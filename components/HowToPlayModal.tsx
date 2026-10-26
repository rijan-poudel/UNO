// components/HowToPlayModal.tsx
// Ground-zero tactile, animated UNO table demonstration for new players.
"use client";

import { useState, useEffect, useCallback, type CSSProperties } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  Users,
  CheckCircle2,
  RotateCw,
  RotateCcw,
  Sparkles,
  Trophy,
  RotateCcw as ResetIcon,
} from "lucide-react";
import Modal from "./Modal";
import UnoCard from "./UnoCard";
import PlayerAvatar from "./PlayerAvatar";
import RulesSummary from "./RulesSummary";
import { defaultRules, type GameRules } from "../types/rules";
import type { Card, CardColor, CardValue } from "../types/card";
import type { PlayerExpression } from "../lib/playerExpression";
import { playTableChime } from "../lib/tableChimes";
import styles from "./HowToPlayModal.module.css";

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  onPracticeWithBots?: () => void;
  onPlayWithFriends?: () => void;
  inGame?: boolean;
  rules?: Partial<GameRules>;
}

const TOTAL_STEPS = 5;

// Sample cards for interactive demonstrations
const CARD_MID_RED7: Card = { id: "demo-red-7", color: "red", value: "7" };
const CARD_HAND_RED3: Card = { id: "demo-red-3", color: "red", value: "3" };
const CARD_HAND_BLUE7: Card = { id: "demo-blue-7", color: "blue", value: "7" };
const CARD_HAND_GREEN2: Card = {
  id: "demo-green-2",
  color: "green",
  value: "2",
};

const CARD_MID_YELLOW4: Card = {
  id: "demo-yellow-4",
  color: "yellow",
  value: "4",
};
const CARD_HAND_GREEN9: Card = {
  id: "demo-green-9",
  color: "green",
  value: "9",
};
const CARD_HAND_WILD: Card = {
  id: "demo-wild-card",
  color: "wild",
  value: "wild",
};
const CARD_DREW_YELLOW1: Card = {
  id: "demo-drew-yellow-1",
  color: "yellow",
  value: "1",
};
const CARD_FINAL_RED5: Card = {
  id: "demo-final-red-5",
  color: "red",
  value: "5",
};

type TrickId = "reverse" | "skip" | "draw2" | "wild4";

interface TrickItem {
  id: TrickId;
  card: Card;
  name: string;
  tagline: string;
  desc: string;
  sound: "reverse" | "skip" | "draw2" | "wild4";
}

const TRICK_ITEMS: TrickItem[] = [
  {
    id: "reverse",
    card: { id: "trick-rev", color: "green", value: "reverse" },
    name: "Reverse",
    tagline: "Flips circle backwards",
    desc: "Normally turns go to Cleo. Reverse spins the entire circle backwards, so Alex is forced to play next!",
    sound: "reverse",
  },
  {
    id: "skip",
    card: { id: "trick-skip", color: "blue", value: "skip" },
    name: "Skip",
    tagline: "Blocks the next player",
    desc: "Cleo loses their turn completely! Play jumps right over Cleo straight to Alex.",
    sound: "skip",
  },
  {
    id: "draw2",
    card: { id: "trick-draw2", color: "yellow", value: "draw2" },
    name: "Draw Two (+2)",
    tagline: "Forces 2 penalty cards",
    desc: "Without stacking, Cleo draws 2 cards and misses their turn. Check your table’s draw-stacking rule above.",
    sound: "draw2",
  },
  {
    id: "wild4",
    card: { id: "trick-wild4", color: "wild", value: "wild4" },
    name: "Wild Draw 4 (+4)",
    tagline: "Color choice + 4 cards",
    desc: "Choose the next color. Without stacking, Cleo draws 4 cards and misses their turn.",
    sound: "wild4",
  },
];

