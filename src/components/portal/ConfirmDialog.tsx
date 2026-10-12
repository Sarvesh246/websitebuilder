"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { spring } from "@/lib/motion";
type ConfirmProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  busy: boolean;
};
export const ConfirmDialog = (props: ConfirmProps) => (
  <AnimatePresence>{props.open && <ConfirmSurface {...props} />}</AnimatePresence>
);

/** Native focus isolation remains active through the spring exit. */
const ConfirmSurface = ({ onClose, title, children, confirmLabel, onConfirm, busy }: ConfirmProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(); // several dialogs can share a page
  useLockBodyScroll(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const previous = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => {
      el.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <m.dialog
      ref={ref}
      className="pt-dialog"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.99 }}
      transition={{ ...spring, opacity: { duration: 0.15 } }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
      aria-labelledby={titleId}
    >
      <h2 id={titleId}>{title}</h2>
      <div className="pt-small">{children}</div>
      <div className="pt-dialog__actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {busy ? "Working" : confirmLabel}
        </button>
      </div>
    </m.dialog>
  );
};
