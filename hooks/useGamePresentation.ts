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
  isReducedMotion,
  subscribeDisplaySettings,
} from "../lib/displaySettings";
import {
  getCardFlight,
  getDealDelay,
  getPlayedCards,
  getMultiPlayDelay,
  CARD_MOTION_EASE,
  hasCardLayoutChanged,
  type CardFlightKind,
  type CardPose,
} from "../lib/cardMotion";
import { readCardPose as cardPose } from "../lib/cardPose";

const ACTION_SOUNDS: Record<string, TableChime> = {
  skip: "skip",
  skipEveryone: "skip",
  wildSkip2: "skip",
  reverse: "reverse",
  draw2: "draw2",
  wildTargetDraw2: "draw2",
  wild4: "wild4",
  wildDraw6: "wild4",
  wildDraw10: "wild4",
  wildReverseDraw4: "wild4",
  wild: "wild",
  wildColorRoulette: "wild",
  wildForcedSwap: "wild",
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
  const handCardPoses = useRef(new Map<string, CardPose>());
  const selectedOrigin = useRef<{
    cardId: string;
    pose: CardPose;
    nextId?: string;
    restoreFocus: boolean;
  } | null>(null);
  const running = useRef<Set<Animation>>(new Set());
  const ghosts = useRef<Set<HTMLElement>>(new Set());
  const flights = useRef(
    new Map<
      HTMLElement,
      {
        ghost: HTMLElement;
        stop: () => void;
        to: CardPose;
        startsAt: number;
        kind: CardFlightKind;
      }
    >(),
  );
  const reflowing = useRef(new Map<HTMLElement, Animation>());
  const takeCard = (element: HTMLElement) => {
    const arrival = flights.current.get(element);
    const pose = cardPose(arrival?.ghost ?? element);
    // A pointer owns one physical card from pickup onward, even mid-deal.
    arrival?.stop();
    return pose;
  };
  const rememberOrigin = (cardId: string, element: HTMLElement) => {
    root.current
      ?.querySelectorAll<HTMLElement>("[data-hand-card]")
      .forEach((wrapper) => {
        const face = wrapper.querySelector<HTMLElement>(".uno-card");
        if (face && wrapper.dataset.handCard) {
          handCardPoses.current.set(
            wrapper.dataset.handCard,
            cardPose(flights.current.get(face)?.ghost ?? face),
          );
        }
      });
    const wrapper = element.closest<HTMLElement>("[data-hand-card]");
    const neighbor =
      wrapper?.nextElementSibling ?? wrapper?.previousElementSibling;
    selectedOrigin.current = {
      cardId,
      pose: cardPose(flights.current.get(element)?.ghost ?? element),
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
    const changed = before !== game;
    // Only a new round clears the table's motion. Metadata and later moves
    // preserve independent flights and their hidden endpoints.
    if (!before) {
      running.current.forEach((animation) => animation.cancel());
      ghosts.current.forEach((element) => element.remove());
      ghosts.current.clear();
      flights.current.clear();
      reflowing.current.clear();
    }
    // Independent arrivals finish through later moves. Remove only hand cards
    // that left the DOM; a new throw must not snap every other card to rest.
    flights.current.forEach((flight, element) => {
      if (!element.isConnected && element.closest("[data-hand-card]"))
        flight.stop();
    });
    const board = root.current;
    if (!before) {
      handPositions.current.clear();
      handCardPoses.current.clear();
      selectedOrigin.current = null;
    }
    const reduced = document.hidden || isReducedMotion();
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
    function destinationPose(element: HTMLElement): CardPose {
      const pose = cardPose(element);
      const wrapper = element.closest<HTMLElement>("[data-hand-card]");
      if (wrapper && reflowing.current.has(wrapper)) {
        const [x, y] = getComputedStyle(wrapper)
          .translate.split(" ")
          .map(parseFloat);
        pose.x -= x || 0;
        pose.y -= y || 0;
      }
      return pose;
    }
    function fly(
      element: HTMLElement,
      from: CardPose,
      delay = 0,
      hideDestination = true,
      to: CardPose = destinationPose(element),
      kind: CardFlightKind = "play",
    ) {
      if (reduced) return;
      if (!element.offsetWidth || !to.width || !from.width) return;
      const existing = hideDestination
        ? flights.current.get(element)
        : undefined;
      if (existing) {
        from = cardPose(existing.ghost);
        existing.stop();
      }
      const { keyframes, duration } = getCardFlight(from, to, kind);
      const resize = to.width / element.offsetWidth;
      const height = element.offsetHeight * resize;
      const ghost = element.cloneNode(true) as HTMLElement;
      ghost.querySelector("[data-card-hint]")?.remove();
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
        animation: "none",
        transformOrigin: "50% 50%",
        opacity: "1",
        visibility: "visible",
        filter: "none",
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
        easing: CARD_MOTION_EASE,
        fill: "both",
      });
      track(flight);
      // The real endpoint remains in layout; only one visible copy moves to it.
      const mask = hideDestination
        ? element.animate([{ opacity: 0 }, { opacity: 0 }], {
            duration: duration + delay,
          })
        : null;
      if (mask) track(mask);
      const entry = {
        ghost,
        to,
        kind,
        startsAt: performance.now() + delay,
        stop: () => {
          flight.cancel();
          mask?.cancel();
          ghost.remove();
          ghosts.current.delete(ghost);
          if (flights.current.get(element) === entry)
            flights.current.delete(element);
        },
      };
      if (hideDestination) flights.current.set(element, entry);
      void flight.finished
        .catch(() => {})
        .finally(() => {
          entry.stop();
          const cardId =
            element.closest<HTMLElement>("[data-hand-card]")?.dataset.handCard;
          if (cardId && element.isConnected && !flights.current.has(element)) {
            handCardPoses.current.set(cardId, destinationPose(element));
          }
        });
    }
    const top = game.discardPile.at(-1);
    const oldTop = before?.discardPile.at(-1);
    const action = game.lastAction;
    const origin = selectedOrigin.current;
    if (
      changed &&
      before &&
      action.type === "play" &&
      top &&
      top.id !== oldTop?.id &&
      discard
    ) {
      const played = getPlayedCards(game);
      played.forEach((card, index) => {
        const element =
          card.id === top.id
            ? discard
            : Array.from(
                board.querySelectorAll<HTMLElement>("[data-discard-card]"),
              )
                .find((entry) => entry.dataset.discardCard === card.id)
                ?.querySelector<HTMLElement>(".uno-card");
        const from =
          origin?.cardId === card.id
            ? origin.pose
            : action.playerId === localPlayerId
              ? handCardPoses.current.get(card.id)
              : playerCardPose(action.playerId);
        if (element && from)
          fly(element, from, getMultiPlayDelay(index, played.length));
      });
    }
    if (
      changed &&
      action.type === "play" &&
      (origin?.cardId === action.card.id ||
        action.playedCards?.some((card) => card.id === origin?.cardId)) &&
      origin &&
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
    if (changed && before && hasCardLayoutChanged(before, game))
      selectedOrigin.current = null;
    const local = game.players.find((p) => p.id === localPlayerId);
    const priorIds = new Set(
      before?.players
        .find((p) => p.id === localPlayerId)
        ?.hand.map((c) => c.id),
    );
    const added = local?.hand.filter((card) => !priorIds.has(card.id)) ?? [];
    if (
      changed &&
      before &&
      action.type === "draw" &&
      action.playerId === localPlayerId
    ) {
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
    // Measure all flight endpoints BEFORE applying reflow inversions.
    // Otherwise the arriving card lands in the hand's old position.
    if (changed && deck) {
      const origin = cardPose(
        action.type === "play" && action.shuffledHands && discard
          ? discard
          : deck,
      );
      const arrivals = before
        ? added.filter((_, i) => i < 5 || i === added.length - 1)
        : added.filter((_, i) => i < 7 || i === added.length - 1);
      arrivals.forEach((card, i) => {
        const element = findCard(card.id);
        if (element)
          fly(
            element,
            origin,
            before ? i * 32 : getDealDelay(i),
            true,
            destinationPose(element),
            before ? "draw" : "deal",
          );
      });
      if (!reduced)
        for (const [seatIndex, player] of game.players.entries()) {
          if (player.id === localPlayerId) continue;
          const oldPlayer = before?.players.find((p) => p.id === player.id);
          const count = before
            ? Math.max(
                0,
                player.hand.length -
                  (oldPlayer?.hand.length ?? player.hand.length),
              )
            : Math.min(5, player.hand.length);
          const backs = Array.from(
            findSeat(player.id)?.querySelectorAll<HTMLElement>(
              ".opponent-hand .uno-card",
            ) ?? [],
          ).filter((el) => el.offsetWidth && el.offsetHeight);
          const destination = playerCardPose(player.id);
          if (!destination) continue;
          for (let i = 0; i < Math.min(before ? 3 : 5, count); i++) {
            const back = !before ? backs[i] : undefined;
            const delay = before ? i * 38 : getDealDelay(i, seatIndex);
            // Always move a card back, including when a compact seat uses its avatar as an anchor.
            fly(
              back ?? deck,
              origin,
              delay,
              !!back,
              back ? cardPose(back) : destination,
              before ? "draw" : "deal",
            );
          }
        }
      if (!before && discard)
        fly(
          discard,
          origin,
          getDealDelay(Math.min(7, local?.hand.length ?? 7)),
          true,
          cardPose(discard),
          "deal",
        );
    }
    // Adaptive sizing/sorting can produce a second layout without a new game
    // snapshot. Retarget the arrival from its visible pose, never from the deck.
    for (const [element, flight] of flights.current) {
      if (!element.closest("[data-hand-card]")) continue;
      const to = destinationPose(element);
      if (
        Math.hypot(to.x - flight.to.x, to.y - flight.to.y) > 1 ||
        Math.abs(to.width - flight.to.width) > 1
      ) {
        fly(
          element,
          cardPose(flight.ghost),
          Math.max(0, flight.startsAt - performance.now()),
          true,
          to,
          flight.kind,
        );
      }
    }
    reflows.forEach(({ element, from, to }) => {
      const active = reflowing.current.get(element);
      const translate = active
        ? getComputedStyle(element).translate.split(" ").map(parseFloat)
        : [0, 0];
      active?.cancel();
      const animation = element.animate(
        [
          {
            translate: `${from.left - to.left + (translate[0] || 0)}px ${from.top - to.top + (translate[1] || 0)}px`,
          },
          { translate: "0px 0px" },
        ],
        { duration: 240, easing: CARD_MOTION_EASE },
      );
      reflowing.current.set(element, animation);
      track(animation);
      void animation.finished
        .catch(() => {})
        .finally(() => {
          if (reflowing.current.get(element) === animation)
            reflowing.current.delete(element);
        });
    });
    // Cache rendered pickup poses before the next snapshot removes these faces.
    const nextPoses = new Map<string, CardPose>();
    board
      .querySelectorAll<HTMLElement>("[data-hand-card]")
      .forEach((wrapper) => {
        const element = wrapper.querySelector<HTMLElement>(".uno-card");
        if (element && wrapper.dataset.handCard && element.offsetWidth) {
          const flight = flights.current.get(element);
          nextPoses.set(
            wrapper.dataset.handCard,
            flight ? cardPose(flight.ghost) : destinationPose(element),
          );
        }
      });
    handCardPoses.current = nextPoses;
    // Effects describe the current snapshot immediately; no queue or duration wait.
    if (changed && !before) playTableChime("deal");
    else if (
      changed &&
      before &&
      (JSON.stringify(before.lastAction) !== JSON.stringify(action) ||
        before.turnCount !== game.turnCount)
    ) {
      announceBoardFromTransition(
        before,
        game,
        localPlayerId ?? null,
        `${game.turnCount}:${JSON.stringify(action)}`,
      );
      if (game.winnerId && !before.winnerId)
        playTableChime(game.winnerId === localPlayerId ? "win" : "lose");
      else if (action.type === "play" && action.declaredUno)
        playTableChime("uno");
      else if (action.type === "play" && top?.id !== oldTop?.id)
        playTableChime(ACTION_SOUNDS[action.card.value] ?? "cardPlay");
      else if (action.type === "draw") playTableChime("draw");
      else if (action.type === "declareUno") playTableChime("uno");
      else if (action.type === "callOut") playTableChime("callOut");
    }
  });
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
      flights.current.clear();
      reflowing.current.clear();
      selectedOrigin.current = null;
    };
    const onVisibility = () => {
      if (document.hidden) {
        stopBoardVoiceover();
        interrupt();
      }
    };
    const onMotion = () => {
      if (isReducedMotion()) interrupt();
    };
    const onResize = () => {
      interrupt();
      // A rotated phone starts a new layout, not a flight from its old fan.
      handPositions.current.clear();
      handCardPoses.current.clear();
    };
    window.addEventListener("uno:audio-settings", onSettings);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotion);
    const unsubscribeDisplay = subscribeDisplaySettings(onMotion);
    const active = running.current;
    const activeGhosts = ghosts.current;
    const activeFlights = flights.current;
    const activeReflows = reflowing.current;
    return () => {
      window.removeEventListener("uno:audio-settings", onSettings);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onMotion);
      unsubscribeDisplay();
      stopBoardVoiceover();
      active.forEach((animation) => animation.cancel());
      activeGhosts.forEach((element) => element.remove());
      active.clear();
      activeGhosts.clear();
      previous.current = null;
      activeFlights.clear();
      activeReflows.clear();
    };
  }, []);
  return { rememberOrigin, takeCard };
}
