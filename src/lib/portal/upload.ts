"use client";

import { MAX_UPLOAD_BYTES, UPLOAD_TYPES, uploadErrors } from "@/config/uploads";
import { confirmUpload, createUploadTicket } from "./actions";

export type UploadOutcome = { ok: true; id: string } | { ok: false; error: string };

/** Cheap checks before asking the server, so obvious mistakes fail instantly. The server re-checks everything. */
export const precheck = (file: File): string | null => {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ext in UPLOAD_TYPES)) return uploadErrors.type;
  if (file.size === 0) return uploadErrors.empty;
  if (file.size > MAX_UPLOAD_BYTES) return uploadErrors.size;
  return null;
};

/** PUT to the signed URL with XHR (fetch has no upload progress). Body format matches storage-js uploadToSignedUrl. */
const send = (url: string, file: File, contentType: string, onProgress: (pct: number) => void, signal?: AbortSignal) =>
  new Promise<boolean>((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
    xhr.onerror = () => resolve(false);
    xhr.onabort = () => resolve(false);
    signal?.addEventListener("abort", () => xhr.abort());
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", new Blob([file], { type: contentType }), file.name);
    xhr.send(body);
  });

/** Ticket, direct upload to storage, confirm. Resolves with the new file id or a readable error. */
export const uploadToProject = async (
  projectId: string,
  file: File,
  onProgress: (pct: number) => void = () => {},
  signal?: AbortSignal,
): Promise<UploadOutcome> => {
  const bad = precheck(file);
  if (bad) return { ok: false, error: bad };
  try {
    const ticket = await createUploadTicket(projectId, { name: file.name, size: file.size, type: file.type });
    if (!ticket.ok) return { ok: false, error: ticket.error };
    const sent = await send(ticket.signedUrl, file, ticket.contentType, onProgress, signal);
    if (!sent) return { ok: false, error: signal?.aborted ? "Upload cancelled." : "The upload was interrupted. Please try again." };
    const done = await confirmUpload(projectId, ticket.path, file.name);
    if (!done.ok) return { ok: false, error: done.error };
    onProgress(100);
    return { ok: true, id: done.id };
  } catch {
    return { ok: false, error: "The upload could not finish. Please try again." };
  }
};
