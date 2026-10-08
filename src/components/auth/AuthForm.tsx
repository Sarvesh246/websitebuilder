"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { TextField } from "@/components/inquiry/fields";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { safeNext } from "@/lib/auth/next";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "signup";

const copy = {
  login: { title: "Welcome back.", lead: "Sign in to follow your project, message me, and manage payments.", submit: "Sign in", alt: "New here?", altLink: "Create an account", altHref: "/signup" },
  signup: { title: "Create your account.", lead: "Your account is your project portal: progress, messages, files, and payments in one place.", submit: "Create account", alt: "Already have an account?", altLink: "Sign in", altHref: "/login" },
} as const;

/** Friendly messages only: raw provider errors are never shown. */
const friendly = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password") && m.includes("characters")) return "Use a password of at least 8 characters.";
  if (m.includes("rate") || m.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
  return "Something went wrong. Please try again.";
};

export const AuthForm = ({ mode, next, notice }: { mode: Mode; next?: string; notice?: string }) => {
  const router = useRouter();
  const target = safeNext(next);
  const c = copy[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(notice ?? "");
  const [sent, setSent] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    // Autofill and phone keyboards often add a trailing space.
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError("Enter a valid email address.");
    if (password.length < 8) return setError("Use a password of at least 8 characters.");
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email: address, password });
        if (err) throw err;
        router.push(target);
        router.refresh();
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: address,
          password,
          options: { data: { full_name: name.trim().slice(0, 100) }, emailRedirectTo: callback() },
        });
        if (err) throw err;
        if (data.session) {
          router.push(target);
          router.refresh();
        } else setSent(true);
      }
    } catch (err) {
      setError(friendly(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError("");
    try {
      const { error: err } = await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
      if (err) throw err;
    } catch {
      setError("Google sign-in isn't available right now. Use your email instead.");
    }
  };

  if (sent) {
    return (
      <GlassSurface variant="elevated" className="auth__panel">
        <h1 className="t-h3">Check your email.</h1>
        <p className="t-body">
          I sent a confirmation link to <strong>{email}</strong>. Open it to finish creating your account, then you will land right
          back where you left off.
        </p>
      </GlassSurface>
    );
  }

  return (
    <GlassSurface variant="elevated" className="auth__panel">
      <h1 className="t-h3">{c.title}</h1>
      <p className="t-body auth__lead">{c.lead}</p>
      <button type="button" className="btn btn-secondary btn-block" onClick={google}>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1a5.98 5.98 0 0 1 0-11.96c1.9 0 3.17.8 3.9 1.5l2.66-2.56C17.5 3.5 15 2.4 12 2.4a9.6 9.6 0 1 0 0 19.2c5.54 0 9.2-3.9 9.2-9.38 0-.63-.07-1.1-.15-1.12Z" />
        </svg>
        Continue with Google
      </button>
      <p className="auth__or" aria-hidden>
        <span>or</span>
      </p>
      <form onSubmit={submit} noValidate className="auth__form">
        {mode === "signup" && <TextField label="Full name" name="name" autoComplete="name" value={name} onValueChange={setName} />}
        <TextField label="Email" name="email" type="email" inputMode="email" autoComplete="email" value={email} onValueChange={setEmail} />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          hint={mode === "signup" ? "At least 8 characters." : undefined}
          value={password}
          onValueChange={setPassword}
        />
        {error && (
          <p role="alert" className="flow__error">
            <span className="sr-only">Error: </span>
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>
          {busy ? <Loader2 aria-hidden size={16} className="spin" /> : null}
          {c.submit}
        </button>
      </form>
      <p className="auth__alt">
        {c.alt}{" "}
        <Link href={`${c.altHref}${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="auth__link">
          {c.altLink}
        </Link>
      </p>
    </GlassSurface>
  );
};
