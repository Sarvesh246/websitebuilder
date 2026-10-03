"use client";

import { CheckCircle2, Download, Trash2, TriangleAlert, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type DragEvent } from "react";
import { deleteFile, fileDownloadUrl } from "@/lib/portal/actions";
import { MAX_UPLOAD_MB, UPLOAD_ACCEPT } from "@/config/uploads";
import { uploadToProject } from "@/lib/portal/upload";
import { cn } from "@/lib/cn";
import { useAction } from "./useAction";

type Job = { key: string; name: string; pct: number; state: "uploading" | "done" | "error"; error?: string };

/**
 * Drop zone plus a queue: every dropped or chosen file uploads straight to storage with its own progress bar.
 */
export const FileUploader = ({ projectId, disabledReason, compact }: { projectId: string; disabledReason?: string; compact?: boolean }) => {
  const router = useRouter();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);
  const disabled = Boolean(disabledReason);
  const busy = jobs.some((j) => j.state === "uploading");

  const patch = (key: string, next: Partial<Job>) => setJobs((all) => all.map((j) => (j.key === key ? { ...j, ...next } : j)));

  const start = async (files: File[]) => {
    if (disabled || files.length === 0) return;
    const queued = files.map((f, i) => ({ file: f, job: { key: `${Date.now()}-${i}-${f.name}`, name: f.name, pct: 0, state: "uploading" as const } }));
    setJobs((all) => [...queued.map((q) => q.job), ...all.filter((j) => j.state !== "done")]);
    // Two uploads at a time: faster than one by one, without splitting a slow connection across many.
    let any = false;
    let next = 0;
    const worker = async () => {
      while (next < queued.length) {
        const { file, job } = queued[next++];
        const res = await uploadToProject(projectId, file, (pct) => patch(job.key, { pct }));
        if (res.ok) {
          any = true;
          patch(job.key, { state: "done", pct: 100 });
        } else patch(job.key, { state: "error", error: res.error });
      }
    };
    await Promise.all([worker(), worker()]);
    if (input.current) input.current.value = "";
    if (any) router.refresh();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void start(Array.from(e.dataTransfer.files));
  };

  return (
    <div className={cn("pt-drop", over && "pt-drop--over", compact && "pt-drop--compact")}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      data-disabled={disabled || undefined}
    >
      <Upload aria-hidden size={compact ? 18 : 24} strokeWidth={1.7} />
      <p className="pt-strong">
        {over ? "Drop to upload" : <><span className="pt-drop__fine">Drag files here</span><span className="pt-drop__touch">Add files</span></>}
      </p>
      <p className="pt-small">
        <span className="pt-drop__fine">or choose them from your device. </span>Images, PDF, ZIP, DOCX or TXT, up to {MAX_UPLOAD_MB} MB each.
      </p>
      <input
        ref={input}
        id={inputId}
        type="file"
        multiple
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => void start(Array.from(e.target.files ?? []))}
      />
      <label htmlFor={inputId} className="btn btn-secondary btn-sm" aria-disabled={disabled || undefined}>
        {busy ? "Add more files" : "Choose files"}
      </label>
      {disabledReason && <p className="pt-small">{disabledReason}</p>}
      {jobs.length > 0 && (
        <ul className="pt-uploads" aria-label="Uploads">
          {jobs.map((j) => (
            <li key={j.key} className="pt-upload" data-state={j.state}>
              <span className="pt-upload__icon" aria-hidden>
                {j.state === "done" ? <CheckCircle2 size={16} /> : j.state === "error" ? <TriangleAlert size={16} /> : <Upload size={16} />}
              </span>
              <div className="pt-upload__body">
                <span className="pt-upload__name">{j.name}</span>
                {j.state === "error" ? (
                  <span className="pt-upload__error" role="alert">{j.error}</span>
                ) : (
                  <span className="pt-upload__bar" role="progressbar" aria-label={`Uploading ${j.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={j.pct}>
                    <span style={{ width: `${j.pct}%` }} />
                  </span>
                )}
              </div>
              <span className="pt-upload__pct pt-num">{j.state === "done" ? "Done" : j.state === "error" ? "" : `${j.pct}%`}</span>
              {j.state !== "uploading" && (
                <button type="button" className="pt-upload__x" aria-label={`Dismiss ${j.name}`} onClick={() => setJobs((all) => all.filter((x) => x.key !== j.key))}>
                  <X aria-hidden size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Opens a short-lived signed link for a project file in a new tab. */
export const useFileOpener = () => {
  const { pending, error, run } = useAction();
  const open = (fileId: string) =>
    run(() => fileDownloadUrl(fileId), { refresh: false, onOk: (r) => r.url && window.open(r.url, "_blank", "noopener,noreferrer") });
  return { pending, error, open, run };
};

export const FileActions = ({ fileId, name, canDelete }: { fileId: string; name: string; canDelete: boolean }) => {
  const { pending, error, open, run } = useFileOpener();
  return (
    <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
      {error && (
        <span className="pt-small" role="alert">
          {error}
        </span>
      )}
      <button
        type="button"
        className="icon-btn"
        aria-label={`Download ${name}`}
        disabled={pending}
        onClick={() => open(fileId)}
      >
        <Download aria-hidden size={19} strokeWidth={1.75} />
      </button>
      {canDelete && (
        <button
          type="button"
          className="icon-btn"
          aria-label={`Delete ${name}`}
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete ${name}? This cannot be undone.`)) run(() => deleteFile(fileId));
          }}
        >
          <Trash2 aria-hidden size={19} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
};
