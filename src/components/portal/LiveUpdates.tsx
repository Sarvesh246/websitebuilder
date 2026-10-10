"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { supabasePublicEnv } from "@/utils/supabase/env";

const STALE_MS = 30_000;

/**
 * Keeps the portal current without a reload. One Supabase Realtime subscription per tab listens for new
 * messages (RLS limits it to rows this user may read) and re-renders the server data, which updates the
 * thread, unread badges and "waiting on you" together. Returning to a tab after a while also refreshes.
 */
export const LiveUpdates = ({ enabled, viewerId }: { enabled: boolean; viewerId: string }) => {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 250);
    };

    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > STALE_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // The Supabase client loads lazily, so pages that never subscribe never download it.
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    if (enabled && supabasePublicEnv()) {
      void import("@/utils/supabase/client").then(({ createClient }) => {
        if (cancelled) return;
        const supabase = createClient();
        const channel = supabase
          .channel("portal-messages")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (change) => {
            // The sender's own page already refreshed after sending.
            if ((change.new as { sender_id?: string }).sender_id !== viewerId) refresh();
          })
          .subscribe();
        unsubscribe = () => void supabase.removeChannel(channel);
      }).catch(() => undefined);
    }
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribe?.();
    };
  }, [enabled, viewerId, router]);
  return null;
};

/** Message thread that opens at the newest message and follows new ones as they arrive. */
export const Thread = ({ count, children }: { count: number; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && follow.current) el.scrollTop = el.scrollHeight;
  }, [count]);
  return (
    <div ref={ref} onScroll={(event) => {
      const el = event.currentTarget;
      follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    }} className="pt-thread" role="log" aria-label="Messages" aria-live="polite" tabIndex={0}>
      {children}
    </div>
  );
};
