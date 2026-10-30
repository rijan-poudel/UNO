// Approved Swiss action geometry, shared by cards and game feedback.
"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import type { CardColor, CardValue } from "../../types/card";

export const DRAW_AMOUNTS: Partial<Record<CardValue, string>> = {
  draw2: "2",
  draw4: "4",
  wild4: "4",
  wildDraw6: "6",
  wildDraw10: "10",
  wildReverseDraw4: "4",
  wildTargetDraw2: "2",
};
const INKS = [
  "var(--wild-red, #f43f5e)",
  "var(--wild-blue, #24a9f0)",
  "var(--wild-yellow, #fbbf24)",
  "var(--wild-green, #20c88a)",
];

function Reverse() {
  const arrow =
    "M38 8 51 18 38 28v-6H29c-5 0-7 3-7 8v4h-8v-6c0-9 5-14 14-14h10Z";
  return (
    <g transform="rotate(-25 32 32)" fill="currentColor">
      <path d={arrow} />
      <path d={arrow} transform="rotate(180 32 32)" />
    </g>
  );
}
function Skip({
  x = 32,
  y = 32,
  radius = 20,
}: {
  x?: number;
  y?: number;
  radius?: number;
}) {
  return (
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="4.5"
      strokeLinecap="round"
    >
      <circle cx={x} cy={y} r={radius} />
      <path
        d={`M${x + radius * 0.7} ${y - radius * 0.7} ${x - radius * 0.7} ${y + radius * 0.7}`}
      />
    </g>
  );
}
function WildOval({ outlined = false }: { outlined?: boolean }) {
  return (
    <g transform="rotate(32 32 32)" stroke="none">
      <path d="M32 3A19 29 0 0 0 13 32h19Z" fill={INKS[0]} />
      <path d="M32 3a19 29 0 0 1 19 29H32Z" fill={INKS[1]} />
      <path d="M51 32a19 29 0 0 1-19 29V32Z" fill={INKS[2]} />
      <path d="M13 32a19 29 0 0 0 19 29V32Z" fill={INKS[3]} />
      {outlined && (
        <ellipse
          cx="32"
          cy="32"
          rx="19"
          ry="29"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />
      )}
    </g>
  );
}
function DrawFan({ two, color }: { two: boolean; color: CardColor }) {
  const inks = two ? [color === "blue" ? INKS[0] : INKS[1], INKS[2]] : INKS;
  return (
    <g>
      {(two ? [-14, 14] : [-24, -8, 8, 24]).map((angle, i) => (
        <rect
          key={angle}
          x="24"
          y="37"
          width="16"
          height="22"
          rx="2"
          fill={inks[i]}
          transform={`rotate(${angle} 32 59)`}
        />
      ))}
    </g>
  );
}
function ActionFan({ colored, id }: { colored: boolean; id: string }) {
  const angles = colored ? [-24, 24, -8, 8] : [-22, 22, 0];
  const inks = colored
    ? [INKS[1], INKS[2], INKS[0], INKS[3]]
    : ["currentColor", "currentColor", "currentColor"];
  let fan: ReactNode = null;
  angles.forEach((angle, i) => {
    const shape = {
      x: 25,
      y: 7,
      width: 14,
      height: 25,
      rx: 1.8,
      transform: `rotate(${angle} 32 33)`,
    };
    const mask = `${id}-seam-${i}`;
    fan = (
      <>
        {i > 0 && (
          <defs>
            <mask
              id={mask}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="64"
              height="64"
            >
              <rect width="64" height="64" fill="white" />
              <rect {...shape} fill="black" stroke="black" strokeWidth="1.6" />
            </mask>
          </defs>
        )}
        {i ? <g mask={`url(#${mask})`}>{fan}</g> : fan}
        <rect {...shape} fill={inks[i]} />
      </>
    );
  });
  return fan;
}
export function UnoActionSymbol({
  value,
  color = "wild",
  size = 64,
  className = "",
  style,
  isCorner = false,
}: {
  value: CardValue;
  color?: CardColor;
  size?: number;
  className?: string;
  style?: CSSProperties;
  isCorner?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  let content: ReactNode;
  switch (value) {
    case "reverse":
      content = <Reverse />;
      break;
    case "skip":
      content = <Skip />;
      break;
    case "skipEveryone":
      content = (
        <path
          d="M45.2 50.8A23 23 0 1 1 54.9 30L61 29 53 45 42 31 48 30A16 16 0 1 0 41.2 45.1Z"
          fill="currentColor"
        />
      );
      break;
    case "wildSkip2":
      content = (
        <>
          <Skip x={40} y={23} radius={12} />
          <circle cx="24" cy="41" r="16" fill="var(--card-ground, #0d0f17)" />
          <Skip x={24} y={41} radius={12} />
        </>
      );
      break;
    case "draw2":
    case "draw4":
    case "wild4":
    case "wildDraw6":
    case "wildDraw10":
      content = (
        <>
          <text x="32" y="29" fontSize="30" fill="currentColor">
            +{DRAW_AMOUNTS[value]}
          </text>
          <DrawFan two={value === "draw2"} color={color} />
        </>
      );
      break;
    case "wildReverseDraw4":
      content = (
        <>
          <g transform="translate(10.24 -1.5) scale(.68)">
            <Reverse />
          </g>
          <text x="32" y="62" fontSize="30" fill="currentColor">
            +4
          </text>
        </>
      );
      break;
    case "wild":
      content = <WildOval />;
      break;
    case "discardAll":
      content = (
        <>
          <ActionFan colored={false} id={id} />
          <path
            d="M46 22C57 31 53 41 43 45L45 50 32 46 42 36 41 41C49 37 50 31 43 26Z"
            fill="currentColor"
          />
          <g fill="currentColor">
            <path d="M16 50h22l-3 10H13Z" />
            <rect x="13" y="62" width="22" height="1.6" rx=".8" />
          </g>
        </>
      );
      break;
    case "wildForcedSwap":
      content = (
        <>
          <ActionFan colored id={id} />
          <path
            d="M9 45C17 31 47 31 55 45L56 39 62 49 50 53 52 47C45 37 19 37 12 47L14 53 2 49 8 39Z"
            fill="currentColor"
          />
        </>
      );
      break;
    case "shuffle":
      content = isCorner ? (
        <WildOval outlined />
      ) : (
        <>
          <defs>
            <filter id={`${id}-ink`} colorInterpolationFilters="sRGB">
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 .0627 0 0 0 0 .0745 0 0 0 0 .1059 -.2126 -.7152 -.0722 1 0"
              />
            </filter>
          </defs>
          <image
            href="/artwork/cards/shuffle-hands.png"
            x="11"
            y="16.7"
            width="42"
            height="30.625"
            filter={`url(#${id}-ink)`}
          />
        </>
      );
      break;
    case "wildColorRoulette":
      content = isCorner ? (
        <>
          <defs>
            <filter id={`${id}-light`} colorInterpolationFilters="sRGB">
              <feComponentTransfer>
                {["R", "G", "B"].map((channel) => {
                  const props = {
                    type: "linear" as const,
                    slope: 1.35,
                    intercept: 0.14,
                  };
                  return channel === "R" ? (
                    <feFuncR key={channel} {...props} />
                  ) : channel === "G" ? (
                    <feFuncG key={channel} {...props} />
                  ) : (
                    <feFuncB key={channel} {...props} />
                  );
                })}
              </feComponentTransfer>
            </filter>
          </defs>
          <image
            href="/artwork/cards/color-roulette.png"
            x="2"
            y="1"
            width="60"
            height="61.7"
            filter={`url(#${id}-light)`}
          />
        </>
      ) : (
        <image
          href="/artwork/cards/color-roulette.png"
          x="11"
          y="10.4"
          width="42"
          height="43.2"
        />
      );
      break;
    case "wildTargetDraw2":
      content = (
        <>
          <g fill="none" stroke="currentColor" strokeWidth={isCorner ? 5 : 3.2}>
            <circle cx="32" cy="32" r={isCorner ? 22 : 24} />
            <path
              d={
                isCorner
                  ? "M32 2v8m0 44v8M2 32h8m44 0h8"
                  : "M32 2v6m0 48v6M2 32h6m48 0h6"
              }
            />
          </g>
          {!isCorner && (
            <text x="32" y="41" fontSize="26" fill="currentColor">
              +2
            </text>
          )}
        </>
      );
      break;
    default:
      content = null;
  }
  return (
    <svg
      className={`uno-action-symbol ${className}`}
      data-card-symbol={value}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{
        fontFamily: "var(--font-card), sans-serif",
        fontWeight: 700,
        textAnchor: "middle",
        letterSpacing: "-.035em",
        ...style,
      }}
    >
      {!isCorner && (value === "shuffle" || value === "wildColorRoulette") && (
        <ellipse
          cx="32"
          cy="32"
          rx="20"
          ry="30"
          transform="rotate(32 32 32)"
          fill="var(--print-paper, #fffaf0)"
        />
      )}
      {content}
    </svg>
  );
}
