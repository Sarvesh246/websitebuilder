/** Project file upload rules, shared by the browser precheck and the server (which re-checks everything). */
export const UPLOAD_BUCKET = "project-files";
export const MAX_UPLOAD_MB = 25;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Allowed extensions and the content type each is stored as. Mirrored in the bucket's allowed_mime_types (SQL). */
export const UPLOAD_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", pdf: "application/pdf",
  zip: "application/zip", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", txt: "text/plain",
};
export const UPLOAD_ACCEPT = Object.keys(UPLOAD_TYPES).map((e) => `.${e}`).join(",");

export const uploadErrors = {
  type: "That file type is not supported. Use images, PDF, ZIP, DOCX or TXT.",
  size: `That file is larger than ${MAX_UPLOAD_MB} MB.`,
  empty: "That file is empty.",
} as const;
