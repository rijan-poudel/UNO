// A held card: tap to inspect, tap again or drag upward to play.
"use client";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { Card } from "../types/card";
import UnoCard from "./UnoCard";

interface Props {
  card: Card;
  index: number;
  count: number;
  playable: boolean;
  selected: boolean;
  onInspect: () => void;
  onPlay: (element: HTMLElement) => void;
}
export default function HandCard({
  card,
  index,
  count,
  playable,
  selected,
  onInspect,
  onPlay,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dragging: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const ghost = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const wrapper = root.current;
    const interrupt = () => {
      ghost.current?.remove();
      ghost.current = null;
      const element = wrapper?.querySelector<HTMLElement>(".uno-card");
      if (element) element.style.opacity = "";
      gesture.current = null;
      wrapper?.classList.remove("dragging-card");
    };
    const onVisibility = () => {
      if (document.hidden) interrupt();
    };
    window.addEventListener("blur", interrupt);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", onVisibility);
      interrupt();
    };
  }, [playable]);
  // Bound the spread for large hands; extra cards scroll instead of shrinking.
  const position =
    count < 2 ? 0 : (index - (count - 1) / 2) / Math.max(3, (count - 1) / 2);
  const face = () => root.current?.querySelector<HTMLElement>(".uno-card");
  function finish(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    gesture.current = null;
    const element = face();
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)
      suppressClick.current = true;
    if (start.dragging) {
      suppressClick.current = true;
      const lifted = ghost.current;
      if (!cancelled && playable && event.clientY - start.y < -65 && lifted) {
        onPlay(lifted);
        lifted.remove();
        ghost.current = null;
        if (element) element.style.opacity = "";
      } else if (lifted && element) {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const returning = lifted.animate(
          [
            { transform: lifted.style.transform },
            { transform: `translate(0, 0) rotate(${position * 16}deg)` },
          ],
          {
            duration: reduced ? 0 : 180,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "forwards",
          },
        );
        void returning.finished
          .catch(() => {})
          .finally(() => {
            lifted.remove();
            if (ghost.current === lifted) {
              ghost.current = null;
              element.style.opacity = "";
            }
          });
      }
      root.current?.classList.remove("dragging-card");
    }
  }
  return (
    <div
      ref={root}
      className={`hand-card ${playable ? "legal-card" : "quiet-card"} ${selected ? "inspected-card" : ""}`}
      data-hand-card={card.id}
      style={
        {
          "--fan-angle": `${position * 16}deg`,
          "--fan-drop": `${position * position * 34}px`,
          "--hand-i": index,
        } as CSSProperties
      }
      onPointerDown={(event) => {
        if (!event.isPrimary || event.button !== 0) return;
        suppressClick.current = false;
        ghost.current?.remove();
        ghost.current = null;
        const previousFace = face();
        if (previousFace) previousFace.style.opacity = "";
        // Capture the face so corner drags and outside releases reach this card.
        // Native horizontal touch scrolling still cancels the pointer normally.
        face()?.setPointerCapture(event.pointerId);
        gesture.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          dragging: false,
        };
      }}
      onPointerMove={(event) => {
        const start = gesture.current;
        if (!start || start.id !== event.pointerId || !playable) return;
        if (event.buttons !== 1) {
          finish(event, true);
          return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.dragging && dy < -10 && Math.abs(dy) > Math.abs(dx)) {
          start.dragging = true;
          event.currentTarget.classList.add("dragging-card");
          const element = face();
          if (element) {
            const rect = element.getBoundingClientRect();
            const lifted = element.cloneNode(true) as HTMLElement;
            lifted.removeAttribute("aria-label");
            lifted.setAttribute("aria-hidden", "true");
            lifted.tabIndex = -1;
            Object.assign(lifted.style, {
              position: "fixed",
              zIndex: "200",
              pointerEvents: "none",
              margin: "0",
              left: `${rect.x + (rect.width - element.offsetWidth) / 2}px`,
              top: `${rect.y + (rect.height - element.offsetHeight) / 2}px`,
              width: `${element.offsetWidth}px`,
              height: `${element.offsetHeight}px`,
              transition: "none",
              boxShadow: "0 18px 28px #060c1780",
            });
            lifted.style.setProperty(
              "--card-scale",
              getComputedStyle(element).getPropertyValue("--card-scale"),
            );
            document.body.append(lifted);
            ghost.current = lifted;
            element.style.opacity = "0";
          }
        }
        if (start.dragging) {
          const element = ghost.current;
          if (element) {
            const reduced = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            element.style.transition = "none";
            element.style.transform = `translate(${dx}px, ${dy}px) rotate(${reduced ? 0 : position * 16 + dx * 0.035}deg)`;
          }
        }
      }}
      onPointerUp={(event) => finish(event)}
      onPointerCancel={(event) => finish(event, true)}
      onLostPointerCapture={(event) => finish(event, true)}
    >
      <UnoCard
        card={card}
        sizeMultiplier={1.45}
        isPlayable={playable}
        isSelected={selected}
        ariaLabel={`${selected && playable ? "Play" : "Inspect"} ${card.color === "wild" ? "" : card.color + " "}${({ skip: "skip", reverse: "reverse", draw2: "draw two", wild4: "wild draw four", wild: "wild", shuffle: "shuffle hands", discardAll: "discard all" } as Record<string, string>)[card.value] ?? card.value}${playable ? "" : ", not playable now"}`}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const element = face();
          if (selected && playable && element) onPlay(element);
          else onInspect();
        }}
      />
    </div>
  );
}
