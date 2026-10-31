// Two curved ribbons travel on a tilted plane beneath the physical piles.
"use client";
import { useEffect, useRef } from "react";
import {
  isReducedMotion,
  subscribeDisplaySettings,
} from "../lib/displaySettings";

const FORWARD_RIBBON =
  "M -116.52 -42.41 A 124 124 0 0 1 79.71 -94.99 L 87.42 -104.18 L 94.56 -73.88 L 66.85 -79.67 L 74.56 -88.86 A 116 116 0 0 0 -109 -39.67 Z";
const REVERSE_RIBBON =
  "M 97.71 -76.34 A 124 124 0 0 0 -105.16 -65.71 L -115.33 -72.07 L -112.76 -41.04 L -88.2 -55.11 L -98.37 -61.47 A 116 116 0 0 1 91.41 -71.42 Z";

export default function TableDirection({ direction }: { direction: 1 | -1 }) {
  const ring = useRef<HTMLDivElement>(null);
  const motion = useRef<Animation | null>(null);
  useEffect(() => {
    const element = ring.current;
    if (!element) return;
    const animation = element.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
      { duration: 16_000, iterations: Infinity },
    );
    // Start inside the repeating timeline so reversing never hits its beginning.
    animation.currentTime = 16_000;
    motion.current = animation;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (document.hidden || isReducedMotion()) animation.pause();
      else animation.play();
    };
    animation.onfinish = () => {
      animation.currentTime = 16_000;
      sync();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    const unsubscribe = subscribeDisplaySettings(sync);
    return () => {
      animation.cancel();
      motion.current = null;
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    // Preserve the current position instead of restarting when Reverse is played.
    motion.current?.updatePlaybackRate(direction);
  }, [direction]);
  const path = direction === 1 ? FORWARD_RIBBON : REVERSE_RIBBON;
  return (
    <div
      className="direction-orbit"
      aria-hidden="true"
      data-direction={direction}
    >
      <div className="direction-orbit-plane">
        <div className="direction-orbit-ring" ref={ring}>
          <svg viewBox="-150 -150 300 300" className="direction-ribbons">
            <g className="direction-ribbon-shadow" transform="translate(0 7)">
              <path d={path} />
              <path d={path} transform="rotate(180)" />
            </g>
            <g className="direction-ribbon-edge" transform="translate(0 3)">
              <path d={path} />
              <path d={path} transform="rotate(180)" />
            </g>
            <g className="direction-ribbon-face">
              <path d={path} />
              <path d={path} transform="rotate(180)" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
