"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { addMilestone, addNote, deleteMilestone, linkProjectToUser, setDeadline, setMilestoneStatus, setPreviewUrl, setRevisions, setStage } from "@/lib/portal/actions";
import { type Milestone, type MilestoneStatus, type ProjectStage, projectStages, stageLabel } from "@/lib/portal/types";
import { useAction } from "./useAction";

const Status = ({ error, notice }: { error: string | null; notice: string | null }) =>
  error ? (
    <span className="pt-small" role="alert" style={{ color: "var(--danger)" }}>
      {error}
    </span>
  ) : notice ? (
    <span className="pt-small" role="status">
      {notice}
    </span>
  ) : null;

const stageOptions: ProjectStage[] = [...projectStages, "cancelled"];

export const StageControl = ({ projectId, stage }: { projectId: string; stage: ProjectStage }) => {
  const [value, setValue] = useState(stage);
  const { pending, error, notice, run } = useAction();
  return (
    <form
      className="pt-form-row"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => setStage(projectId, value), { success: "Stage updated." });
      }}
    >
      <div className="pt-field">
        <label htmlFor="pt-stage">Stage</label>
        <select id="pt-stage" className="pt-select" value={value} onChange={(e) => setValue(e.target.value as ProjectStage)}>
          {stageOptions.map((s) => (
            <option key={s} value={s}>
              {stageLabel[s]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending || value === stage}>
        {pending ? "Saving" : "Update stage"}
      </button>
      <Status error={error} notice={notice} />
    </form>
  );
};

export const ScheduleControls = ({
  projectId,
  deadline,
  previewUrl,
  revisionsIncluded,
  revisionsUsed,
}: {
  projectId: string;
  deadline: string | null;
  previewUrl: string | null;
  revisionsIncluded: number;
  revisionsUsed: number;
}) => {
  const [date, setDate] = useState(deadline ?? "");
  const [url, setUrl] = useState(previewUrl ?? "");
  const [included, setIncluded] = useState(String(revisionsIncluded));
  const [used, setUsed] = useState(String(revisionsUsed));
  const a = useAction();
  const b = useAction();
  const c = useAction();
  const num = (v: string) => Math.max(0, Math.min(20, Math.round(Number(v) || 0)));

  return (
    <div className="pt-stack">
      <form
        className="pt-form-row"
        onSubmit={(e) => {
          e.preventDefault();
          a.run(() => setDeadline(projectId, date || null), { success: "Deadline saved." });
        }}
      >
        <div className="pt-field">
          <label htmlFor="pt-deadline">Deadline</label>
          <input id="pt-deadline" type="date" className="pt-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary btn-sm" disabled={a.pending}>
          Save
        </button>
        <Status error={a.error} notice={a.notice} />
      </form>
      <form
        className="pt-form-row"
        onSubmit={(e) => {
          e.preventDefault();
          b.run(() => setPreviewUrl(projectId, url.trim() || null), { success: "Preview link saved." });
        }}
      >
        <div className="pt-field">
          <label htmlFor="pt-preview">Preview URL</label>
          <input id="pt-preview" type="url" inputMode="url" className="pt-input" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary btn-sm" disabled={b.pending}>
          Save
        </button>
        <Status error={b.error} notice={b.notice} />
      </form>
      <form
        className="pt-form-row"
        onSubmit={(e) => {
          e.preventDefault();
          c.run(() => setRevisions(projectId, { included: num(included), used: num(used) }), { success: "Revisions saved." });
        }}
      >
        <div className="pt-field">
          <label htmlFor="pt-rev-used">Revisions used</label>
          <input id="pt-rev-used" type="number" min={0} max={20} inputMode="numeric" className="pt-input" value={used} onChange={(e) => setUsed(e.target.value)} />
        </div>
        <div className="pt-field">
          <label htmlFor="pt-rev-inc">Revisions included</label>
          <input id="pt-rev-inc" type="number" min={0} max={20} inputMode="numeric" className="pt-input" value={included} onChange={(e) => setIncluded(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-secondary btn-sm" disabled={c.pending}>
          Save
        </button>
        <Status error={c.error} notice={c.notice} />
      </form>
    </div>
  );
};

const MilestoneRow = ({ m }: { m: Milestone }) => {
  const { pending, error, run } = useAction();
  return (
    <li className="pt-row">
      <div className="pt-row__main">
        <span className="pt-row__title">{m.title}</span>
        {error && (
          <span className="pt-small" role="alert" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <label className="sr-only" htmlFor={`ms-${m.id}`}>
          Status of {m.title}
        </label>
        <select
          id={`ms-${m.id}`}
          className="pt-select"
          style={{ minWidth: "8.5rem" }}
          defaultValue={m.status}
          disabled={pending}
          onChange={(e) => run(() => setMilestoneStatus(m.id, e.target.value as MilestoneStatus))}
        >
          <option value="pending">Upcoming</option>
          <option value="active">In progress</option>
          <option value="done">Done</option>
        </select>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Delete milestone ${m.title}`}
          disabled={pending}
          onClick={() => {
            if (window.confirm(`Delete milestone "${m.title}"?`)) run(() => deleteMilestone(m.id));
          }}
        >
          <Trash2 aria-hidden size={18} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
};

export const MilestoneEditor = ({ projectId, milestones }: { projectId: string; milestones: Milestone[] }) => {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [due, setDue] = useState("");
  const { pending, error, run } = useAction();
  return (
    <div className="pt-stack">
      {milestones.length > 0 && (
        <ul className="pt-list">
          {milestones.map((m) => (
            <MilestoneRow key={`${m.id}-${m.status}`} m={m} />
          ))}
        </ul>
      )}
      <form
        className="pt-stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          run(() => addMilestone(projectId, { title: title.trim(), detail: detail.trim() || undefined, dueDate: due || undefined }), {
            onOk: () => {
              setTitle("");
              setDetail("");
              setDue("");
            },
          });
        }}
      >
        <div className="pt-form-row">
          <div className="pt-field" style={{ flex: "2 1 14rem" }}>
            <label htmlFor="pt-ms-title">New milestone</label>
            <input id="pt-ms-title" className="pt-input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="Design review" />
          </div>
          <div className="pt-field">
            <label htmlFor="pt-ms-due">Due</label>
            <input id="pt-ms-due" type="date" className="pt-input" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
        </div>
        <div className="pt-field">
          <label htmlFor="pt-ms-detail">Detail (optional)</label>
          <input id="pt-ms-detail" className="pt-input" value={detail} maxLength={240} onChange={(e) => setDetail(e.target.value)} />
        </div>
        <div className="pt-form-row">
          <button type="submit" className="btn btn-secondary btn-sm" disabled={pending || !title.trim()}>
            <Plus aria-hidden size={15} />
            Add milestone
          </button>
          <Status error={error} notice={null} />
        </div>
      </form>
    </div>
  );
};

export const LinkUserForm = ({ projectId, email }: { projectId: string; email: string }) => {
  const [value, setValue] = useState(email);
  const { pending, error, notice, run } = useAction();
  return (
    <form
      className="pt-form-row"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => linkProjectToUser(projectId, value.trim()), { success: "Linked to the account." });
      }}
    >
      <div className="pt-field">
        <label htmlFor="pt-link-email">Link to account by email</label>
        <input id="pt-link-email" type="email" className="pt-input" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-secondary btn-sm" disabled={pending || !value.trim()}>
        Link
      </button>
      <Status error={error} notice={notice} />
    </form>
  );
};

export const NoteForm =({ projectId }: { projectId: string }) => {
  const [body, setBody] = useState("");
  const { pending, error, run } = useAction();
  return (
    <form
      className="pt-stack"
      onSubmit={(e) => {
        e.preventDefault();
        if (!body.trim()) return;
        run(() => addNote(projectId, body.trim()), { onOk: () => setBody("") });
      }}
    >
      <div className="pt-field">
        <label htmlFor="pt-note">Internal note (never shown to the client)</label>
        <textarea id="pt-note" className="pt-textarea" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} />
      </div>
      <div className="pt-form-row">
        <button type="submit" className="btn btn-secondary btn-sm" disabled={pending || !body.trim()}>
          Add note
        </button>
        <Status error={error} notice={null} />
      </div>
    </form>
  );
};
