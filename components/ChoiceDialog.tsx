"use client";
import { useEffect, useRef } from "react";
import Modal from "./Modal";
export default function ChoiceDialog({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
    disabled?: boolean;
    busy?: boolean;
  }>;
}) {
  const decisions = useRef<HTMLDivElement>(null);
  const wasBusy = useRef(false);
  const busy = actions.some((action) => action.busy);
  useEffect(() => {
    if (wasBusy.current && !busy)
      decisions.current
        ?.querySelector<HTMLButtonElement>(".primary:not(:disabled)")
        ?.focus({ preventScroll: true });
    wasBusy.current = busy;
  }, [busy]);
  return (
    <Modal
      title={title}
      onClose={
        actions.find((a) => a.variant === "secondary" && !a.disabled)?.onClick
      }
    >
      <p className="muted">{description}</p>
      <div className="dialog-actions" ref={decisions}>
        {actions.map((a, index) => (
          <button
            key={index}
            className={`button ${a.variant ?? "secondary"}`}
            onClick={a.onClick}
            disabled={a.disabled}
            aria-busy={a.busy || undefined}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
