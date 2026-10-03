"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { setViewAs, updateFullName } from "@/lib/portal/actions";
import { useAction } from "./useAction";

export const ExitPreviewButton = () => {
  const { pending, run } = useAction();
  return (
    <button type="button" className="btn btn-secondary btn-sm" disabled={pending} onClick={() => run(() => setViewAs(false))}>
      Exit preview
    </button>
  );
};

export const ViewAsToggle = ({ active }: { active: boolean }) => {
  const { pending, error, run } = useAction();
  return (
    <div className="pt-stack">
      <button
        type="button"
        className={active ? "btn btn-secondary" : "btn btn-primary"}
        style={{ justifySelf: "start" }}
        disabled={pending}
        aria-busy={pending}
        onClick={() => run(() => setViewAs(!active))}
      >
        {active ? <EyeOff aria-hidden size={16} /> : <Eye aria-hidden size={16} />}
        {active ? "Exit client preview" : "Preview as client"}
      </button>
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export const NameForm = ({ initial }: { initial: string }) => {
  const [name, setName] = useState(initial);
  const { pending, error, notice, run } = useAction();
  return (
    <form
      className="pt-stack"
      onSubmit={(e) => {
        e.preventDefault();
        run(() => updateFullName(name.trim()), { success: "Saved." });
      }}
    >
      <div className="pt-field">
        <label htmlFor="pt-fullname">Full name</label>
        <input id="pt-fullname" className="pt-input" value={name} maxLength={120} autoComplete="name" onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="pt-form-row">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending || name.trim().length < 1 || name.trim() === initial}>
          {pending ? "Saving" : "Save name"}
        </button>
        {notice && (
          <span className="pt-small" role="status">
            {notice}
          </span>
        )}
        {error && (
          <span className="pt-small" role="alert" style={{ color: "var(--danger)" }}>
            {error}
          </span>
        )}
      </div>
    </form>
  );
};
