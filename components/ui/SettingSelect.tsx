// Native selection with a consistent value inset and a separate decorative chevron.
"use client";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

export default function SettingSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="setting-select">
      <select {...props} className={className}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </span>
  );
}
