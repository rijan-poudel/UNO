// Card-table layout. The engine owns turns; presentation never blocks an action.
"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  HelpCircle,
  Menu,
  Smartphone,
  RotateCw,
  Layers,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { useUnoGame } from "../hooks/useUnoGame";
import type { useUnoOnlineGame } from "../hooks/useUnoOnlineGame";
import type { Card } from "../types/card";
import {
  canDeclareUno,
  getCardPlayChoices,
  getCardPlayHint,
  getCardPlayBlockReason,
  getStackResponseLabel,
} from "../lib/gameRules";
import type { PlayOptions } from "../lib/gameActions";
import { describeGameAction } from "../lib/gameActivity";
import { getPlayedCards } from "../lib/cardMotion";
import { getHandSort, saveHandSort, sortHand } from "../lib/handSorting";
import { getNextPlayerIndex } from "../lib/turns";
import { getHandOverlap, getHandCropMargin } from "../lib/handLayout";
import CardPlayDialog from "./CardPlayDialog";
import { getTableMood } from "../lib/rulePresets";
import { getBotDifficultyLabel } from "../lib/botSupport";
import TurnCue from "./TurnCue";
import { getPlayerExpression } from "../lib/playerExpression";
import { getAudioSettings, setAudioSettings } from "../lib/audioSettings";
import { usePhonePortrait } from "../hooks/usePhonePortrait";
import { useGamePresentation } from "../hooks/useGamePresentation";
import { useHandNavigation } from "../hooks/useHandNavigation";
import RematchStatus from "./RematchStatus";
import RoundSummary from "./RoundSummary";
import TableScoreCard from "./TableScoreCard";
import OpponentSeat from "./OpponentSeat";
import GameFeedback, { VictoryBurst } from "./GameFeedback";
import UnoCard from "./UnoCard";
import HandCard from "./HandCard";
import {
  getTableAudioStatus,
  subscribeTableAudio,
  playTableChime,
  primeTableAudioFromUserGesture,
} from "../lib/tableChimes";
import ColorPicker from "./ColorPicker";
import ChoiceDialog from "./ChoiceDialog";
import Modal from "./Modal";
import HowToPlayModal from "./HowToPlayModal";
import { UnoWordmark } from "./ui/PageChrome";
import { NoMercyIcon } from "./icons/NoMercyIcons";
export type GameApi =
  ReturnType<typeof useUnoGame> | ReturnType<typeof useUnoOnlineGame>;
interface Props {
  profileMenu: ReactNode;
  gameApi: GameApi;
  onReset: () => void;
  onDealAgain: () => boolean | Promise<boolean>;
}
// Reveal in the hand’s horizontal scrollport without scrolling the document.
function revealHandCard(scroller: HTMLElement, card: HTMLElement) {
  const area = scroller.getBoundingClientRect();
  const face = card.getBoundingClientRect();
  const delta =
    face.left < area.left + 18
      ? face.left - area.left - 18
      : face.right > area.right - 18
        ? face.right - area.right + 18
        : 0;
  if (delta) scroller.scrollBy({ left: delta, behavior: "instant" });
}

