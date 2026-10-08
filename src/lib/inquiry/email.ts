import "server-only";
import { budgets, features, projectTypes, timelines } from "@/config/inquiry";
import { customTier, discountLabel, packageTiers } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import { choiceLabel, type InquiryValues } from "@/lib/inquiry/schema";

/**
 * Delivery via Resend's HTTP API (plain fetch, no SDK). All config comes from env vars:
 * RESEND_API_KEY, CONTACT_EMAIL (where inquiries go), FROM_EMAIL (verified sender).
 * See .env.example. Nothing here is ever sent to the client.
 */
type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string };

export const emailConfig = () => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_EMAIL?.trim();
  const from = process.env.FROM_EMAIL?.trim();
  if (!apiKey || !to || !from) return null;
  const base = (process.env.RESEND_API_BASE?.trim() || "https://api.resend.com").replace(/\/$/, "");
  return { apiKey, to, from, base };
};

const label = (list: readonly { id: string; label: string }[], id: string) =>
  list.find((item) => item.id === id)?.label ?? "";

const packageLabel = (id: InquiryValues["package"]) => {
  if (id === "custom") return `${customTier.name} (quote)`;
  const tier = packageTiers.find((t) => t.id === id);
  if (!tier) return id;
  const label = discountLabel(tier);
  return label ? `${tier.name} ($${tier.price} ${label})` : `${tier.name} ($${tier.price})`;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const rows = (d: InquiryValues): [string, string][] => [
  ["Name", d.name],
  ["Email", d.email],
  ["Phone", d.phone || "-"],
  ["Organization", d.organization || "-"],
  ["Package", packageLabel(d.package)],
  ["Project type", choiceLabel(projectTypes, d.projectType, d.projectTypeOther)],
  ["Features", d.features.map((id) => label(features, id)).join(", ") || "-"],
  ["Timeline", choiceLabel(timelines, d.timeline, d.timelineOther) || "-"],
  ["Budget", d.package === "custom" ? label(budgets, d.budget) || "-" : "n/a"],
  ["Current website", d.hasSite === "yes" ? d.siteUrl || "Yes (no URL given)" : "None"],
  ["Links", d.links.join("\n") || "-"],
];

const inquiryMail = (d: InquiryValues, to: string): Mail => {
  const text = [
    ...rows(d).map(([k, v]) => `${k}: ${v}`),
    "",
    "Project details:",
    d.description,
  ].join("\n");
  const html = `<div style="font:15px/1.6 system-ui,sans-serif;color:#111"><table cellpadding="6" style="border-collapse:collapse">${rows(d)
    .map(([k, v]) => `<tr><td style="color:#555;vertical-align:top"><b>${escapeHtml(k)}</b></td><td>${escapeHtml(v).replace(/\n/g, "<br>")}</td></tr>`)
    .join("")}</table><p><b>Project details</b></p><p style="white-space:pre-wrap">${escapeHtml(d.description)}</p></div>`;
  // Subject is static apart from the package name: no user text in headers.
  return { to, subject: `New project request: ${d.package}`, text, html, replyTo: d.email };
};

const autoReplyMail = (d: InquiryValues): Mail => ({
  to: d.email,
  subject: `${siteConfig.name} received your project request`,
  text: [
    `Hi ${d.name.split(/\s+/)[0]},`,
    "",
    `Thanks for reaching out to ${siteConfig.name}. I received your project details and will review the scope before getting back to you.`,
    "",
    `If you didn't send this request, you can ignore this email.`,
    "",
    `${siteConfig.name}`,
  ].join("\n"),
});

const send = async (cfg: NonNullable<ReturnType<typeof emailConfig>>, mail: Mail) => {
  const res = await fetch(`${cfg.base}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${siteConfig.name} <${cfg.from}>`,
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      reply_to: mail.replyTo,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
};

/** Sends the notification to the studio inbox. Throws if it fails (the visitor then sees "Try again"). */
export const deliverInquiry = async (data: InquiryValues) => {
  const cfg = emailConfig();
  if (!cfg) throw new Error("Email is not configured");
  await send(cfg, inquiryMail(data, cfg.to));
};

/** Courtesy auto-reply to the visitor. Best effort: run it after the response, never fail on it. */
export const sendAutoReply = async (data: InquiryValues) => {
  const cfg = emailConfig();
  if (!cfg) return;
  try {
    await send(cfg, autoReplyMail(data));
  } catch (error) {
    console.error("[inquiry] auto-reply failed:", error instanceof Error ? error.message : "unknown");
  }
};

/**
 * Plain alert to the studio inbox (payments: automatic refunds and anything flagged for review).
 * Best effort and never throws: the portal event is the record, the email is the nudge. Callers pass ids
 * and fixed reason codes only, never client content.
 */
export const notifyStudio = async (subject: string, lines: string[]) => {
  const cfg = emailConfig();
  if (!cfg) return;
  try {
    await send(cfg, { to: cfg.to, subject: subject.replace(/[\r\n]+/g, " ").slice(0, 150), text: lines.join("\n") });
  } catch (error) {
    console.error("[payments] studio alert failed:", error instanceof Error ? error.message : "unknown");
  }
};

/**
 * Plain-text email to a client about their own project (payment reminders). Returns whether the provider
 * accepted it; never throws. The recipient is always the address stored on the project, never user input.
 */
export const sendClientMail = async (to: string, subject: string, lines: string[]): Promise<boolean> => {
  const cfg = emailConfig();
  const address = to.trim();
  if (!cfg || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(address)) return false;
  try {
    await send(cfg, { to: address, subject: subject.replace(/[\r\n]+/g, " ").slice(0, 150), text: lines.join("\n"), replyTo: cfg.to });
    return true;
  } catch (error) {
    console.error("[payments] client email failed:", error instanceof Error ? error.message : "unknown");
    return false;
  }
};
