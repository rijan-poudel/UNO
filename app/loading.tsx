"use client";

import { useEffect, useLayoutEffect } from "react";
import { primeMusicForFastStart, useAudioManager } from "../hooks/useAudioManager";

export default function Loading() {
  const { setMusicContext, playMusic } = useAudioManager();

  useEffect(() => {
    void import("@dotlottie/player-component");
  }, []);

  useLayoutEffect(() => {
    primeMusicForFastStart("lobby");
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
        speed="2.5"
        style={{ width: "min(460px, 76vw)", height: "min(460px, 76vw)" }}
        loop
        autoplay
      />
    </div>
  );
}
