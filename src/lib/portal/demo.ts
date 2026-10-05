import "server-only";
import type {
  AdminOverview, ChecklistItem, FeedbackRound, Message, ProjectDetail, ProjectFile, ProjectNote, ProjectSummary,
} from "./types";
import { mergeChecklist, type ChecklistRow } from "./workflow";
import {
  buildOverview, filterAndSort, otherSide, toDetail, toFile, toMessage, toPaymentRow, toRounds, toSummary,
  type EventDb, type FeedbackItemDb, type FeedbackRoundDb, type FileDb, type ListOpts, type MessageDb, type MilestoneDb, type Perspective, type PaymentDb, type ProjectRow,
} from "./mappers";

/**
 * Dev-only fixtures so the portal can render without a live Supabase session (PORTAL_DEMO=1).
 * Everything here is fictional: no real people, brands or domains. Never available in production.
 */
if (process.env.NODE_ENV === "production") throw new Error("Portal demo data is not available in production");

const DEMO_USER = "00000000-0000-4000-8000-000000000001";
const OTHER_USER = "d1111111-1111-4111-8111-111111111111";

const uid = (kind: string, n: number) => `${kind}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const DAY = 86_400_000;
const ago = (days: number, hour = 10) => {
  const d = new Date(Date.now() - days * DAY);
  d.setUTCHours(hour, 15, 0, 0);
  return d.toISOString();
};
const day = (offset: number) => new Date(Date.now() + offset * DAY).toISOString().slice(0, 10);

type Seed = {
  n: number; name: string; email: string; org: string | null; pkg: ProjectRow["package"]; type: string; stage: string;
  created: number; updated: number; deadline: number | null; money: [number, number, number] | null;
  initial: ProjectRow["initial_payment_status"]; final: ProjectRow["final_payment_status"];
  owner: string | null; description: string; features: string[]; timeline: string; preview?: string;
  rev?: [number, number]; approved?: boolean;
};

const seeds: Seed[] = [
  { n: 1, name: "Tessa Marlowe", email: "tessa.marlowe@example.com", org: null, pkg: "launch", type: "Student portfolio", stage: "completed",
    created: 75, updated: 20, deadline: -25, money: [4900, 4900, 0], initial: "paid", final: "not_required", owner: DEMO_USER,
    description: "One-page portfolio for a design student: selected projects, a short bio and a resume download.",
    features: ["Project gallery", "Resume section", "Contact links"], timeline: "2 to 4 weeks", rev: [1, 1], approved: true },
  { n: 2, name: "Kofi Adair", email: "kofi.adair@example.com", org: "Halcyon Yoga Collective", pkg: "presence", type: "Small business", stage: "ready_for_launch",
    created: 60, updated: 3, deadline: 4, money: [19900, 9950, 0], initial: "paid", final: "paid", owner: OTHER_USER,
    description: "Three-page site for a neighbourhood yoga collective with a class schedule and a booking enquiry form.",
    features: ["Contact form", "SEO setup", "Class schedule"], timeline: "1 to 2 months", rev: [2, 2], approved: true },
  { n: 3, name: "Ines Calloway", email: "ines.calloway@example.com", org: "Fernwood Pottery Studio", pkg: "presence", type: "Creator or freelancer", stage: "building",
    created: 20, updated: 1, deadline: 12, money: [19900, 9950, 9950], initial: "paid", final: "pending", owner: DEMO_USER,
    description: "Showcase site for a ceramics studio: seasonal collections, workshop dates and a simple enquiry form.",
    features: ["Gallery", "Contact form", "Enhanced animations"], timeline: "2 to 4 weeks", rev: [2, 0] },
  { n: 4, name: "Devon Harlan", email: "devon.harlan@example.com", org: "Lakeside Robotics Club", pkg: "business", type: "Student organization", stage: "client_review",
    created: 32, updated: 1, deadline: 6, money: [34900, 17450, 17450], initial: "paid", final: "pending", owner: OTHER_USER,
    description: "Five-page site for a student robotics club: team pages, event calendar, sponsor page and a join form.",
    features: ["Team pages", "Event pages", "Forms", "Simple integrations"], timeline: "1 to 2 months",
    preview: "https://preview.example.com/lakeside-robotics", rev: [3, 0] },
  { n: 5, name: "Noor Whitaker", email: "noor.whitaker@example.com", org: "Pinewright Carpentry", pkg: "business", type: "Small business", stage: "revisions",
    created: 42, updated: 2, deadline: -3, money: [34900, 17450, 17450], initial: "paid", final: "pending", owner: OTHER_USER,
    description: "Service site for a small carpentry business: services, project gallery, quote request form and a FAQ.",
    features: ["Service pages", "FAQ section", "Quote form"], timeline: "1 to 2 months", preview: "https://preview.example.com/pinewright", rev: [3, 2] },
  { n: 6, name: "Callum Ashby", email: "callum.ashby@example.com", org: "Amberlane Bakery", pkg: "business", type: "Small business", stage: "awaiting_final_payment",
    created: 52, updated: 1, deadline: -1, money: [34900, 17450, 17450], initial: "paid", final: "failed", owner: DEMO_USER,
    description: "Neighbourhood bakery site with a menu, opening hours, a seasonal specials page and a catering enquiry form.",
    features: ["Menu pages", "Catering form", "Advanced UI"], timeline: "1 to 2 months", preview: "https://preview.example.com/amberlane",
    rev: [3, 3], approved: true },
  { n: 7, name: "Wren Delacroix", email: "wren.delacroix@example.com", org: "Tidepool Film Club", pkg: "custom", type: "Student organization", stage: "accepted",
    created: 9, updated: 2, deadline: 35, money: [60000, 30000, 30000], initial: "pending", final: "pending", owner: OTHER_USER,
    description: "Film club site with member accounts, a screening calendar and an admin panel for organizers.",
    features: ["Authentication", "Database", "Admin tools"], timeline: "1 to 2 months", rev: [2, 0] },
  { n: 8, name: "Elias Thornbury", email: "elias.thornbury@example.com", org: "Sable & Stone Photography", pkg: "custom", type: "Creator or freelancer", stage: "requested",
    created: 1, updated: 1, deadline: null, money: null, initial: "pending", final: "pending", owner: null,
    description: "Photographer wants client galleries with private links, downloads and online payments.",
    features: ["Database", "Payments", "Dashboard"], timeline: "No hard deadline" },
  { n: 9, name: "Sarvesh", email: "owner@northframe.co", org: "Northside Climbing Club", pkg: "presence", type: "Student organization", stage: "client_review",
    created: 26, updated: 0, deadline: 5, money: [19900, 9950, 9950], initial: "paid", final: "pending", owner: DEMO_USER,
    description: "Three-page site for a university climbing club: session times, a gallery of trips and a membership enquiry form.",
    features: ["Gallery", "Contact form", "SEO setup"], timeline: "2 to 4 weeks", preview: "https://preview.example.com/northside-climbing", rev: [2, 1] },
];

const rowOf = (s: Seed): ProjectRow => ({
  id: uid("a", s.n), created_at: ago(s.created), updated_at: ago(s.updated, 14), client_name: s.name, email: s.email, phone: null,
  organization: s.org, package: s.pkg, website_type: s.type, project_description: s.description, features_needed: s.features,
  inspiration_links: [], existing_website: null, timeline: s.timeline, budget: s.pkg === "custom" ? "$1,000 to $2,500" : null,
  status: s.stage, deadline: s.deadline == null ? null : day(s.deadline), preview_url: s.preview ?? null,
  revisions_included: s.rev?.[0] ?? 1, revisions_used: s.rev?.[1] ?? 0, approved_at: s.approved ? ago(Math.max(s.updated, 1)) : null,
  currency: "usd", total_amount: s.money?.[0] ?? null, deposit_amount: s.money?.[1] ?? null, remaining_amount: s.money?.[2] ?? null,
  initial_payment_status: s.initial, final_payment_status: s.final, initial_paid_at: s.initial === "paid" ? ago(s.created - 2) : null,
  final_paid_at: s.final === "paid" ? ago(3) : null, cancellation_requested_at: null,
  cancelled_at: null, refunded_amount: 0, user_id: s.owner,
});

let pn = 0;
const pay = (project: number, type: PaymentDb["type"], status: PaymentDb["status"], amount: number, daysAgo: number): PaymentDb => ({
  id: uid("c", ++pn), project_id: uid("a", project), type, status, amount, currency: "usd", created_at: ago(daysAgo),
  paid_at: status === "succeeded" ? ago(daysAgo) : null,
  receipt_url: status === "succeeded" ? `https://pay.stripe.com/receipts/demo_${pn}` : null,
});

