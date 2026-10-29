// Printed action vocabulary, referenced against Mattel's illustrated instruction sheets.
import type { CSSProperties } from "react";
import type { CardValue } from "../../types/card";

// Reverse: Two distinct opposing bent arrows rotated along the card oval's long axis (56°).
// Formed as symmetrical point reflections with an S-curve negative space gap,
// matching the physical Mattel UNO deck artwork.
function Reverse({ isCorner = false }: { isCorner?: boolean }) {
  // Arrow path in upright coordinates (tip at top, sweeps to right and down, curves back):
  // When rotated 56°, the upper arrow points up-right along the oval's long axis.
  // When isCorner is true, barbs and stroke are subtly thickened for 14-18px legibility.
  const pathData = isCorner
    ? "M 32 2 L 14 21 L 23.5 21 C 23.5 30.5 27 38.5 38 41.5 L 38 33.5 C 32 31 31.5 26 31.5 21 L 41 21 Z"
    : "M 32 2 L 15 20.5 L 23.5 20.5 C 23.5 30 27 38.5 38 41.5 L 38 33.5 C 31.5 31 31.5 26 31.5 20.5 L 40 20.5 Z";

  return (
    <g fill="currentColor" transform="rotate(56 32 32)">
      <path d={pathData} />
      <path d={pathData} transform="rotate(180 32 32)" />
    </g>
  );
}

// Skip: Standard prohibition sign with balanced stroke weight and slash from top-right to bottom-left.
function Skip({ isCorner = false }: { isCorner?: boolean }) {
  const sw = isCorner ? 6.5 : 5.5;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <circle cx="32" cy="32" r="19" />
      <line x1="45.5" y1="18.5" x2="18.5" y2="45.5" />
    </g>
  );
}

// Skip Everyone: Bold clockwise sweeping circular arrow matching Mattel No Mercy card.
// Sweeps from bottom-right (~4 o'clock) clockwise through bottom, left, top to ~2:30.
// Large, unmistakable arrowhead at 2:30 pointing down/inward.
function SkipEveryone({ isCorner = false }: { isCorner?: boolean }) {
  const sw = isCorner ? 8 : 6.5;
  return (
    <g fill="currentColor">
      <path
        d="M 45 35 A 19 19 0 1 1 45 22"
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <polygon
        points={isCorner ? "37,14 49,27 35,32" : "38,15 48,26 36,30"}
        fill="currentColor"
        stroke="none"
      />
    </g>
  );
}

// Wild Skip Two: Two prohibition signs overlapping along the vertical axis matching Mattel All Wild.
function WildSkip2({ isCorner = false }: { isCorner?: boolean }) {
  const sw = isCorner ? 5.8 : 4.8;
  return (
    <g fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round">
      <g transform="translate(32 22)">
        <circle cx="0" cy="0" r="13.5" />
        <line x1="9.5" y1="-9.5" x2="-9.5" y2="9.5" />
      </g>
      <g transform="translate(32 42)">
        <circle cx="0" cy="0" r="13.5" />
        <line x1="9.5" y1="-9.5" x2="-9.5" y2="9.5" />
      </g>
    </g>
  );
}

// Wild Forced Swap: Hand fan of cards with arching two-way bridge arrow matching Mattel All Wild.
function WildForcedSwap({ isCorner = false }: { isCorner?: boolean }) {
  return (
    <g>
      <g
        stroke="#101d3a"
        strokeWidth={isCorner ? 2.2 : 1.8}
        strokeLinejoin="round"
        fill="white"
      >
        <rect
          x="25"
          y="10"
          width="14"
          height="26"
          rx="2"
          transform="rotate(-24 32 46)"
        />
        <rect
          x="25"
          y="10"
          width="14"
          height="26"
          rx="2"
          transform="rotate(-8 32 46)"
        />
        <rect
          x="25"
          y="10"
          width="14"
          height="26"
          rx="2"
          transform="rotate(8 32 46)"
        />
        <rect
          x="25"
          y="10"
          width="14"
          height="26"
          rx="2"
          transform="rotate(24 32 46)"
        />
      </g>
      {/* Arching two-way bridge arrow across the card fan */}
      <path
        d="M 12 43 C 18 31, 46 31, 52 43 L 52 38 L 59 45 L 50 49 L 51 44 C 45 34, 19 34, 13 44 L 14 49 L 5 45 L 12 38 Z"
        fill="currentColor"
        stroke="#101d3a"
        strokeWidth={isCorner ? 1.5 : 1}
        strokeLinejoin="round"
      />
    </g>
  );
}