const VALUES: Record<string, string> = {
  skip: "Skip",
  reverse: "Reverse",
  draw2: "+2",
  draw4: "+4",
  skipEveryone: "Skip everyone",
  wildReverseDraw4: "Wild reverse +4",
  wildDraw6: "Wild +6",
  wildDraw10: "Wild +10",
  wildColorRoulette: "Color roulette",
  wildSkip2: "Skip two",
  wildTargetDraw2: "Targeted +2",
  wildForcedSwap: "Forced swap",
  wild: "Wild",
  wild4: "+4",
  shuffle: "Shuffle hands",
  discardAll: "Discard all",
};
function cardLabel(card: Card): string {
  const value =
    card.value === "wild4" ? "Wild +4" : (VALUES[card.value] ?? card.value);
  return `${card.color === "wild" ? "" : card.color + " "}${value}`;
}
export default function GameBoard({
  gameApi: api,
  onReset,
  onDealAgain,
  profileMenu,
}: Props) {
  const {
    game,
    localPlayer,
    localPlayerIndex,
    currentPlayer,
    isLocalTurn,
    pendingWild,
    drawnThisTurn,
    canPass,
  } = api;
  const phonePortrait = usePhonePortrait();
  const root = useRef<HTMLDivElement>(null);
  const [targetChoice, setTargetChoice] = useState<{
    cardId: string;
    turnCount: number;
    options: PlayOptions;
  } | null>(null);
  const targetOrigin = useRef<HTMLElement | null>(null);
  const [exit, setExit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [history, setHistory] = useState(false);
  const tableDialogOpen = menu || help || history || exit;
  useEffect(() => {
    if (!tableDialogOpen) return;
    const board = root.current;
    return () => {
      queueMicrotask(() => {
        // Menu destinations replace their opener, so native focus return needs a fallback.
        if (
          board?.isConnected &&
          document.activeElement === document.body &&
          !document.querySelector("dialog[open]")
        )
          board
            .querySelector<HTMLButtonElement>(".game-menu-trigger")
            ?.focus({ preventScroll: true });
      });
    };
  }, [tableDialogOpen]);
  const [sort, setSort] = useState(getHandSort);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [manualRoomCode, setManualRoomCode] = useState(false);
  const [startingRematch, setStartingRematch] = useState(false);
  const [returningToLobby, setReturningToLobby] = useState(false);
  const [draggingCard, setDraggingCard] = useState<"lifting" | "ready" | null>(
    null,
  );
  const onDragChange = useCallback(
    (state: "lifting" | "ready" | null) => setDraggingCard(state),
    [],
  );
  const [soundOn, setSoundOn] = useState(() => {
    const audio = getAudioSettings();
    return !audio.muted && audio.chimesEnabled && audio.sfxVolume > 0;
  });
  const audioStatus = useSyncExternalStore(
    subscribeTableAudio,
    getTableAudioStatus,
    () => "locked" as const,
  );
  const soundIntent = useRef<"enable" | "mute" | null>(null);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [previewedId, setPreviewedId] = useState<string | null>(null);
  const [playChoice, setPlayChoice] = useState<{
    cardId: string;
    turnCount: number;
    playerIndex: number;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState(false);
  const pendingRef = useRef(false);
  const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { rememberOrigin, takeCard } = useGamePresentation(
    game,
    localPlayer?.id,
    root,
  );
  const online = "room" in api ? api : null;
  const cards = useMemo(
    () => sortHand(localPlayer?.hand ?? [], sort),
    [localPlayer?.hand, sort],
  );
  const cardChoices = useMemo(
    () =>
      new Map(
        cards.map((card) => [
          card.id,
          game ? getCardPlayChoices(game, localPlayerIndex, card) : [],
        ]),
      ),
    [cards, game, localPlayerIndex],
  );
  const handNavigation = useHandNavigation(cards);
  const { hand } = handNavigation;
  const targetCard =
    targetChoice &&
    targetChoice.turnCount === game?.turnCount &&
    isLocalTurn &&
    !game?.winnerId &&
    !pendingWild &&
    !pendingAction &&
    !phonePortrait &&
    (!online || online.connected)
      ? cards.find((card) => card.id === targetChoice.cardId)
      : undefined;
  const previousTarget = useRef(false);
  const targetingId = targetCard?.id;
  useEffect(() => {
    if (targetingId)
      root.current
        ?.querySelector<HTMLButtonElement>("[data-target]")
        ?.focus({ preventScroll: true });
    else if (previousTarget.current) {
      const origin = targetOrigin.current;
      (origin?.isConnected
        ? origin
        : hand.current?.querySelector<HTMLButtonElement>(
            '.uno-card[tabindex="0"]',
          )
      )?.focus({ preventScroll: true });
    }
    previousTarget.current = !!targetingId;
  }, [targetingId, hand]);
  // Fit by overlap only. A larger hand scrolls at the same readable card size.
  const [handFit, setHandFit] = useState({ overlap: -36, crop: 0 });
  useLayoutEffect(() => {
    const scroller = hand.current;
    if (!scroller) return;
    const measure = () => {
      if (!scroller.clientWidth || !scroller.clientHeight) return;
      const style = getComputedStyle(scroller);
      const scale = parseFloat(style.getPropertyValue("--hand-scale")) || 1;
      const available =
        scroller.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const face = scroller.querySelector<HTMLElement>(".hand-card .uno-card");
      const fit = {
        overlap: getHandOverlap(available, cards.length, 82 * scale),
        crop: getHandCropMargin(
          cards.length,
          face?.offsetWidth ?? 82 * scale,
          face?.offsetHeight ?? 122 * scale,
          parseFloat(style.getPropertyValue("--hand-fan-depth")) || 0,
          parseFloat(style.getPropertyValue("--hand-fan-rotation")) || 0,
        ),
      };
      setHandFit((prior) =>
        prior.overlap === fit.overlap && prior.crop === fit.crop ? prior : fit,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [cards.length, hand]);
  useEffect(() => {
    const scroller = hand.current;
    if (!scroller) return;
    const reveal = () => {
      const focused = document.activeElement;
      const inspected = inspectedId
        ? scroller.querySelector<HTMLElement>(
            `[data-hand-card="${inspectedId}"] .uno-card`,
          )
        : null;
      const element =
        focused instanceof HTMLElement && scroller.contains(focused)
          ? focused
          : inspected;
      if (element) revealHandCard(scroller, element);
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [inspectedId, sort, hand]);
  useEffect(() => {
    const timer = setTimeout(() => {
      pendingRef.current = false;
      setPendingAction(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [game, pendingWild]);
  useEffect(() => {
    const sync = () => {
      const audio = getAudioSettings();
      setSoundOn(!audio.muted && audio.chimesEnabled && audio.sfxVolume > 0);
    };
    window.addEventListener("uno:audio-settings", sync);
    return () => {
      window.removeEventListener("uno:audio-settings", sync);
      if (actionTimeout.current) clearTimeout(actionTimeout.current);
    };
  }, []);
  function act(action: () => void) {
    if (pendingRef.current) return;
    primeTableAudioFromUserGesture();
    pendingRef.current = true;
    setPendingAction(true);
    action();
    if (actionTimeout.current) clearTimeout(actionTimeout.current);
    actionTimeout.current = setTimeout(() => {
      pendingRef.current = false;
      setPendingAction(false);
    }, 1800);
  }
  const canSayUno = !!(
    game &&
    localPlayer &&
    !game.winnerId &&
    !pendingWild &&
    !pendingAction &&
    (!online || online.connected) &&
    canDeclareUno(game, localPlayerIndex)
  );
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (phonePortrait) return;
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
        if (targetCard) {
          event.preventDefault();
          setTargetChoice(null);
        }
        setInspectedId(null);
        return;
      }
      if (
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        document.querySelector("dialog[open]") ||
        !game ||
        game.winnerId ||
        pendingWild ||
        targetCard ||
        pendingRef.current ||
        (online && !online.connected)
      )
        return;
      if (
        (event.target as HTMLElement).closest(
          "input, textarea, select, [contenteditable]",
        )
      )
        return;
      if (
        event.key.toLowerCase() === "d" &&
        isLocalTurn &&
        !drawnThisTurn &&
        !pendingWild
      ) {
        event.preventDefault();
        act(api.drawCard);
      }
      if (event.key.toLowerCase() === "p" && isLocalTurn && canPass) {
        event.preventDefault();
        act(api.pass);
      }
      if (event.key.toLowerCase() === "u" && canSayUno) {
        event.preventDefault();
        primeTableAudioFromUserGesture();
        api.sayUno(localPlayerIndex);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!game || !localPlayer || !currentPlayer) return null;
  const winner = game.players.find((p) => p.id === game.winnerId);
  const opponents = Array.from({ length: game.players.length - 1 }, (_, i) => {
    const index = (localPlayerIndex + i + 1) % game.players.length;
    return { player: game.players[index], index };
  });
  const positions =
    opponents.length === 1
      ? ["seat-top"]
      : opponents.length === 2
        ? ["seat-upper-left", "seat-upper-right"]
        : opponents.length === 3
          ? ["seat-left", "seat-top", "seat-right"]
          : opponents.length === 4
            ? ["seat-left", "seat-upper-left", "seat-upper-right", "seat-right"]
            : [
                "seat-left",
                "seat-upper-left",
                "seat-top",
                "seat-upper-right",
                "seat-right",
              ];
  const playable = cards.filter(
    (card) => (cardChoices.get(card.id)?.length ?? 0) > 0,
  );
  const top = game.discardPile.at(-1);
  const playedCards = getPlayedCards(game);
  const historyCards = game.discardPile.slice(
    -Math.max(3, playedCards.length),
    -1,
  );
  const previewedCard = cards.find((card) => card.id === previewedId);
  const previewHint =
    previewedCard &&
    !pendingAction &&
    !pendingWild &&
    !winner &&
    (!online || online.connected)
      ? getCardPlayHint(game, localPlayerIndex, previewedCard)
      : undefined;
  const drawDisabled =
    !isLocalTurn ||
    drawnThisTurn ||
    !!pendingWild ||
    !!targetCard ||
    !!winner ||
    pendingAction ||
    !!(online && !online.connected);
  const mustDraw = isLocalTurn && !drawDisabled && playable.length === 0;
  const activeColor =
    game.activeColor && game.activeColor !== "wild" ? game.activeColor : "red";
  const turnTitle = winner
    ? `${winner.name} wins!`
    : pendingWild
      ? "Pick your next color"
      : isLocalTurn
        ? game.pendingDraw
          ? `Draw ${game.pendingDraw}${playable.length ? " or stack" : " cards"}`
          : drawnThisTurn
            ? playable.length
              ? "Play a card or pass"
              : "No match this time"
            : playable.length
              ? "Your move."
              : "No match? Take a card."
        : `${currentPlayer.name}’s turn`;
  const stackResponse = getStackResponseLabel(game);
  const commitCard = (card: Card, options: PlayOptions = {}) => {
    if (
      !options.targetPlayerId &&
      ((game.rules.sevenZero && card.value === "7") ||
        card.value === "wildForcedSwap" ||
        card.value === "wildTargetDraw2")
    ) {
      setPlayChoice(null);
      setInspectedId(null);
      targetOrigin.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setTargetChoice({ cardId: card.id, turnCount: game.turnCount, options });
      return;
    }
    setTargetChoice(null);
    setPlayChoice(null);
    setInspectedId(null);
    primeTableAudioFromUserGesture();
    act(() => api.selectCard(card, options));
  };
  const select = (card: Card, element: HTMLElement) => {
    // Capture before a choice moves focus or a released drag ghost is removed.
    rememberOrigin(card.id, element);
    const choices = cardChoices.get(card.id) ?? [];
    if (card.value === "discardAll" && choices.length) {
      commitCard(card, {
        declareUno: game.rules.mustDeclareUno && choices[0].remaining === 1,
      });
      return;
    }
    if (choices.length > 1 || choices[0]?.cards.length > 1) {
      setPlayChoice({
        cardId: card.id,
        turnCount: game.turnCount,
        playerIndex: game.currentPlayerIndex,
      });
    } else commitCard(card);
  };
  const choiceCard =
    playChoice &&
    !phonePortrait &&
    !pendingWild &&
    !winner &&
    !pendingAction &&
    (!online || online.connected) &&
    playChoice.turnCount === game.turnCount &&
    playChoice.playerIndex === game.currentPlayerIndex
      ? cards.find((card) => card.id === playChoice.cardId)
      : undefined;
  const playChoices = choiceCard ? (cardChoices.get(choiceCard.id) ?? []) : [];
  const selectedCard = cards.find((card) => card.id === inspectedId);
  const canPlaySelected =
    selectedCard &&
    playable.some((card) => card.id === selectedCard.id) &&
    !pendingAction &&
    !pendingWild &&
    !winner &&
    (!online || online.connected);
  const selectedLabel = selectedCard ? cardLabel(selectedCard) : "";
  const drawnCard =
    game.lastAction.type === "draw" &&
    game.lastAction.playerId === localPlayer.id &&
    game.lastAction.count === 1
      ? localPlayer.hand.at(-1)
      : null;

  const blockedReason = selectedCard
    ? getCardPlayBlockReason(game, localPlayerIndex, selectedCard)
    : undefined;
  const moveHint =
    online && !online.connected
      ? "Reconnecting. Your hand is safe."
      : pendingWild
        ? "Choose a color to finish your move."
        : pendingAction
          ? "Making your move…"
          : blockedReason
            ? blockedReason
            : canPlaySelected
              ? isLocalTurn
                ? "Ready to play. You can also drag it onto the table."
                : "Exact match. Play now to jump in."
              : !isLocalTurn
                ? ""
                : drawnThisTurn
                  ? playable.length
                    ? drawnCard
                      ? `Drew ${cardLabel(drawnCard)}. Play a match or pass.`
                      : "Play a matching card, or pass to end your turn."
                    : "No match. Passing…"
                  : selectedCard
                    ? `Match ${activeColor}${top?.color !== "wild" && top ? ` or ${VALUES[top.value] ?? top.value}` : ""}, or play a wild.`
                    : game.pendingDraw
                      ? playable.length
                        ? `Stack ${stackResponse ?? "a matching draw card"}, or draw ${game.pendingDraw} total.`
                        : `Draw ${game.pendingDraw} to take the penalty.`
                      : playable.length
                        ? ""
                        : "No matching card. Draw to keep the round moving.";
  return (
    <div
      className={`game-page centered-board mood-${getTableMood(game.rules)} seats-${game.players.length} ${phonePortrait ? "needs-landscape" : ""} ${isLocalTurn ? "local-turn" : ""}`}
      ref={root}
      onPointerDownCapture={(event) => {
        if (
          inspectedId &&
          !(event.target as HTMLElement).closest(".hand-card, .move-buttons")
        )
          setInspectedId(null);
      }}
    >
      {phonePortrait && (
        <section
          className="rotate-phone"
          aria-label="Landscape play"
          role="status"
        >
          <div className="rotate-phone-art" aria-hidden="true">
            <Smartphone size={76} strokeWidth={1.5} />
            <RotateCw size={32} />
          </div>
          <h1>Turn your phone.</h1>
          <p>
            {online ? "The online round continues." : "Your round is paused."}
          </p>
          <button className="button secondary" onClick={() => setExit(true)}>
            Leave table
          </button>
        </section>
      )}
      <header className="game-header">
        <button
          className="brand-button"
          aria-label="Leave game"
          onClick={() => setExit(true)}
        >
          <UnoWordmark compact />
        </button>
        <div className="header-actions">
          {profileMenu}
          <button
            className="icon-button game-menu-trigger"
            aria-label="Game menu"
            title="Game menu"
            onClick={() => setMenu(true)}
          >
            <Menu size={24} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      </header>
      {online && !online.connected && (
        <div className="reconnect-banner" role="status">
          Reconnecting to your table… Your seat is saved.
        </div>
      )}
      {online?.error && (
        <div className="game-error" role="alert">
          {online.error}
        </div>
      )}
      <main className="game-main" data-design-contract="centered-table">
        <section
          className={`playing-table color-${activeColor} seats-${game.players.length} ${draggingCard ? "receiving-card" : ""} ${draggingCard === "ready" ? "drop-ready" : ""}`}
          aria-label="Playing table"
        >
          <div className="card-landing" aria-hidden="true">
            <span>
              {draggingCard === "ready"
                ? "Release to play"
                : draggingCard
                  ? "Slide up to play"
                  : ""}
            </span>
          </div>
          <GameFeedback game={game} />
          {opponents.map(({ player, index }, i) => (
            <OpponentSeat
              key={player.id}
              player={player}
              mercyLimit={game.rules.eliminationHandLimit}
              targetAction={
                targetCard?.value === "wildTargetDraw2"
                  ? "Give two cards to"
                  : "Swap hands with"
              }
              onTarget={
                targetCard && !player.eliminated
                  ? () =>
                      commitCard(targetCard, {
                        ...targetChoice?.options,
                        targetPlayerId: player.id,
                      })
                  : undefined
              }
              active={game.currentPlayerIndex === index}
              expression={getPlayerExpression(game, player.id)}
              position={positions[i]}
              offline={
                !player.isBot &&
                online?.room?.players.find((p) => p.playerId === player.id)
                  ?.connected === false
              }
              canCatch={
                !targetCard &&
                !localPlayer.eliminated &&
                !player.eliminated &&
                (!online || isLocalTurn) &&
                !winner &&
                !pendingWild &&
                !pendingAction &&
                (!online || online.connected) &&
                !player.saidUno &&
                player.hand.length === 1 &&
                game.rules.mustDeclareUno
              }
              onCatch={() => {
                act(() => api.callOut(localPlayerIndex, index));
              }}
            />
          ))}
          <div className="table-center">
            {(["far", "near"] as const).map((half) => (
              <div
                key={half}
                className={`direction-orbit direction-orbit-${half} ${game.direction === -1 ? "direction-reversed" : ""}`}
                aria-hidden="true"
              >
                <span className="direction-orbit-track" />
                <span className="direction-orbit-ring">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            ))}
            <div className="pile-zone">
              <button
                data-draw-pile
                data-must-draw={mustDraw || undefined}
                className={`draw-pile ${game.pendingDraw ? "penalty-deck" : ""} ${!drawDisabled ? "turn-hint" : ""} ${mustDraw ? "must-draw" : ""}`}
                disabled={drawDisabled}
                aria-label={
                  game.pendingDraw
                    ? `Draw ${game.pendingDraw} penalty cards`
                    : "Draw a card"
                }
                aria-keyshortcuts="D"
                onClick={() => act(api.drawCard)}
              >
                <UnoCard
                  card={{ id: "deck", color: "wild", value: "wild" }}
                  faceDown
                  sizeMultiplier={1.25}
                />
                {game.pendingDraw > 0 && (
                  <span className="draw-penalty" aria-hidden="true">
                    +{game.pendingDraw}
                  </span>
                )}
              </button>
            </div>
            <div className="pile-zone">
              <div className="discard-stack">
                <div className="discard-history" aria-hidden="true">
                  {historyCards.map((card, index) => (
                    <span
                      key={card.id}
                      data-discard-card={card.id}
                      style={
                        {
                          "--stack-i": Math.max(
                            0,
                            index - historyCards.length + 2,
                          ),
                          visibility:
                            index < historyCards.length - 2
                              ? "hidden"
                              : undefined,
                        } as CSSProperties
                      }
                    >
                      <UnoCard card={card} sizeMultiplier={1.25} />
                    </span>
                  ))}
                </div>
                <div data-discard-pile className="discard-pile">
                  {top && (
                    <UnoCard key={top.id} card={top} sizeMultiplier={1.25} />
                  )}
                </div>
              </div>
              <span className="sr-only">Last played</span>
              {game.rules.gameMode !== "all_wild" &&
                !game.pendingRoulette &&
                top?.color === "wild" && (
                  <span
                    className="wild-color"
                    aria-label={`Chosen color: ${activeColor}`}
                  >
                    <i aria-hidden="true" />
                    {activeColor}
                  </span>
                )}
            </div>
          </div>
          <div className="sr-only" role="status">
            {describeGameAction(game)}
          </div>
          {"wildPickerPlayerName" in api &&
            api.wildPickerPlayerName &&
            !pendingWild && (
              <div className="table-waiting">
                {api.wildPickerPlayerName} is choosing a color…
              </div>
            )}
          <div className="sr-only">
            <h1 aria-live="polite">{turnTitle}</h1>
            <span>
              {game.rules.gameMode === "all_wild"
                ? "Every card is playable without matching a color"
                : `Active color: ${activeColor}`}
            </span>
          </div>
        </section>
        <section
          className={`hand-section ${isLocalTurn ? "your-turn" : ""} ${canPass || canPlaySelected ? "has-hand-actions" : ""}`}
          aria-label={`Your hand, ${cards.length} ${cards.length === 1 ? "card" : "cards"}`}
          data-seat={localPlayer.id}
          style={{ "--hand-crop-margin": `${handFit.crop}px` } as CSSProperties}
        >
          {canSayUno && <span className="sr-only">You can call UNO.</span>}
          <div className="hand-toolbar">
            {!targetCard &&
              (isLocalTurn ||
                canPlaySelected ||
                canSayUno ||
                localPlayer.saidUno) &&
              !pendingWild &&
              !winner && (
                <div
                  className="move-buttons"
                  role="group"
                  aria-label="Your turn actions"
                >
                  {canSayUno && (
                    <button
                      className="button uno-button uno-ready"
                      aria-keyshortcuts="U"
                      onClick={() => {
                        primeTableAudioFromUserGesture();
                        act(() => api.sayUno(localPlayerIndex));
                      }}
                    >
                      UNO!
                    </button>
                  )}
                  {localPlayer.saidUno && (
                    <span className="uno-called" role="status">
                      <Check size={13} /> UNO called
                    </span>
                  )}
                  {isLocalTurn &&
                    (canPass ? (
                      <button
                        className={`button pass-button ${canPlaySelected ? "secondary" : "primary"}`}
                        disabled={
                          pendingAction || !!(online && !online.connected)
                        }
                        aria-keyshortcuts="P"
                        onClick={() => act(api.pass)}
                      >
                        Pass <ArrowRight size={18} />
                      </button>
                    ) : null)}
                  {canPlaySelected && (
                    <button
                      className="button primary play-selected"
                      onClick={() => {
                        const element =
                          hand.current?.querySelector<HTMLElement>(
                            `[data-hand-card="${selectedCard.id}"] .uno-card`,
                          );
                        if (element) select(selectedCard, element);
                      }}
                    >
                      <span className="play-card-label">
                        Play {selectedLabel}
                      </span>
                      <ArrowRight size={18} />
                    </button>
                  )}
                </div>
              )}
            {targetCard && (
              <div
                className="move-buttons"
                role="group"
                aria-label="Choose a player"
              >
                <button
                  className="button secondary target-cancel"
                  onClick={() => setTargetChoice(null)}
                >
                  <X size={16} /> Cancel
                </button>
              </div>
            )}
            <TurnCue
              targetAction={
                targetCard
                  ? targetCard.value === "wildTargetDraw2"
                    ? "Who draws two?"
                    : "Swap hands with…"
                  : undefined
              }
              game={game}
              local={isLocalTurn}
              choosing={!!pendingWild}
              playableCount={playable.length}
              connected={!online || online.connected}
            />
            <div className="move-dock">
              <div
                className={`move-hint ${selectedCard || (online && !online.connected) ? "" : "sr-only"}`}
                role="status"
              >
                {selectedCard && !previewHint && (
                  <strong className="inspected-label">{selectedLabel}</strong>
                )}
                <span>{previewHint?.description ?? moveHint}</span>
                {selectedCard && (
                  <button
                    className="inspection-dismiss"
                    aria-label="Clear card inspection"
                    onClick={() => setInspectedId(null)}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div
            id={handNavigation.id}
            className="hand-scroll"
            ref={hand}
            role="region"
            aria-label="Cards. Use the left and right arrow keys to browse."
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              const buttons = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  "button.uno-card",
                ),
              );
              const index = buttons.indexOf(event.target as HTMLButtonElement);
              if (index < 0) return;
              event.preventDefault();
              setInspectedId(null);
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? buttons.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        buttons.length) %
                      buttons.length;
              const target = buttons[next];
              if (target) {
                // Keyboard intent reveals the final slot, even during hand reflow.
                target
                  .closest("[data-hand-card]")
                  ?.getAnimations()
                  .forEach((animation) => animation.cancel());
                target.focus({ preventScroll: true });
                revealHandCard(event.currentTarget, target);
              }
            }}
          >
            <div
              className={`hand-cards ${cards.length > 10 ? "large-hand" : ""}`}
              style={
                { "--hand-overlap": `${handFit.overlap}px` } as CSSProperties
              }
            >
              {localPlayer.eliminated && (
                <div className="mercy-knockout-card" role="status">
                  <NoMercyIcon size={32} />
                  <div>
                    <strong>Knocked out by the Mercy Rule</strong>
                    <small>
                      Reached {game.rules.eliminationHandLimit || 25} cards.
                    </small>
                  </div>
                </div>
              )}
              {cards.map((card, i) => {
                // Request locks block interaction without making the whole hand
                // briefly lose/reacquire its legal-card lift and color.
                const legal =
                  (cardChoices.get(card.id)?.length ?? 0) > 0 && !winner;
                const disabled =
                  !!pendingWild ||
                  !!winner ||
                  pendingAction ||
                  !!targetCard ||
                  !!(online && !online.connected);
                return (
                  <HandCard
                    key={card.id}
                    card={card}
                    index={i}
                    count={cards.length}
                    playable={legal}
                    disabled={disabled}
                    selected={inspectedId === card.id}
                    tabIndex={handNavigation.tabStop === card.id ? 0 : -1}
                    onFocus={() => {
                      handNavigation.setFocusedId(card.id);
                      setPreviewedId(card.id);
                      const element = hand.current?.querySelector<HTMLElement>(
                        `[data-hand-card="${card.id}"] .uno-card`,
                      );
                      if (hand.current && element?.matches(":focus-visible"))
                        revealHandCard(hand.current, element);
                    }}
                    onInspect={() =>
                      setInspectedId((id) => (id === card.id ? null : card.id))
                    }
                    onPlay={(element) => select(card, element)}
                    onLift={takeCard}
                    onDragChange={onDragChange}
                    playHint={getCardPlayHint(game, localPlayerIndex, card)}
                    onPreview={setPreviewedId}
                  />
                );
              })}
            </div>
          </div>
          {(handNavigation.edges.before || handNavigation.edges.after) && (
            <div
              className="hand-navigation"
              aria-label="Browse your hand"
              role="group"
            >
              <button
                className="hand-page hand-page-previous"
                aria-label="Show earlier cards"
                aria-controls={handNavigation.id}
                disabled={!handNavigation.edges.before}
                onClick={() => handNavigation.scroll(-1)}
              >
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
              <button
                className="hand-page hand-page-next"
                aria-label="Show more cards"
                aria-controls={handNavigation.id}
                disabled={!handNavigation.edges.after}
                onClick={() => handNavigation.scroll(1)}
              >
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      </main>
      {pendingWild && !phonePortrait && (
        <ColorPicker
          playerName={localPlayer.name}
          hand={cards.filter((card) => card.id !== pendingWild.id)}
          onSelect={(color) => act(() => api.confirmWildColor(color))}
          roulette={!!game.pendingRoulette}
          onCancel={
            game.pendingRoulette
              ? undefined
              : () => {
                  pendingRef.current = false;
                  setPendingAction(false);
                  api.cancelWild();
                }
          }
        />
      )}
      {exit && (
        <ChoiceDialog
          title="Leave the table?"
          description={
            online
              ? "You’ll leave this room. The other players can keep their round going."
              : "This round will end. You can start a fresh one whenever you like."
          }
          actions={[
            {
              label: "Stay and play",
              variant: "secondary",
              onClick: () => setExit(false),
            },
            { label: "Leave table", variant: "primary", onClick: onReset },
          ]}
        />
      )}
      {menu && (
        <Modal
          title="Your table."
          onClose={() => setMenu(false)}
          className="game-menu-modal"
        >
          <div className="game-menu-context">
            <p className="game-turn-order">
              Turn order:{" "}
              {game.direction === 1 ? "clockwise" : "counterclockwise"}. Next:{" "}
              {game.players[getNextPlayerIndex(game)].name}.
              {game.players.some((player) => player.isBot) &&
                ` ${getBotDifficultyLabel(game.rules.botDifficulty)} bots.`}
            </p>
            {online?.room && (
              <div className="menu-room-code-group">
                <button
                  className="text-button room-code-control"
                  onClick={async () => {
                    const roomCode = online.room?.roomId;
                    if (!roomCode) return;
                    try {
                      await navigator.clipboard.writeText(roomCode);
                      toast.success("Room code copied.");
                      setCopiedRoomCode(true);
                      setManualRoomCode(false);
                      setTimeout(() => setCopiedRoomCode(false), 2000);
                    } catch {
                      toast.error("Couldn’t copy room code automatically.");
                      setManualRoomCode(true);
                    }
                  }}
                >
                  {copiedRoomCode
                    ? `Copied: ${online.room.roomId}`
                    : `Copy room code: ${online.room.roomId}`}
                </button>
                {manualRoomCode && (
                  <div
                    className="manual-copy-box"
                    role="region"
                    aria-label="Manual copy room code"
                  >
                    <span className="manual-copy-hint">
                      Select and copy room code:
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={online.room.roomId}
                      aria-label="Room code"
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      className="manual-copy-input"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="game-menu">
            <button
              className="game-sound-control"
              aria-label={
                soundOn && audioStatus === "ready"
                  ? "Turn sound off"
                  : "Enable sound"
              }
              aria-pressed={soundOn && audioStatus === "ready"}
              onPointerDown={() => {
                soundIntent.current =
                  soundOn && audioStatus === "ready" ? "mute" : "enable";
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ")
                  soundIntent.current =
                    soundOn && audioStatus === "ready" ? "mute" : "enable";
              }}
              onClick={() => {
                const intent =
                  soundIntent.current ??
                  (soundOn && audioStatus === "ready" ? "mute" : "enable");
                soundIntent.current = null;
                if (intent === "mute") setAudioSettings({ muted: true });
                else {
                  const settings = getAudioSettings();
                  setAudioSettings({
                    muted: false,
                    chimesEnabled: true,
                    sfxVolume: settings.sfxVolume || 0.65,
                  });
                  primeTableAudioFromUserGesture();
                  playTableChime("cardPlay");
                }
              }}
            >
              {soundOn && audioStatus === "ready" ? (
                <Volume2 size={19} />
              ) : (
                <VolumeX size={19} />
              )}
              <span>Sound</span>
              <b aria-hidden="true">
                {soundOn && audioStatus === "ready" ? "On" : "Off"}
              </b>
            </button>

            <label className="game-sort-control">
              <Layers aria-hidden="true" />
              <span>Sort hand</span>
              <select
                aria-label="Sort your hand"
                value={sort}
                onChange={(event) => {
                  const order = event.target.value;
                  if (
                    order === "color" ||
                    order === "number" ||
                    order === "original"
                  ) {
                    setSort(order);
                    saveHandSort(order);
                  }
                }}
              >
                <option value="color">By color</option>
                <option value="number">By number</option>
                <option value="original">Original order</option>
              </select>
            </label>
            <button
              onClick={() => {
                setMenu(false);
                setHelp(true);
              }}
            >
              <HelpCircle />
              <span>How to play</span>
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => {
                setMenu(false);
                setHistory(true);
              }}
            >
              <Trophy />
              <span>Table activity</span>
              <ArrowRight size={17} />
            </button>
            <button
              className="game-leave-control"
              onClick={() => {
                setMenu(false);
                setExit(true);
              }}
            >
              <ArrowLeft />
              <span>Leave table</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </Modal>
      )}
      {choiceCard && playChoices.length > 0 && playChoice && (
        <CardPlayDialog
          card={choiceCard}
          choices={playChoices}
          mustDeclareUno={game.rules.mustDeclareUno}
          saidUno={localPlayer.saidUno}
          onClose={() => setPlayChoice(null)}
          onPlay={(lead, options) => commitCard(lead, options)}
        />
      )}
      {help && (
        <HowToPlayModal
          open={help}
          rules={game.rules}
          onClose={() => setHelp(false)}
          inGame={true}
        />
      )}
      {history && (
        <Modal title="Table activity" onClose={() => setHistory(false)}>
          <TableScoreCard
            score={game.tableScore}
            players={game.players}
            localPlayerId={localPlayer.id}
          />
          <ol className="activity-list">
            {api.log.map((entry, i) => (
              <li key={`${i}:${entry}`}>{entry}</li>
            ))}
          </ol>
        </Modal>
      )}
      {winner && !exit && (
        <Modal
          title={
            winner.id === localPlayer.id ? "You win." : `${winner.name} wins.`
          }
          className={
            game.tableScore?.completedRounds
              ? "winner-modal has-table-score"
              : "winner-modal"
          }
        >
          {winner.id === localPlayer.id && <VictoryBurst />}
          <div
            className="round-details"
            role="region"
            aria-label="Round results"
            tabIndex={0}
          >
            <RoundSummary game={game} localPlayerId={localPlayer.id} />
            {online?.room && (
              <RematchStatus
                room={online.room}
                playerId={online.playerId}
                starting={startingRematch}
                connected={online.connected}
              />
            )}
          </div>
          <div className="dialog-actions round-actions">
            {!online || online.room?.hostPlayerId === online.playerId ? (
              <button
                className="button primary"
                onClick={async () => {
                  setStartingRematch(true);
                  try {
                    if (!(await onDealAgain())) {
                      toast.error("Couldn’t start the next round. Try again.");
                    }
                  } catch {
                    toast.error("Couldn’t start the next round. Try again.");
                  } finally {
                    setStartingRematch(false);
                  }
                }}
                disabled={
                  startingRematch ||
                  returningToLobby ||
                  (!!online &&
                    (!online.connected ||
                      (online.room?.players.length ?? 0) < 2))
                }
              >
                {startingRematch
                  ? "Dealing cards…"
                  : online && (online.room?.players.length ?? 0) < 2
                    ? "Waiting for a player"
                    : "One more round"}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className={`button ${online.room?.players.find((p) => p.playerId === online.playerId)?.ready ? "secondary ready-active" : "primary"}`}
                aria-pressed={
                  !!online.room?.players.find(
                    (p) => p.playerId === online.playerId,
                  )?.ready
                }
                aria-label="Ready for the next round"
                onClick={() => act(() => void online.toggleReady())}
                disabled={startingRematch || pendingAction || !online.connected}
              >
                {startingRematch ? "Dealing…" : "Ready"}
                <Check size={17} />
              </button>
            )}
            {online && online.room?.hostPlayerId === online.playerId && (
              <button
                className="button secondary"
                disabled={
                  startingRematch || returningToLobby || !online.connected
                }
                onClick={async () => {
                  setReturningToLobby(true);
                  try {
                    if (!(await online.returnToLobby())) {
                      toast.error("Couldn’t return to the room. Try again.");
                    }
                  } catch {
                    toast.error("Couldn’t return to the room. Try again.");
                  } finally {
                    setReturningToLobby(false);
                  }
                }}
              >
                {returningToLobby ? "Returning to room…" : "Edit table"}
              </button>
            )}
            <button
              className="button secondary"
              disabled={startingRematch || returningToLobby}
              onClick={onReset}
            >
              Back to home
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