const payments: PaymentDb[] = [
  pay(1, "full", "succeeded", 4900, 70),
  pay(2, "deposit", "succeeded", 9950, 55),
  pay(2, "final_balance", "succeeded", 9950, 3),
  pay(3, "deposit", "succeeded", 9950, 18),
  pay(4, "deposit", "succeeded", 17450, 30),
  pay(5, "deposit", "succeeded", 17450, 40),
  pay(6, "deposit", "succeeded", 17450, 48),
  pay(6, "final_balance", "failed", 17450, 1),
  pay(9, "deposit", "succeeded", 9950, 24),
];

let mn = 0;
const ms = (project: number, title: string, status: MilestoneDb["status"], pos: number, dueOffset: number | null = null, detail: string | null = null): MilestoneDb => ({
  id: uid("b", ++mn), project_id: uid("a", project), title, detail, position: pos, status,
  due_date: dueOffset == null ? null : day(dueOffset), completed_at: status === "done" ? ago(Math.max(1, 10 - pos * 2)) : null,
});

const milestones: MilestoneDb[] = [
  ms(3, "Discovery and content", "done", 0), ms(3, "Design direction", "done", 1), ms(3, "Build pages", "active", 2, 7, "Home, collections and workshops."),
  ms(3, "Review and revisions", "pending", 3, 11), ms(3, "Launch", "pending", 4, 12),
  ms(4, "Discovery and content", "done", 0), ms(4, "Design direction", "done", 1), ms(4, "Build pages", "done", 2), ms(4, "Forms and events", "done", 3),
  ms(4, "Client review", "active", 4, 6), ms(4, "Launch", "pending", 5, 10),
  ms(5, "Discovery and content", "done", 0), ms(5, "Design and build", "done", 1), ms(5, "Client review", "done", 2), ms(5, "Revisions", "active", 3, -3), ms(5, "Launch", "pending", 4, 2),
  ms(9, "Discovery and content", "done", 0), ms(9, "Design and build", "done", 1), ms(9, "Client review", "active", 2, 3), ms(9, "Launch", "pending", 3, 5),
  ms(6, "Design and build", "done", 0), ms(6, "Client review", "done", 1), ms(6, "Revisions", "done", 2), ms(6, "Final payment", "active", 3, -1), ms(6, "Launch", "pending", 4, 3),
];

