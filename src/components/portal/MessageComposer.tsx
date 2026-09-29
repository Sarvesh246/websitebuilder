"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { markMessagesRead, sendMessage } from "@/lib/portal/actions";
import { useAction } from "./useAction";

export const MessageComposer = ({ projectId, disabledReason }: { projectId: string; disabledReason?: string }) => {
  const [body, setBody] = useState("");
  const { pending, error, run } = useAction();
  const ref = useRef<HTMLTextAreaElement>(null);
  const disabled = Boolean(disabledReason);

  const submit = () => {
    const text = body.trim();
    if (!text || disabled) return;
    run(() => sendMessage(projectId, text), { onOk: () => setBody("") });
  };

  return (
    <form
      className="pt-composer"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label className="sr-only" htmlFor="pt-msg-body">
        Message
      </label>
      <textarea
        id="pt-msg-body"
        ref={ref}
        className="pt-textarea"
        value={body}
        maxLength={4000}
        placeholder={disabledReason ?? "Write a message"}
        disabled={disabled}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="pt-composer__row">
        <span className="pt-small" role={error ? "alert" : undefined}>
          {error ?? disabledReason ?? "Ctrl or Cmd + Enter to send"}
        </span>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || disabled || !body.trim()} aria-busy={pending}>
          {pending ? "Sending" : "Send"}
          <Send aria-hidden size={15} strokeWidth={1.9} />
        </button>
      </div>
    </form>
  );
};

/** Marks the other side's messages read once the thread is on screen. Runs after paint, never during render. */
export const MarkRead = ({ projectId, unread }: { projectId: string; unread: number }) => {
  useEffect(() => {
    if (unread > 0) void markMessagesRead(projectId);
  }, [projectId, unread]);
  return null;
};
