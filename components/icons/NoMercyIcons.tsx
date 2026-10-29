"use client";

import type { CSSProperties } from "react";

import { UnoActionSymbol } from "./UnoActionSymbol";

// Retain the existing call-site API; the printed Roulette mark is mystery cards, not a wheel.
export function RouletteWheelIcon({
  size = 24,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <UnoActionSymbol
      value="wildColorRoulette"
      size={size}
      className={className}
      style={style}
    />
  );
}

/**
 * Signature fiery skull insignia for UNO Show 'Em No Mercy.
 */
export function NoMercyIcon({
  size = 20,
  className,
  style,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`no-mercy-icon ${className ?? ""}`}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        ...style,
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nm-flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#df0735" />
          <stop offset="55%" stopColor="#ff3355" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
      </defs>
      {/* Stylized high-stakes flame crest */}
      <path
        d="M12 2C10.6 4.3 9.1 6.6 9.1 9.2C9.1 10.9 9.9 12.2 11 12.9C9.3 12.7 8.1 11.6 8.1 9.8C6.1 11.8 5 14.4 5 16.9C5 20.8 8.1 23 12 23C15.9 23 19 20.8 19 16.9C19 13.4 16.6 10.1 15.1 6.9C14.6 9.1 13.3 10.4 12.1 10.7C12.1 7.9 13.6 4.9 12 2Z"
        fill="url(#nm-flame-grad)"
        stroke="none"
      />
      {/* Inner incandescent core / skull */}
      <path
        d="M12 13C10.5 13 9.6 14.1 9.6 15.6C9.6 17.2 10.3 18.2 11 19.2L11 21L13 21L13 19.2C13.7 18.2 14.4 17.2 14.4 15.6C14.4 14.1 13.5 13 12 13Z"
        fill="#ffffff"
        opacity="0.95"
        stroke="none"
      />
      {/* Eye cuts in skull core */}
      <circle cx="11" cy="15.3" r="0.85" fill="#140c12" stroke="none" />
      <circle cx="13" cy="15.3" r="0.85" fill="#140c12" stroke="none" />
    </svg>
  );
}