let gn = 0;
const msg = (project: number, from: "client" | "admin", body: string, daysAgo: number, read: boolean, hour = 11): MessageDb => ({
  id: uid("d", ++gn), project_id: uid("a", project), sender_role: from, body, created_at: ago(daysAgo, hour), read_at: read ? ago(Math.max(0, daysAgo - 0.2), hour + 1) : null,
});

const messages: MessageDb[] = [
  msg(3, "client", "Hi! Attached is my logo and the colour palette I mentioned. The glaze photos are coming this week.", 14, true),
  msg(3, "admin", "Thanks, that is everything I need for the design direction. I will share a first look soon.", 13, true),
  msg(3, "admin", "The first design is ready. Homepage and collections are in the files tab, take a look when you can.", 6, true),
  msg(3, "client", "Love the collections layout. Could the workshop dates sit higher on the homepage?", 5, true),
  msg(3, "admin", "Yes, easy change. Moving them up now, and the pages are being built.", 4, true),
  msg(3, "client", "Perfect. One more idea: a small note about shipping times near the shop link?", 1, false, 16),
  msg(4, "admin", "The preview link is live in the Preview tab. Please look through every page on your phone too.", 2, false, 15),
  msg(4, "client", "Looks great so far. We will collect feedback from the team on Thursday.", 3, true),
  msg(5, "admin", "Revision one is in: gallery spacing and the quote form wording are updated.", 4, true),
  msg(5, "client", "Thanks. Can the footer phone number be a tap-to-call link? That is revision two.", 2, false, 9),
  msg(6, "client", "Everything looks right to me, I approved the final version.", 4, true),
  msg(6, "admin", "Thank you. The final payment did not go through on the saved card. You can retry from the Payments tab.", 1, false, 13),
  msg(9, "admin", "Round one is addressed: the session table now sits under the hero and the gallery loads faster. Have another look when you can.", 0.3, false, 10),
  msg(8, "client", "Hi, I would like galleries with private client links and payments. Not sure where to start, happy to talk it through.", 1, false, 8),
];

