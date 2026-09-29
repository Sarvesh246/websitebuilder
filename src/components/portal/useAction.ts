"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Loose result shape shared by every portal server action. */
export type ActionResult = { ok: boolean; error?: string; url?: string; message?: string; outcome?: string };

/** Runs a server action in a transition, tracks pending + error, and refreshes server data on success. */
export const useAction = () => {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const run = (
    fn: () => Promise<ActionResult>,
    opts: { refresh?: boolean; success?: string | ((r: ActionResult) => string); onOk?: (r: ActionResult) => void } = {},
  ) => {
    setError(null);
    setNotice(null);
    start(async () => {
      try {
        const res = await fn();
        if (!res.ok) {
          setError(res.error ?? res.message ?? "Something went wrong. Please try again.");
          return;
        }
        const text = typeof opts.success === "function" ? opts.success(res) : opts.success;
        if (text) setNotice(text);
        opts.onOk?.(res);
        if (opts.refresh !== false) router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  return { pending, error, notice, run, setError };
};
