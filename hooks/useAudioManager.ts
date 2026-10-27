// Background music is optional; immediate card feedback uses the shared Web Audio context.
"use client";
import { useEffect } from "react";
import {
  getAudioSettings,
  isMusicEnabledForContext,
  type MusicContext,
} from "../lib/audioSettings";
import { primeTableAudioFromUserGesture } from "../lib/tableChimes";
import { preloadBoardVoiceovers } from "../lib/voiceAnnouncer";
let music: HTMLAudioElement | null = null;
let activeContext: MusicContext = "lobby";
let users = 0;
function syncMusic(): void {
  if (typeof window === "undefined") return;
  const settings = getAudioSettings();
  if (
    settings.muted ||
    document.hidden ||
    !isMusicEnabledForContext(activeContext) ||
    settings.musicVolume <= 0
  ) {
    music?.pause();
    return;
  }
  music ??= Object.assign(new Audio("/audio/music.mp3"), {
    loop: true,
    preload: "none",
  });
  music.volume = settings.musicVolume * 0.5;
  if (music.paused) void music.play().catch(() => {});
}
function unlock() {
  primeTableAudioFromUserGesture();
  syncMusic();
}
function applySettings() {
  syncMusic();
  preloadBoardVoiceovers();
}
export function useAudioManager(context: MusicContext) {
  useEffect(() => {
    activeContext = context;
    syncMusic();
  }, [context]);
  useEffect(() => {
    users++;
    preloadBoardVoiceovers();
    if (users === 1) {
      window.addEventListener("uno:audio-settings", applySettings);
      window.addEventListener("storage", applySettings);
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("keydown", unlock);
      document.addEventListener("visibilitychange", syncMusic);
    }
    return () => {
      users--;
      if (users === 0) {
        window.removeEventListener("uno:audio-settings", applySettings);
        window.removeEventListener("storage", applySettings);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        document.removeEventListener("visibilitychange", syncMusic);
        music?.pause();
      }
    };
  }, []);
}
