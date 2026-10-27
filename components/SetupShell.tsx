"use client";
import type { ReactNode } from "react";

export default function SetupShell({
  subtitle,
  children,
  footer,
  controls,
  className = "",
}: {
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  controls?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`setup-page ${className}`}>
      {controls}
      <main className="setup-content" aria-label={subtitle}>
        <div className="setup-body">{children}</div>
        {footer && <footer className="setup-footer">{footer}</footer>}
      </main>
    </div>
  );
}
