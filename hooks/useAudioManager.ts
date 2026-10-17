// Background music is optional; immediate card feedback uses the shared Web Audio context.
"use client";
import { useCallback, useEffect } from "react";
import {
  getAudioSettings,
  isMusicEnabledForContext,
  type MusicContext,
} from "../lib/audioSettings";
import {
  playTableChime,
  primeTableAudioFromUserGesture,
} from "../lib/tableChimes";
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
export function primeMusicForFastStart(context: MusicContext = "lobby") {
  activeContext = context;
  primeTableAudioFromUserGesture();
  syncMusic();
}
export function useAudioManager() {
  useEffect(() => {
    users++;
    preloadBoardVoiceovers();
    if (users === 1) {
      window.addEventListener("uno:audio-settings", applySettings);
      window.addEventListener("pointerdown", unlock, { passive: true });
      window.addEventListener("keydown", unlock);
      document.addEventListener("visibilitychange", syncMusic);
    }
    return () => {
      users--;
      if (users === 0) {
        window.removeEventListener("uno:audio-settings", applySettings);
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
        document.removeEventListener("visibilitychange", syncMusic);
        music?.pause();
      }
    };
  }, []);
  const setMusicContext = useCallback((context: MusicContext) => {
    activeContext = context;
    syncMusic();
  }, []);
  const playMusic = useCallback((context?: MusicContext) => {
    if (context) activeContext = context;
    syncMusic();
  }, []);
  const pauseMusic = useCallback(() => music?.pause(), []);
  const playCardMixing = useCallback(() => playTableChime("shuffleMotion"), []);
  const playCardThrowing = useCallback(() => playTableChime("cardPlay"), []);
  const stopCardMixing = useCallback(() => {}, []);
  return {
    setMusicContext,
    playMusic,
    pauseMusic,
    playCardMixing,
    playCardThrowing,
    stopCardMixing,
  };
}
