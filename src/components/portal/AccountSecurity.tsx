"use client";

import { KeyRound, Link2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { deleteAccount } from "@/lib/portal/actions";
import { useAction } from "./useAction";

type Identity = { identity_id: string; provider: string; email?: string };

const browserAuth = async () => (await import("@/utils/supabase/client")).createClient().auth;
const MIN_PASSWORD = 8;

/** The account's linked sign-in methods, or null when they could not be read. */
const fetchIdentities = async (): Promise<Identity[] | null> => {
  try {
    const { data, error } = await (await browserAuth()).getUserIdentities();
    if (error) return null;
    return (data?.identities ?? []).map((i) => ({ identity_id: i.identity_id, provider: i.provider, email: (i.identity_data?.email as string | undefined) ?? undefined }));
  } catch {
    return null;
  }
};

/** Password changes go through Supabase Auth in the browser, on the signed-in session (no password ever reaches our server). */
export const PasswordForm = ({ disabled }: { disabled?: boolean }) => {
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [state, setState] = useState<{ pending: boolean; error: string | null; notice: string | null }>({ pending: false, error: null, notice: null });
  const mismatch = again.length > 0 && pw !== again;

  const submit = async () => {
    if (pw.length < MIN_PASSWORD || pw !== again) return;
    setState({ pending: true, error: null, notice: null });
    try {
      const { error } = await (await browserAuth()).updateUser({ password: pw });
      if (error) {
        const msg = /reauth|recent/i.test(error.message)
          ? "For your security, sign out and back in, then change your password right away."
          : /same|different/i.test(error.message)
            ? "Choose a password you have not used here before."
            : "Your password could not be changed. Please try again.";
        setState({ pending: false, error: msg, notice: null });
        return;
      }
      setPw("");
      setAgain("");
      setState({ pending: false, error: null, notice: "Password updated. Use it next time you sign in." });
    } catch {
      setState({ pending: false, error: "Your password could not be changed. Please try again.", notice: null });
    }
  };

  return (
    <form
      className="pt-stack"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {/* Hidden username helps password managers save the new password against the right account. */}
      <div className="pt-field">
        <label htmlFor="pt-pw-new">New password</label>
        <input id="pt-pw-new" type="password" className="pt-input" autoComplete="new-password" minLength={MIN_PASSWORD} value={pw} disabled={disabled} onChange={(e) => setPw(e.target.value)} aria-describedby="pt-pw-hint" />
        <p id="pt-pw-hint" className="pt-small">
          At least {MIN_PASSWORD} characters. If you only sign in with Google, this adds a password as a second way in.
        </p>
      </div>
      <div className="pt-field">
        <label htmlFor="pt-pw-again">Confirm new password</label>
        <input id="pt-pw-again" type="password" className="pt-input" autoComplete="new-password" value={again} disabled={disabled} onChange={(e) => setAgain(e.target.value)} aria-invalid={mismatch || undefined} />
        {mismatch && <p className="pt-small" role="alert">The passwords do not match yet.</p>}
      </div>
      <div className="pt-form-row">
        <button type="submit" className="btn btn-primary btn-sm" disabled={disabled || state.pending || pw.length < MIN_PASSWORD || pw !== again} aria-busy={state.pending}>
          <KeyRound aria-hidden size={15} />
          {state.pending ? "Saving" : "Update password"}
        </button>
        {state.notice && (
          <span className="pt-small" role="status">
            {state.notice}
          </span>
        )}
      </div>
      {state.error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
};

const providerName = (p: string) => (p === "google" ? "Google" : p === "email" ? "Email and password" : p.charAt(0).toUpperCase() + p.slice(1));

/** Sign-in methods on this account. Google can be connected, or disconnected while another method remains. */
export const ConnectedAccounts = ({ disabled }: { disabled?: boolean }) => {
  const [ids, setIds] = useState<Identity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (disabled) return;
    let live = true;
    void fetchIdentities().then((found) => {
      if (!live) return;
      setIds(found ?? []);
      if (!found) setError("Your sign-in methods could not be loaded.");
    });
    return () => {
      live = false;
    };
  }, [disabled, version]);

  const google = ids?.find((i) => i.provider === "google");
  const connect = async () => {
    setBusy(true);
    setError(null);
    const next = encodeURIComponent("/portal/settings");
    try {
      const { error: err } = await (await browserAuth()).linkIdentity({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${next}` } });
      if (!err) return; // the browser is leaving for Google
    } catch {
      // Network or a failed chunk load: same message as a refusal.
    }
    setBusy(false);
    setError("Google could not be connected right now. Please try again later.");
  };
  const disconnect = async () => {
    if (!google || (ids?.length ?? 0) < 2) return;
    if (!window.confirm("Disconnect Google? You will sign in with your email and password instead.")) return;
    setBusy(true);
    setError(null);
    let err: unknown = null;
    try {
      const auth = await browserAuth();
      const { data } = await auth.getUserIdentities();
      const identity = data?.identities.find((i) => i.identity_id === google.identity_id);
      err = identity ? (await auth.unlinkIdentity(identity)).error : new Error("missing");
    } catch (caught) {
      err = caught;
    }
    setBusy(false);
    if (err) setError("Google could not be disconnected. Make sure you have set a password first.");
    else setVersion((v) => v + 1);
  };

  if (disabled) return <p className="pt-small">Not available in demo mode.</p>;
  return (
    <div className="pt-stack">
      {ids === null ? (
        <p className="pt-small">Loading sign-in methods…</p>
      ) : (
        <ul className="pt-list">
          {ids.map((i) => (
            <li key={i.identity_id} className="pt-row">
              <div className="pt-row__main">
                <span className="pt-row__title">{providerName(i.provider)}</span>
                {i.email && <p className="pt-row__meta">{i.email}</p>}
              </div>
              <div className="pt-row__aside">
                <span className="pt-chip pt-chip--done">Connected</span>
                {i.provider === "google" && ids.length > 1 && (
                  <button type="button" className="btn-link pt-small" disabled={busy} onClick={() => void disconnect()}>
                    Disconnect
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {ids !== null && !google && (
        <button type="button" className="btn btn-secondary btn-sm" style={{ justifySelf: "start" }} disabled={busy} onClick={() => void connect()}>
          <Link2 aria-hidden size={15} />
          Connect Google
        </button>
      )}
      {error && (
        <p className="pt-msg pt-msg--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/** Two-step delete: open the panel, type DELETE, confirm. Then the session is ended by the sign-out route. */
export const DeleteAccount = ({ disabled }: { disabled?: boolean }) => {
  const [text, setText] = useState("");
  const signout = useRef<HTMLFormElement>(null);
  const { pending, error, run } = useAction();
  return (
    <details className="pt-danger">
      <summary>Delete my account</summary>
      <div className="pt-stack">
        <p className="pt-small">
          This permanently removes your sign-in, profile, messages and files. Requests you never paid for are deleted too. Records of payments you made are kept for accounting, as the privacy
          policy explains. This cannot be undone.
        </p>
        <div className="pt-field">
          <label htmlFor="pt-delete-confirm">Type DELETE to confirm</label>
          <input id="pt-delete-confirm" className="pt-input" autoComplete="off" value={text} disabled={disabled} onChange={(e) => setText(e.target.value)} />
        </div>
        <button
          type="button"
          className="btn btn-danger btn-sm"
          style={{ justifySelf: "start" }}
          disabled={disabled || pending || text.trim() !== "DELETE"}
          aria-busy={pending}
          onClick={() => run(() => deleteAccount(text), { refresh: false, onOk: () => signout.current?.submit() })}
        >
          <Trash2 aria-hidden size={15} />
          {pending ? "Deleting" : "Delete account permanently"}
        </button>
        {error && (
          <p className="pt-msg pt-msg--error" role="alert">
            {error}
          </p>
        )}
        <form ref={signout} action="/auth/signout" method="post" hidden />
      </div>
    </details>
  );
};
