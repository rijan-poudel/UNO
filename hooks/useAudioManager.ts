import { useEffect } from "react";
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
  globalMusic.volume = getContextMusicVolume();
}

export function useAudioManager() {
  const setMusicContext = (context: MusicContext) => {
    activeMusicContext = context;
    applyMusicVolume();
  };

  // Play background music (looped)
  const playMusic = (context?: MusicContext) => {
    if (context) {
      activeMusicContext = context;
    }
    const music = ensureMusicElement();
    applyMusicVolume();
    music.play().catch(() => {});
  };

  // Pause background music
  const pauseMusic = () => {
    globalMusic?.pause();
  };

  // Play card mixing sound
  const playCardMixing = () => {
    if (!globalCardMixing) {
      globalCardMixing = new Audio("/audios/card_mixing.mp3");
    }
    const settings = getAudioSettings();
    globalCardMixing.volume = settings.sfxVolume ?? 0.8;
    globalCardMixing.currentTime = 0;
    globalCardMixing.play().catch(() => {});
  };

  // Play card throwing sound (lower volume)
  const playCardThrowing = () => {
    if (!globalCardThrowing) {
      globalCardThrowing = new Audio("/audios/card_throwing.mp3");
    }
    const settings = getAudioSettings();
    globalCardThrowing.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    globalCardThrowing.currentTime = 0;
    globalCardThrowing.play().catch(() => {});
  };

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
