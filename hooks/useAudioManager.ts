import { useCallback, useEffect } from "react";
import {
  getAudioSettings,
  isMusicEnabledForContext,
  type MusicContext,
} from "../lib/audioSettings";

let globalMusic: HTMLAudioElement | null = null;
let globalCardMixing: HTMLAudioElement | null = null;
let globalCardThrowing: HTMLAudioElement | null = null;
let globalCardMixingStopTimer: number | null = null;
let lastCardMixingAt = 0;
let activeMusicContext: MusicContext = "lobby";
let unlockListenersBound = false;

function ensureMusicElement(): HTMLAudioElement {
  if (!globalMusic) {
    globalMusic = new Audio("/audios/background_music.wav");
    globalMusic.loop = true;
    globalMusic.preload = "auto";
  }
  return globalMusic;
}

export function primeMusicForFastStart(context: MusicContext = "lobby"): void {
  if (typeof window === "undefined") return;
  activeMusicContext = context;
  const music = ensureMusicElement();
  music.preload = "auto";
  try {
    music.load();
  } catch {
    // Ignore media preload failures.
  }
}

if (typeof window !== "undefined") {
  primeMusicForFastStart("lobby");
}

function getContextMusicVolume(): number {
  const settings = getAudioSettings();
  const enabled = isMusicEnabledForContext(activeMusicContext);
  return enabled ? settings.musicVolume ?? 0.7 : 0;
}

function applyMusicVolume(): void {
  if (!globalMusic) return;
  globalMusic.volume = getContextMusicVolume();
}

function tryPlayMusic(): void {
  const music = ensureMusicElement();
  applyMusicVolume();

  if (music.volume <= 0) return;
  if (!music.paused) return;

  const playPromise = music.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {});
  }
}

function bindMusicUnlockListeners(): void {
  if (typeof window === "undefined") return;
  if (unlockListenersBound) return;
  unlockListenersBound = true;

  const unlock = () => {
    tryPlayMusic();
    const music = globalMusic;
    if (!music || music.paused) return;

    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock);
}

export function useAudioManager() {
  const setMusicContext = useCallback((context: MusicContext) => {
    activeMusicContext = context;
    applyMusicVolume();
    tryPlayMusic();
  }, []);

  // Play background music (looped)
  const playMusic = useCallback((context?: MusicContext) => {
    if (context) {
      activeMusicContext = context;
    }
    tryPlayMusic();
  }, []);

  const pauseMusic = useCallback(() => {
    globalMusic?.pause();
  }, []);

  // Play card mixing sound
  const playCardMixing = useCallback((durationMs = 180) => {
    if (!globalCardMixing) {
      globalCardMixing = new Audio("/audios/card_mixing.mp3");
      globalCardMixing.preload = "auto";
    }

    const now = Date.now();
    if (now - lastCardMixingAt < 70) return;
    lastCardMixingAt = now;

    const settings = getAudioSettings();
    globalCardMixing.volume = settings.sfxVolume ?? 0.8;
    globalCardMixing.currentTime = 0;
    globalCardMixing.play().catch(() => {});

    if (globalCardMixingStopTimer !== null) {
      window.clearTimeout(globalCardMixingStopTimer);
    }
    globalCardMixingStopTimer = window.setTimeout(() => {
      if (!globalCardMixing) return;
      globalCardMixing.pause();
      globalCardMixing.currentTime = 0;
      globalCardMixingStopTimer = null;
    }, Math.max(80, durationMs));
  }, []);

  const stopCardMixing = useCallback(() => {
    if (globalCardMixingStopTimer !== null) {
      window.clearTimeout(globalCardMixingStopTimer);
      globalCardMixingStopTimer = null;
    }
    if (!globalCardMixing) return;
    globalCardMixing.pause();
    globalCardMixing.currentTime = 0;
  }, []);

  // Play card throwing sound (lower volume)
  const playCardThrowing = useCallback(() => {
    if (!globalCardThrowing) {
      globalCardThrowing = new Audio("/audios/card_throwing.mp3");
      globalCardThrowing.preload = "auto";
    }
    const settings = getAudioSettings();
    globalCardThrowing.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    globalCardThrowing.currentTime = 0;
    globalCardThrowing.play().catch(() => {});
  }, []);

  // React to volume/context changes
  useEffect(() => {
    bindMusicUnlockListeners();
    tryPlayMusic();

    const handler = () => {
      applyMusicVolume();
      tryPlayMusic();
      const settings = getAudioSettings();
      if (globalCardMixing) globalCardMixing.volume = settings.sfxVolume ?? 0.8;
      if (globalCardThrowing) globalCardThrowing.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    };
    window.addEventListener("uno:audio-settings", handler);
    return () => window.removeEventListener("uno:audio-settings", handler);
  }, []);

  return {
    playMusic,
    pauseMusic,
    setMusicContext,
    playCardMixing,
    stopCardMixing,
    playCardThrowing,
  };
}
