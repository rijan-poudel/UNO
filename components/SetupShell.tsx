"use client";
import type { ReactNode } from "react";

export default function SetupShell({
  subtitle,
  children,
  footer,
  controls,
}: {
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <div className="setup-page">
      {controls}
      <main className="setup-content" aria-label={subtitle}>
        {children}
        {footer && <footer className="setup-footer">{footer}</footer>}
      </main>
      <div className="page-footnote">
        A seat for everyone. A rule for every table.
      </div>
    </div>
  );
}