export default function HowToPlayModal({
  open,
  onClose,
  onPracticeWithBots,
  onPlayWithFriends,
  inGame = false,
  rules = defaultRules,
}: HowToPlayModalProps) {
  const [step, setStep] = useState(0);

  // Turn Direction & Active Seat
  const [direction, setDirection] = useState<"clockwise" | "counter-clockwise">(
    "clockwise",
  );
  const [activeSeat, setActiveSeat] = useState<"you" | "cleo" | "alex">("you");

  // Step 1: Matching
  const [pileCardStep1, setPileCardStep1] = useState<Card>(CARD_MID_RED7);
  const [playedCardStep1Id, setPlayedCardStep1Id] = useState<string | null>(
    null,
  );
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [wobbleId, setWobbleId] = useState<string | null>(null);

  // Step 2: Stuck / Drawing / Wild
  const [pileCardStep2, setPileCardStep2] = useState<Card>(CARD_MID_YELLOW4);
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [hasPlayedDrawnCard, setHasPlayedDrawnCard] = useState(false);
  const [wildPickedColor, setWildPickedColor] = useState<CardColor | null>(
    null,
  );
  const [drawStatus, setDrawStatus] = useState<string | null>(null);

  // Step 3: Trick Cards Tester
  const [activeTrick, setActiveTrick] = useState<TrickId>("reverse");
  const [trickPileCard, setTrickPileCard] = useState<Card>(TRICK_ITEMS[0].card);
  const [cleoStatus, setCleoStatus] = useState<string | null>(null);

  // Step 4: Calling UNO & Winning
  const [calledUno, setCalledUno] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Step change helper
  const changeStep = useCallback((targetStep: number) => {
    const next = Math.max(0, Math.min(targetStep, TOTAL_STEPS - 1));
    setStep(next);
    if (next === 0) {
      setDirection("clockwise");
      setActiveSeat("you");
    } else if (next === 1) {
      setPileCardStep1(CARD_MID_RED7);
      setPlayedCardStep1Id(null);
      setMatchStatus(null);
      setActiveSeat("you");
      setDirection("clockwise");
    } else if (next === 2) {
      setPileCardStep2(CARD_MID_YELLOW4);
      setHasDrawnCard(false);
      setHasPlayedDrawnCard(false);
      setWildPickedColor(null);
      setDrawStatus(null);
      setActiveSeat("you");
      setDirection("clockwise");
    } else if (next === 3) {
      setActiveTrick("reverse");
      setTrickPileCard(TRICK_ITEMS[0].card);
      setDirection("counter-clockwise");
      setActiveSeat("alex");
      setCleoStatus(null);
    } else if (next === 4) {
      setCalledUno(false);
      setHasWon(false);
      setActiveSeat("you");
      setDirection("clockwise");
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        changeStep(step + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        changeStep(step - 1);
      }
    },
    [open, step, changeStep],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Step 1: Matching Card Action
  const handlePlayMatchingCard = (card: Card) => {
    if (card.color === pileCardStep1.color) {
      playTableChime("cardPlay");
      setPileCardStep1(card);
      setPlayedCardStep1Id(card.id);
      setActiveSeat("cleo");
      setMatchStatus(
        "Nice! Played Red 3 (matched color Red). Your turn ends, play passes to Cleo.",
      );
    } else if (card.value === pileCardStep1.value) {
      playTableChime("cardPlay");
      setPileCardStep1(card);
      setPlayedCardStep1Id(card.id);
      setActiveSeat("cleo");
      setMatchStatus(
        "Great! Played Blue 7 (matched number 7). Your turn ends, play passes to Cleo.",
      );
    } else {
      setWobbleId(card.id);
      setTimeout(() => setWobbleId(null), 350);
      setMatchStatus(
        "Cannot play Green 2. It has neither color Red nor number 7.",
      );
    }
  };

  const handleResetStep1 = () => {
    setPileCardStep1(CARD_MID_RED7);
    setPlayedCardStep1Id(null);
    setMatchStatus(null);
    setActiveSeat("you");
  };

  // Step 2: Draw from deck
  const handleDrawCard = () => {
    playTableChime("draw");
    setHasDrawnCard(true);
    setDrawStatus(
      "You drew Yellow 1! Since it matches the Yellow 4, tap it to play it now.",
    );
  };

  // Step 2: Play drawn card
  const handlePlayDrawnCard = () => {
    playTableChime("cardPlay");
    setPileCardStep2(CARD_DREW_YELLOW1);
    setHasPlayedDrawnCard(true);
    setActiveSeat("cleo");
    setDrawStatus(
      "Played Yellow 1! Your turn is complete, and play passes to Cleo.",
    );
  };

  // Step 2: Pick wild color
  const handleChooseWildColor = (color: CardColor) => {
    playTableChime("wild");
    setWildPickedColor(color);
    setPileCardStep2({ id: "wild-played", color: "wild", value: "wild" });
    setActiveSeat("cleo");
    setDrawStatus(`${color.toUpperCase()} is now active. Cleo plays next.`);
  };

  // Step 3: Trigger Trick Card
  const handleSelectTrick = (trick: TrickItem) => {
    playTableChime(trick.sound);
    setActiveTrick(trick.id);
    setTrickPileCard(trick.card);

    if (trick.id === "reverse") {
      setDirection("counter-clockwise");
      setActiveSeat("alex");
      setCleoStatus(null);
    } else if (trick.id === "skip") {
      setDirection("clockwise");
      setActiveSeat("alex");
      setCleoStatus("SKIPPED!");
    } else if (trick.id === "draw2") {
      setDirection("clockwise");
      setActiveSeat("alex");
      setCleoStatus("+2 CARDS!");
    } else if (trick.id === "wild4") {
      setDirection("clockwise");
      setActiveSeat("alex");
      setCleoStatus("+4 CARDS!");
    }
  };

  // Step 4: Call UNO
  const handleDeclareUno = () => {
    playTableChime("uno");
    setCalledUno(true);
  };

  // Step 4: Play final card to win
  const handlePlayFinalWinningCard = () => {
    playTableChime("win");
    setHasWon(true);
  };

  // Dynamic Cleo card count in Step 3
  const cleoCount =
    step === 3
      ? activeTrick === "draw2"
        ? 6
        : activeTrick === "wild4"
          ? 8
          : 4
      : 4;

  // Derived player expressions
  const cleoExpression: PlayerExpression = cleoStatus
    ? "surprised"
    : activeSeat === "cleo"
      ? "happy"
      : "neutral";

  const alexExpression: PlayerExpression =
    activeSeat === "alex" ? "happy" : "neutral";

  const youExpression: PlayerExpression = hasWon
    ? "celebrate"
    : calledUno
      ? "happy"
      : "neutral";

  if (!open) return null;

  return (
    <Modal
      open={open}
      title="How to play"
      onClose={onClose}
      className={styles.modalBackdrop}
    >
      <div className={styles.modalContent}>
        {/* Stepper Dots */}
        <div className={styles.stepper}>
          <div
            className={styles.stepIndicators}
            role="navigation"
            aria-label="Steps"
          >
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Step ${i + 1}`}
                aria-current={i === step ? "step" : undefined}
                className={`${styles.stepDot} ${
                  i === step
                    ? styles.stepDotActive
                    : i < step
                      ? styles.stepDotCompleted
                      : ""
                }`}
                onClick={() => changeStep(i)}
              />
            ))}
          </div>
          <span className={styles.stepCounter}>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
        </div>

        <details className={styles.currentRules}>
          <summary>
            {inGame ? "Rules at this table" : "Rules for your next round"}
          </summary>
          <RulesSummary rules={rules} />
        </details>
        <p className={styles.examplesNote}>
          These practice examples show basic play. Your table’s rules above
          decide how your round works.
        </p>
        {/* Live Table Arena: Authentic Petrol Stage */}
        <div className={styles.tableArena}>
          {/* Top Instruction Cue (matches game TurnCue style) */}
          <div className={styles.instructionBanner}>
            {step === 0 && (
              <div>
                <p className={styles.instructionTitle}>01 · The Whole Game</p>
                <p className={styles.instructionText}>
                  This practice table starts with <strong>7 cards each</strong>.
                  Players take turns in a <strong>circle</strong> putting 1 card
                  onto the pile.{" "}
                  <strong>First person to empty their hand wins!</strong>
                </p>
              </div>
            )}
            {step === 1 && (
              <div>
                <p className={styles.instructionTitle}>
                  02 · The Matching Rule
                </p>
                <p className={styles.instructionText}>
                  Look at the center card. On your turn, play a card matching
                  either the <strong>SAME COLOR</strong> or the{" "}
                  <strong>SAME NUMBER</strong>. Tap a card below!
                </p>
              </div>
            )}
            {step === 2 && (
              <div>
                <p className={styles.instructionTitle}>
                  03 · Stuck? Draw or go Wild
                </p>
                <p className={styles.instructionText}>
                  No match? Tap the <strong>Draw Deck</strong> to take 1 card.
                  Or play a <strong>Wild Card</strong> to switch to any color
                  you choose!
                </p>
              </div>
            )}
            {step === 3 && (
              <div>
                <p className={styles.instructionTitle}>
                  04 · Trick Cards (Reverse &amp; Skip)
                </p>
                <p className={styles.instructionText}>
                  Disrupt your opponents! Tap each card below to see how it
                  affects turn order around the table:
                </p>
              </div>
            )}
            {step === 4 && (
              <div>
                <p className={styles.instructionTitle}>
                  05 · Call &ldquo;UNO!&rdquo; &amp; Win
                </p>
                <p className={styles.instructionText}>
                  &ldquo;Uno&rdquo; is Spanish for <strong>ONE</strong>. When
                  you hold <strong>only 1 card left</strong>, tap the UNO button
                  before anyone catches you!
                </p>
              </div>
            )}
          </div>

          {/* Opponents Row at Top of Table */}
          <div className={styles.opponentsRow}>
            {/* Cleo Seat (Top Left) */}
            <div
              className={`${styles.opponentSeat} ${
                activeSeat === "cleo" ? styles.opponentSeatActive : ""
              }`}
            >
              {/* Face-down cards fan */}
              <div className={styles.opponentCardsFan} aria-hidden="true">
                {Array.from({ length: Math.min(5, cleoCount) }).map((_, i) => (
                  <div
                    key={i}
                    className={styles.opponentMiniCard}
                    style={
                      {
                        "--rot": `${(i - (Math.min(5, cleoCount) - 1) / 2) * 8}deg`,
                      } as CSSProperties
                    }
                  >
                    <UnoCard
                      card={{ id: `c-${i}`, color: "wild", value: "wild" }}
                      faceDown
                      sizeMultiplier={0.46}
                    />
                  </div>
                ))}
              </div>

              {/* Real Game Player Label with Avatar */}
              <div className={styles.seatLabelPill}>
                <PlayerAvatar
                  seed="cleo"
                  avatarId="portrait-1"
                  isBot
                  expression={cleoExpression}
                />
                <div className={styles.seatMeta}>
                  <strong className={styles.seatName}>Cleo</strong>
                  <span className={styles.seatCount}>{cleoCount} cards</span>
                </div>
                {activeSeat === "cleo" && (
                  <span className={styles.activeTurnPill}>Turn</span>
                )}
              </div>

              {/* Status Badge on Cleo (Skip / +2 / +4) */}
              {step === 3 && cleoStatus && (
                <div className={styles.statusPopBadge}>{cleoStatus}</div>
              )}
            </div>

            {/* Center Direction Indicator */}
            <div
              className={`${styles.directionPill} ${
                direction === "counter-clockwise"
                  ? styles.directionPillReversed
                  : ""
              }`}
            >
              {direction === "clockwise" ? (
                <>
                  <RotateCw size={13} className={styles.spinIconCw} />
                  <span>Clockwise (You → Cleo → Alex)</span>
                </>
              ) : (
                <>
                  <RotateCcw size={13} className={styles.spinIconCcw} />
                  <span className={styles.reversedHighlight}>
                    REVERSED! (You → Alex → Cleo)
                  </span>
                </>
              )}
            </div>

            {/* Alex Seat (Top Right) */}
            <div
              className={`${styles.opponentSeat} ${
                activeSeat === "alex" ? styles.opponentSeatActive : ""
              }`}
            >
              {/* Face-down cards fan */}
              <div className={styles.opponentCardsFan} aria-hidden="true">
                <div
                  className={styles.opponentMiniCard}
                  style={{ "--rot": "-8deg" } as CSSProperties}
                >
                  <UnoCard
                    card={{ id: "a1", color: "wild", value: "wild" }}
                    faceDown
                    sizeMultiplier={0.46}
                  />
                </div>
                <div
                  className={styles.opponentMiniCard}
                  style={{ "--rot": "4deg" } as CSSProperties}
                >
                  <UnoCard
                    card={{ id: "a2", color: "wild", value: "wild" }}
                    faceDown
                    sizeMultiplier={0.46}
                  />
                </div>
              </div>

              {/* Real Game Player Label with Avatar */}
              <div className={styles.seatLabelPill}>
                <PlayerAvatar
                  seed="alex"
                  avatarId="portrait-3"
                  isBot
                  expression={alexExpression}
                />
                <div className={styles.seatMeta}>
                  <strong className={styles.seatName}>Alex</strong>
                  <span className={styles.seatCount}>3 cards</span>
                </div>
                {activeSeat === "alex" && (
                  <span className={styles.activeTurnPill}>Turn</span>
                )}
              </div>
            </div>
          </div>

          {/* Center Table (Orbit Track + Draw Deck & Center Discard Pile) */}
          <div className={styles.centerTableWrapper}>
            {/* SVG Orbit Track showing table circulation */}
            <svg
              className={styles.orbitSvg}
              viewBox="0 0 460 160"
              fill="none"
              aria-hidden="true"
            >
              <ellipse
                cx="230"
                cy="80"
                rx="195"
                ry="65"
                className={`${styles.orbitEllipse} ${
                  direction === "counter-clockwise"
                    ? styles.orbitEllipseReversed
                    : ""
                }`}
              />
              {direction === "clockwise" ? (
                <>
                  <path
                    d="M 120 45 L 140 32 L 124 24"
                    className={styles.orbitArrow}
                  />
                  <path
                    d="M 335 24 L 350 32 L 335 45"
                    className={styles.orbitArrow}
                  />
                  <path
                    d="M 245 146 L 225 138 L 245 130"
                    className={styles.orbitArrow}
                  />
                </>
              ) : (
                <>
                  <path
                    d="M 140 45 L 120 32 L 138 24"
                    className={styles.orbitArrowReversed}
                  />
                  <path
                    d="M 350 24 L 335 32 L 350 45"
                    className={styles.orbitArrowReversed}
                  />
                  <path
                    d="M 215 146 L 235 138 L 215 130"
                    className={styles.orbitArrowReversed}
                  />
                </>
              )}
            </svg>

            <div className={styles.centerPiles}>
              {/* Draw Deck */}
              <div className={styles.pileContainer}>
                <span className={styles.pileLabel}>Draw deck</span>
                {step === 2 && !hasDrawnCard ? (
                  <button
                    type="button"
                    className={styles.deckTapBtn}
                    onClick={handleDrawCard}
                    aria-label="Draw 1 card from deck"
                  >
                    <div className={styles.deckPhysicalStack}>
                      <UnoCard
                        card={{
                          id: "draw-deck-top",
                          color: "wild",
                          value: "wild",
                        }}
                        faceDown
                        sizeMultiplier={0.76}
                      />
                    </div>
                    <span className={styles.deckPulseBadge}>Tap to Draw</span>
                  </button>
                ) : (
                  <div className={styles.deckPhysicalStack}>
                    <UnoCard
                      card={{
                        id: "draw-pile-static",
                        color: "wild",
                        value: "wild",
                      }}
                      faceDown
                      sizeMultiplier={0.76}
                    />
                  </div>
                )}
              </div>

              {/* Discard Pile */}
              <div className={styles.pileContainer}>
                <span className={styles.pileLabel}>Center pile</span>
                <div
                  key={
                    step === 1
                      ? pileCardStep1.id
                      : step === 2
                        ? pileCardStep2.id
                        : step === 3
                          ? trickPileCard.id
                          : step === 4 && hasWon
                            ? CARD_FINAL_RED5.id
                            : "pile-static"
                  }
                  className={styles.discardPileCard}
                >
                  <UnoCard
                    card={
                      step === 1
                        ? pileCardStep1
                        : step === 2
                          ? pileCardStep2
                          : step === 3
                            ? trickPileCard
                            : step === 4 && hasWon
                              ? CARD_FINAL_RED5
                              : CARD_MID_RED7
                    }
                    sizeMultiplier={0.8}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Player Hand / Interaction Area at Bottom */}
          <div className={styles.playerArea}>
            {/* STEP 0: Whole Game Intro */}
            {step === 0 && (
              <div className={styles.step0Container}>
                <div className={styles.yourSeatRow}>
                  <div className={styles.seatLabelPillActive}>
                    <PlayerAvatar
                      seed="you"
                      avatarId="portrait-0"
                      expression={youExpression}
                    />
                    <div className={styles.seatMeta}>
                      <strong className={styles.seatName}>You</strong>
                      <span className={styles.seatCount}>7 cards (start)</span>
                    </div>
                    <span className={styles.activeTurnPill}>Your Turn</span>
                  </div>
                </div>

                <div className={styles.fannedHandRow}>
                  {[1, 2, 3, 4, 5, 6, 7].map((num, i) => (
                    <div
                      key={num}
                      style={{
                        margin: "0 -8px",
                        transform: `rotate(${(i - 3) * 4}deg) translateY(${Math.abs(i - 3) * 2}px)`,
                      }}
                    >
                      <UnoCard
                        card={{
                          id: `p0-${num}`,
                          color: i % 2 === 0 ? "red" : "blue",
                          value: String(num) as CardValue,
                        }}
                        sizeMultiplier={0.68}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 1: Matching Color or Number */}
            {step === 1 && (
              <div className={styles.stepInteractiveContainer}>
                <div className={styles.handHeaderRow}>
                  <span className={styles.playerLabel}>
                    {playedCardStep1Id
                      ? "Card played into center pile!"
                      : "Your hand · Tap a matching card:"}
                  </span>
                  {playedCardStep1Id && (
                    <button
                      type="button"
                      className={styles.resetHandBtn}
                      onClick={handleResetStep1}
                    >
                      <ResetIcon size={12} />
                      Reset Hand
                    </button>
                  )}
                </div>

                <div className={styles.playerHandRow}>
                  {playedCardStep1Id !== CARD_HAND_RED3.id && (
                    <button
                      type="button"
                      className={styles.handCardBtn}
                      onClick={() => handlePlayMatchingCard(CARD_HAND_RED3)}
                      disabled={playedCardStep1Id !== null}
                    >
                      <UnoCard
                        card={CARD_HAND_RED3}
                        sizeMultiplier={0.76}
                        isPlayable={playedCardStep1Id === null}
                      />
                      <span
                        className={`${styles.cardHintTag} ${styles.cardHintColor}`}
                      >
                        Same Color (Red)
                      </span>
                    </button>
                  )}

                  {playedCardStep1Id !== CARD_HAND_BLUE7.id && (
                    <button
                      type="button"
                      className={styles.handCardBtn}
                      onClick={() => handlePlayMatchingCard(CARD_HAND_BLUE7)}
                      disabled={playedCardStep1Id !== null}
                    >
                      <UnoCard
                        card={CARD_HAND_BLUE7}
                        sizeMultiplier={0.76}
                        isPlayable={playedCardStep1Id === null}
                      />
                      <span
                        className={`${styles.cardHintTag} ${styles.cardHintNumber}`}
                      >
                        Same Number (7)
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={`${styles.handCardBtn} ${
                      wobbleId === CARD_HAND_GREEN2.id ? styles.wobbleAnim : ""
                    }`}
                    onClick={() => handlePlayMatchingCard(CARD_HAND_GREEN2)}
                    disabled={playedCardStep1Id !== null}
                  >
                    <UnoCard
                      card={CARD_HAND_GREEN2}
                      sizeMultiplier={0.76}
                      disabled
                    />
                    <span
                      className={`${styles.cardHintTag} ${styles.cardHintDisabled}`}
                    >
                      No match
                    </span>
                  </button>
                </div>

                {matchStatus && (
                  <div className={styles.feedbackBanner}>
                    <span>{matchStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Stuck? Draw or Wild */}
            {step === 2 && (
              <div className={styles.stepInteractiveContainer}>
                {!hasDrawnCard && !wildPickedColor ? (
                  <>
                    <span className={styles.playerLabel}>
                      No match for Yellow 4! Draw a card or drop a Wild:
                    </span>
                    <div className={styles.playerHandRow}>
                      <button
                        type="button"
                        className={styles.handCardBtn}
                        onClick={() => handleChooseWildColor("blue")}
                      >
                        <UnoCard
                          card={CARD_HAND_WILD}
                          sizeMultiplier={0.76}
                          isPlayable
                        />
                        <span
                          className={`${styles.cardHintTag} ${styles.cardHintWild}`}
                        >
                          Play Wild Card
                        </span>
                      </button>

                      <button
                        type="button"
                        className={styles.handCardBtn}
                        disabled
                      >
                        <UnoCard
                          card={CARD_HAND_GREEN9}
                          sizeMultiplier={0.76}
                          disabled
                        />
                        <span
                          className={`${styles.cardHintTag} ${styles.cardHintDisabled}`}
                        >
                          Green 9 (No match)
                        </span>
                      </button>
                    </div>
                  </>
                ) : hasDrawnCard && !hasPlayedDrawnCard ? (
                  <div className={styles.drawnCardActionRow}>
                    <button
                      type="button"
                      className={styles.handCardBtn}
                      onClick={handlePlayDrawnCard}
                    >
                      <UnoCard
                        card={CARD_DREW_YELLOW1}
                        sizeMultiplier={0.78}
                        isPlayable
                      />
                      <span
                        className={`${styles.cardHintTag} ${styles.cardHintNumber}`}
                      >
                        Tap to play Yellow 1!
                      </span>
                    </button>
                  </div>
                ) : wildPickedColor || hasPlayedDrawnCard ? (
                  <div className={styles.wildChoiceRow}>
                    {!hasPlayedDrawnCard && (
                      <>
                        <span className={styles.playerLabel}>
                          Choose next color:
                        </span>
                        <div className={styles.colorPickerRow}>
                          <button
                            type="button"
                            className={`${styles.colorDisc} ${styles.colorDiscRed}`}
                            onClick={() => handleChooseWildColor("red")}
                            aria-label="Red"
                          />
                          <button
                            type="button"
                            className={`${styles.colorDisc} ${styles.colorDiscYellow}`}
                            onClick={() => handleChooseWildColor("yellow")}
                            aria-label="Yellow"
                          />
                          <button
                            type="button"
                            className={`${styles.colorDisc} ${styles.colorDiscGreen}`}
                            onClick={() => handleChooseWildColor("green")}
                            aria-label="Green"
                          />
                          <button
                            type="button"
                            className={`${styles.colorDisc} ${styles.colorDiscBlue}`}
                            onClick={() => handleChooseWildColor("blue")}
                            aria-label="Blue"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ) : null}

                {drawStatus && (
                  <div className={styles.feedbackBanner}>
                    <span>{drawStatus}</span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Trick Cards Tester */}
            {step === 3 && (
              <div className={styles.stepTrickContainer}>
                <div className={styles.trickCardsGrid}>
                  {TRICK_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.trickCardBox} ${
                        activeTrick === item.id ? styles.trickCardBoxActive : ""
                      }`}
                      onClick={() => handleSelectTrick(item)}
                    >
                      <UnoCard card={item.card} sizeMultiplier={0.58} />
                      <span className={styles.trickCardName}>{item.name}</span>
                      <span className={styles.trickCardTagline}>
                        {item.tagline}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected trick live explanation */}
                <div className={styles.trickDetailBanner}>
                  {TRICK_ITEMS.find((t) => t.id === activeTrick)?.desc}
                </div>
              </div>
            )}

            {/* STEP 4: Calling UNO & Winning */}
            {step === 4 && (
              <div className={styles.stepUnoContainer}>
                {!calledUno ? (
                  <div className={styles.unoActionBox}>
                    <div className={styles.yourSeatRow}>
                      <div className={styles.seatLabelPillActive}>
                        <PlayerAvatar
                          seed="you"
                          avatarId="portrait-0"
                          expression="thinking"
                        />
                        <div className={styles.seatMeta}>
                          <strong className={styles.seatName}>You</strong>
                          <span className={styles.seatCount}>1 card left!</span>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        margin: "4px 0",
                      }}
                    >
                      <UnoCard card={CARD_FINAL_RED5} sizeMultiplier={0.74} />
                    </div>
                    <button
                      type="button"
                      className={styles.unoActionBtn}
                      onClick={handleDeclareUno}
                    >
                      CALL UNO!
                    </button>
                  </div>
                ) : !hasWon ? (
                  <div className={styles.unoActionBox}>
                    <div className={styles.unoSuccessBanner}>
                      <CheckCircle2 size={18} className={styles.successIcon} />
                      <span>UNO CALLED! Protected from penalty!</span>
                    </div>

                    <p className={styles.unoSuccessSubtext}>
                      Now tap your last card to play it and win the round!
                    </p>

                    <button
                      type="button"
                      className={styles.handCardBtn}
                      onClick={handlePlayFinalWinningCard}
                    >
                      <UnoCard
                        card={CARD_FINAL_RED5}
                        sizeMultiplier={0.78}
                        isPlayable
                      />
                      <span
                        className={`${styles.cardHintTag} ${styles.cardHintWinning}`}
                      >
                        Play final card to Win!
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className={styles.readyLaunchScreen}>
                    <div className={styles.victoryBanner}>
                      <Trophy size={24} className={styles.trophyIcon} />
                      <span>YOU WIN! CONGRATULATIONS!</span>
                    </div>

                    <p className={styles.unoSuccessSubtext}>
                      Hand emptied to 0 cards! You know the whole game. Now jump
                      in with bots or play online with friends:
                    </p>

                    <div className={styles.launchButtonsGroup}>
                      {!inGame && onPracticeWithBots && (
                        <button
                          type="button"
                          className={styles.btnPlayBots}
                          onClick={onPracticeWithBots}
                        >
                          <Bot size={20} />
                          Play with bots
                        </button>
                      )}

                      {!inGame && onPlayWithFriends && (
                        <button
                          type="button"
                          className={styles.btnPlayFriends}
                          onClick={onPlayWithFriends}
                        >
                          <Users size={20} />
                          Play with friends
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Footer Navigation Controls */}
      <div className={styles.footer}>
        <button
          type="button"
          className={styles.btnNavBack}
          onClick={() => changeStep(step - 1)}
          disabled={step === 0}
        >
          <ArrowLeft size={14} style={{ marginRight: 4 }} />
          Back
        </button>

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            className={styles.btnNavNext}
            onClick={() => changeStep(step + 1)}
          >
            Next
            <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className={styles.btnNavDone} onClick={onClose}>
            <Sparkles size={16} style={{ marginRight: 6 }} />
            {inGame ? "Back to table" : "Done"}
          </button>
        )}
      </div>
    </Modal>
  );
}
