import { useCallback, useEffect } from "react";
import {
  getAudioSettings,
  isMusicEnabledForContext,
  type MusicContext,
} from "../lib/audioSettings";

let globalMusic: HTMLAudioElement | null = null;
let globalCardMixing: HTMLAudioElement | null = null;
let globalCardThrowing: HTMLAudioElement | null = null;
let activeMusicContext: MusicContext = "lobby";

function ensureMusicElement(): HTMLAudioElement {
  if (!globalMusic) {
    globalMusic = new Audio("/audios/background_music.wav");
    globalMusic.loop = true;
  }
  return globalMusic;
}

function getContextMusicVolume(): number {
  const settings = getAudioSettings();
  const enabled = isMusicEnabledForContext(activeMusicContext);
  return enabled ? settings.musicVolume ?? 0.7 : 0;
}

function applyMusicVolume(): void {
  if (!globalMusic) return;
  const newVolume = getContextMusicVolume();
  globalMusic.volume = newVolume;
}

function ensureMusicPlaying(): void {
  const music = ensureMusicElement();
  applyMusicVolume();
  // Resume if paused, but don't interrupt if already playing
  if (music.paused) {
    const playPromise = music.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  }
}

export function useAudioManager() {
  const setMusicContext = useCallback((context: MusicContext) => {
    activeMusicContext = context;
    applyMusicVolume();
    // Ensure music continues playing in the new context
    ensureMusicPlaying();
  }, []);

  // Play background music (looped)
  const playMusic = useCallback((context?: MusicContext) => {
    if (context) {
      activeMusicContext = context;
    }
    ensureMusicPlaying();
  }, []);

  // Pause background music
  const pauseMusic = useCallback(() => {
    globalMusic?.pause();
  }, []);

  // Play card mixing sound
  const playCardMixing = useCallback(() => {
    if (!globalCardMixing) {
      globalCardMixing = new Audio("/audios/card_mixing.mp3");
    }
    const settings = getAudioSettings();
    globalCardMixing.volume = settings.sfxVolume ?? 0.8;
    globalCardMixing.currentTime = 0;
    globalCardMixing.play().catch(() => {});
  }, []);

  // Play card throwing sound (lower volume)
  const playCardThrowing = useCallback(() => {
    if (!globalCardThrowing) {
      globalCardThrowing = new Audio("/audios/card_throwing.mp3");
    }
    const settings = getAudioSettings();
    globalCardThrowing.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    globalCardThrowing.currentTime = 0;
    globalCardThrowing.play().catch(() => {});
  }, []);

  // React to volume/context changes
  useEffect(() => {
    const handler = () => {
      applyMusicVolume();
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
    playCardThrowing,
  };
}
