"use client";

import { Check, Circle, MinusCircle, Paperclip, Plus, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import { addChecklistItem, removeChecklistItem, updateChecklistItem } from "@/lib/portal/actions";
import type { ChecklistItem } from "@/lib/portal/types";
import { UPLOAD_ACCEPT } from "@/config/uploads";
import { uploadToProject } from "@/lib/portal/upload";
import { ProgressBar } from "./charts/ProgressBar";
import { useAction } from "./useAction";

type RowProps = { projectId: string; item: ChecklistItem; admin: boolean; disabled: boolean };

const statusText = { needed: "Needed", provided: "Sent", skipped: "Not needed" } as const;

const Row = ({ projectId, item, admin, disabled }: RowProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [pct, setPct] = useState<number | null>(null);
  const { pending, error, run, setError } = useAction();
  const busy = pending || pct !== null;
  const set = (status: ChecklistItem["status"], extra: { answer?: string | null; fileId?: string | null } = {}) =>
    run(() => updateChecklistItem(projectId, item.key, { status, ...extra }));

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPct(0);
    const res = await uploadToProject(projectId, file, setPct);
    setPct(null);
    if (fileInput.current) fileInput.current.value = "";
    if (!res.ok) return setError(res.error);
    set("provided", { fileId: res.id });
  };

  const Icon = item.status === "provided" ? Check : item.status === "skipped" ? MinusCircle : Circle;
  return (
    <li className="pt-check-item" data-status={item.status}>
      <span className="pt-check-item__icon" aria-hidden>
        <Icon size={15} strokeWidth={2.4} />
      </span>
      <div className="pt-check-item__body">
        <p className="pt-check-item__label">
          {item.label}
          {item.optional && <span className="pt-check-item__opt">Optional</span>}
          <span className="sr-only">: {statusText[item.status]}</span>
        </p>
        {item.status === "provided" && item.kind === "upload" ? (
          <p className="pt-small pt-check-item__sent">
            {item.fileName ? (
              <>
                <Paperclip aria-hidden size={13} />
                {item.fileName}
              </>
            ) : (
              "Marked as sent"
            )}
          </p>
        ) : (
          item.hint && <p className="pt-small">{item.hint}</p>
        )}
        {pct !== null && (
          <span className="pt-upload__bar" role="progressbar" aria-label={`Uploading for ${item.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <span style={{ width: `${pct}%` }} />
          </span>
        )}
        {error && (
          <p className="pt-msg pt-msg--error" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="pt-check-item__actions">
        {item.kind === "answer" ? (
          <select
            className="pt-select"
            aria-label={item.label}
            disabled={disabled || busy}
            value={item.answer ?? ""}
            onChange={(e) => (e.target.value ? set("provided", { answer: e.target.value }) : set("needed", { answer: null }))}
          >
            <option value="">Choose an answer</option>
            {item.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : item.status === "needed" ? (
          <>
            <input ref={fileInput} id={inputId} type="file" accept={UPLOAD_ACCEPT} className="sr-only" disabled={disabled || busy} onChange={(e) => void upload(e.target.files?.[0])} />
            <label htmlFor={inputId} className="btn btn-primary btn-sm" aria-disabled={disabled || busy || undefined}>
              {pct !== null ? `${pct}%` : "Upload"}
            </label>
            <button type="button" className="btn btn-secondary btn-sm" disabled={disabled || busy} onClick={() => set("provided")} title="Use this if you sent it another way, such as in Messages">
              Already sent
            </button>
          </>
        ) : (
          <button type="button" className="btn-link pt-small" disabled={disabled || busy} onClick={() => set("needed", { fileId: null })}>
            Undo
          </button>
        )}
        {item.status === "needed" && (item.optional || admin) && item.kind === "upload" && (
          <button type="button" className="btn-link pt-small" disabled={disabled || busy} onClick={() => set("skipped")}>
            {admin ? "Not needed" : "Skip"}
          </button>
        )}
        {admin && item.custom && (
          <button type="button" className="icon-btn" aria-label={`Remove ${item.label}`} disabled={busy} onClick={() => run(() => removeChecklistItem(projectId, item.key))}>
            <Trash2 aria-hidden size={16} strokeWidth={1.8} />
          </button>
        )}
      </div>
    </li>
  );
};

const AddItem = ({ projectId }: { projectId: string }) => {
  const [label, setLabel] = useState("");
  const { pending, error, run } = useAction();
  return (
    <form
      className="pt-check-add"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => addChecklistItem(projectId, label), { onOk: () => setLabel("") });
      }}
    >
      <label className="sr-only" htmlFor="pt-check-new">
        Ask the client for something else
      </label>
      <input id="pt-check-new" className="pt-input" placeholder="Ask for something else, e.g. menu PDF" value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} />
      <button type="submit" className="btn btn-secondary btn-sm" disabled={pending || !label.trim()}>
        <Plus aria-hidden size={15} />
        Add
      </button>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert" style={{ gridColumn: "1 / -1" }}>
          {error}
        </p>
      )}
    </form>
  );
};

export const ChecklistCard = ({ projectId, items, admin, disabledReason }: { projectId: string; items: ChecklistItem[]; admin: boolean; disabledReason?: string }) => {
  const required = items.filter((i) => !i.optional);
  const done = required.filter((i) => i.status !== "needed").length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 100;
  return (
    <section className="pt-card" id="checklist" aria-labelledby="pt-checklist-title">
      <div className="pt-card__head">
        <div>
          <h2 className="pt-card__title" id="pt-checklist-title">
            {admin ? "Content checklist" : "What the studio needs from you"}
          </h2>
          <p className="pt-card__note">
            {done === required.length ? "Everything required is in. Thank you." : `${done} of ${required.length} required items sent`}
          </p>
        </div>
      </div>
      <ProgressBar value={pct} label="Checklist progress" size="sm" tone={pct === 100 ? "muted" : "accent"} className="pt-check-progress" />
      <ul className="pt-check-list">
        {items.map((item) => (
          <Row key={item.key} projectId={projectId} item={item} admin={admin} disabled={Boolean(disabledReason)} />
        ))}
      </ul>
      {disabledReason && <p className="pt-small">{disabledReason}</p>}
      {admin && !disabledReason && <AddItem projectId={projectId} />}
    </section>
  );
};
