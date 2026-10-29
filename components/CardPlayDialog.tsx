// Explain a multi-card move and submit UNO with the play in one action.
"use client";
import { ArrowRight } from "lucide-react";
import type { Card } from "../types/card";
import type { CardPlayChoice } from "../lib/gameRules";
import type { PlayOptions } from "../lib/gameActions";
import Modal from "./Modal";
import UnoCard from "./UnoCard";

export default function CardPlayDialog({
  card,
  choices,
  mustDeclareUno,
  saidUno,
  onPlay,
  onClose,
}: {
  card: Card;
  choices: CardPlayChoice[];
  mustDeclareUno: boolean;
  saidUno: boolean;
  onPlay: (lead: Card, options: PlayOptions) => void;
  onClose: () => void;
}) {
  const canPlayAlone = choices.some((choice) => !choice.secondCardId);
  // Physical duplicate copies produce the same visible move and next color.
  const distinctChoices = choices.filter(
    (choice, index) =>
      choices.findIndex(
        (other) =>
          other.cards.length === choice.cards.length &&
          other.cards[0].color === choice.cards[0].color &&
          other.cards.at(-1)?.color === choice.cards.at(-1)?.color,
      ) === index,
  );
  return (
    <Modal
      title={`Play your ${card.value}s?`}
      onClose={onClose}
      className="card-play-dialog"
    >
      <p className="muted">
        {canPlayAlone
          ? "Choose one card or a pair. The last card sets the color."
          : "Play the matching card first. The second sets the color."}
      </p>
      <div className="card-play-options">
        {distinctChoices.map((choice) => {
          const callUno = mustDeclareUno && !saidUno && choice.remaining === 1;
          const label = choice.secondCardId
            ? "Play both"
            : `Play just ${card.color} ${card.value}`;
          return (
            <button
              type="button"
              className="card-play-option"
              key={`${choice.cards[0].id}:${choice.secondCardId ?? card.id}`}
              onClick={() =>
                onPlay(choice.secondCardId ? choice.cards[0] : card, {
                  secondCardId: choice.secondCardId,
                  declareUno: callUno,
                })
              }
            >
              <span className="card-play-preview" aria-hidden="true">
                {choice.cards.map((entry) => (
                  <UnoCard key={entry.id} card={entry} sizeMultiplier={0.5} />
                ))}
              </span>
              <span className="card-play-copy">
                <strong>
                  {callUno ? `Call UNO + ${label.toLowerCase()}` : label}
                </strong>
                <small>
                  {choice.remaining === 0
                    ? "Empty hand — you win this round!"
                    : `${choice.remaining} ${choice.remaining === 1 ? "card" : "cards"} left · ${(choice.secondCardId ? choice.cards[1] : card).color} is next`}
                </small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <button type="button" className="button secondary wide" onClick={onClose}>
        Keep my cards
      </button>
    </Modal>
  );
}
