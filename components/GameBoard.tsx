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
  Settings,
  Trophy,
  Volume2,
  VolumeX,
  X,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { useUnoGame } from "../hooks/useUnoGame";
import type { useUnoOnlineGame } from "../hooks/useUnoOnlineGame";
import type { Card } from "../types/card";
import { isActionCard } from "../types/card";
import type { GameState } from "../types/game";
import { canJumpInPlay, canPlayCard } from "../lib/gameRules";
import { getTableMood } from "../lib/rulePresets";
import TurnCue from "./TurnCue";
import { getPlayerExpression } from "../lib/playerExpression";
import { getAudioSettings, setAudioSettings } from "../lib/audioSettings";
import { usePhonePortrait } from "../hooks/usePhonePortrait";
import { useGamePresentation } from "../hooks/useGamePresentation";
import { useHandNavigation } from "../hooks/useHandNavigation";
import PlayerProgress from "./PlayerProgress";
import RoundSummary from "./RoundSummary";
import OpponentSeat from "./OpponentSeat";
import PlayerAvatar from "./PlayerAvatar";
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
import { UnoWordmark } from "./ui/PageChrome";
export type GameApi =
  ReturnType<typeof useUnoGame> | ReturnType<typeof useUnoOnlineGame>;
interface Props {
  gameApi: GameApi;
  onReset: () => void;
  onDealAgain: () => boolean | Promise<boolean>;
  onOpenSettings: (tab?: "profile" | "controls" | "audio") => void;
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

const COLORS: Record<string, number> = {
  red: 0,
  yellow: 1,
  green: 2,
  blue: 3,
  wild: 4,
};
const VALUES: Record<string, string> = {
  skip: "Skip",
  reverse: "Reverse",
  draw2: "+2",
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
function describeAction(game: GameState) {
  const a = game.lastAction;
  if (a.type === "init") return "Cards dealt. Let’s play.";
  const name = (id: string) =>
    game.players.find((p) => p.id === id)?.name ?? "A player";
  if (a.type === "play")
    return `${name(a.playerId)} played ${a.card.color === "wild" ? "" : `${a.card.color} `}${VALUES[a.card.value] ?? a.card.value}${a.chosenColor ? ` · ${a.chosenColor} is up` : ""}`;
  if (a.type === "draw")
    return `${name(a.playerId)} drew ${a.count} ${a.count === 1 ? "card" : "cards"}`;
  if (a.type === "pass") return `${name(a.playerId)} passed`;
  if (a.type === "declareUno") return `${name(a.playerId)} called UNO!`;
  return `${name(a.callerId)} called out ${name(a.targetId)} · +${a.penalty} cards`;
}
export default function GameBoard({
  gameApi: api,
  onReset,
  onDealAgain,
  onOpenSettings,
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
  const [exit, setExit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [history, setHistory] = useState(false);
  const [sort, setSort] = useState(true);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [manualRoomCode, setManualRoomCode] = useState(false);
  const [startingRematch, setStartingRematch] = useState(false);
  const [dismissedTips, setDismissedTips] = useState<Record<string, boolean>>(
    () => {
      try {
        return {
          jumpIn: localStorage.getItem("uno.dismissed_tip.jumpIn") === "true",
          stacking:
            localStorage.getItem("uno.dismissed_tip.stacking") === "true",
          catchUno:
            localStorage.getItem("uno.dismissed_tip.catchUno") === "true",
        };
      } catch {
        return { jumpIn: false, stacking: false, catchUno: false };
      }
    },
  );
  const dismissTip = useCallback(
    (tipKey: "jumpIn" | "stacking" | "catchUno") => {
      setDismissedTips((prev) => ({ ...prev, [tipKey]: true }));
      try {
        localStorage.setItem(`uno.dismissed_tip.${tipKey}`, "true");
      } catch {}
    },
    [],
  );
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
  const [pendingAction, setPendingAction] = useState(false);
  const pendingRef = useRef(false);
  const actionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { rememberOrigin, takeCard } = useGamePresentation(
    game,
    localPlayer?.id,
    root,
  );
  const online = "room" in api ? api : null;
  const cards = useMemo(() => {
    const cards = localPlayer?.hand ?? [];
    return sort
      ? [...cards].sort(
          (a, b) =>
            COLORS[a.color] - COLORS[b.color] ||
            a.value.localeCompare(b.value, undefined, { numeric: true }),
        )
      : cards;
  }, [localPlayer?.hand, sort]);
  const handNavigation = useHandNavigation(cards);
  const { hand } = handNavigation;
  // The hand compacts to its scrollport: deeper overlap first, then a bounded
  // scale step-down, so a normal hand never needs the paging arrows. Scale 0
  // means "no override" and lets the CSS media queries own the size.
  const [handFit, setHandFit] = useState({ scale: 0, overlap: -44 });
  const handFitRef = useRef(handFit);
  useLayoutEffect(() => {
    const scroller = hand.current;
    const count = cards.length;
    const reset = () => {
      if (handFitRef.current.scale !== 0) {
        handFitRef.current = { scale: 0, overlap: -44 };
        setHandFit({ scale: 0, overlap: -44 });
      }
    };
    if (!scroller || !scroller.clientWidth || count < 2) {
      reset();
      return;
    }
    const measure = () => {
      const scrollerStyle = getComputedStyle(scroller);
      const base =
        parseFloat(scrollerStyle.getPropertyValue("--hand-scale")) || 1.65;
      const inner = scroller.firstElementChild;
      const innerStyle = inner ? getComputedStyle(inner) : null;
      const available =
        scroller.clientWidth -
        parseFloat(scrollerStyle.paddingLeft) -
        parseFloat(scrollerStyle.paddingRight) -
        (innerStyle
          ? parseFloat(innerStyle.paddingLeft) +
            parseFloat(innerStyle.paddingRight)
          : 0);
      let fit = { scale: base, overlap: -44 };
      for (let step = 1; step >= 0.61; step -= 0.065) {
        const cardWidth = 82 * base * step;
        const needed = (available - cardWidth) / (count - 1) - cardWidth;
        // Show at least 30% of each face; a short hand keeps a light overlap.
        const overlap = Math.max(-0.7 * cardWidth, Math.min(-40, needed));
        const advance = cardWidth + overlap;
        fit = { scale: base * step, overlap };
        // A 1px tolerance absorbs float drift; the side padding hides it.
        if (cardWidth + (count - 1) * advance <= available + 1) break;
      }
      const prior = handFitRef.current;
      if (
        Math.abs(prior.scale - fit.scale) > 0.005 ||
        Math.abs(prior.overlap - fit.overlap) > 0.5
      ) {
        handFitRef.current = fit;
        setHandFit(fit);
      }
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
    game.rules.mustDeclareUno &&
    localPlayer.hand.length >= 1 &&
    localPlayer.hand.length <= 2 &&
    !localPlayer.saidUno
  );
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (phonePortrait) return;
      if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
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
  const playable = cards.filter((c) => canPlayCard(c, game, localPlayerIndex));
  const top = game.discardPile.at(-1);
  const drawDisabled =
    !isLocalTurn ||
    drawnThisTurn ||
    !!pendingWild ||
    !!winner ||
    pendingAction ||
    !!(online && !online.connected);
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
  const select = (card: Card, element: HTMLElement) => {
    setInspectedId(null);
    primeTableAudioFromUserGesture();
    rememberOrigin(card.id, element);
    if (!isLocalTurn && canJumpInPlay(card, game)) {
      dismissTip("jumpIn");
    }
    if (isLocalTurn && game.pendingDraw > 0) {
      dismissTip("stacking");
    }
    act(() => api.selectCard(card));
  };
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

  const canJumpInNow =
    !isLocalTurn &&
    !winner &&
    !pendingWild &&
    game.rules.allowJumpIn &&
    cards.some((c) => canJumpInPlay(c, game));
  const canStackNow =
    isLocalTurn &&
    !winner &&
    !pendingWild &&
    game.pendingDraw > 0 &&
    cards.some((c) => canPlayCard(c, game, localPlayerIndex));
  const catchableOpponent = opponents.find(
    ({ player }) =>
      (!online || isLocalTurn) &&
      !winner &&
      !pendingWild &&
      !pendingAction &&
      (!online || online.connected) &&
      !player.saidUno &&
      player.hand.length === 1 &&
      game.rules.mustDeclareUno,
  );

  const activeTip = (() => {
    if (canJumpInNow && !dismissedTips.jumpIn) {
      return {
        key: "jumpIn" as const,
        icon: Zap,
        title: "Jump-in",
        message: "Exact color and value? Tap the match to play out of turn.",
      };
    }
    if (canStackNow && !dismissedTips.stacking) {
      return {
        key: "stacking" as const,
        icon: Layers,
        title: "Stacking",
        message: "Play a matching draw card to pass the penalty along.",
      };
    }
    if (catchableOpponent && !dismissedTips.catchUno) {
      return {
        key: "catchUno" as const,
        icon: AlertCircle,
        title: "Missed UNO",
        message: `Tap ${catchableOpponent.player.name}’s “Catch!” badge to give them +2 cards.`,
      };
    }
    return null;
  })();
  const moveHint =
    online && !online.connected
      ? "Reconnecting. Your hand is safe."
      : pendingWild
        ? "Choose a color to finish your move."
        : pendingAction
          ? "Making your move…"
          : canPlaySelected
            ? isLocalTurn
              ? "Ready to play. You can also drag it onto the table."
              : "Exact match. Play now to jump in."
            : !isLocalTurn
              ? "Browse your hand while they play."
              : drawnThisTurn
                ? playable.length
                  ? drawnCard
                    ? `Drew ${cardLabel(drawnCard)}. Play a match or pass.`
                    : "Play a matching card, or pass to end your turn."
                  : "No match. Passing…"
                : selectedCard
                  ? game.pendingDraw
                    ? playable.length
                      ? `That card can’t stack. Choose a highlighted draw card or draw ${game.pendingDraw}.`
                      : `Draw ${game.pendingDraw} to take the penalty. No cards in your hand can stack.`
                    : !game.rules.canFinishWithActionCard &&
                        isActionCard(selectedCard) &&
                        (cards.length === 1 ||
                          (selectedCard.value === "discardAll" &&
                            cards.every(
                              (card) => card.color === selectedCard.color,
                            )))
                      ? "This table needs a number card to finish. Draw to keep playing."
                      : `Match ${activeColor}${top?.color !== "wild" && top ? ` or ${VALUES[top.value] ?? top.value}` : ""}, or play a wild.`
                  : game.pendingDraw
                    ? playable.length
                      ? "Stack a matching draw card, or take the penalty."
                      : `Draw ${game.pendingDraw} to take the penalty.`
                    : playable.length
                      ? "Tap a match, or flick it onto the table."
                      : "No matching card. Draw to keep the round moving.";
  return (
    <div
      className={`game-page mood-${getTableMood(game.rules)} seats-${game.players.length} ${phonePortrait ? "needs-landscape" : ""} ${isLocalTurn ? "local-turn" : ""}`}
      ref={root}
      onPointerDownCapture={(event) => {
        if (
          inspectedId &&
          !(event.target as HTMLElement).closest(".hand-card, .move-dock")
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
          <h1>
            Turn your phone.
            <br />
            Take your seat.
          </h1>
          <p>We play sideways. More room for your cards.</p>
          <small>
            {online
              ? "Your online round continues while you rotate."
              : "Your round is paused until you’re ready."}
          </small>
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
      <main className="game-main" data-design-contract="uno-play-field">
        <section
          className={`playing-table color-${activeColor} seats-${game.players.length} ${draggingCard ? "receiving-card" : ""}`}
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
              active={game.currentPlayerIndex === index}
              expression={getPlayerExpression(game, player.id)}
              position={positions[i]}
              offline={
                !player.isBot &&
                online?.room?.players.find((p) => p.playerId === player.id)
                  ?.connected === false
              }
              canCatch={
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
                dismissTip("catchUno");
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
                className={`draw-pile ${game.pendingDraw ? "penalty-deck" : ""}`}
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
              <span
                className={`pile-label ${!drawDisabled ? "draw-available" : "sr-only"}`}
              >
                {!drawDisabled
                  ? game.pendingDraw
                    ? `Draw ${game.pendingDraw}`
                    : "Draw"
                  : "Draw pile"}
              </span>
            </div>
            <div className="pile-zone">
              <div className="discard-stack">
                <div className="discard-history" aria-hidden="true">
                  {game.discardPile.slice(-3, -1).map((card, index) => (
                    <span
                      key={card.id}
                      style={{ "--stack-i": index } as CSSProperties}
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
              {top?.color === "wild" && (
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
            {describeAction(game)}
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
            <span>Active color: {activeColor}</span>
          </div>
        </section>
        <section
          className={`hand-section ${isLocalTurn ? "your-turn" : ""} ${canPass || canPlaySelected ? "has-hand-actions" : ""}`}
          aria-label={`Your hand, ${cards.length} ${cards.length === 1 ? "card" : "cards"}`}
          data-seat={localPlayer.id}
        >
          {canSayUno && <span className="sr-only">You can call UNO.</span>}
          {activeTip && (
            <div
              className="action-hint-banner"
              role="status"
              aria-live="polite"
            >
              <activeTip.icon
                size={15}
                className="action-hint-icon"
                aria-hidden="true"
              />
              <span className="action-hint-text">
                <strong>{activeTip.title}:</strong> {activeTip.message}
              </span>
              <button
                type="button"
                className="action-hint-dismiss"
                aria-label={`Dismiss ${activeTip.title} hint`}
                onClick={() => dismissTip(activeTip.key)}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>
          )}
          {(isLocalTurn || canPlaySelected) && !pendingWild && !winner && (
            <div className="move-buttons">
              {canPlaySelected && (
                <button
                  className="button primary play-selected"
                  onClick={() => {
                    const element = hand.current?.querySelector<HTMLElement>(
                      `[data-hand-card="${selectedCard.id}"] .uno-card`,
                    );
                    if (element) select(selectedCard, element);
                  }}
                >
                  <span className="play-card-label">Play {selectedLabel}</span>
                  <ArrowRight size={18} />
                </button>
              )}
              {isLocalTurn &&
                (canPass ? (
                  <button
                    className={`button ${canPlaySelected ? "secondary" : "primary"}`}
                    disabled={pendingAction || !!(online && !online.connected)}
                    aria-keyshortcuts="P"
                    onClick={() => act(api.pass)}
                  >
                    Pass <ArrowRight size={18} />
                  </button>
                ) : null)}
            </div>
          )}
          <TurnCue
            game={game}
            local={isLocalTurn}
            choosing={!!pendingWild}
            playableCount={playable.length}
            connected={!online || online.connected}
          />
          {canSayUno && (
            <button
              className="button uno-button uno-ready hand-uno"
              aria-keyshortcuts="U"
              onClick={() => {
                primeTableAudioFromUserGesture();
                api.sayUno(localPlayerIndex);
              }}
            >
              UNO!
            </button>
          )}
          {localPlayer.saidUno && cards.length === 1 && (
            <span className="uno-called hand-uno" role="status">
              <Check size={13} /> UNO called
            </span>
          )}
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
                handFit.scale
                  ? ({
                      "--hand-scale": handFit.scale,
                      "--hand-overlap": `${handFit.overlap.toFixed(1)}px`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {cards.map((card, i) => {
                // Request locks block interaction without making the whole hand
                // briefly lose/reacquire its legal-card lift and color.
                const legal =
                  canPlayCard(card, game, localPlayerIndex) && !winner;
                const disabled =
                  !!pendingWild ||
                  !!winner ||
                  pendingAction ||
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
          <div className="move-dock">
            <div
              className={`move-hint ${selectedCard || drawnThisTurn || (online && !online.connected) ? "" : "sr-only"}`}
              role="status"
            >
              {selectedCard && (
                <strong className="inspected-label">{selectedLabel}</strong>
              )}
              <span>{moveHint}</span>
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
        </section>
      </main>
      {pendingWild && !phonePortrait && (
        <ColorPicker
          playerName={localPlayer.name}
          hand={cards.filter((card) => card.id !== pendingWild.id)}
          onSelect={(color) => act(() => api.confirmWildColor(color))}
          onCancel={() => {
            pendingRef.current = false;
            setPendingAction(false);
            api.cancelWild();
          }}
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
              {
                game.players[
                  (game.currentPlayerIndex +
                    game.direction +
                    game.players.length) %
                    game.players.length
                ].name
              }
              .
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

            <button aria-pressed={sort} onClick={() => setSort((s) => !s)}>
              <Layers />
              <span>Sort by color</span>
              <Check size={17} style={{ opacity: sort ? 1 : 0 }} />
            </button>
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
                onOpenSettings();
              }}
            >
              <Settings />
              <span>Settings & house rules</span>
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
      {help && (
        <Modal title="A good hand starts here." onClose={() => setHelp(false)}>
          <div className="help-rules">
            <p>
              <strong>Match it.</strong> Tap a card with the same color or value
              as the top card. Wild cards let you choose the next color.
            </p>
            <p>
              <strong>Draw it.</strong> If you can’t play, draw a card. Play a
              matching card or pass. Draw penalties follow your table’s house
              rules.
            </p>
            <p>
              <strong>Call it.</strong> One card left? Tap UNO. Catch another
              player’s missed call to give them a penalty.
            </p>
            <p>
              <strong>Win it.</strong> Get rid of every card in your hand.
            </p>
            <p>
              <strong>Make it move.</strong> Tap a lifted card to play, or drag
              it upward and release. Swipe sideways to browse a large hand.
            </p>
            <p>
              <strong>Use your keyboard.</strong> Arrow keys browse cards; Enter
              or Space plays. D draws, P passes, U calls UNO. Escape clears an
              inspection. R, Y, G or B chooses a wild color.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="button primary small"
              onClick={() => setHelp(false)}
            >
              Let’s play
            </button>
          </div>
        </Modal>
      )}
      {history && (
        <Modal title="Around the table." onClose={() => setHistory(false)}>
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
          className="winner-modal"
        >
          {winner.id === localPlayer.id && <VictoryBurst />}
          <div
            className="round-details"
            role="region"
            aria-label="Round results"
            tabIndex={0}
          >
            <RoundSummary game={game} localPlayerId={localPlayer.id} />
            <PlayerProgress />
            {online?.room &&
              (() => {
                const isHost = online.room.hostPlayerId === online.playerId;
                const players = online.room.players;
                const guests = players.filter(
                  (p) => p.playerId !== online.room?.hostPlayerId,
                );
                const readyGuests = guests.filter(
                  (p) => (p.ready || p.isBot) && p.connected,
                );
                const waitingGuests = guests.filter(
                  (p) => !p.ready && !p.isBot && p.connected,
                );
                const allGuestsReady =
                  guests.length > 0 && readyGuests.length === guests.length;
                const myPlayer = players.find(
                  (p) => p.playerId === online.playerId,
                );
                const isMyPlayerReady = !!myPlayer?.ready;

                let headline = "";
                let subtext = "";
                if (startingRematch) {
                  headline = "Dealing cards for the next round…";
                  subtext =
                    "Shuffling the deck and dealing cards to all players.";
                } else if (isHost) {
                  if (allGuestsReady) {
                    headline = "Everyone is ready for a rematch!";
                    subtext = "Deal whenever you’re ready to start.";
                  } else if (waitingGuests.length > 0) {
                    headline = `Waiting on players (${readyGuests.length} of ${guests.length} ready)`;
                    subtext = `Waiting for ${waitingGuests.map((g) => g.name).join(", ")} to ready up.`;
                  } else {
                    headline = "Ready for the next round?";
                    subtext = "Deal whenever you’re ready.";
                  }
                } else {
                  if (isMyPlayerReady) {
                    headline = "You’re marked ready!";
                    subtext = allGuestsReady
                      ? "All players ready. Waiting for the host to deal."
                      : "Waiting for other players and the host to deal.";
                  } else {
                    headline = "Ready for another round?";
                    subtext = "Tap Ready below to let the host know you’re in.";
                  }
                }

                return (
                  <div
                    className="rematch-readiness-card"
                    role="region"
                    aria-label="Rematch readiness"
                  >
                    <div className="rematch-card-header">
                      <strong>{headline}</strong>
                      <small>{subtext}</small>
                    </div>
                    <div className="rematch-seats-list">
                      {players.map((p) => {
                        const isPlayerHost =
                          p.playerId === online.room?.hostPlayerId;
                        const isMe = p.playerId === online.playerId;
                        let badgeState:
                          "waiting" | "ready" | "disconnected" | "starting" =
                          "waiting";
                        let stateLabel = "";

                        if (!p.connected && !p.isBot) {
                          badgeState = "disconnected";
                          stateLabel = "Disconnected";
                        } else if (startingRematch) {
                          badgeState = "starting";
                          stateLabel = "Dealing in…";
                        } else if (isPlayerHost) {
                          badgeState = "ready";
                          stateLabel = "Host";
                        } else if (p.ready || p.isBot) {
                          badgeState = "ready";
                          stateLabel = p.isBot ? "Bot · Ready" : "Ready";
                        } else {
                          badgeState = "waiting";
                          stateLabel = "Waiting…";
                        }

                        return (
                          <div
                            key={p.playerId}
                            className={`rematch-seat-item status-${badgeState}`}
                          >
                            <PlayerAvatar seed={p.playerId} />
                            <span className="rematch-seat-name">
                              <strong>{p.name}</strong>
                              <small>
                                {isMe
                                  ? "You"
                                  : isPlayerHost
                                    ? "Host"
                                    : p.isBot
                                      ? "Bot"
                                      : "Guest"}
                              </small>
                            </span>
                            <span
                              className={`rematch-status-badge status-${badgeState}`}
                            >
                              {badgeState === "starting" ? (
                                <RotateCw size={12} className="spin" />
                              ) : badgeState === "disconnected" ? (
                                <AlertCircle size={12} />
                              ) : badgeState === "ready" ? (
                                <Check size={12} />
                              ) : (
                                <Clock size={12} />
                              )}
                              {stateLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
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
                disabled={startingRematch || (!!online && !online.connected)}
              >
                {startingRematch ? "Dealing cards…" : "One more round"}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className={`button ${online.room?.players.find((p) => p.playerId === online.playerId)?.ready ? "secondary ready-active" : "primary"}`}
                onClick={() => void online.toggleReady()}
                disabled={startingRematch || pendingAction || !online.connected}
              >
                {startingRematch
                  ? "Host is dealing…"
                  : online.room?.players.find(
                        (p) => p.playerId === online.playerId,
                      )?.ready
                    ? "Ready · Tap to unready"
                    : "Ready for a rematch"}
                <Check size={17} />
              </button>
            )}
            <button className="button secondary" onClick={onReset}>
              Back to home
            </button>
          </div>
          {online &&
            online.room?.hostPlayerId !== online.playerId &&
            !startingRematch && (
              <p className="muted">The host will start the next round.</p>
            )}
        </Modal>
      )}
    </div>
  );
}
