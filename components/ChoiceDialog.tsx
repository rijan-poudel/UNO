"use client";
import Modal from "./Modal";
export default function ChoiceDialog({
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
}) {
  return (
    <Modal
      title={title}
      onClose={actions.find((a) => a.variant === "secondary")?.onClick}
    >
      <p className="muted">{description}</p>
      <div className="dialog-actions">
        {actions.map((a) => (
          <button
            key={a.label}
            className={`button ${a.variant ?? "secondary"}`}
            onClick={a.onClick}
          >
            {a.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
