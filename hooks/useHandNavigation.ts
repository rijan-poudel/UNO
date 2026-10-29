// One keyboard stop for a held hand; native scrolling remains available on touch.
"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Card } from "../types/card";
import { isReducedMotion } from "../lib/displaySettings";

export function useHandNavigation(cards: Card[]) {
  const hand = useRef<HTMLDivElement>(null);
  const id = useId();
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [edges, setEdges] = useState({ before: false, after: false });
  const tabStop = cards.some((card) => card.id === focusedId)
    ? focusedId
    : cards[0]?.id;

  useEffect(() => {
    const scroller = hand.current;
    if (!scroller) return;
    const measure = () => {
      const before = scroller.scrollLeft > 2;
      const after =
        scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft > 2;
      setEdges((prior) =>
        prior.before === before && prior.after === after
          ? prior
          : { before, after },
      );
    };
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    if (scroller.firstElementChild)
      observer.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scroller.removeEventListener("scroll", measure);
    };
  }, [cards.length]);

  function scroll(direction: -1 | 1) {
    const scroller = hand.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.7,
      behavior: isReducedMotion() ? "instant" : "smooth",
    });
  }

  return { hand, id, tabStop, setFocusedId, edges, scroll };
}
