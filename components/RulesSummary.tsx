// One read-only explanation of the actual table settings, shared by help and guests.
import { defaultRules, type GameRules } from "../types/rules";
import { RULE_PRESETS, matchesPreset } from "../lib/rulePresets";
import { getBotDifficultyLabel } from "../lib/botSupport";

export default function RulesSummary({
  rules,
  includeBots = false,
}: {
  rules: Partial<GameRules>;
  includeBots?: boolean;
}) {
  const active = {
    ...defaultRules,
    ...Object.fromEntries(
      Object.entries(rules).filter(([, value]) => value !== undefined),
    ),
  };
  const preset = RULE_PRESETS.find((item) => matchesPreset(active, item.rules));
  const stacking = [
    active.stackDraw2 && "+2 on +2",
    active.stackWild4 && "+4 on +4",
    active.allowWild4OnDraw2 && "+4 on +2",
  ]
    .filter(Boolean)
    .join(" · ");
  const extras = [
    active.allowJumpIn && "Jump-in",
    active.allowShuffleCard && "Shuffle hands",
  ]
    .filter(Boolean)
    .join(" · ");
  const rows = [
    ["Cards dealt", `${active.startingHandSize} each`],
    ...(includeBots
      ? [["Bot challenge", getBotDifficultyLabel(active.botDifficulty)]]
      : []),
    [
      "Drawing",
      active.drawUntilPlayable ? "Until you can play" : "One card per draw",
    ],
    ["Draw stacking", stacking || "Off"],
    [
      "Matching-number pairs",
      !active.allowDoublePlaySameNumber
        ? "Off — play one card"
        : active.allowDoublePlayExactMatchOnly
          ? "Same number and color"
          : "Same number; either color",
    ],
    [
      "Discard All",
      active.allowDiscardAll
        ? "Clear this card’s color together"
        : "Not in this deck",
    ],
    [
      "UNO call",
      active.mustDeclareUno ? "Call with one card left" : "Not required",
    ],
    [
      "Last card",
      active.canFinishWithActionCard
        ? "Any card can win"
        : "Finish with a number",
    ],
    ["Extra rules", extras || "None"],
    [
      "Two-player reverse",
      active.reverseActsAsSkipInTwoPlayer
        ? "Skips your opponent"
        : "Changes direction",
    ],
    [
      "Opening card",
      active.allowStartingActionCard ? "Numbers or actions" : "Numbers only",
    ],
    [
      "False call-out",
      active.penalizeFalseCallOut ? "Draw two cards" : "No penalty",
    ],
  ];
  return (
    <>
      <p className="rules-preset-name">
        <strong>{preset?.label ?? "Custom rules"}</strong>
      </p>
      <dl className="rules-summary">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {(active.allowDoublePlaySameNumber || active.allowDiscardAll) && (
        <p className="rules-combined-uno">
          {active.mustDeclareUno
            ? "If a pair or Discard All leaves one card, you can combine Call UNO with the play. An empty hand wins automatically."
            : "An empty hand wins automatically, including a legal pair or Discard All."}
        </p>
      )}
    </>
  );
}
