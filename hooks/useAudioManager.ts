import { useEffect, useRef } from "react";
import { getAudioSettings } from "../lib/audioSettings";

export function useAudioManager() {
  // Background music
  const musicRef = useRef<HTMLAudioElement | null>(null);
  // Card SFX
  const cardMixingRef = useRef<HTMLAudioElement | null>(null);
  const cardThrowingRef = useRef<HTMLAudioElement | null>(null);

  // Play background music (looped)
  const playMusic = () => {
    if (!musicRef.current) {
      musicRef.current = new Audio("/audios/background_music.mp3");
      musicRef.current.loop = true;
    }
    const settings = getAudioSettings();
    musicRef.current.volume = settings.musicVolume ?? 0.7;
    musicRef.current.play().catch(() => {});
  };

  // Pause background music
  const pauseMusic = () => {
    musicRef.current?.pause();
  };

  // Play card mixing sound
  const playCardMixing = () => {
    if (!cardMixingRef.current) {
      cardMixingRef.current = new Audio("/audios/card_mixing.mp3");
    }
    const settings = getAudioSettings();
    cardMixingRef.current.volume = settings.sfxVolume ?? 0.8;
    cardMixingRef.current.currentTime = 0;
    cardMixingRef.current.play().catch(() => {});
  };

  // Play card throwing sound (lower volume)
  const playCardThrowing = () => {
    if (!cardThrowingRef.current) {
      cardThrowingRef.current = new Audio("/audios/card_throwing.mp3");
    }
    const settings = getAudioSettings();
    cardThrowingRef.current.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    cardThrowingRef.current.currentTime = 0;
    cardThrowingRef.current.play().catch(() => {});
  };

  // React to volume changes
  useEffect(() => {
    const handler = () => {
      const settings = getAudioSettings();
      if (musicRef.current) musicRef.current.volume = settings.musicVolume ?? 0.7;
      if (cardMixingRef.current) cardMixingRef.current.volume = settings.sfxVolume ?? 0.8;
      if (cardThrowingRef.current) cardThrowingRef.current.volume = (settings.sfxVolume ?? 0.8) * 0.5;
    };
    window.addEventListener("uno:audio-settings", handler);
    return () => window.removeEventListener("uno:audio-settings", handler);
  }, []);

  return {
    playMusic,
    pauseMusic,
    playCardMixing,
    playCardThrowing,
  };
}
