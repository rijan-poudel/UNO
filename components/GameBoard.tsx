// Card-table layout. The engine owns turns; presentation never blocks an action.
"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
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
} from "lucide-react";
import { toast } from "sonner";
import type { useUnoGame } from "../hooks/useUnoGame";
import type { useUnoOnlineGame } from "../hooks/useUnoOnlineGame";
import type { Card } from "../types/card";
import type { GameState } from "../types/game";
import { canPlayCard } from "../lib/gameRules";
import { getPlayerExpression } from "../lib/playerExpression";
import { getAudioSettings, setAudioSettings } from "../lib/audioSettings";
import { usePhonePortrait } from "../hooks/usePhonePortrait";
import { useGamePresentation } from "../hooks/useGamePresentation";
import PlayerProgress from "./PlayerProgress";
import RoundSummary from "./RoundSummary";
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
import { UnoWordmark } from "./ui/PageChrome";
export type GameApi =
  ReturnType<typeof useUnoGame> | ReturnType<typeof useUnoOnlineGame>;
interface Props {
  gameApi: GameApi;
  onReset: () => void;
  onDealAgain: () => void;
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
  const hand = useRef<HTMLDivElement>(null);
  const [exit, setExit] = useState(false);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [history, setHistory] = useState(false);
  const [sort, setSort] = useState(true);
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
  const { rememberOrigin } = useGamePresentation(game, localPlayer?.id, root);
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
  }, [inspectedId, sort]);
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
                    : "That card doesn’t match. Choose another or draw."
                  : game.pendingDraw
                    ? playable.length
                      ? "Stack a matching draw card, or take the penalty."
                      : `Draw ${game.pendingDraw} to take the penalty.`
                    : playable.length
                      ? "Tap a match, or flick it onto the table."
                      : "No matching card. Draw to keep the round moving.";
  return (
    <div
      className={`game-page seats-${game.players.length} ${phonePortrait ? "needs-landscape" : ""} ${isLocalTurn ? "local-turn" : ""}`}
      ref={root}
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
              onCatch={() => act(() => api.callOut(localPlayerIndex, index))}
            />
          ))}
          <div className="table-center">
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
                  {top && <UnoCard card={top} sizeMultiplier={1.25} />}
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
          {canSayUno && (
            <button
              className="button uno-button uno-ready hand-uno"
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
            className="hand-scroll"
            ref={hand}
            role="region"
            aria-label="Cards. Scroll sideways, or use left and right arrow keys."
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
            >
              {cards.map((card, i) => {
                const legal =
                  canPlayCard(card, game, localPlayerIndex) &&
                  !pendingWild &&
                  !winner &&
                  !pendingAction &&
                  (!online || online.connected);
                return (
                  <HandCard
                    key={card.id}
                    card={card}
                    index={i}
                    count={cards.length}
                    playable={legal}
                    selected={inspectedId === card.id}
                    onInspect={() =>
                      setInspectedId((id) => (id === card.id ? null : card.id))
                    }
                    onPlay={(element) => select(card, element)}
                    onDragChange={onDragChange}
                  />
                );
              })}
            </div>
          </div>
          <div className="move-dock">
            <div
              className={`move-hint ${selectedCard || drawnThisTurn || (online && !online.connected) ? "" : "sr-only"}`}
              role="status"
            >
              {moveHint}
            </div>
            <div className="move-buttons">
              {(isLocalTurn || canPlaySelected) && !pendingWild && !winner && (
                <>
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
                  {isLocalTurn &&
                    (canPass ? (
                      <button
                        className={`button ${canPlaySelected ? "secondary" : "primary"}`}
                        disabled={
                          pendingAction || !!(online && !online.connected)
                        }
                        onClick={() => act(api.pass)}
                      >
                        Pass <ArrowRight size={18} />
                      </button>
                    ) : null)}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
      {pendingWild && !phonePortrait && (
        <ColorPicker
          playerName={localPlayer.name}
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
              <button
                className="text-button room-code-control"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(online.room?.roomId ?? "")
                    .then(() => toast.success("Room code copied."))
                    .catch(() => toast.error("Couldn’t copy room code."));
                }}
              >
                Copy room code: {online.room.roomId}
              </button>
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
          <RoundSummary game={game} localPlayerId={localPlayer.id} />
          <PlayerProgress />
          <div className="dialog-actions round-actions">
            {!online || online.room?.hostPlayerId === online.playerId ? (
              <button
                className="button primary"
                onClick={onDealAgain}
                disabled={!!online && !online.connected}
              >
                One more round
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                className="button primary"
                onClick={() => void online.toggleReady()}
                disabled={pendingAction || !online.connected}
              >
                {online.room?.players.find(
                  (p) => p.playerId === online.playerId,
                )?.ready
                  ? "Ready for a rematch"
                  : "Ready for another"}
                <Check size={17} />
              </button>
            )}
            <button className="button secondary" onClick={onReset}>
              Back to home
            </button>
          </div>
          {online && online.room?.hostPlayerId !== online.playerId && (
            <p className="muted">The host will start the next round.</p>
          )}
        </Modal>
      )}
    </div>
  );
}
