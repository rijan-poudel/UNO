// Native modal: focus containment, Escape, and focus return are browser-owned.
"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X, ArrowLeft } from "lucide-react";

export default function Modal({
  open = true,
  title,
  children,
  onClose,
  className = "",
  onBack,
}: {
  open?: boolean;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  className?: string;
  onBack?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const opener = document.activeElement;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    return () => {
      if (dialog.open) dialog.close();
      if (open && opener instanceof HTMLElement) {
        queueMicrotask(() => {
          const remaining = document.querySelector("dialog[open]");
          if (opener.isConnected && (!remaining || remaining.contains(opener)))
            opener.focus({ preventScroll: true });
        });
      }
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${className}`}
      aria-labelledby={id}
      {...({ closedby: onClose ? "any" : "none" } as Record<string, string>)}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }}
      onClick={(e) => {
        const dialog = ref.current;
        if (dialog && e.target === dialog) {
          const rect = dialog.getBoundingClientRect();
          const inside =
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width;
          if (!inside) onClose?.();
        }
      }}
    >
      <div className="modal-content">
        <div className="modal-heading">
          <div className="modal-title-group">
            {onBack && (
              <button
                type="button"
                className="icon-button modal-back-btn"
                aria-label="All settings"
                onClick={onBack}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 id={id}>{title}</h2>
          </div>
          {onClose && (
            <button
              type="button"
              className="icon-button modal-close-btn"
              aria-label="Close dialog"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </dialog>
  );
}