let fn = 0;
const file = (project: number, name: string, size: number, mime: string, by: "client" | "admin", daysAgo: number): FileDb => ({
  id: uid("e", ++fn), project_id: uid("a", project), name, size_bytes: size, mime_type: mime, uploader_role: by, created_at: ago(daysAgo),
});

const files: FileDb[] = [
  file(3, "fernwood-logo.png", 184_320, "image/png", "client", 14),
  file(3, "design-v1.pdf", 2_412_000, "application/pdf", "admin", 6),
  file(4, "brand-guidelines.pdf", 1_048_576, "application/pdf", "client", 28),
  file(5, "project-photos.zip", 18_874_368, "application/zip", "client", 30),
  file(9, "club-logo.png", 96_000, "image/png", "client", 22),
  file(9, "homepage-spacing.png", 410_000, "image/png", "client", 4),
  file(6, "menu-copy.docx", 42_000, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "client", 45),
];

let en = 0;
const ev = (project: number, kind: string, title: string, actor: EventDb["actor_role"], daysAgo: number): EventDb => ({
  id: uid("f", ++en), project_id: uid("a", project), kind, title, actor_role: actor, created_at: ago(daysAgo, 9),
});

const events: EventDb[] = [
  ev(1, "stage", "Project completed", "admin", 20),
  ev(2, "payment", "Final payment received", "system", 3),
  ev(2, "stage", "Moved to Ready to launch", "admin", 3),
  ev(3, "milestone", "Milestone done: Design direction", "admin", 6),
  ev(3, "payment", "Deposit received", "system", 18),
  ev(4, "preview", "Preview link shared", "admin", 2),
  ev(4, "stage", "Moved to In review", "admin", 2),
  ev(5, "revision", "Revision 2 requested", "client", 2),
  ev(6, "approval", "Final version approved", "client", 4),
  ev(6, "payment", "Final payment failed", "system", 1),
  ev(7, "stage", "Quote accepted", "admin", 2),
  ev(8, "request", "New project request", "client", 1),
  ev(9, "request", "New project request", "client", 26),
  ev(9, "payment_received", "Initial payment received", "system", 24),
  ev(9, "checklist", "Sent: Logo", "client", 22),
  ev(9, "checklist", "Sent: Page text", "client", 21),
  ev(9, "preview", "Preview link shared", "admin", 6),
  ev(9, "stage", "Ready for your review", "admin", 6),
  ev(9, "feedback", "Feedback round 1 sent", "client", 4),
  ev(9, "feedback", "Feedback round 1 addressed", "admin", 0.3),
  ev(3, "checklist", "Sent: Logo", "client", 14),
];

