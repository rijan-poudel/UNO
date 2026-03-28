"use client";

import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    void import("@dotlottie/player-component");
  }, []);

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
