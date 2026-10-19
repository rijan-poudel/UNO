// Present state transitions without holding up the engine or animating layout properties.
"use client";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import type { GameState } from "../types/game";
import {
  announceBoardFromTransition,
  preloadBoardVoiceovers,
  stopBoardVoiceover,
} from "../lib/voiceAnnouncer";
import { playTableChime, type TableChime } from "../lib/tableChimes";
import { recordRound } from "../lib/playerProgress";
import { getAudioSettings } from "../lib/audioSettings";
const ACTION_SOUNDS: Record<string, TableChime> = {
  skip: "skip",
  reverse: "reverse",
  draw2: "draw2",
  wild4: "wild4",
  wild: "wild",
  shuffle: "shuffle",
};
type Origin = { cardId: string; rect: DOMRect };
export function useGamePresentation(
  game: GameState | null,
  localPlayerId: string | undefined,
  root: RefObject<HTMLElement | null>,
) {
  const previous = useRef<GameState | null>(null);
  const handRects = useRef<Map<string, DOMRect>>(new Map());
  const selectedOrigin = useRef<Origin | null>(null);
  const running = useRef<Set<Animation>>(new Set());
  const ghosts = useRef<Set<HTMLElement>>(new Set());
  const rememberOrigin = (cardId: string, element: HTMLElement) => {
    selectedOrigin.current = { cardId, rect: element.getBoundingClientRect() };
  };
  useLayoutEffect(() => {
    if (!game || !root.current) return;
    const prior = previous.current;
    const before =
      game.lastAction.type === "init" && prior?.winnerId ? null : prior;
    previous.current = game;
    if (before === game) return;
    const board = root.current;
    if (!before) {
      handRects.current.clear();
      selectedOrigin.current = null;
    }
    const reduced =
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const findSeat = (id: string) =>
      Array.from(board.querySelectorAll<HTMLElement>("[data-seat]")).find(
        (el) => el.dataset.seat === id,
      );
    const findCard = (id: string) =>
      Array.from(board.querySelectorAll<HTMLElement>("[data-hand-card]")).find(
        (el) => el.dataset.handCard === id,
      )?.firstElementChild as HTMLElement | null;
    const deck = board.querySelector<HTMLElement>("[data-draw-pile]");
    const discard = board.querySelector<HTMLElement>(
      "[data-discard-pile] .uno-card",
    );
    function track(animation: Animation) {
      running.current.add(animation);
      animation.finished
        .catch(() => {})
        .finally(() => running.current.delete(animation));
    }
    function arrive(element: HTMLElement, from: DOMRect, delay = 0) {
      if (reduced) return;
      const to = element.getBoundingClientRect();
      const animation = element.animate(
        [
          {
            transform: `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) rotate(-12deg) scale(0.72)`,
            opacity: 0.2,
          },
          { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
        ],
        {
          duration: 260,
          delay,
          easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          fill: "backwards",
        },
      );
      track(animation);
    }
    const top = game.discardPile.at(-1);
    const oldTop = before?.discardPile.at(-1);
    const playAction = game.lastAction.type === "play" ? game.lastAction : null;
    if (before && top && top.id !== oldTop?.id && discard && !reduced) {
      const felt = board.querySelector<HTMLElement>(".table-boundary");
      if (felt)
        track(
          felt.animate(
            [
              { transform: "translateY(0)" },
              { transform: "translateY(2px)", offset: 0.65 },
              { transform: "translateY(0)" },
            ],
            { duration: 240, easing: "ease-out" },
          ),
        );
      const actor =
        playAction?.playerId ?? before.players[before.currentPlayerIndex]?.id;
      const from =
        selectedOrigin.current?.cardId === top.id
          ? selectedOrigin.current.rect
          : actor
            ? findSeat(actor)?.getBoundingClientRect()
            : undefined;
      if (from) {
        const to = discard.getBoundingClientRect();
        const ghost = discard.cloneNode(true) as HTMLElement;
        ghost.setAttribute("aria-hidden", "true");
        ghost.classList.add("flying-card");
        Object.assign(ghost.style, {
          position: "fixed",
          left: `${to.x}px`,
          top: `${to.y}px`,
          width: `${to.width}px`,
          height: `${to.height}px`,
          margin: "0",
          pointerEvents: "none",
          zIndex: "90",
        });
        document.body.append(ghost);
        ghosts.current.add(ghost);
        const flight = ghost.animate(
          [
            {
              transform: `translate(${from.x + from.width / 2 - to.x - to.width / 2}px, ${from.y + from.height / 2 - to.y - to.height / 2}px) rotate(-10deg) scale(0.9)`,
            },
            {
              transform: `translate(${(from.x + from.width / 2 - to.x - to.width / 2) * 0.3}px, ${(from.y + from.height / 2 - to.y - to.height / 2) * 0.3 - 28}px) rotate(7deg) scale(1.04)`,
              offset: 0.6,
            },
            {
              transform: "translate(0, 0) rotate(-2deg) scale(1.035)",
              offset: 0.88,
            },
            { transform: "translate(0, 0) rotate(0deg) scale(1)" },
          ],
          { duration: 280, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" },
        );
        track(flight);
        flight.finished
          .catch(() => {})
          .finally(() => {
            ghost.remove();
            ghosts.current.delete(ghost);
          });
        track(
          discard.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 280 }),
        );
      }
      selectedOrigin.current = null;
    }
    const local = game.players.find((p) => p.id === localPlayerId);
    const priorIds = new Set(
      before?.players
        .find((p) => p.id === localPlayerId)
        ?.hand.map((c) => c.id),
    );
    // Reveal an actual new draw before measuring/animating its arrival.
    // Initial deals, opponent draws and hand shuffles keep the reader's position.
    if (
      before &&
      local &&
      game.lastAction.type === "draw" &&
      game.lastAction.playerId === localPlayerId
    ) {
      const added = local.hand.filter((card) => !priorIds.has(card.id));
      const newest = added.at(-1);
      if (newest)
        findCard(newest.id)?.closest("[data-hand-card]")?.scrollIntoView({
          block: "nearest",
          inline: "center",
          behavior: "instant",
        });
    }
    const nextRects = new Map<string, DOMRect>();
    board
      .querySelectorAll<HTMLElement>("[data-hand-card]")
      .forEach((wrapper) => {
        const id = wrapper.dataset.handCard;
        const element = wrapper.firstElementChild as HTMLElement | null;
        if (!id || !element) return;
        const to = wrapper.getBoundingClientRect();
        const from = handRects.current.get(id);
        nextRects.set(id, to);
        if (
          from &&
          !reduced &&
          (Math.abs(from.x - to.x) > 1 || Math.abs(from.y - to.y) > 1)
        ) {
          track(
            element.animate(
              [
                {
                  transform: `translate(${from.x - to.x}px, ${from.y - to.y}px)`,
                },
                { transform: "translate(0, 0)" },
              ],
              { duration: 180, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
            ),
          );
        }
      });
    handRects.current = nextRects;
    if (local && deck)
      local.hand
        .filter((c) => !priorIds.has(c.id))
        .forEach((card, i) => {
          const element = findCard(card.id);
          if (element)
            arrive(element, deck.getBoundingClientRect(), Math.min(i, 5) * 35);
        });
    if (before)
      for (const player of game.players) {
        const oldPlayer = before.players.find((p) => p.id === player.id);
        if (
          player.id !== localPlayerId &&
          oldPlayer &&
          player.hand.length > oldPlayer.hand.length
        ) {
          const seat = findSeat(player.id);
          if (seat && deck && !reduced) {
            const source = deck.querySelector<HTMLElement>(".uno-card");
            if (source) {
              const from = source.getBoundingClientRect();
              const to = seat.getBoundingClientRect();
              const ghost = source.cloneNode(true) as HTMLElement;
              ghost.setAttribute("aria-hidden", "true");
              Object.assign(ghost.style, {
                position: "fixed",
                left: `${from.x}px`,
                top: `${from.y}px`,
                width: `${from.width}px`,
                height: `${from.height}px`,
                pointerEvents: "none",
                zIndex: "90",
              });
              document.body.append(ghost);
              ghosts.current.add(ghost);
              const flight = ghost.animate(
                [
                  { transform: "translate(0, 0) scale(1)", opacity: 1 },
                  {
                    transform: `translate(${to.x + to.width / 2 - from.x - from.width / 2}px, ${to.y + to.height / 2 - from.y - from.height / 2}px) rotate(12deg) scale(0.4)`,
                    opacity: 0.2,
                  },
                ],
                { duration: 260, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
              );
              track(flight);
              flight.finished
                .catch(() => {})
                .finally(() => {
                  ghost.remove();
                  ghosts.current.delete(ghost);
                });
            }
          }
        }
      }
    // Sound is tied to this same snapshot, never a voice duration or animation timer.
    if (!before) playTableChime("deal");
    else {
      const changed =
        JSON.stringify(before.lastAction) !== JSON.stringify(game.lastAction) ||
        before.turnCount !== game.turnCount;
      if (changed) {
        announceBoardFromTransition(
          before,
          game,
          localPlayerId ?? null,
          `${game.turnCount}:${JSON.stringify(game.lastAction)}`,
        );
        if (game.winnerId && !before.winnerId)
          playTableChime(game.winnerId === localPlayerId ? "win" : "lose");
        else if (top?.id !== oldTop?.id)
          playTableChime(ACTION_SOUNDS[top?.value ?? ""] ?? "cardPlay");
        else if (game.lastAction.type === "draw") playTableChime("draw");
        else if (game.lastAction.type === "declareUno") playTableChime("uno");
        else if (game.lastAction.type === "callOut") playTableChime("callOut");
      }
    }
  }, [game, localPlayerId, root]);
  useEffect(() => {
    if (game?.winnerId && localPlayerId) recordRound(game, localPlayerId);
  }, [game, localPlayerId]);
  useEffect(() => {
    preloadBoardVoiceovers();
    const onSettings = () => {
      if (!getAudioSettings().voiceInGame || getAudioSettings().muted)
        stopBoardVoiceover();
      else preloadBoardVoiceovers();
    };
    const onVisibility = () => {
      if (document.hidden) {
        stopBoardVoiceover();
        running.current.forEach((animation) => animation.cancel());
        ghosts.current.forEach((element) => element.remove());
        ghosts.current.clear();
      }
    };
    window.addEventListener("uno:audio-settings", onSettings);
    document.addEventListener("visibilitychange", onVisibility);
    const active = running.current;
    const activeGhosts = ghosts.current;
    return () => {
      window.removeEventListener("uno:audio-settings", onSettings);
      document.removeEventListener("visibilitychange", onVisibility);
      stopBoardVoiceover();
      active.forEach((a) => a.cancel());
      activeGhosts.forEach((el) => el.remove());
      active.clear();
      activeGhosts.clear();
    };
  }, []);
  return { rememberOrigin };
}
