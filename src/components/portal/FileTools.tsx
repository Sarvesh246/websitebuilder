"use client";

import { Download, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { deleteFile, fileDownloadUrl, uploadFile } from "@/lib/portal/actions";
import { useAction } from "./useAction";

const MAX_MB = 25;

export const FileUploader = ({ projectId, disabledReason }: { projectId: string; disabledReason?: string }) => {
  const input = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const { pending, error, notice, run, setError } = useAction();

  const submit = () => {
    const file = input.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is larger than ${MAX_MB} MB.`);
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    run(() => uploadFile(projectId, fd), {
      success: "File uploaded.",
      onOk: () => {
        setName(null);
        if (input.current) input.current.value = "";
      },
    });
  };

  return (
    <div className="pt-drop">
      <Upload aria-hidden size={22} strokeWidth={1.7} />
      <p className="pt-strong">Add a file</p>
      <p className="pt-small">Images, PDFs and documents up to {MAX_MB} MB.</p>
      <input
        ref={input}
        id="pt-file-input"
        type="file"
        className="sr-only"
        disabled={Boolean(disabledReason) || pending}
        onChange={(e) => setName(e.target.files?.[0]?.name ?? null)}
      />
      <div className="pt-form-row" style={{ justifyContent: "center" }}>
        <label htmlFor="pt-file-input" className="btn btn-secondary btn-sm" aria-disabled={Boolean(disabledReason) || undefined}>
          Choose file
        </label>
        <button type="button" className="btn btn-primary btn-sm" disabled={!name || pending || Boolean(disabledReason)} onClick={submit} aria-busy={pending}>
          {pending ? "Uploading" : "Upload"}
        </button>
      </div>
      {name && <p className="pt-small">{name}</p>}
      {disabledReason && <p className="pt-small">{disabledReason}</p>}
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="pt-msg" role="status">
          {notice}
        </p>
      )}
    </div>
  );
};

export const FileActions = ({ fileId, name, canDelete }: { fileId: string; name: string; canDelete: boolean }) => {
  const { pending, error, run } = useAction();
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
        onClick={() =>
          run(() => fileDownloadUrl(fileId), {
            refresh: false,
            onOk: (r) => {
              if (r.url) window.open(r.url, "_blank", "noopener,noreferrer");
            },
          })
        }
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
