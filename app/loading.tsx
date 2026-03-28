"use client";

import { useEffect } from "react";

export default function Loading() {
  useEffect(() => {
    void import("@dotlottie/player-component");
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&display=swap');

        @keyframes loaderSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes loaderBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }

        @keyframes loaderFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      <div
        style={{
          minHeight: "100svh",
          width: "100%",
          overflow: "hidden",
          position: "relative",
          display: "grid",
          placeItems: "center",
          background:
            "radial-gradient(120% 95% at 50% 10%, color-mix(in srgb, var(--ui-accent-blue) 16%, transparent), transparent 58%), linear-gradient(180deg, var(--ui-bg), color-mix(in srgb, var(--ui-bg) 80%, #000 20%))",
          color: "var(--ui-text)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 10px, color-mix(in srgb, var(--ui-line) 42%, transparent) 10px, color-mix(in srgb, var(--ui-line) 42%, transparent) 11px)",
            opacity: 0.2,
            pointerEvents: "none",
          }}
        />

        <section
          style={{
            width: "min(760px, calc(100vw - 28px))",
            border: "1px solid color-mix(in srgb, var(--ui-line) 75%, transparent)",
            background: "color-mix(in srgb, var(--ui-surface) 90%, var(--ui-bg) 10%)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.34)",
            padding: "clamp(16px, 3vw, 26px)",
            display: "grid",
            gap: "clamp(10px, 2vw, 18px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, var(--ui-accent-red), var(--ui-accent-yellow), var(--ui-accent-blue), transparent)",
              opacity: 0.85,
            }}
          />

          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Bebas Neue', cursive",
                fontSize: "clamp(30px, 5.2vw, 54px)",
                letterSpacing: "0.06em",
                lineHeight: 0.9,
                textTransform: "uppercase",
              }}
            >
              UNO Arena
            </h1>
            <span
              style={{
                fontFamily: "'Courier Prime', monospace",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ui-muted)",
                whiteSpace: "nowrap",
              }}
            >
              boot sequence
            </span>
          </header>

          <div
            style={{
              display: "grid",
              placeItems: "center",
              animation: "loaderFloat 2.2s ease-in-out infinite",
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

          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                height: 10,
                border: "1px solid var(--ui-line)",
                position: "relative",
                overflow: "hidden",
                background: "color-mix(in srgb, var(--ui-bg) 78%, transparent)",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in srgb, var(--ui-accent-yellow) 88%, #fff 12%), transparent)",
                  animation: "loaderSweep 1.6s linear infinite",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "var(--ui-muted)",
                }}
              >
                Loading game
              </span>
              <span
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ animation: "loaderBlink 1s 0s infinite" }}>.</span>
                <span style={{ animation: "loaderBlink 1s 0.2s infinite" }}>.</span>
                <span style={{ animation: "loaderBlink 1s 0.4s infinite" }}>.</span>
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
