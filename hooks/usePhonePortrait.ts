// Matches the phone gameplay gate without hiding home/setup in portrait.
"use client";
import { useSyncExternalStore } from "react";

const PHONE_PORTRAIT = "(orientation: portrait) and (max-width: 700px)";
function subscribe(onChange: () => void) {
  const media = window.matchMedia(PHONE_PORTRAIT);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function getSnapshot() {
  return window.matchMedia(PHONE_PORTRAIT).matches;
}
export function usePhonePortrait() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
