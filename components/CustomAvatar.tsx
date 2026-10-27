// Layered vector portrait: every visible feature is an explicit profile choice.
import type { CustomAvatar as AvatarConfig } from "../lib/avatarCustomization";
export default function CustomAvatar({ config: c }: { config: AvatarConfig }) {
  const face = [
    "M29 42Q29 25 50 25Q71 25 71 42V57Q70 78 50 80Q30 78 29 57Z",
    "M26 46Q26 25 50 25Q74 25 74 46V56Q74 80 50 80Q26 80 26 56Z",
    "M29 40Q29 25 50 25Q71 25 71 40V61L62 76L50 81L38 76L29 61Z",
  ][c.face];
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      aria-hidden="true"
      style={{ borderRadius: "50%", display: "block" }}
    >
      <circle cx="50" cy="50" r="50" fill={c.background} />
      {c.hair === 3 && (
        <path d="M24 46Q20 13 50 14Q80 13 76 47L81 91H19Z" fill={c.hairColor} />
      )}
      {c.hair === 4 && <circle cx="50" cy="19" r="14" fill={c.hairColor} />}
      {c.hair === 5 && (
        <path
          d="M22 60C6 48 12 23 25 20C26 3 45 5 50 11C62 0 80 11 79 22C96 30 89 52 78 61Z"
          fill={c.hairColor}
        />
      )}
      <path d="M10 102Q12 81 39 80H61Q88 81 90 102" fill={c.shirt} />
      <path d="M41 71V82Q50 91 59 82V71" fill={c.skin} />
      <ellipse cx="29" cy="54" rx="5" ry="8" fill={c.skin} />
      <ellipse cx="71" cy="54" rx="5" ry="8" fill={c.skin} />
      <path d={face} fill={c.skin} />
      <path
        d="M49 52L46 63H52"
        fill="none"
        stroke="#663c30"
        strokeOpacity=".3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g
        fill="none"
        stroke={c.hairColor}
        strokeWidth="2.8"
        strokeLinecap="round"
      >
        {c.brows === 0 && <path d="M35 44Q39 41 44 43M56 43Q61 41 65 44" />}
        {c.brows === 1 && <path d="M35 43L39 40L44 42M56 42L61 40L65 43" />}
        {c.brows === 2 && <path d="M35 42H44M56 42H65" />}
      </g>
      {c.eyes === 0 && (
        <g>
          <g fill="white">
            <ellipse cx="40" cy="51" rx="5" ry="4" />
            <ellipse cx="60" cy="51" rx="5" ry="4" />
          </g>
          <g fill={c.eyeColor}>
            <circle cx="40" cy="51" r="3" />
            <circle cx="60" cy="51" r="3" />
          </g>
          <g fill="#17345f">
            <circle cx="40" cy="51" r="1.5" />
            <circle cx="60" cy="51" r="1.5" />
          </g>
        </g>
      )}
      {c.eyes === 1 && (
        <g fill={c.eyeColor}>
          <path d="M35 49H45Q44 55 40 55Q36 55 35 49M55 49H65Q64 55 60 55Q56 55 55 49" />
        </g>
      )}
      {c.eyes === 2 && (
        <path
          d="M36 52Q40 46 44 52M56 52Q60 46 64 52"
          fill="none"
          stroke={c.eyeColor}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      )}
      {c.beard === 2 && (
        <path
          d="M31 60L37 65L40 72Q50 78 60 72L63 65L69 60V66Q65 81 50 82Q35 81 31 66Z"
          fill={c.hairColor}
        />
      )}
      {c.mouth === 0 && (
        <path
          d="M43 68Q50 74 57 68"
          fill="none"
          stroke="#713e39"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {c.mouth === 1 && (
        <path d="M41 66H59Q57 76 50 76Q43 76 41 66Z" fill="#713e39" />
      )}
      {c.mouth === 1 && <path d="M43 66H57L56 69H44Z" fill="white" />}
      {c.mouth === 2 && (
        <path
          d="M45 70H55"
          fill="none"
          stroke="#713e39"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}
      {c.beard === 1 && (
        <path
          d="M50 63Q43 59 38 66Q44 70 50 66Q56 70 62 66Q57 59 50 63"
          fill={c.hairColor}
        />
      )}
      {c.hair === 0 && (
        <path
          d="M28 43V34Q28 20 50 20Q72 20 72 34V43L66 34Q50 29 34 34Z"
          fill={c.hairColor}
        />
      )}
      {c.hair === 1 && (
        <path
          d="M27 45V34Q25 16 49 17Q76 14 74 36L71 46L66 32Q49 40 36 31L31 46Z"
          fill={c.hairColor}
        />
      )}
      {c.hair === 2 && (
        <g fill={c.hairColor}>
          <circle cx="32" cy="32" r="10" />
          <circle cx="42" cy="25" r="11" />
          <circle cx="56" cy="25" r="12" />
          <circle cx="68" cy="33" r="10" />
        </g>
      )}
      {(c.hair === 3 || c.hair === 4) && (
        <path
          d="M26 46V33Q28 17 50 18Q73 17 74 37V46L67 35Q59 35 50 27Q42 36 32 37L31 48Z"
          fill={c.hairColor}
        />
      )}
      {c.hair === 5 && (
        <path
          d="M27 44V31Q50 14 73 31V44L68 34L62 37L56 32L49 36L42 32L35 37Z"
          fill={c.hairColor}
        />
      )}
      {c.glasses > 0 && (
        <g fill="none" stroke={c.accessory} strokeWidth="2.5">
          <rect
            x="31"
            y="45"
            width="17"
            height="14"
            rx={c.glasses === 1 ? 7 : 3}
          />
          <rect
            x="52"
            y="45"
            width="17"
            height="14"
            rx={c.glasses === 1 ? 7 : 3}
          />
          <path d="M48 49Q50 47 52 49M27 48H31M69 48H73" />
        </g>
      )}
      <path
        d="M36 86Q50 97 64 86"
        fill="none"
        stroke="white"
        strokeOpacity=".45"
        strokeWidth="2"
      />
    </svg>
  );
}
