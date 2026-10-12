/** Only same-site relative paths are valid post-login destinations (blocks open redirects). */
export const safeNext = (value: string | null | undefined, fallback = "/portal"): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value))
    return fallback;
  return value;
};
