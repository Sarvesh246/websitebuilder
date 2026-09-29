/** Only same-site relative paths are valid post-login destinations (blocks open redirects). */
export const safeNext = (value: string | null | undefined, fallback = "/portal"): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
};
