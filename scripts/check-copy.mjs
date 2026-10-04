/**
 * Spelling, grammar and house-style check of the PUBLIC page copy, via the free LanguageTool API.
 *
 *   npm run check:copy                       (checks http://localhost:3000, start the site first)
 *   npm run check:copy -- https://northframe.co
 *
 * Dev tool only: nothing here ships to the site or runs on a server. Only the visible text of
 * the three fixed public pages is sent (no accounts, no forms, no secrets). Free limits are
 * 20 requests/min and 20 KB per request, so text is chunked and paced.
 */
const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const PAGES = ["/", "/privacy", "/terms"];
const API = "https://api.languagetool.org/v2/check";
const CHUNK = 12_000;
// Brand and product words LanguageTool does not know.
const IGNORE = new Set(["northframe", "sarvesh", "presence", "supabase", "resend", "stripe", "vercel", "seo", "cms", "ui"]);
// Purely stylistic rules (comma advice, repeated sentence openers, capitalisation of headings/labels).
const DISABLED = [
  "UPPERCASE_SENTENCE_START", "EN_UPPER_CASE_NGRAM", "COMMA_COMPOUND_SENTENCE", "COMMA_COMPOUND_SENTENCE_2",
  "ENGLISH_WORD_REPEAT_BEGINNING_RULE", "MISSING_COMMA_AFTER_YEAR", "THE_POLISH", "PHRASE_REPETITION", "ENGLISH_WORD_REPEAT_RULE",
  "SENTENCE_WHITESPACE", "STARS_AND_STEPS", // fire on adjacent spans/table cells, not real prose
].join(",");

if (!/^https?:\/\/(localhost|127\.0\.0\.1|[a-z0-9.-]+\.[a-z]{2,})(:\d+)?$/i.test(base)) {
  console.error(`Refusing odd base URL: ${base}`);
  process.exit(2);
}

const visibleText = (html) => {
  const main = html.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? html;
  return main
    .replace(/<(script|style|svg|noscript|nav)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/?(p|h[1-6]|li|div|section|article|dt|dd|dl|tr|td|th|button|label|figcaption|header|footer|ul|ol|table)\b[^>]*>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "") // inline tags join their text, so "$" + "200" stays "$200"
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim())
    // Skip tiny fragments and the decorative code/browser mock-ups.
    .filter((l) => l.length > 2 && !/[{}<>›]/.test(l))
    .join("\n");
};

const chunks = (text) => {
  const out = [];
  let cur = "";
  for (const line of text.split("\n")) {
    if (cur.length + line.length + 1 > CHUNK) { out.push(cur); cur = ""; }
    cur += `${line}\n`;
  }
  if (cur) out.push(cur);
  return out;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let problems = 0;

for (const path of PAGES) {
  const res = await fetch(base + path, { redirect: "follow", signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res?.ok) { console.error(`${path}: could not load (${res?.status ?? "no response"})`); problems++; continue; }
  const text = visibleText(await res.text());

  // House rule: no em dashes in visible copy.
  text.split("\n").forEach((line) => {
    if (line.includes("—")) { console.log(`${path}  [house style] em dash: "${line.slice(0, 80)}"`); problems++; }
  });

  for (const part of chunks(text)) {
    const r = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({ text: part, language: "en-US", level: "default", disabledRules: DISABLED }),
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (!r?.ok) { console.error(`${path}: LanguageTool unavailable (${r?.status ?? "no response"}), try again later`); problems++; break; }
    const { matches = [] } = await r.json();
    for (const m of matches) {
      const bad = part.slice(m.offset, m.offset + m.length);
      // Skip known words, extraction artifacts (words fused from adjacent elements) and code-mock whitespace.
      if (IGNORE.has(bad.toLowerCase()) || /[a-z][A-Z]/.test(bad) || bad.includes("\n")) continue;
      problems++;
      const fix = (m.replacements ?? []).slice(0, 3).map((x) => x.value).join(" | ");
      console.log(`${path}  [${m.rule?.id}] "${bad}": ${m.message}${fix ? `  -> ${fix}` : ""}\n    ...${m.context?.text?.trim()}`);
    }
    await sleep(3200); // stay well under 20 requests/min
  }
}

console.log(problems === 0 ? "Copy check clean." : `\n${problems} item(s) to review.`);
process.exitCode = problems === 0 ? 0 : 1;