const rounds: FeedbackRoundDb[] = [
  { id: uid("7", 1), project_id: uid("a", 9), number: 1, status: "resolved", extra: false, submitted_at: ago(4), resolved_at: ago(0.3), created_at: ago(5) },
  { id: uid("7", 2), project_id: uid("a", 9), number: 2, status: "draft", extra: false, submitted_at: null, resolved_at: null, created_at: ago(0.1) },
  { id: uid("7", 3), project_id: uid("a", 4), number: 1, status: "submitted", extra: false, submitted_at: ago(1), resolved_at: null, created_at: ago(2) },
];

let fbn = 0;
const fb = (round: number, project: number, page: string | null, body: string, status: "open" | "done", fileId: string | null = null) => ({
  id: uid("6", ++fbn), project_id: uid("a", project), round_id: uid("7", round), page, body, file_id: fileId, status, created_at: ago(4 - fbn * 0.01),
});

const feedbackItems: (FeedbackItemDb & { project_id: string })[] = [
  fb(1, 9, "Home, hero", "Could the weekly session times sit right under the headline? People mostly visit for those.", "done"),
  fb(1, 9, "Gallery", "The gallery feels slow on my phone. Maybe fewer photos per row on mobile?", "done", uid("e", 6)),
  fb(2, 9, "Footer", "Add our Instagram handle next to the email address.", "open"),
  fb(3, 4, "Events", "The event calendar should show the room name, not just the time.", "done"),
  fb(3, 4, "Team", "Swap the two officer photos, they are on the wrong bios.", "open"),
  fb(3, 4, "Mobile layout", "The join form button is hidden behind the cookie bar on small phones.", "open"),
];

const checklistRows: (ChecklistRow & { project_id: string })[] = [
  { project_id: uid("a", 3), key: "logo", label: null, status: "provided", answer: null, file_id: uid("e", 1), updated_at: ago(14) },
  { project_id: uid("a", 3), key: "domain", label: null, status: "provided", answer: "I own a domain and can log in", file_id: null, updated_at: ago(13) },
  { project_id: uid("a", 3), key: "brand", label: null, status: "skipped", answer: null, file_id: null, updated_at: ago(13) },
  { project_id: uid("a", 3), key: "custom:shiptime", label: "Shipping times for the shop note", status: "needed", answer: null, file_id: null, updated_at: ago(1) },
  ...["logo", "copy", "photos", "domain"].map((key, i) => ({
    project_id: uid("a", 9), key, label: null, status: "provided" as const, answer: key === "domain" ? "I need a new domain" : null,
    file_id: key === "logo" ? uid("e", 5) : null, updated_at: ago(22 - i),
  })),
];

const notes: (ProjectNote & { projectId: string })[] = [
  { id: uid("9", 1), projectId: uid("a", 5), body: "Client prefers evening calls. Third revision reserved for footer and legal copy.", createdAt: ago(5) },
  { id: uid("9", 2), projectId: uid("a", 6), body: "Card declined once. Send a friendly nudge before switching to a hosted payment link.", createdAt: ago(1) },
  { id: uid("9", 3), projectId: uid("a", 8), body: "Quote idea: gallery sites plus Stripe. Ask about expected client volume.", createdAt: ago(1) },
];

const rows = () => seeds.map(rowOf);
const scoped = (perspective: Perspective) => rows().filter((r) => perspective === "admin" || r.user_id === DEMO_USER);
const unreadFor = (perspective: Perspective, projectId: string) =>
  messages.filter((m) => m.project_id === projectId && m.read_at == null && m.sender_role === otherSide(perspective)).length;
const summary = (r: ProjectRow, perspective: Perspective): ProjectSummary =>
  toSummary(r, {
    payments: payments.filter((p) => p.project_id === r.id),
    milestones: milestones.filter((m) => m.project_id === r.id),
    unread: unreadFor(perspective, r.id),
  });

