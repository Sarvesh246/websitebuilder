/**
 * WCAG contrast check for the key text/background token pairs in styles/tokens.css.
 * Run: npm run contrast. Update the table if tokens change. Exits non-zero on failure.
 * Values are the opaque light/dark pairs. Translucent surfaces are checked at their
 * worst case: glass composited on --bg.
 */
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (fg, bg, a) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const themes = {
  light: {
    bg: "#f3f3f1", strong: "#0f1115", text: "#2b2f36", muted: "#5d646e", subtle: "#646b75",
    accentInk: "#2a4a82", accent: "#3b5f9e", accentSoftBase: [92, 132, 200, 0.14],
    btnBg: "#17191d", btnText: "#f7f7f5", glassWhite: 0.55,
    danger: "#b42318", fieldBorder: "#7d8794", fieldWhite: 0.92, footerBg: "#f3f3f1",
    pillBg: "#dfe8f6", pillInk: "#2c4d85",
  },
  dark: {
    bg: "#0c0e11", strong: "#f3f4f6", text: "#c9cdd3", muted: "#a0a6ae", subtle: "#8d939b",
    accentInk: "#c3d4f3", accent: "#a9c0ea", accentSoftBase: [169, 192, 234, 0.14],
    btnBg: "#f3f4f6", btnText: "#0c0e11", glassWhite: 0.06,
    danger: "#ff9a8f", fieldBorder: "#6f7a89", fieldWhite: 0.08, footerBg: "#0c0e11",
    pillBg: "#1f2733", pillInk: "#c3d4f3",
  },
};

let failed = false;
for (const [name, t] of Object.entries(themes)) {
  const bg = hex(t.bg);
  const glass = mix([255, 255, 255], bg, t.glassWhite);
  const badgeBg = mix(t.accentSoftBase.slice(0, 3), bg, t.accentSoftBase[3]);
  const field = mix([255, 255, 255], glass, t.fieldWhite);
  const checks = [
    ["text-strong on bg", t.strong, bg, 4.5],
    ["text on bg", t.text, bg, 4.5],
    ["text-muted on bg", t.muted, bg, 4.5],
    ["text-subtle on bg", t.subtle, bg, 4.5],
    ["text-muted on glass", t.muted, glass, 4.5],
    ["accent-ink on badge", t.accentInk, badgeBg, 4.5],
    ["accent (focus ring) on bg", t.accent, bg, 3],
    ["primary button text", t.btnText, t.btnBg, 4.5],
    ["danger text on glass", t.danger, glass, 4.5],
    ["field border on field", t.fieldBorder, field, 3],
    ["text-strong on field", t.strong, field, 4.5],
    ["accent-ink on bg (legal links)", t.accentInk, bg, 4.5],
    ["text on footer", t.text, t.footerBg, 4.5],
    ["text-muted on footer", t.muted, t.footerBg, 4.5],
    ["pricing pill (Founding Client Pricing)", t.pillInk, t.pillBg, 4.5],
  ].map(([label, fg, back, min]) => [label, ratio(typeof fg === "string" ? hex(fg) : fg, typeof back === "string" ? hex(back) : back), min]);

  console.log(`\n${name}`);
  for (const [label, r, min] of checks) {
    const ok = r >= min;
    failed ||= !ok;
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)} (min ${min})  ${label}`);
  }
}
process.exit(failed ? 1 : 0);
