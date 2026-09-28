import "server-only";
import { budgets, features, projectTypes, timelines } from "@/config/inquiry";
import { customTier, packageTiers } from "@/config/pricing";
import { siteConfig } from "@/config/site";
import type { InquiryValues } from "@/lib/inquiry/schema";

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
  return tier.regularPrice !== undefined ? `${tier.name} ($${tier.price} launch price)` : `${tier.name} ($${tier.price})`;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const rows = (d: InquiryValues): [string, string][] => [
  ["Name", d.name],
  ["Email", d.email],
  ["Phone", d.phone || "-"],
  ["Organization", d.organization || "-"],
  ["Package", packageLabel(d.package)],
  ["Project type", label(projectTypes, d.projectType)],
  ["Features", d.features.map((id) => label(features, id)).join(", ") || "-"],
  ["Timeline", label(timelines, d.timeline) || "-"],
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

/** Sends the notification (required) then the auto-reply (best effort). Throws only if the notification fails. */
export const deliverInquiry = async (data: InquiryValues) => {
  const cfg = emailConfig();
  if (!cfg) throw new Error("Email is not configured");
  await send(cfg, inquiryMail(data, cfg.to));
  try {
    await send(cfg, autoReplyMail(data));
  } catch {
    // The team already has the inquiry; a failed courtesy reply must not fail the request.
  }
};
