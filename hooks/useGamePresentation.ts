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
import { getCardFlight, type CardPose } from "../lib/cardMotion";

const ACTION_SOUNDS: Record<string, TableChime> = {
  skip: "skip",
  reverse: "reverse",
  draw2: "draw2",
  wild4: "wild4",
  wild: "wild",
  shuffle: "shuffle",
};

function cardPose(element: HTMLElement): CardPose {
  const rect = element.getBoundingClientRect();
  // Card, fan and pile rotations compose. Translation alone cannot recover this.
  let angle = 0;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const transform = getComputedStyle(node).transform;
    if (transform !== "none") {
      const matrix = new DOMMatrixReadOnly(transform);
      angle += Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
    }
  }
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
    width: element.offsetWidth,
    angle,
  };
}

type HandPosition = { left: number; top: number; transform: string };
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
    // A rapid jump-in/reconnect interrupts the old picture instead of piling up ghosts.
    running.current.forEach((animation) => animation.cancel());
    ghosts.current.forEach((element) => element.remove());
    ghosts.current.clear();
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
    ) {
      if (reduced) return;
      const to = cardPose(element);
      if (!to.width || !from.width) return;
      const { keyframes, duration } = getCardFlight(from, to);
      const ghost = element.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("aria-label");
      ghost.setAttribute("aria-hidden", "true");
      ghost.tabIndex = -1;
      ghost.dataset.presentationCard = "";
      Object.assign(ghost.style, {
        position: "fixed",
        left: `${to.x - element.offsetWidth / 2}px`,
        top: `${to.y - element.offsetHeight / 2}px`,
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
        margin: "0",
        pointerEvents: "none",
        transition: "none",
        zIndex: "90",
      });
      ghost.style.setProperty(
        "--card-scale",
        getComputedStyle(element).getPropertyValue("--card-scale"),
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
      const actorCard = findSeat(action.playerId)?.querySelector<HTMLElement>(
        ".opponent-hand .uno-card",
      );
      const from =
        origin?.cardId === action.card.id
          ? origin.pose
          : actorCard
            ? cardPose(actorCard)
            : null;
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
    // Read positions together before applying FLIP, preserving the fan's actual transform.
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
          transform: getComputedStyle(wrapper).transform,
        };
        nextPositions.set(id, to);
        const from = handPositions.current.get(id);
        if (
          from &&
          !reduced &&
          (Math.abs(from.left - to.left) > 1 ||
            Math.abs(from.top - to.top) > 1 ||
            from.transform !== to.transform)
        )
          reflows.push({ element: wrapper, from, to });
      });
    handPositions.current = nextPositions;
    reflows.forEach(({ element, from, to }) =>
      track(
        element.animate(
          [
            {
              transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) ${from.transform === "none" ? "" : from.transform}`,
            },
            { transform: to.transform },
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
            const endpoint = findSeat(player.id)?.querySelector<HTMLElement>(
              ".opponent-hand .uno-card",
            );
            if (endpoint) fly(endpoint, origin, 0, false);
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
    window.addEventListener("uno:audio-settings", onSettings);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotion);
    const active = running.current;
    const activeGhosts = ghosts.current;
    return () => {
      window.removeEventListener("uno:audio-settings", onSettings);
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
