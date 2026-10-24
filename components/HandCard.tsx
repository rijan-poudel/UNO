// A held card: tap to play, or lift and flick toward the table.
"use client";
import {
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent,
} from "react";
import type { Card } from "../types/card";
import UnoCard from "./UnoCard";
import {
  playTableChime,
  primeTableAudioFromUserGesture,
} from "../lib/tableChimes";
import { canReleaseCard } from "../lib/cardGesture";
import { readCardPose } from "../lib/cardPose";

interface Props {
  card: Card;
  index: number;
  count: number;
  playable: boolean;
  disabled: boolean;
  selected: boolean;
  tabIndex: number;
  onFocus: () => void;
  onInspect: () => void;
  onPlay: (element: HTMLElement) => void;
  onDragChange: (state: "lifting" | "ready" | null) => void;
}
export default function HandCard({
  card,
  index,
  count,
  playable,
  disabled,
  selected,
  tabIndex,
  onFocus,
  onInspect,
  onPlay,
  onDragChange,
}: Props) {
  const root = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    dragging: boolean;
    pose?: ReturnType<typeof readCardPose>;
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
      suppressClick.current = false;
      if (wrapper?.classList.contains("dragging-card")) {
        wrapper.classList.remove("dragging-card");
        onDragChange(null);
      }
    };
    const onVisibility = () => {
      if (document.hidden) interrupt();
    };
    window.addEventListener("blur", interrupt);
    window.addEventListener("resize", interrupt);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", interrupt);
      window.removeEventListener("resize", interrupt);
      document.removeEventListener("visibilitychange", onVisibility);
      interrupt();
    };
  }, [playable, disabled, onDragChange]);
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
      onDragChange(null);
      if (
        !cancelled &&
        playable &&
        canReleaseCard(event.clientX - start.x, event.clientY - start.y) &&
        lifted
      ) {
        onPlay(lifted);
        lifted.remove();
        ghost.current = null;
        if (element) element.style.opacity = "";
      } else if (lifted && element && start.pose) {
        const destination = readCardPose(element);
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        const returning = lifted.animate(
          [
            { transform: lifted.style.transform },
            {
              transform: `translate(${destination.x - start.pose.x}px, ${destination.y - start.pose.y}px) rotate(${destination.angle}deg) scale(${destination.width / start.pose.width})`,
            },
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
      onFocus={onFocus}
      style={
        {
          "--fan-angle": `${position * 16}deg`,
          "--fan-drop": `${position * position * 34}px`,
          "--hand-i": index,
        } as CSSProperties
      }
      onClickCapture={(event) => {
        // Keyboard activation is a new intent, never the drag's synthetic click.
        if (event.detail === 0) suppressClick.current = false;
      }}
      onPointerDown={(event) => {
        if (
          disabled ||
          !event.isPrimary ||
          event.button !== 0 ||
          gesture.current
        )
          return;
        primeTableAudioFromUserGesture();
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
          pose: previousFace ? readCardPose(previousFace) : undefined,
        };
      }}
      onPointerMove={(event) => {
        const start = gesture.current;
        if (!start || start.id !== event.pointerId || !playable) return;
        if (disabled) {
          finish(event, true);
          return;
        }
        if (event.buttons !== 1) {
          finish(event, true);
          return;
        }
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (!start.dragging && dy < -10 && Math.abs(dy) > Math.abs(dx)) {
          start.dragging = true;
          playTableChime("pickup");
          onDragChange("lifting");
          event.currentTarget.classList.add("dragging-card");
          const element = face();
          if (element) {
            const pose = start.pose ?? readCardPose(element);
            start.pose = pose;
            const lifted = element.cloneNode(true) as HTMLElement;
            lifted.removeAttribute("aria-label");
            lifted.setAttribute("aria-hidden", "true");
            lifted.tabIndex = -1;
            Object.assign(lifted.style, {
              position: "fixed",
              zIndex: "200",
              pointerEvents: "none",
              margin: "0",
              left: `${pose.x - pose.width / 2}px`,
              top: `${pose.y - pose.height / 2}px`,
              width: `${pose.width}px`,
              height: `${pose.height}px`,
              transition: "none",
              boxShadow: "0 18px 28px #060c1780",
            });
            lifted.style.setProperty(
              "--card-scale",
              `${(parseFloat(getComputedStyle(element).getPropertyValue("--card-scale")) || 1) * (pose.width / element.offsetWidth)}`,
            );
            lifted.dataset.heldCard = card.id;
            document.body.append(lifted);
            ghost.current = lifted;
            element.style.opacity = "0";
          }
        }
        if (start.dragging) {
          onDragChange(canReleaseCard(dx, dy) ? "ready" : "lifting");
          const element = ghost.current;
          if (element) {
            const reduced = window.matchMedia(
              "(prefers-reduced-motion: reduce)",
            ).matches;
            element.style.transition = "none";
            element.style.transform = `translate(${dx}px, ${dy}px) rotate(${(start.pose?.angle ?? 0) + (reduced ? 0 : dx * 0.035)}deg)`;
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
        tabIndex={tabIndex}
        disabled={disabled}
        ariaLabel={`${playable ? "Play" : "Inspect"} ${card.color === "wild" ? "" : card.color + " "}${({ skip: "skip", reverse: "reverse", draw2: "draw two", wild4: "wild draw four", wild: "wild", shuffle: "shuffle hands", discardAll: "discard all" } as Record<string, string>)[card.value] ?? card.value}${playable ? "" : ", not playable now"}`}
        onClick={() => {
          if (disabled) return;
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const element = face();
          element?.focus({ preventScroll: true });
          primeTableAudioFromUserGesture();
          playTableChime("pickup");
          if (playable && element) onPlay(element);
          else {
            onInspect();
          }
        }}
      />
    </div>
  );
}
