import "server-only";
import { siteConfig } from "@/config/site";
import { notifyStudio, sendClientMail } from "@/lib/inquiry/email";
import { formatUsd } from "@/lib/money";
import type { ProjectPayRow } from "@/lib/payments/repo";
import type { PaymentsDeps } from "@/lib/payments/stripe";

/**
 * Payment notifications. Every alert and reminder goes through `firstTime`, a marker stored in the webhook
 * de-duplication table, so a payment Stripe reports twice (session + intent events) or that the daily
 * reconciliation sees again never sends a second email or adds a second timeline entry.
 * Emails carry ids, amounts and portal links only; never card details or message content.
 */
const portal = (projectId: string, tab = "payments") => `${siteConfig.url}/portal/projects/${projectId}/${tab}`;

/** True the first time a key is seen, false forever after. A storage error counts as "seen" (stay quiet). */
export const firstTime = async (deps: PaymentsDeps, key: string): Promise<boolean> =>
  deps.repo.recordWebhookEvent(`marker:${key}`.slice(0, 250), "marker").catch(() => false);

/** Timeline entry + studio email for a payment the studio must look at. Once per key. */
export const flagForReview = async (
  deps: PaymentsDeps,
  input: { key: string; projectId: string; timeline: string; subject: string; detail: string; paymentIntentId?: string | null },
): Promise<boolean> => {
  if (!(await firstTime(deps, `review:${input.key}`))) return false;
  await deps.repo.addEvent(input.projectId, "payment_review", input.timeline, "system");
  await alertStudio(input.projectId, input.subject, input.detail, input.paymentIntentId ?? undefined);
  return true;
};

export const alertStudio = (projectId: string, subject: string, detail: string, paymentIntentId?: string) =>
  notifyStudio(`Northframe payments: ${subject}`, [
    detail,
    "",
    `Project: ${portal(projectId)}`,
    ...(paymentIntentId ? [`Stripe payment: ${paymentIntentId}`] : []),
  ]);

/** Minimum gap between balance reminders, and the most a client is ever sent for one balance. */
export const REMINDER_GAP_MS = 3 * 24 * 60 * 60 * 1000;
export const MAX_REMINDERS = 3;

/**
 * Tells the client their remaining balance needs them (the saved card failed or needs confirming), with a
 * link to the portal page that opens a fresh hosted checkout. Paced: never twice within REMINDER_GAP_MS,
 * never more than MAX_REMINDERS in total. Returns whether an email was sent.
 */
export const remindBalanceDue = async (deps: PaymentsDeps, project: ProjectPayRow): Promise<boolean> => {
  if (project.initial_payment_status !== "paid") return false;
  if (!["failed", "requires_action"].includes(project.final_payment_status)) return false;
  if (["cancelled", "completed"].includes(project.status) || !project.email || !project.remaining_amount) return false;
  const { count, lastAt } = await deps.repo.eventStats(project.id, "balance_reminder");
  if (count >= MAX_REMINDERS) return false;
  if (lastAt && deps.now().getTime() - new Date(lastAt).getTime() < REMINDER_GAP_MS) return false;

  const needsConfirm = project.final_payment_status === "requires_action";
  const sent = await sendClientMail(project.email, "Your Northframe balance payment needs attention", [
    `Hi${project.client_name ? ` ${project.client_name.split(/\s+/)[0]}` : ""},`,
    "",
    needsConfirm
      ? `Your bank asked to confirm the remaining balance of ${formatUsd(project.remaining_amount)} for your website project, so it was not charged.`
      : `The remaining balance of ${formatUsd(project.remaining_amount)} for your website project could not be charged to your saved card.`,
    "",
    `You can pay it securely here: ${portal(project.id)}`,
    "",
    "Launch and handover happen as soon as the balance is paid.",
    "",
    siteConfig.name,
  ]);
  if (!sent) return false;
  await deps.repo.addEvent(project.id, "balance_reminder", "Payment reminder sent", "system");
  return true;
};
