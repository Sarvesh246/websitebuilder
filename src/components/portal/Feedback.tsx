"use client";

import { Check, ImagePlus, MessageSquareText, Paperclip, Send, Trash2, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import {
  addFeedback,
  deleteFeedback,
  resolveFeedbackRound,
  setFeedbackItemStatus,
  submitFeedback,
} from "@/lib/portal/actions";
import { shortDate } from "@/lib/portal/format";
import type { FeedbackItem, FeedbackRound } from "@/lib/portal/types";
import { uploadToProject } from "@/lib/portal/upload";
import { draftRound, roundInProgress } from "@/lib/portal/workflow";
import { useFileOpener } from "./FileTools";
import { useAction } from "./useAction";
import { ConfirmDialog } from "./ConfirmDialog";

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp";

const Screenshot = ({ fileId, name }: { fileId: string; name: string | null }) => {
  const { pending, error, open } = useFileOpener();
  return (
    <span>
      <button type="button" className="pt-fb-shot" disabled={pending} onClick={() => open(fileId)}>
        <Paperclip aria-hidden size={13} />
        {name ?? "Screenshot"}
      </button>
      {error && (
        <span className="pt-msg pt-msg--error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
};

const Comment = ({ item, children }: { item: FeedbackItem; children?: ReactNode }) => (
  <li className="pt-fb-item" data-status={item.status}>
    <div className="pt-fb-item__body">
      {item.page && <span className="pt-chip pt-chip--outline">{item.page}</span>}
      <p style={{ whiteSpace: "pre-wrap" }}>{item.body}</p>
      {item.fileId && <Screenshot fileId={item.fileId} name={item.fileName} />}
    </div>
    {children}
  </li>
);

const Composer = ({ projectId }: { projectId: string }) => {
  const [page, setPage] = useState("");
  const [body, setBody] = useState("");
  const [shot, setShot] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const shotId = useId();
  const shotInput = useRef<HTMLInputElement>(null);
  const { pending, error, run, setError } = useAction();
  const busy = pending || pct !== null;

  // The uploaded screenshot is kept for retries, so a failed comment save never re-uploads (and orphans) it.
  const uploaded = useRef<{ file: File; id: string } | null>(null);
  const submitting = useRef(false);

  const submit = async () => {
    if (!body.trim() || submitting.current) return;
    submitting.current = true;
    try {
      let fileId: string | null = null;
      if (shot && uploaded.current?.file === shot) fileId = uploaded.current.id;
      else if (shot) {
        setPct(0);
        const res = await uploadToProject(projectId, shot, setPct);
        setPct(null);
        if (!res.ok) return setError(res.error);
        fileId = res.id;
        uploaded.current = { file: shot, id: res.id };
      }
      await run(() => addFeedback(projectId, { page: page.trim() || undefined, body: body.trim(), fileId }), {
        onOk: () => {
          setBody("");
          setShot(null);
          uploaded.current = null;
          if (shotInput.current) shotInput.current.value = "";
        },
      });
    } finally {
      submitting.current = false;
    }
  };

  return (
    <form
      className="pt-fb-composer"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="pt-field">
        <label htmlFor="pt-fb-page">Page or section</label>
        <input
          id="pt-fb-page"
          disabled={busy}
          className="pt-input"
          list="pt-fb-pages"
          placeholder="e.g. Home, hero"
          maxLength={120}
          value={page}
          onChange={(e) => setPage(e.target.value)}
        />
        <datalist id="pt-fb-pages">
          {["Home", "About", "Services", "Contact", "Footer", "Navigation", "Mobile layout", "Everywhere"].map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>
      <div className="pt-field">
        <label htmlFor="pt-fb-body">What would you like changed?</label>
        <textarea
          id="pt-fb-body"
          disabled={busy}
          className="pt-textarea"
          rows={3}
          maxLength={2000}
          placeholder="Be as specific as you like: what to change, and how it should look or read instead."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="pt-fb-composer__row">
        <input
          ref={shotInput}
          id={shotId}
          disabled={busy}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={(e) => setShot(e.target.files?.[0] ?? null)}
        />
        {shot ? (
          <span className="pt-chip pt-chip--outline">
            <Paperclip aria-hidden size={13} />
            {shot.name}
            <button
              type="button"
              disabled={busy}
              className="pt-chip__x"
              aria-label="Remove screenshot"
              onClick={() => setShot(null)}
            >
              <X aria-hidden size={12} />
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => shotInput.current?.click()}
            className="btn btn-secondary btn-sm"
          >
            <ImagePlus aria-hidden size={15} />
            Attach screenshot
          </button>
        )}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !body.trim()} aria-busy={busy}>
          {pct !== null ? `Uploading ${pct}%` : pending ? "Adding" : "Add comment"}
        </button>
      </div>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
};

const DraftList = ({
  projectId,
  round,
  used,
  included,
}: {
  projectId: string;
  round: FeedbackRound | null;
  used: number;
  included: number;
}) => {
  const [confirmExtra, setConfirmExtra] = useState(false);
  const remove = useAction();
  const send = useAction();
  const items = round?.items ?? [];
  const extra = used >= included;
  const sendRound = () =>
    send.run(() => submitFeedback(projectId), {
      success: "Sent. The studio will work through your comments.",
      onOk: () => setConfirmExtra(false),
    });
  if (items.length === 0) return null;
  return (
    <div className="pt-fb-draft">
      <p className="pt-strong">
        Round {round?.number} draft · {items.length} {items.length === 1 ? "comment" : "comments"}
      </p>
      <p className="pt-small">Only you can see drafts. The studio gets them all at once when you send the round.</p>
      <ul className="pt-fb-list">
        {items.map((item) => (
          <Comment key={item.id} item={item}>
            <button
              type="button"
              className="icon-btn"
              aria-label="Delete comment"
              disabled={remove.pending || send.pending}
              onClick={() => remove.run(() => deleteFeedback(item.id))}
            >
              <Trash2 aria-hidden size={16} strokeWidth={1.8} />
            </button>
          </Comment>
        ))}
      </ul>
      <div className="pt-fb-send">
        <p className="pt-small">
          {extra
            ? `Your package includes ${included} ${included === 1 ? "round" : "rounds"} of revisions, and all have been used. The studio will confirm any extra cost before starting this one.`
            : `Sending uses revision ${used + 1} of ${included}.`}
        </p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={send.pending || remove.pending}
          aria-busy={send.pending}
          onClick={() => (extra ? setConfirmExtra(true) : sendRound())}
        >
          <Send aria-hidden size={16} />
          {send.pending ? "Sending" : `Send round ${round?.number}`}
        </button>
      </div>
      <ConfirmDialog
        open={confirmExtra}
        onClose={() => setConfirmExtra(false)}
        title="Send an extra revision round?"
        confirmLabel="Send round"
        busy={send.pending}
        onConfirm={sendRound}
      >
        <p>This round is beyond your included revisions. The studio will confirm any extra cost before starting it.</p>
        {send.error && (
          <p className="pt-msg pt-msg--error" role="alert">
            {send.error}
          </p>
        )}
      </ConfirmDialog>
      {(send.error || remove.error) && (
        <p className="pt-msg pt-msg--error" role="alert">
          {send.error ?? remove.error}
        </p>
      )}
    </div>
  );
};

const AdminItem = ({ item }: { item: FeedbackItem }) => {
  const { pending, error, run } = useAction();
  const done = item.status === "done";
  return (
    <Comment item={item}>
      <button
        type="button"
        className="pt-fb-toggle"
        aria-pressed={done}
        disabled={pending}
        onClick={() => run(() => setFeedbackItemStatus(item.id, done ? "open" : "done"))}
      >
        <Check aria-hidden size={14} strokeWidth={2.6} />
        {done ? "Done" : "Mark done"}
      </button>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
    </Comment>
  );
};

const ResolveButton = ({ roundId, open }: { roundId: string; open: number }) => {
  const { pending, error, run } = useAction();
  const [confirmResolve, setConfirmResolve] = useState(false);
  const resolve = () => run(() => resolveFeedbackRound(roundId), { onOk: () => setConfirmResolve(false) });
  return (
    <div className="pt-stack" style={{ justifyItems: "start" }}>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={pending}
        onClick={() => (open > 0 ? setConfirmResolve(true) : resolve())}
      >
        {pending ? "Saving" : "Mark round addressed"}
      </button>
      <ConfirmDialog
        open={confirmResolve}
        onClose={() => setConfirmResolve(false)}
        title="Mark the round addressed?"
        confirmLabel="Mark addressed"
        busy={pending}
        onConfirm={resolve}
      >
        <p>
          {open} {open === 1 ? "comment is" : "comments are"} not marked done. Confirm only if the requested changes are
          ready for another client review.
        </p>
        {error && (
          <p className="pt-msg pt-msg--error" role="alert">
            {error}
          </p>
        )}
      </ConfirmDialog>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

const roundState = (r: FeedbackRound) =>
  r.status === "resolved" ? `Addressed ${shortDate(r.resolvedAt)}` : `Sent ${shortDate(r.submittedAt)}, in progress`;

export const FeedbackPanel = ({
  projectId,
  rounds,
  admin,
  canGive,
  used,
  included,
  previewing,
}: {
  projectId: string;
  rounds: FeedbackRound[];
  admin: boolean;
  canGive: boolean;
  used: number;
  included: number;
  previewing: boolean;
}) => {
  const draft = draftRound(rounds);
  const active = roundInProgress(rounds);
  const history = rounds.filter((r) => r.status !== "draft");

  return (
    <section className="pt-card" id="feedback" aria-labelledby="pt-feedback-title">
      <div className="pt-card__head">
        <div>
          <h2 className="pt-card__title" id="pt-feedback-title">
            Feedback
          </h2>
          <p className="pt-card__note">
            Revisions used: {used} of {included}
          </p>
        </div>
        <MessageSquareText aria-hidden size={18} className="pt-muted" />
      </div>

      {!admin && !previewing && canGive && !active && (
        <>
          <Composer projectId={projectId} />
          <DraftList projectId={projectId} round={draft} used={used} included={included} />
        </>
      )}
      {!admin && active && (
        <p className="pt-msg" role="status">
          Round {active.number} is with the studio. You can add new comments once it has been addressed.
        </p>
      )}
      {!admin && !canGive && !active && history.length === 0 && (
        <p className="pt-small">
          When a preview is ready for review, you can leave comments here. Each round you send uses one revision.
        </p>
      )}
      {admin && history.length === 0 && (
        <p className="pt-small">
          No feedback rounds yet. The client can comment once there is a preview and the project is in review.
        </p>
      )}
      {previewing && <p className="pt-small">Preview mode: commenting is disabled.</p>}

      {history.length > 0 && (
        <div className="pt-fb-history">
          {history.map((r) => {
            const live = admin && r.status === "submitted";
            return (
              <details key={r.id} className="pt-fb-round" open={r.status === "submitted"}>
                <summary>
                  <span className="pt-strong">Round {r.number}</span>
                  <span className={`pt-chip ${r.status === "resolved" ? "pt-chip--done" : "pt-chip--accent"}`}>
                    {r.status === "resolved" ? "Addressed" : "In progress"}
                  </span>
                  {r.extra && <span className="pt-chip pt-chip--outline">Extra round</span>}
                  <span className="pt-small">{roundState(r)}</span>
                </summary>
                <ul className="pt-fb-list">
                  {r.items.map((item) =>
                    live ? (
                      <AdminItem key={item.id} item={item} />
                    ) : (
                      <Comment key={item.id} item={item}>
                        {item.status === "done" && (
                          <span className="pt-chip pt-chip--done">
                            <Check aria-hidden size={12} strokeWidth={2.6} /> Done
                          </span>
                        )}
                      </Comment>
                    ),
                  )}
                </ul>
                {live && <ResolveButton roundId={r.id} open={r.items.filter((i) => i.status === "open").length} />}
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
};
