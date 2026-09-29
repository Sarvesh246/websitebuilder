/**
 * Inquiry validation, shared by the form (friendly per-step errors) and the API route (the
 * real gate). Plain TypeScript on purpose: no schema dependency for a handful of fields.
 * Never trust the client: the route calls `validateInquiry` on every request.
 */
import { budgets, features, isPackageId, limits, projectTypes, siteAnswers, timelines } from "@/config/inquiry";
import type { PackageId } from "@/config/pricing";

export type InquiryValues = {
  package: PackageId | "";
  projectType: string;
  description: string;
  hasSite: "yes" | "no" | "";
  siteUrl: string;
  links: string[];
  features: string[];
  timeline: string;
  budget: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
};

export type FieldName = keyof InquiryValues | "links";
export type FieldErrors = Partial<Record<FieldName | `links.${number}`, string>>;

export const emptyValues: InquiryValues = {
  package: "",
  projectType: "",
  description: "",
  hasSite: "",
  siteUrl: "",
  links: [""],
  features: [],
  timeline: "",
  budget: "",
  name: "",
  email: "",
  phone: "",
  organization: "",
};

const ids = (list: readonly { id: string }[]) => list.map((item) => item.id);
const featureIds = ids(features);
const oneOf = (list: readonly { id: string }[], value: string) => ids(list).includes(value);

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE = /^[+()\-.\s\d]{7,}$/;
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;

/** Trim and strip control characters (keeps normal newlines and tabs). */
export const clean = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(CONTROL, "").trim().slice(0, max + 1) : "";

/** Single-line fields: also collapse newlines/tabs so a value can never smuggle in extra lines. */
const line = (value: unknown, max: number) => clean(value, max).replace(/\s+/g, " ");

/**
 * Accepts "example.com", "www.example.com/x" or a full http(s) URL. Returns the normalised URL,
 * or null if it is not a plausible web address. Harmless formatting is forgiven, not rejected.
 */
export const normalizeUrl = (raw: string): string | null => {
  const input = raw.trim();
  if (!input || /\s/.test(input)) return null;
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
};

/** Which fields belong to which step, so the form can validate one step at a time. */
export const stepFields: Record<"project" | "details" | "scope" | "contact", readonly FieldName[]> = {
  project: ["package", "projectType"],
  details: ["description", "hasSite", "siteUrl", "links"],
  scope: ["features", "timeline", "budget"],
  contact: ["name", "email", "phone", "organization"],
};

type Result = { ok: true; data: InquiryValues } | { ok: false; errors: FieldErrors };

export const validateInquiry = (input: unknown): Result => {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  const pkg = typeof raw.package === "string" ? raw.package : "";
  if (!isPackageId(pkg)) errors.package = "Choose a package to continue.";

  const projectType = clean(raw.projectType, 40);
  if (!oneOf(projectTypes, projectType)) errors.projectType = "Pick what the site is for.";

  const description = clean(raw.description, limits.descriptionMax);
  if (description.length < limits.descriptionMin) {
    errors.description = `Add a little more detail (at least ${limits.descriptionMin} characters).`;
  } else if (description.length > limits.descriptionMax) {
    errors.description = `Please keep this under ${limits.descriptionMax.toLocaleString("en-US")} characters.`;
  }

  const hasSite = clean(raw.hasSite, 3);
  if (!oneOf(siteAnswers, hasSite)) errors.hasSite = "Let me know if you already have a website.";

  let siteUrl = "";
  const siteRaw = line(raw.siteUrl, limits.url);
  if (hasSite === "yes" && siteRaw) {
    const normalized = siteRaw.length > limits.url ? null : normalizeUrl(siteRaw);
    if (normalized) siteUrl = normalized;
    else errors.siteUrl = "That doesn't look like a web address. Try something like example.com.";
  }

  const linkList = Array.isArray(raw.links) ? raw.links.slice(0, limits.links) : [];
  const links: string[] = [];
  linkList.forEach((entry, index) => {
    const value = line(entry, limits.url);
    if (!value) return;
    const normalized = value.length > limits.url ? null : normalizeUrl(value);
    if (normalized) links.push(normalized);
    else errors[`links.${index}`] = "That doesn't look like a web address. Try something like example.com.";
  });
  if (Array.isArray(raw.links) && raw.links.length > limits.links) errors.links = `Up to ${limits.links} links, please.`;

  // Lists must be arrays when present (the form always sends arrays); other shapes are malformed.
  if (raw.links !== undefined && !Array.isArray(raw.links)) errors.links = "Please re-enter your links.";
  if (raw.features !== undefined && !Array.isArray(raw.features)) errors.features = "One of the selected features isn't recognised. Please reselect.";
  const featureList = Array.isArray(raw.features) ? raw.features : [];
  const selected = [...new Set(featureList.filter((f): f is string => typeof f === "string"))];
  if (selected.some((id) => !featureIds.includes(id)) || selected.length > featureIds.length) {
    errors.features = "One of the selected features isn't recognised. Please reselect.";
  }

  const timeline = clean(raw.timeline, 20);
  if (timeline && !oneOf(timelines, timeline)) errors.timeline = "Pick one of the timing options.";

  // Budget only applies to Custom; ignore anything sent for fixed packages.
  const budgetRaw = clean(raw.budget, 20);
  if (pkg === "custom" && budgetRaw && !oneOf(budgets, budgetRaw)) errors.budget = "Pick one of the budget ranges.";
  const budget = pkg === "custom" && oneOf(budgets, budgetRaw) ? budgetRaw : "";

  const name = line(raw.name, limits.name);
  if (!name) errors.name = "Add your name so I know who I'm talking to.";
  else if (name.length > limits.name) errors.name = `Please keep your name under ${limits.name} characters.`;

  const email = line(raw.email, limits.email);
  if (!email) errors.email = "Add an email address so I can reply.";
  else if (email.length > limits.email || !EMAIL.test(email)) {
    errors.email = "That email doesn't look right. Check for typos, like name@example.com.";
  }

  const phone = line(raw.phone, limits.phone);
  if (phone && (phone.length > limits.phone || !PHONE.test(phone))) {
    errors.phone = "Use digits, spaces, and + ( ) - only, or leave this blank.";
  }

  const organization = line(raw.organization, limits.organization);
  if (organization.length > limits.organization) {
    errors.organization = `Please keep this under ${limits.organization} characters.`;
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      package: pkg as PackageId,
      projectType,
      description,
      hasSite: hasSite as "yes" | "no",
      siteUrl,
      links,
      features: selected,
      timeline,
      budget,
      name,
      email,
      phone,
      organization,
    },
  };
};
