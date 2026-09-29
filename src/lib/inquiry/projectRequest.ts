import "server-only";
import type { InquiryValues } from "@/lib/inquiry/schema";
import { planForPackage } from "@/lib/payments/plan";
import { createAdminClient } from "@/utils/supabase/server";

/**
 * Storage for validated inquiries (Supabase table `project_requests`, see
 * supabase/migrations). The browser only ever knows `InquiryValues` (the public DTO);
 * workflow, payment and note columns are set by the database defaults or, later, by staff/Stripe.
 */
export const requestStatuses = [
  "new", "contacted", "awaiting_payment", "paid", "in_progress", "awaiting_client", "review",
  "revisions", "awaiting_final_payment", "ready_for_launch", "completed", "cancelled",
] as const;
export const paymentStatuses = ["unpaid", "pending", "paid", "partially_paid", "failed", "partially_refunded", "refunded", "disputed"] as const;

export type ProjectRequestStatus = (typeof requestStatuses)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

/** Columns the public intake is allowed to write (mapped from the validated form). */
export type ProjectRequestInput = {
  submission_key: string;
  client_name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  package: Exclude<InquiryValues["package"], "">;
  website_type: string;
  project_description: string;
  features_needed: string[];
  inspiration_links: string[];
  has_existing_website: boolean;
  existing_website: string | null;
  timeline: string | null;
  budget: string | null;
} & Partial<PriceSnapshot>;

/** Agreed price frozen at submission (integer cents). Absent for Custom until staff quote it. */
export type PriceSnapshot = {
  total_cents: number;
  deposit_cents: number;
  remaining_cents: number;
  initial_payment_status: "pending";
  final_payment_status: "pending" | "not_required";
};

/** Full row, internal only (never returned to the browser). */
export type ProjectRequestRecord = ProjectRequestInput & {
  id: string;
  created_at: string;
  updated_at: string;
  pages_needed: string[] | null;
  domain_status: string | null;
  desired_launch_date: string | null;
  status: ProjectRequestStatus;
  payment_status: PaymentStatus;
  stripe_customer_id: string | null;
  stripe_session_id: string | null;
  amount_paid: number | null;
  internal_notes: string | null;
};

const orNull = (value: string) => value || null;

const snapshotFor = (pkg: Exclude<InquiryValues["package"], "">): Partial<PriceSnapshot> => {
  const plan = planForPackage(pkg);
  return plan
    ? {
        total_cents: plan.total,
        deposit_cents: plan.deposit,
        remaining_cents: plan.remaining,
        initial_payment_status: "pending",
        final_payment_status: plan.remaining > 0 ? "pending" : "not_required",
      }
    : {};
};

export const toProjectRequest = (data: InquiryValues, submissionKey: string): ProjectRequestInput => ({
  ...snapshotFor(data.package as Exclude<InquiryValues["package"], "">),
  submission_key: submissionKey,
  client_name: data.name,
  email: data.email,
  phone: orNull(data.phone),
  organization: orNull(data.organization),
  package: data.package as ProjectRequestInput["package"],
  website_type: data.projectType,
  project_description: data.description,
  features_needed: data.features,
  inspiration_links: data.links,
  has_existing_website: data.hasSite === "yes",
  existing_website: orNull(data.siteUrl),
  timeline: orNull(data.timeline),
  budget: orNull(data.budget),
});

export const storageConfigured = () => createAdminClient() !== null;

export class StorageError extends Error {}

/**
 * Inserts the request and returns its id. A repeated submission_key (double click, retry after a
 * lost response) returns the existing row's id instead of creating a duplicate.
 * Throws StorageError with a short code only; database details are never surfaced.
 */
export const saveProjectRequest = async (data: InquiryValues, submissionKey: string): Promise<{ id: string; duplicate: boolean }> => {
  const db = createAdminClient();
  if (!db) throw new StorageError("not_configured");
  const table = db.from("project_requests");

  const { data: row, error } = await table.insert(toProjectRequest(data, submissionKey)).select("id").single<{ id: string }>();
  if (row) return { id: row.id, duplicate: false };

  if (error?.code === "23505") {
    const { data: existing } = await db
      .from("project_requests")
      .select("id")
      .eq("submission_key", submissionKey)
      .maybeSingle<{ id: string }>();
    if (existing) return { id: existing.id, duplicate: true };
  }
  throw new StorageError(error?.code ? `db_${error.code}` : "db_error");
};
