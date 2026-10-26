// The landscape gate follows the same uninterrupted panel as the board.
"use client";
import { useSyncExternalStore } from "react";

const SEGMENT_QUERIES = [
  "(horizontal-viewport-segments: 2)",
  "(vertical-viewport-segments: 2)",
];
function subscribe(onChange: () => void) {
  const media = SEGMENT_QUERIES.map((query) => window.matchMedia(query));
  window.addEventListener("resize", onChange);
  media.forEach((query) => query.addEventListener("change", onChange));
  return () => {
    window.removeEventListener("resize", onChange);
    media.forEach((query) => query.removeEventListener("change", onChange));
  };
}
export function isPhonePortraitPanel(width: number, height: number): boolean {
  return width <= 700 && height > width;
}
function getSnapshot() {
  // Current Chromium reports exact segment geometry. CSS-only implementations
  // still get an orientation fallback from the reported segment arrangement.
  const panel = (
    window as Window & {
      viewport?: {
        segments?: ReadonlyArray<{ width: number; height: number }>;
      };
    }
  ).viewport?.segments?.[0];
  const width =
    panel?.width ??
    window.innerWidth / (window.matchMedia(SEGMENT_QUERIES[0]).matches ? 2 : 1);
  const height =
    panel?.height ??
    window.innerHeight /
      (window.matchMedia(SEGMENT_QUERIES[1]).matches ? 2 : 1);
  return isPhonePortraitPanel(width, height);
}
export function usePhonePortrait() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
