"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export function UnoWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`wordmark ${compact ? "compact" : ""}`} aria-label="UNO">
      UNO
      <span className="brand-colors" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
export function CountBadge({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  return (
    <span className="count-badge">
      {current} / {total} seats
    </span>
  );
}
export function SetupIntro({
  title,
  description,
  onBack,
  backDisabled = false,
  trailing,
}: {
  title: string;
  description?: string;
  onBack?: () => void;
  backDisabled?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div className="setup-intro">
      {onBack && (
        <button
          className="text-button"
          onClick={onBack}
          disabled={backDisabled}
        >
          <ArrowLeft size={16} /> Back to home
        </button>
      )}
      <div className="section-heading">
        <h1>{title}</h1>
        {trailing}
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
