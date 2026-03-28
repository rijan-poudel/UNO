"use client";

import { useEffect } from "react";
import { useAudioManager } from "../hooks/useAudioManager";

export default function Loading() {
  const { setMusicContext, playMusic } = useAudioManager();

  useEffect(() => {
    void import("@dotlottie/player-component");
  }, []);

  useEffect(() => {
    setMusicContext("lobby");
    playMusic("lobby");
  }, [setMusicContext, playMusic]);

  return (
    <div
      style={{
        minHeight: "100svh",
        width: "100%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "var(--ui-bg)",
      }}
    >
      <dotlottie-player
        src="/loadingPage/Welcome.lottie"
        background="transparent"
        speed="1"
        style={{ width: "min(460px, 76vw)", height: "min(460px, 76vw)" }}
        loop
        autoplay
      />
    </div>
  );
}
