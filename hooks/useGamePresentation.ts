// Present snapshots with physical card continuity. Neither motion nor audio gates a turn.
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
import {
  getCardFlight,
  hasCardLayoutChanged,
  type CardPose,
} from "../lib/cardMotion";
import { readCardPose as cardPose } from "../lib/cardPose";

const ACTION_SOUNDS: Record<string, TableChime> = {
  skip: "skip",
  reverse: "reverse",
  draw2: "draw2",
  wild4: "wild4",
  wild: "wild",
  shuffle: "shuffle",
};

type HandPosition = { left: number; top: number };
export function useGamePresentation(
  game: GameState | null,
  localPlayerId: string | undefined,
  root: RefObject<HTMLElement | null>,
) {
  const previous = useRef<GameState | null>(null);
  const handPositions = useRef<Map<string, HandPosition>>(new Map());
  const selectedOrigin = useRef<{
    cardId: string;
    pose: CardPose;
    nextId?: string;
    restoreFocus: boolean;
  } | null>(null);
  const running = useRef<Set<Animation>>(new Set());
  const ghosts = useRef<Set<HTMLElement>>(new Set());
  const rememberOrigin = (cardId: string, element: HTMLElement) => {
    const wrapper = element.closest<HTMLElement>("[data-hand-card]");
    const neighbor =
      wrapper?.nextElementSibling ?? wrapper?.previousElementSibling;
    selectedOrigin.current = {
      cardId,
      pose: cardPose(element),
      nextId: (neighbor as HTMLElement | null)?.dataset.handCard,
      restoreFocus: document.activeElement === element,
    };
  };
  useLayoutEffect(() => {
    if (!game || !root.current) return;
    const prior = previous.current;
    const before =
      game.lastAction.type === "init" && prior?.winnerId ? null : prior;
    previous.current = game;
    if (before === game) return;
    // Interrupt only when cards actually change. UNO declarations and equivalent
    // network snapshots can arrive mid-flight and must not flash the destination.
    if (!before || hasCardLayoutChanged(before, game)) {
      running.current.forEach((animation) => animation.cancel());
      ghosts.current.forEach((element) => element.remove());
      ghosts.current.clear();
    }
    const board = root.current;
    if (!before) {
      handPositions.current.clear();
      selectedOrigin.current = null;
    }
    const reduced =
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const findSeat = (id: string) =>
      Array.from(board.querySelectorAll<HTMLElement>("[data-seat]")).find(
        (el) => el.dataset.seat === id,
      );
    const playerCardPose = (id: string): CardPose | null => {
      const seat = findSeat(id);
      // Compact phones hide the fan, but keep the player's graphical identity.
      for (const selector of [
        ".opponent-hand .uno-card",
        ".opponent-label .player-avatar",
      ]) {
        const element = seat?.querySelector<HTMLElement>(selector);
        if (element?.offsetWidth && element.offsetHeight)
          return cardPose(element);
      }
      return null;
    };
    const findCard = (id: string) =>
      Array.from(board.querySelectorAll<HTMLElement>("[data-hand-card]")).find(
        (el) => el.dataset.handCard === id,
      )?.firstElementChild as HTMLElement | null;
    const deck = board.querySelector<HTMLElement>("[data-draw-pile] .uno-card");
    const discard = board.querySelector<HTMLElement>(
      "[data-discard-pile] .uno-card",
    );
    function track(animation: Animation) {
      running.current.add(animation);
      void animation.finished
        .catch(() => {})
        .finally(() => running.current.delete(animation));
    }
    function fly(
      element: HTMLElement,
      from: CardPose,
      delay = 0,
      hideDestination = true,
      to: CardPose = cardPose(element),
    ) {
      if (reduced) return;
      if (!element.offsetWidth || !to.width || !from.width) return;
      const { keyframes, duration } = getCardFlight(from, to);
      const resize = to.width / element.offsetWidth;
      const height = element.offsetHeight * resize;
      const ghost = element.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("aria-label");
      ghost.setAttribute("aria-hidden", "true");
      ghost.tabIndex = -1;
      ghost.dataset.presentationCard = "";
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${to.x - to.width / 2}px`,
        top: `${to.y - height / 2}px`,
        width: `${to.width}px`,
        height: `${height}px`,
        margin: "0",
        pointerEvents: "none",
        transition: "none",
        zIndex: "90",
      });
      ghost.style.setProperty(
        "--card-scale",
        `${(parseFloat(getComputedStyle(element).getPropertyValue("--card-scale")) || 1) * resize}`,
      );
      document.body.append(ghost);
      ghosts.current.add(ghost);
      const flight = ghost.animate(keyframes, {
        duration,
        delay,
        easing: "cubic-bezier(.16,1,.3,1)",
        fill: "backwards",
      });
      track(flight);
      // The real endpoint remains in layout; only one visible copy moves to it.
      if (hideDestination)
        track(
          element.animate([{ opacity: 0 }, { opacity: 0 }], {
            duration: duration + delay,
          }),
        );
      void flight.finished
        .catch(() => {})
        .finally(() => {
          ghost.remove();
          ghosts.current.delete(ghost);
        });
    }
    const top = game.discardPile.at(-1);
    const oldTop = before?.discardPile.at(-1);
    const action = game.lastAction;
    const origin = selectedOrigin.current;
    if (
      before &&
      action.type === "play" &&
      top &&
      top.id !== oldTop?.id &&
      discard
    ) {
      const from =
        origin?.cardId === action.card.id
          ? origin.pose
          : playerCardPose(action.playerId);
      if (from) fly(discard, from);
    }
    if (
      action.type === "play" &&
      origin?.cardId === action.card.id &&
      origin.restoreFocus
    ) {
      queueMicrotask(() => {
        if (
          !board.isConnected ||
          document.activeElement !== document.body ||
          document.querySelector("dialog[open]")
        )
          return;
        const next =
          (origin.nextId && findCard(origin.nextId)) ||
          board.querySelector<HTMLElement>("[data-hand-card] .uno-card");
        next?.focus({ preventScroll: true });
      });
    }
    // Preparing an online wild publishes metadata before the card moves. Keep
    // its measured origin and focus intent through that color-choice snapshot.
    if (before && hasCardLayoutChanged(before, game))
      selectedOrigin.current = null;
    const local = game.players.find((p) => p.id === localPlayerId);
    const priorIds = new Set(
      before?.players
        .find((p) => p.id === localPlayerId)
        ?.hand.map((c) => c.id),
    );
    const added = local?.hand.filter((card) => !priorIds.has(card.id)) ?? [];
    if (before && action.type === "draw" && action.playerId === localPlayerId) {
      const newest = added.at(-1);
      if (newest)
        findCard(newest.id)?.closest("[data-hand-card]")?.scrollIntoView({
          block: "nearest",
          inline: "center",
          behavior: "instant",
        });
    }
    // Reflow only the layout offset. CSS owns the fan, legal lift and inspection,
    // so a turn change cannot be frozen or snapped by a competing transform.
    const nextPositions = new Map<string, HandPosition>();
    const reflows: {
      element: HTMLElement;
      from: HandPosition;
      to: HandPosition;
    }[] = [];
    board
      .querySelectorAll<HTMLElement>("[data-hand-card]")
      .forEach((wrapper) => {
        const id = wrapper.dataset.handCard;
        if (!id) return;
        const to = {
          left: wrapper.offsetLeft,
          top: wrapper.offsetTop,
        };
        nextPositions.set(id, to);
        const from = handPositions.current.get(id);
        if (
          from &&
          !reduced &&
          (Math.abs(from.left - to.left) > 1 || Math.abs(from.top - to.top) > 1)
        )
          reflows.push({ element: wrapper, from, to });
      });
    handPositions.current = nextPositions;
    reflows.forEach(({ element, from, to }) =>
      track(
        element.animate(
          [
            {
              translate: `${from.left - to.left}px ${from.top - to.top}px`,
            },
            { translate: "0px 0px" },
          ],
          { duration: 180, easing: "cubic-bezier(.16,1,.3,1)" },
        ),
      ),
    );
    if (deck) {
      const origin = cardPose(
        action.type === "play" && action.shuffledHands && discard
          ? discard
          : deck,
      );
      // Six representative arrivals maximum, including the newest card in a large draw.
      added
        .filter((_, i) => i < 5 || i === added.length - 1)
        .forEach((card, i) => {
          const element = findCard(card.id);
          if (element) fly(element, origin, i * 25);
        });
      if (before && !reduced)
        for (const player of game.players) {
          const oldPlayer = before.players.find((p) => p.id === player.id);
          if (
            player.id !== localPlayerId &&
            oldPlayer &&
            player.hand.length > oldPlayer.hand.length
          ) {
            const destination = playerCardPose(player.id);
            // Clone the face-down deck, never the avatar used as its landing pose.
            if (destination) fly(deck, origin, 0, false, destination);
          }
        }
    }
    // Effects describe the current snapshot immediately; no queue or duration wait.
    if (!before) playTableChime("deal");
    else if (
      JSON.stringify(before.lastAction) !== JSON.stringify(action) ||
      before.turnCount !== game.turnCount
    ) {
      announceBoardFromTransition(
        before,
        game,
        localPlayerId ?? null,
        `${game.turnCount}:${JSON.stringify(action)}`,
      );
      if (game.winnerId && !before.winnerId)
        playTableChime(game.winnerId === localPlayerId ? "win" : "lose");
      else if (action.type === "play" && top?.id !== oldTop?.id)
        playTableChime(ACTION_SOUNDS[action.card.value] ?? "cardPlay");
      else if (action.type === "draw") playTableChime("draw");
      else if (action.type === "declareUno") playTableChime("uno");
      else if (action.type === "callOut") playTableChime("callOut");
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
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const interrupt = () => {
      running.current.forEach((animation) => animation.cancel());
      ghosts.current.forEach((element) => element.remove());
      ghosts.current.clear();
      selectedOrigin.current = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stopBoardVoiceover();
        interrupt();
      }
    };
    const onMotion = () => {
      if (media.matches) interrupt();
    };
    const onResize = () => {
      interrupt();
      // A rotated phone starts a new layout, not a flight from its old fan.
      handPositions.current.clear();
    };
    window.addEventListener("uno:audio-settings", onSettings);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotion);
    const active = running.current;
    const activeGhosts = ghosts.current;
    return () => {
      window.removeEventListener("uno:audio-settings", onSettings);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onMotion);
      stopBoardVoiceover();
      active.forEach((animation) => animation.cancel());
      activeGhosts.forEach((element) => element.remove());
      active.clear();
      activeGhosts.clear();
    };
  }, []);
  return { rememberOrigin };
}
