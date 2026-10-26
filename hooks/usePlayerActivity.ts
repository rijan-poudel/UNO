// A returning human takes control without resetting clocks for idle viewers.
"use client";

import { useEffect } from "react";

export function usePlayerActivity(enabled: boolean, onActivity: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const resume = () => {
      if (document.visibilityState === "visible") onActivity();
    };
    window.addEventListener("pointerdown", resume, true);
    window.addEventListener("keydown", resume, true);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.removeEventListener("pointerdown", resume, true);
      window.removeEventListener("keydown", resume, true);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [enabled, onActivity]);
}