// Wild Shuffle Hands: Two fanning cards with bold curved crossing shuffle arrows.
function WildShuffle({ isCorner = false }: { isCorner?: boolean }) {
  return (
    <g>
      <g
        stroke="#101d3a"
        strokeWidth={isCorner ? 2.2 : 1.8}
        strokeLinejoin="round"
        fill="white"
      >
        <rect
          x="12"
          y="18"
          width="16"
          height="26"
          rx="2.5"
          transform="rotate(-15 20 31)"
        />
        <rect
          x="36"
          y="18"
          width="16"
          height="26"
          rx="2.5"
          transform="rotate(15 44 31)"
        />
      </g>
      {/* Crossing shuffle arrows */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={isCorner ? 4.5 : 3.6}
        strokeLinecap="round"
      >
        <path d="M 17 26 C 24 26, 26 38, 45 38" />
        <path d="M 17 38 C 24 38, 26 26, 45 26" />
      </g>
      <polygon
        points="43,21 51,26 43,31"
        fill="currentColor"
        stroke="#101d3a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <polygon
        points="43,33 51,38 43,43"
        fill="currentColor"
        stroke="#101d3a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </g>
  );
}

export function UnoActionSymbol({
  value,
  size = 64,
  className = "",
  style,
  isCorner = false,
}: {
  value: CardValue;
  size?: number;
  className?: string;
  style?: CSSProperties;
  isCorner?: boolean;
}) {
  let content;
  switch (value) {
    case "skip":
      content = <Skip isCorner={isCorner} />;
      break;

    case "reverse":
      content = <Reverse isCorner={isCorner} />;
      break;

    case "skipEveryone":
      content = <SkipEveryone isCorner={isCorner} />;
      break;

    case "wildSkip2":
      content = <WildSkip2 isCorner={isCorner} />;
      break;

    case "draw2":
      // Two overlapping white cards in perspective.
      content = (
        <g
          stroke="#101d3a"
          strokeWidth={isCorner ? 2.2 : 1.8}
          strokeLinejoin="round"
          fill="white"
        >
          <rect x="18" y="15" width="18" height="28" rx="2.5" />
          <rect x="27" y="21" width="18" height="28" rx="2.5" />
        </g>
      );
      break;

    case "draw4":
    case "wild4":
      // Four cascading cards fanning from top-left to bottom-right.
      content = (
        <g
          stroke="#101d3a"
          strokeWidth={isCorner ? 2 : 1.6}
          strokeLinejoin="round"
        >
          <rect
            x="13"
            y="16"
            width="16"
            height="25"
            rx="2.5"
            fill={value === "wild4" ? "#df0735" : "white"}
          />
          <rect
            x="20"
            y="20"
            width="16"
            height="25"
            rx="2.5"
            fill={value === "wild4" ? "#075bee" : "white"}
          />
          <rect
            x="27"
            y="24"
            width="16"
            height="25"
            rx="2.5"
            fill={value === "wild4" ? "#ffce00" : "white"}
          />
          <rect
            x="34"
            y="28"
            width="16"
            height="25"
            rx="2.5"
            fill={value === "wild4" ? "#00bc68" : "white"}
          />
        </g>
      );
      break;

    case "wildReverseDraw4": {
      // Four fanned colored cards in background + white reverse arrows with dark halo in foreground.
      const revPath =
        "M 32 2 L 15 20.5 L 23.5 20.5 C 23.5 30 27 38.5 38 41.5 L 38 33.5 C 31.5 31 31.5 26 31.5 20.5 L 40 20.5 Z";
      content = (
        <g>
          <g stroke="#101d3a" strokeWidth="1.6" strokeLinejoin="round">
            <rect
              x="12"
              y="14"
              width="16"
              height="25"
              rx="2.5"
              fill="#df0735"
            />
            <rect
              x="24"
              y="10"
              width="16"
              height="25"
              rx="2.5"
              fill="#075bee"
            />
            <rect
              x="16"
              y="28"
              width="16"
              height="25"
              rx="2.5"
              fill="#ffce00"
            />
            <rect
              x="36"
              y="24"
              width="16"
              height="25"
              rx="2.5"
              fill="#00bc68"
            />
          </g>
          <g transform="rotate(56 32 32)">
            <path
              d={revPath}
              fill="#101d3a"
              stroke="#101d3a"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path
              d={revPath}
              transform="rotate(180 32 32)"
              fill="#101d3a"
              stroke="#101d3a"
              strokeWidth="4.5"
              strokeLinejoin="round"
            />
            <path d={revPath} fill="white" />
            <path d={revPath} transform="rotate(180 32 32)" fill="white" />
          </g>
        </g>
      );
      break;
    }

    case "wildDraw6":
      // Overlapping cluster of 6 colored cards matching Mattel physical card.
      content = (
        <g stroke="#101d3a" strokeWidth="1.6" strokeLinejoin="round">
          <rect x="29" y="10" width="15" height="22" rx="2.5" fill="#075bee" />
          <rect x="18" y="14" width="15" height="22" rx="2.5" fill="#ffce00" />
          <rect x="35" y="21" width="15" height="22" rx="2.5" fill="#df0735" />
          <rect x="12" y="25" width="15" height="22" rx="2.5" fill="#df0735" />
          <rect x="28" y="29" width="15" height="22" rx="2.5" fill="#00bc68" />
          <rect x="19" y="34" width="15" height="22" rx="2.5" fill="#075bee" />
        </g>
      );
      break;

    case "wildDraw10":
      // Dual cascading columns of 5 cards each flanking the central axis matching Mattel sheet.
      content = (
        <g stroke="#101d3a" strokeWidth="1.5" strokeLinejoin="round">
          <rect x="11" y="11" width="13" height="19" rx="2" fill="#df0735" />
          <rect x="13" y="17" width="13" height="19" rx="2" fill="#075bee" />
          <rect x="15" y="23" width="13" height="19" rx="2" fill="#ffce00" />
          <rect x="17" y="29" width="13" height="19" rx="2" fill="#00bc68" />
          <rect x="19" y="35" width="13" height="19" rx="2" fill="#df0735" />
          <rect x="32" y="9" width="13" height="19" rx="2" fill="#ffce00" />
          <rect x="34" y="15" width="13" height="19" rx="2" fill="#00bc68" />
          <rect x="36" y="21" width="13" height="19" rx="2" fill="#df0735" />
          <rect x="38" y="27" width="13" height="19" rx="2" fill="#075bee" />
          <rect x="40" y="33" width="13" height="19" rx="2" fill="#ffce00" />
        </g>
      );
      break;

    case "wildTargetDraw2":
      // Bullseye target reticle with cardinal crosshairs and centered +2.
      content = (
        <g fill="none" stroke="currentColor">
          <circle cx="32" cy="32" r="19.5" strokeWidth={isCorner ? 4.5 : 3.5} />
          <line
            x1="32"
            y1="5"
            x2="32"
            y2="15"
            strokeWidth={isCorner ? 4.2 : 3.5}
            strokeLinecap="round"
          />
          <line
            x1="32"
            y1="49"
            x2="32"
            y2="59"
            strokeWidth={isCorner ? 4.2 : 3.5}
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="32"
            x2="15"
            y2="32"
            strokeWidth={isCorner ? 4.2 : 3.5}
            strokeLinecap="round"
          />
          <line
            x1="49"
            y1="32"
            x2="59"
            y2="32"
            strokeWidth={isCorner ? 4.2 : 3.5}
            strokeLinecap="round"
          />
          <circle cx="32" cy="32" r="11.5" fill="currentColor" stroke="none" />
          <text
            x="32"
            y="36.5"
            textAnchor="middle"
            fill="#101d3a"
            fontSize="14.5"
            fontWeight="900"
            fontFamily="'Barlow Condensed', sans-serif"
            fontStyle="italic"
            stroke="none"
          >
            +2
          </text>
        </g>
      );
      break;

    case "wildForcedSwap":
      content = <WildForcedSwap isCorner={isCorner} />;
      break;

    case "shuffle":
      content = <WildShuffle isCorner={isCorner} />;
      break;

    case "discardAll":
      // Fan of 4 cards curving down into a 3D perspective discard stack.
      content = (
        <g stroke="#101d3a" strokeLinejoin="round">
          <g strokeWidth={isCorner ? 2.2 : 1.8} fill="white">
            <rect
              x="25"
              y="7"
              width="14"
              height="25"
              rx="2"
              transform="rotate(-21 32 42)"
            />
            <rect
              x="25"
              y="7"
              width="14"
              height="25"
              rx="2"
              transform="rotate(-7 32 42)"
            />
            <rect
              x="25"
              y="7"
              width="14"
              height="25"
              rx="2"
              transform="rotate(7 32 42)"
            />
            <rect
              x="25"
              y="7"
              width="14"
              height="25"
              rx="2"
              transform="rotate(21 32 42)"
            />
          </g>
          <path
            d="M 37 25 C 37 34, 30 38, 25 41"
            fill="none"
            stroke="currentColor"
            strokeWidth={isCorner ? 4 : 3.2}
            strokeLinecap="round"
          />
          <polygon
            points="21,43 28,42 26,36"
            fill="currentColor"
            stroke="none"
          />
          <g fill="white" stroke="#101d3a" strokeWidth={isCorner ? 2 : 1.6}>
            <polygon points="12,46 25,40 37,45 24,51" />
            <path d="M 12 46 L 12 51 L 24 56 L 37 50 L 37 45" fill="none" />
            <line x1="12" y1="48.5" x2="24" y2="53.5" />
            <line x1="24" y1="53.5" x2="37" y2="47.5" />
          </g>
        </g>
      );
      break;

    case "wildColorRoulette":
      // 4 fanned mystery cards in the 4 deck colors with bold white question marks.
      content = (
        <g stroke="#101d3a" strokeWidth="1.6" strokeLinejoin="round">
          <g transform="rotate(-24 32 48)">
            <rect x="25" y="8" width="14" height="26" rx="2.5" fill="#df0735" />
            <text
              x="32"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="14.5"
              fontWeight="900"
              fontFamily="'Barlow Condensed', sans-serif"
              fontStyle="italic"
              stroke="none"
            >
              ?
            </text>
          </g>
          <g transform="rotate(-8 32 48)">
            <rect x="25" y="8" width="14" height="26" rx="2.5" fill="#075bee" />
            <text
              x="32"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="14.5"
              fontWeight="900"
              fontFamily="'Barlow Condensed', sans-serif"
              fontStyle="italic"
              stroke="none"
            >
              ?
            </text>
          </g>
          <g transform="rotate(8 32 48)">
            <rect x="25" y="8" width="14" height="26" rx="2.5" fill="#ffce00" />
            <text
              x="32"
              y="26"
              textAnchor="middle"
              fill="#332810"
              fontSize="14.5"
              fontWeight="900"
              fontFamily="'Barlow Condensed', sans-serif"
              fontStyle="italic"
              stroke="none"
            >
              ?
            </text>
          </g>
          <g transform="rotate(24 32 48)">
            <rect x="25" y="8" width="14" height="26" rx="2.5" fill="#00bc68" />
            <text
              x="32"
              y="26"
              textAnchor="middle"
              fill="white"
              fontSize="14.5"
              fontWeight="900"
              fontFamily="'Barlow Condensed', sans-serif"
              fontStyle="italic"
              stroke="none"
            >
              ?
            </text>
          </g>
        </g>
      );
      break;

    default:
      return null;
  }

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`uno-action-symbol ${className}`}
      style={style}
      data-card-symbol={value}
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  );
}
