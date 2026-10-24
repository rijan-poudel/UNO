---
version: 1
slug: "components-gameboard-tsx"
primary_target: "components/GameBoard.tsx"
related_targets:
  [
    "app/arena.css",
    "app/club.css",
    "components/OpponentSeat.tsx",
    "components/OpponentSeat.module.css",
    "components/PlayerAvatar.tsx",
    "components/PlayerAvatar.module.css",
    "components/TurnCue.tsx",
    "components/HandCard.tsx",
    "components/UnoCard.module.css",
    "hooks/useGamePresentation.ts",
    "hooks/usePhonePortrait.ts",
  ]
---

Visitor mode: Experience. Scope: live local/online play and the phone orientation gate.
Job: read the current actor/action/deadline, find a lifted legal card and tap/flick or draw, with every card reachable and piles clear of identities.

Direction: Color play, approved October 24 as a composite of Classic, Color court and After-hours. Current contract `.impeccable/review/experience-reset/contract.md`, FORM seed `2fba311c`; current system `DESIGN.md`. The three approved refs are `.impeccable/mocks/decision/reset-classic.png`, `reset-color-court.png` and `reset-after-hours.png`. No catalog QUALITY BAR was selected. The combined commitment overrides literal sample names/counts/timing from any one comp.

World: coherent rich blue field with warm cream foreground, human illustrated portraits, native vivid cards and amber action emphasis. Classic is blue, Stack party deeper blue and Wild table plum, selected from supported rules by `getTableMood`. Shared components retain one geometry/interaction vocabulary. No giant cast, painted menu controls, ink swashes, room scenery, poker rail/felt, diagonal printed corners or giant orbit field. Earlier violet/Comic-card/illustrated-room briefs are superseded; preserve their historical artwork and provenance without restoring their directives.

Composition: small wordmark/Menu at the perimeter, portrait identities around the upper field, nearby tilted draw/discard piles above a curved bottom-held fan. The arena fills `100dvh`, internal width caps1600px and page overflow clips. Hand overflow stays horizontal inside its own scrollport, with fan-end clearance, paging controls and lift/focus headroom. Ordinary desktop hand scale1.65/pile1.35; tall desktop2.15/1.6. Under680px height1.35/1.08. Landscape phone under460px height1.08/0.7; under360px0.88/0.48. Hand crops below the viewport while its scrollport contains full card faces. Direct legal play stays immediate; a flat shrinking row is not the hand model.

Portraits: six original human heads come from `public/artwork/player-portraits.webp`, consistently framed with cream circular rims; exact prompt provenance stays alongside the asset. Opaque dark-blue172px nameplates use56px portraits,16px names and13px exact counts. Active badge is cream with amber portrait outline; catchable badge is amber. Compact labels are126px wide/44px minimum high at≤460h and100px at≤360h, with36px then30px portraits. Names remain12px, counts11px, status10px; name/status share an explicit row, with4px then2px gaps, preserving a consistent two-tier footprint. Do not infer final module colors from older global arena selectors.

Turn cue: actual actor/action and clockwise/counterclockwise icon/text sit immediately above the hand. Amber marks the local turn, opaque dark blue other turns. The real human deadline drives the ring and number; last5seconds use urgency colors. Desktop message64px minimum high,18px title/12px hint; under680h56px/16px title; under460h42px/13px title/10px hint and32px ring/12px numeral. Short screens place direction beside the cue; the shortest omits its visible word while preserving the accessible direction. This visible cue intentionally supersedes the former no-visible-routine-HUD instruction.

Flow and signature: human turns last30seconds; draw or metadata cannot restart the deadline, online server owns timing, local portrait gating pauses local timing while online continues. Card flights preserve measured origin and metadata continuity. A move leaves the fan and lands on the pile; penalties name the real total/target and draw automatically if no legal stack response exists. Bots publish one snapshot at a time with1.15second pacing. Skip/reverse/penalty impacts are bounded. Audio/music respect saved preferences, respond without a queue and never gate turns. Reduced motion retains state while removing travel.

Interaction: one roving hand Tab stop, arrows/Home/End browsing and immediate Enter/Space legal play. Shared gesture release predicate also drives drag readiness. Inspection names the card, explains the match and dismisses by44px Close, Escape or outside tap. Wild choices show actual remaining color counts and R/Y/G/B shortcuts; short screens omit keycaps. Menu owns sound, rules/help, room context and Leave. Native `Modal` keeps a visible Close and reachable short-landscape decisions.

Responsive evidence: `.impeccable/review/experience-reset/` contains desktop, six-seat844×390/568×320, portrait gate and menu captures plus finish-review. The initial `six-844.jpg`/`six-568.jpg` precede the final compact row/gap corrections; final source is authoritative. Check six seats, status-bearing badges, a20-card hand, keyboard focus and reduced motion. Static captures cannot establish physical touch/speaker quality or motion execution.