export const demoListProjects = (perspective: Perspective, opts?: ListOpts): ProjectSummary[] =>
  filterAndSort(scoped(perspective).map((r) => summary(r, perspective)), opts);

export const demoGetProject = (perspective: Perspective, id: string): ProjectDetail | null => {
  const r = scoped(perspective).find((x) => x.id === id);
  if (!r) return null;
  return toDetail(r, {
    payments: payments.filter((p) => p.project_id === id),
    milestones: milestones.filter((m) => m.project_id === id),
    events: events.filter((e) => e.project_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    unread: unreadFor(perspective, id),
  });
};

export const demoOverview = (): AdminOverview => {
  const all = rows();
  const projects = all.map((r) => summary(r, "admin"));
  const nameOf = new Map(all.map((r) => [r.id, r.client_name]));
  return buildOverview({
    projects,
    payments: payments.map((p) => ({ type: p.type, status: p.status, amount: p.amount, createdAt: p.created_at, paidAt: p.paid_at })),
    unread: messages.filter((m) => m.read_at == null && m.sender_role === "client").length,
    activity: events.map((e) => ({ id: e.id, projectId: e.project_id, clientName: nameOf.get(e.project_id) ?? "", title: e.title, createdAt: e.created_at })),
  });
};

const canSee = (perspective: Perspective, projectId: string) => scoped(perspective).some((r) => r.id === projectId);

export const demoMessages = (perspective: Perspective, projectId: string): Message[] =>
  canSee(perspective, projectId)
    ? messages.filter((m) => m.project_id === projectId).sort((a, b) => a.created_at.localeCompare(b.created_at)).map((m) => toMessage(m, perspective))
    : [];

export const demoInbox = (perspective: Perspective): { project: ProjectSummary; last: Message | null }[] =>
  scoped(perspective)
    .map((r) => {
      const last = messages.filter((m) => m.project_id === r.id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return { project: summary(r, perspective), last: last ? toMessage(last, perspective) : null };
    })
    .sort((a, b) => (b.last?.createdAt ?? b.project.updatedAt).localeCompare(a.last?.createdAt ?? a.project.updatedAt));

// Demo thumbnails reuse a bundled brand image so the thumbnail layout is visible without storage.
export const demoFiles = (perspective: Perspective, projectId: string): ProjectFile[] =>
  canSee(perspective, projectId)
    ? files.filter((f) => f.project_id === projectId).map((f) => toFile(f, f.mime_type?.startsWith("image/") ? "/brand/mark-light.webp" : null))
    : [];

export const demoWorkflow = (perspective: Perspective, projectId: string): { rounds: FeedbackRound[]; checklist: ChecklistItem[] } => {
  const r = scoped(perspective).find((x) => x.id === projectId);
  if (!r) return { rounds: [], checklist: [] };
  const names = new Map(files.filter((f) => f.project_id === projectId).map((f) => [f.id, f.name]));
  const visible = rounds.filter((x) => x.project_id === projectId && (perspective === "client" || x.status !== "draft"));
  const pkg = toSummary(r, { payments: [], milestones: [], unread: 0 }).package;
  return {
    rounds: toRounds(visible, feedbackItems.filter((i) => i.project_id === projectId), names),
    checklist: mergeChecklist(pkg, checklistRows.filter((c) => c.project_id === projectId), names),
  };
};

export const demoNotes = (projectId: string): ProjectNote[] =>
  notes.filter((n) => n.projectId === projectId).map(({ id, body, createdAt }) => ({ id, body, createdAt }));

export const demoPayments = (perspective: Perspective) => {
  const visible = new Map(scoped(perspective).map((r) => [r.id, r]));
  return payments
    .filter((p) => visible.has(p.project_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const r = visible.get(p.project_id) as ProjectRow;
      return { ...toPaymentRow(p), projectId: p.project_id, clientName: r.client_name, packageId: r.package };
    });
};
