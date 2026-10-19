---
name: "UNO — Tactile table"
description: "Vivid held cards over real baize and leather, with immediate direct play."
colors:
  ui-bg: "#fff8ec"
  ui-surface: "#fffcf5"
  ui-text: "#2c2c32"
  ui-muted: "#706b65"
  ui-line: "#e3dbce"
  ui-accent-red: "#c74531"
  ui-accent-blue: "#3265a0"
  midnight-bg: "#24272e"
  midnight-surface: "#30343c"
  midnight-text: "#fff8ec"
  midnight-muted: "#c5c3be"
  midnight-line: "#4a4d54"
  midnight-accent-red: "#f18c70"
  forest-bg: "#e5eddb"
  forest-surface: "#f3f6e9"
  forest-text: "#2d4032"
  forest-muted: "#5c6d58"
  forest-line: "#c7d3bf"
  sunset-bg: "#f4dfd1"
  sunset-surface: "#fff1e6"
  sunset-text: "#51372f"
  sunset-muted: "#795c4f"
  sunset-line: "#dfc4b4"
  arena-bg: "#101c1c"
  arena-surface: "#1c302d"
  arena-text: "#f1f4fa"
  arena-muted: "#b1bfd2"
  arena-line: "#3a4b63"
  arena-accent-red: "#f17d82"
  table-felt: "#245b49"
  table-rail: "#172a28"
  seat-surface: "#152926"
  turn-lime: "#d8ed82"
  arena-dark-ink: "#172130"
  move-action-ink: "#202b12"
  card-red: "#e73442"
  card-yellow: "#f7c934"
  card-green: "#159768"
  card-blue: "#2474df"
  card-wild: "#242837"
  card-paper: "#fffdf5"
  card-yellow-ink: "#332810"
  card-yellow-value: "#8b600b"
  card-back: "#172b2b"
  active-red: "#ff727a"
  active-blue: "#79b5ff"
  active-green: "#5adeaa"
  active-yellow: "#f7d86a"
  action-light-ink: "#fffaf1"
  play-yellow: "#f1c95b"
  play-green: "#c9dcb4"
  play-green-ink: "#2c3430"
  play-green-muted: "#4e5d47"
  play-yellow-muted: "#655425"
  play-green-hover: "#d9e6c9"
  play-yellow-hover: "#f7d775"
  avatar-red: "#ef755d"
  avatar-blue: "#8db6ed"
  avatar-yellow: "#e4c455"
  avatar-green: "#a8c991"
  avatar-lilac: "#c5afe5"
  avatar-peach: "#edae86"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(56px, 6.1vw, 88px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(34px, 4vw, 46px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  dialog-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-muted:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  table-label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  caption:
    fontFamily: "Outfit, sans-serif"
    fontSize: "11px"
  body-large:
    fontFamily: "Outfit, sans-serif"
    fontSize: "17px"
  turn-cue-phone:
    fontFamily: "Outfit, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    letterSpacing: "-0.02em"
  play-choice-medium:
    fontFamily: "Outfit, sans-serif"
    fontSize: "20px"
    fontWeight: 550
    lineHeight: 1.2
  play-choice-phone:
    fontFamily: "Outfit, sans-serif"
    fontSize: "22px"
    fontWeight: 550
    lineHeight: 1.2
  dialog-title-phone:
    fontFamily: "Outfit, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  wordmark-phone:
    fontFamily: "Outfit, sans-serif"
    fontSize: "36px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.04em"
  button:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.25
  wordmark:
    fontFamily: "Outfit, sans-serif"
    fontSize: "42px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.04em"
  play-choice:
    fontFamily: "Outfit, sans-serif"
    fontSize: "23px"
    fontWeight: 550
    lineHeight: 1.2
  turn-cue:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    letterSpacing: "-0.02em"
  card-value:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "70px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  card-index:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1
  card-action:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "46px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
rounded:
  inset: "8px"
  control: "14px"
  field: "10px"
  play-choice: "21px"
  panel: "12px"
  dialog: "16px"
  card: "6px"
  play-choice-phone: "18px"
  circle: "50%"
spacing:
  "4": "4px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "14": "14px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "22": "22px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
components:
  button-primary:
    backgroundColor: "{colors.ui-accent-red}"
    textColor: "{colors.action-light-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "50px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ui-text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "50px"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ui-text}"
    padding: "4px 0"
    height: "44px"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.field}"
    size: "44px"
  field:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.field}"
    padding: "12px 15px"
    height: "50px"
  play-choice-primary:
    backgroundColor: "{colors.play-yellow}"
    textColor: "{colors.ui-text}"
    typography: "{typography.play-choice}"
    rounded: "{rounded.play-choice}"
    padding: "14px 19px 14px 14px"
  play-choice-secondary:
    backgroundColor: "{colors.play-green}"
    textColor: "{colors.play-green-ink}"
    typography: "{typography.play-choice}"
    rounded: "{rounded.play-choice}"
    padding: "14px 19px 14px 14px"
  button-play-selected:
    backgroundColor: "{colors.turn-lime}"
    textColor: "{colors.move-action-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "50px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.dialog}"
    padding: "28px"
  opponent-badge:
    backgroundColor: "{colors.seat-surface}"
    textColor: "{colors.arena-text}"
    rounded: "{rounded.panel}"
    padding: "7px 10px"
  opponent-badge-active:
    backgroundColor: "{colors.turn-lime}"
    textColor: "{colors.arena-dark-ink}"
    rounded: "{rounded.panel}"
    padding: "7px 10px"
  player-character:
    backgroundColor: "{colors.avatar-red}"
    rounded: "{rounded.inset}"
    width: "33px"
    height: "41px"
  catch-button:
    backgroundColor: "{colors.card-yellow}"
    textColor: "{colors.card-yellow-ink}"
    rounded: "{rounded.inset}"
    padding: "5px 8px"
    width: "56px"
    height: "44px"
  milestone-stamp:
    textColor: "{colors.ui-muted}"
    rounded: "{rounded.card}"
    padding: "12px 5px 9px"
  milestone-stamp-earned:
    backgroundColor: "{colors.card-yellow}"
    textColor: "{colors.card-yellow-ink}"
    rounded: "{rounded.card}"
    padding: "12px 5px 9px"
  uno-card:
    backgroundColor: "{colors.card-red}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.card}"
    width: "82px"
    height: "122px"
---

# Design System: UNO — Tactile table

## Overview

**Creative North Star: "The after-hours card table"**

UNO feels like a held hand of real cards over a shared after-hours table. Deep green baize, a dark padded leather rail, vivid faces and ivory stock establish the material world. Cards are the controls: a legal face plays on its first activation; the foreground fan makes pickup and deliberate upward release tangible.

The launch and settings shell retains warm, theme-aware surfaces and compact card-face player identities. Live play uses a fixed green-black material palette with lime turn feedback, independent of the selected appearance. The launch illustration is a fan of the same native deck used in play. Outfit UI and Barlow Condensed card lettering remain the two pinned families.

**Key Characteristics:**

- One shared native card face across launch, hand, piles and motion.
- Outfit interface lettering paired with Barlow Condensed card numerals.
- Warm themed supporting surfaces and a fixed baize-and-leather live table.
- First-activation legal play, nonmatching-card inspection and deliberate upward release.
- Bounded hand scrolling, contextual controls and paper/contact feedback that never delays a turn.
- Real round outcomes and optional device-local milestone cards.

Refreshed from the finished implementation on 2026-10-19. The owner-directed replacement in `.impeccable/review/direct-play/contract.md` and `.impeccable/direction.md` supersedes the previous midnight table and inspect-first flow; launch/settings remain incumbent. Evidence is `app/table.css`, `components/UnoCard.tsx`, `components/HandCard.tsx`, `components/GameBoard.tsx`, `hooks/useGamePresentation.ts`, `lib/cardGesture.ts` and `lib/tableChimes.ts`, alongside unchanged shell primitives. This is code-led work with no approved raster comp. The fresh full material review is `finish-review-rebuild.md` in that review packet; `verdict.md` confirms the sole rail-shadow fix resolved. Six valid captures at 320, 390 and 1440px are seeded local fixtures, not public matches. Reduced-motion behavior is evidenced by source guards, not an emulated capture; screenshots and audio scheduling assertions do not certify physical speaker quality.

The earned-moments extension was recorded from `components/PlayerProgress.tsx`, `components/RoundSummary.tsx`, `components/GameBoard.tsx`, `components/GameFeedback.tsx`, `lib/playerProgress.ts` and the progress/earned-moments stylesheet blocks on 2026-10-20. Its contract, verification and ship review live in `.impeccable/review/table-rewards/`. Eleven 320/390/1440px captures cover synthetic local result/pressure states and a home capture using actual device history (one round, zero wins). The pure collection preview did not write history; its temporary route was removed before production. This extension retains the materials, deck, fonts and sound already recorded here.

The 2026-10-20 interaction audit in `.impeccable/review/interaction-audit/` records keyboard continuity, accurate release geometry, bounded interruption, responsive landscape/short-phone compositions, arena action contrast and blocked-storage audio controls. Saved pressure captures use the existing loopback fixture; no synthetic completed rounds were recorded.

## Colors

Warm interface paper frames the invitation to play; stable saturated card colors stand over deep green baize and dark leather during play.

### Primary

- **Coral action:** `ui-accent-red` identifies primary shell actions, selected preferences and the wordmark period. The midnight appearance uses its lighter coral counterpart.
- **Turn lime:** `turn-lime` marks the live active seat, local turn cue, available draw, selected-card Play action and arena keyboard focus. The Play label uses `move-action-ink`, the dark green ink paired with lime; retain this final foreground through appearance overrides. It belongs to meaningful game state.
- **Play yellow and play green:** `play-yellow` and `play-green` distinguish immediate bot play and room creation. Green uses `play-green-ink`; each choice has its own muted supporting ink and lighter hover tone. These are supporting entry controls, not new card colors.

### Secondary

- **Card spectrum:** `card-red`, `card-yellow`, `card-green`, `card-blue` and `card-wild` belong to the deck. Yellow keeps its vivid shell and dark corner ink; its center rank uses `card-yellow-value` over ivory (5.46:1 contrast). Other center ranks retain the face color; other corner indices use ivory. The same yellow and dark yellow ink identify collected milestone cards and last-card/catch state; unearned collection cards retain themed muted ink and line borders.
- **Active-color spectrum:** the brighter `active-*` swatches accompany a written color name on the dark arena; color alone never carries this state.
- **Player palette:** the six `avatar-*` colors identify small original card-face badges. These remain supporting identity marks rather than a separate illustration system.

### Neutral

- **Warm paper and ink:** `ui-bg`, `ui-surface`, `ui-text`, `ui-muted` and `ui-line` form the supporting shell. Paper, midnight, forest and sunset appearances change these root variables.
- **After-hours table:** `arena-bg`, `arena-surface`, `arena-text`, `arena-muted` and `arena-line` override interface roles inside live play. `table-felt` and `table-rail` grade the real material rasters; `seat-surface` keeps inactive badges quiet. These are material base colors, not substitutes for the texture assets.
- **Ivory stock and dark back:** `card-paper`, green-black `card-back` and `arena-dark-ink` anchor the deck and dark ink on lime. The back carries a red diagonal mark and ivory Outfit lettering.

**The Two Surfaces Rule.** Honor root appearance variables on supporting screens; scope the fixed baize-and-leather palette to live play. Card colors and ivory stock stay stable across both.

## Typography

**Display and Body Font:** Outfit, with sans-serif fallback.
**Card Font:** Barlow Condensed, with sans-serif fallback; card faces use italic lettering at weight 800.

**Character:** A geometric UI voice stays direct and legible while narrow, large card numerals preserve the physical deck's energy. The font-display variable aliases the body font; it is not a third family.

### Hierarchy

- **Display:** the frontmatter display role leads the launch. It becomes 60px at 701–1000px, `clamp(47px, 11vw, 68px)` at phone widths and 45px at 380px and below.
- **Headline:** the fluid headline role introduces setup. Dialog titles use the separate dialog-title role and its phone variant. Setup headlines reduce to 35px on phones.
- **Choice and turn:** play-choice lettering is 23px at rest, with 20px medium and narrow variants and 22px on ordinary phones. The turn cue is 18px on desktop and 16px on phones; it is game status, not a display heading.
- **Body and label:** body, muted body, form labels, buttons and table labels use the compact roles in frontmatter. Seat names remain 12px on phones; supporting table counts and pile labels use 11px where space is constrained.
- **Wordmark:** the compact shell mark uses its frontmatter role, with the wordmark-phone variant on phones; the arena reduces it to 34px, then 30px on phones.
- **Card typography:** card-value, card-index and card-action sizes describe the unscaled 82 × 122px face. They scale together with the entire card through its multiplier; these are card graphics, not extra interface text levels.

Milestone names and progress values use compact Outfit labels; the terminal count column uses 17px tabular numerals with weight 600. Last-card and deck-penalty numerals reuse the condensed italic card face. These extend the existing roles rather than introducing a reward font or a new display hierarchy.

**The Deck Lettering Rule.** Use Outfit for UI, headings and the card-back wordmark; reserve Barlow Condensed for indexed card faces. Preserve italic numerals and the shared face proportions when scaling.

This is a role-based hierarchy with responsive sizes, not a mathematical modular scale. The documented display, headline, dialog, body, label and card roles intentionally describe the built system; incidental tiny decorative text does not establish a reusable type token.

## Layout

The supporting shell uses centered content: the launch reaches 1450px and setup stays within 650px. Desktop launch pairs copy and choices with the native card fan. At 700px and below, the heading, fan and two primary choices stack; secondary setup/join shortcuts follow the primary group, then optional help. The introductory sentence yields to the visual. Primary choices precede shortcuts in keyboard order as well. Common spacing repeats the frontmatter's compact 4–32px vocabulary rather than a strict single interval.

Live play has a sparse header, a broad rounded baize mat inside a leather rail, opponents around two physical piles, and the local fan in the foreground. The game container reaches 1440px. Desktop uses a 68px header and 40px side padding; the 800px breakpoint reduces the header to 62px and side padding to 16px; phones use 12px game padding. The rail extends beyond the phone edges while seats, piles and active-color text remain readable.

The active-color swatch and written name sit in normal flow after the turn heading inside one wrapping cue. The cue stays within the table width minus 24px, with a 3px row gap; the heading can wrap long names at any character. This shared placement follows the cue across every viewport and seat count. Phone seats hide decorative avatars and keep names and counts readable; five- and six-seat counts use a compact card icon where needed. The 360px breakpoint further compacts pile and opponent-card sizes. Large desktop viewports and short desktop heights have separate card-scale adjustments.

The hand owns horizontal overflow. It keeps generous upper clearance for lift and focus, with cards at useful physical sizes instead of reducing the entire row. Fan position is normalized and bounded: rotation stays within ±16 degrees and the arc drops at most 34px. Phone cards overlap by 36px, reducing to 30px at 360px and below for ordinary hands; large hands retain 36px overlap and scroll. This leaves useful center tap targets instead of relying on exposed corner slivers. Selection scrolls its card into view when selected, sorted or resized; the Play action also names that card. Safe-area padding protects the move dock below the hand. The dock places hints beside actions on desktop and stacks them at 540px and below. It contains contextual Pass and, only when a previously inspected card becomes legal, the full named Play fallback. Draw belongs exclusively to the physical deck, including penalty draws. The action group is bounded to 65% of the desktop dock and uses the full phone width; button text can wrap, retaining complete card identity and a fixed-size arrow. Eligible UNO sits separately beside the hand title in the toolbar, with a 44px minimum height. Short phone viewports compact the arena and opponent backs and reserve a 171px hand row; the large desktop arena row has a 380px minimum. At 1100px wide and 850px high or larger, the hand strip is 260px tall and the card multiplier is 1.65, preserving the outer fan corners above the dock. These adjustments keep controls reachable without shrinking the card faces into a miniature row.

Landscape phones (at least 600px wide and no taller than 540px) place the table and hand side by side under a 48px header; the hand, hint and contextual controls remain in the same viewport. Short portrait phones (540px or narrower and at most 650px high) use a 52px header, compact pile/hand sizes and staggered top/side seats. Confirmed with six seats and twelve cards at 844×390 and 320×568; labels remain distinct and Catch has a 56×44px target.

The optional collection follows the primary play choices on phone home layouts. Its four mini cards stay in a four-column grid, with 7px gaps reduced to 5px at 380px and below; the summary has a 44px minimum target. The progress block is bounded to 440px on home and fills the result dialog. Results scroll inside the native modal; their action group sticks at bottom zero within the dialog, with its own themed background and no negative bottom margin. At 540px and below the result actions stack at full width. Long winner and player names wrap rather than push counts or rematch outside the bounds.

**The Hand Owns Its Width Rule.** Keep overflow inside the hand, preserve corner identity and focus clearance, and bound the fan arc as the card count grows.

## Elevation & Depth

Real baize fibers, padded leather grain, soft cast shadows, an inset mat and actual card overlap establish physical depth. Controls receive modest lift; cards deepen as they rise, are inspected or travel. The deck's narrow hard edges depict a physical stack. They are native to this card world and do not establish block shadows for general controls.

The mat renders `public/textures/green-baize.jpg` at a 560px repeat scale over its material base; the rail renders `public/textures/padded-leather.jpg` at 340px. Both use soft-light blending and native rounded clipping. Their exact generation prompts are preserved beside the JPEGs as `.prompt.txt` files, with embedded provenance in the assets. Preserve those materials and provenance when extending the table; a crossed CSS grid is not the felt material.

### Shadow Vocabulary

- **Supporting surface:** `--ui-shadow` supplies the ambient dialog shadow and varies with appearance.
- **Card at rest:** `inset 0 1px 1px #ffffff60, 0 5px 10px #03090870` gives native stock a small edge highlight and soft lift.
- **Leather rail:** `inset 0 2px 3px #b9d3c036, 0 18px 38px #020a0966` supplies padded, soft depth; the mat uses `inset 0 5px 12px #061e2160`.
- **Held fan:** `-4px 7px 11px #060c1759` separates overlapping cards; inspection deepens to `0 14px 25px #060c1780`.
- **Draw stack:** `1px 3px 0 #cad2db, 3px 6px 0 #67768a, 4px 13px 15px #080f1e80` distinguishes a usable deck from one face.
- **Launch choice:** `0 6px 14px #2c2c3228` adds soft lift to the broad play controls.

**The Paper Lift Rule.** A moving or inspected card changes its own depth and reveals its face. Keep unrelated chrome quiet and reserve hard stacked edges for actual piles.

## Shapes

The native face is a tightly rounded rectangle (6px base radius) with ivory edging and a cream diagonal ellipse (116% width, 64% height, rotated −34 degrees). Its base dimensions, radius and index geometry scale as one unit. Wilds use the same silhouette with a four-color circular symbol; action faces use shared SVG symbols or large draw values. The back uses a green-black base, a red diagonal ellipse, faint diagonal stripes and an ivory Outfit UNO mark. Reverse uses the shared Repeat2 SVG; wild draw four retains a subdued four-color mark behind its large draw value.

Milestone collectibles reuse the tight card corner and flat geometric icon language. Their small four-card disclosure fan inherits the deck's overlap; it is supporting progress, not another photographic material.

Controls, fields, panels and dialogs use the observed rounded vocabulary in frontmatter. Launch choices have broader corners, reducing to 18px on phones. Circular color swatches and count badges communicate state. The table's broad responsive rail and the hand's curved overlap carry the large forms; do not transfer card rotation to ordinary information containers.

## Components

### Buttons

Broad shell actions use the button role, a 50px minimum height, rounded control corners and 14px × 22px padding. Supporting-screen primary actions use coral; live-arena primary actions use the existing turn-lime and dark-green ink in every shell appearance. Secondary actions are outlined and transparent; text actions remain quiet. Compact utilities retain the field radius and have a 44px minimum hit area; small buttons also have a 44px minimum height. Hover changes surface tone; press feedback is immediate. Global keyboard focus uses a blue outline; arena focus uses lime. Disabled actions reduce opacity, while the physical deck remains visibly present when unavailable.

### Inputs / Fields

Native labeled fields use the themed surface, a fine line border, the field radius and a 50px height. The local human-name label and input form one compact field rather than separate setup-grid rows. Its 8px grid gap and existing 8px label margin produce 16px of visible separation. At 800px and below native inputs and selects use 16px text. Focus strengthens the border and retains the visible outline. Placeholder ink stays muted. Range inputs use the accent color without custom replacement controls.

### Navigation

Settings use four equal tabs with a fine baseline and a coral selected underline. Phone tabs hide their decorative SVGs and preserve their text. In-game sorting and activity live in the game menu; the header keeps room context and named utilities compact.

### Cards / Containers

Use the native dialog primitive for settings, game menu, color choice and results. Dialogs use the themed surface, ambient shadow, bounded viewport height and internal scrolling. Supporting panels and separated rows stay visually subordinate to the cards. Original small card-face player badges identify seats and launch choices; phone seats may hide them for readable names.

### Entry, setup and room choices

The large yellow launch choice deals immediately with the saved local crew and rules. The green choice starts room creation. Quiet secondary links expose bot setup and room joining. Setup shows the human name, two-to-six-seat count and a compact bot crew; bot renaming stays inside a native disclosure. Local setup and room hosts share the same rule-preset and starting-hand controls before dealing, with custom rules as a secondary text action.

Creation and joining are distinct labeled choices. Joining accepts either the six-character room code or an invitation URL in one field, normalizes the code without truncation, and places validation guidance beside it. Persistent friend codes remain inside the separate Friends & invitations disclosure. Room sharing uses named copy-code and invitation-link actions. Bot seats are identified as bots; host controls and the guest waiting message reflect their actual roles.

### Active seat and turn cue

An opponent's active badge fills lime with dark text; the local active turn cue uses lime text and a small dot. Turn status follows the live state. The named active color and its swatch are static children after the turn heading, using muted ink at 12px. The cue wraps as a group within the available width, and long turn names can wrap rather than conceal color or overflow the page. Pile labels remain beside their physical piles without duplicating this combined status.

### Earned pressure and action signals

A one-card opponent gets one yellow numeral/UNO marker attached inside the opponent hand, clear of seat labels and the physical deck. It settles once in 240ms; reduced motion removes that animation and preserves the static marker. The label still carries the actual count or called-UNO state for assistive technology. An eligible missed call exposes a compact 56 × 44px Catch control with the full accessible name “Catch [player]’s missed UNO”; it disappears when the state is resolved. Pending actions, color choice and disconnection prevent unavailable catches.

A real pending draw overlays its count on the physical deck and dims the back wordmark; the deck's accessible name retains the complete penalty count. Never manufacture pressure from a decorative value. The brief reverse action graphic uses the same Repeat2 icon as the deck. Discard-all feedback displays the negative total actually removed, including the played card (`1 + discardAllCount`), rather than an invented score. Existing feedback stays bounded and reduced motion suppresses its spatial burst. Call-out feedback reads the actual penalty from the engine; audio event identity follows the played action card.

### Completed round and milestone collection

The native result dialog uses the winner's existing card backs, player identity and trophy, then a terminal “Cards left” list. The winner comes first; all other rows retain their seat order. Counts are actual remaining hands, with a tabular count column and a distinct winner cue. They do not establish points or finishing ranks. The local player keeps a textual identity cue. The existing local/host “One more round,” online guest readiness and “Back to home” handlers remain the real actions; online rematch controls are unavailable while disconnected; the scrollable dialog keeps them reachable when the collection is expanded.

`PlayerProgress` reads validated device history and delegates to the exported pure `ProgressCollection`; no progress UI is shown before the first completed round. The compact record names rounds, wins and the device scope. Current streak appears only when greater than one. A native details/summary disclosure shows the earned count and optional four-card collection: **First win** (one win), **Hat trick** (three wins), **Table regular** (ten completed rounds), and **On fire** (best streak of three). Progress fractions cap at their goals. Collected cards use deck yellow, dark ink and a check; unearned cards use themed muted ink, a line border and their fraction. Their icons use the established SVG system.

The collection derives from the existing idempotent completed-round record; it introduces no separate reward storage. Best streak keeps On fire earned after later losses, while the record's current streak reflects the current run. Rendering illustrative data through the pure collection must not mount result recording or write synthetic history.

**The Earned History Rule.** Show rewards only from validated completed rounds. Keep best-streak collectibles earned after a loss, keep current streak separate, and present terminal hand counts without inferred points or finishing ranks.

### Held hand and piles

`UnoCard` owns all native faces; `HandCard` owns inspection and gestures; `app/table.css` owns the deck, arena, fan and launch preview. The first tap or native keyboard activation plays a legal card immediately. A nonmatching card remains inspectable; explicit named Play is a fallback if that inspected card later becomes legal. Waiting players can inspect their hands; a legal exact-match jump-in follows the same direct-play availability. Cancelled dialogs return focus to their opener. A locally played focused card hands keyboard focus to a surviving neighbor without stealing focus from another dialog/control. Arrow keys browse the hand with wrapping; Home and End reach its ends, keeping focused cards in view. A legal card can also be dragged upward. Readiness and release use the same `canReleaseCard` predicate: `dy < -65` and `abs(dy) > abs(dx) * 0.8`, with finite coordinates. The table says “Slide up to play” during lift and “Release to play” only when that exact predicate passes. Focus lifts a card, native button activation preserves keyboard access, and a small ivory bottom mark identifies legal cards beyond saturation alone.

Pointer capture starts on the face. Nonprimary pointers and nonleft clicks are ignored; button loss, pointer cancellation, capture loss, blur, visibility changes and unmount cancel or clean up the gesture. An unsuccessful drag returns quickly. Reduced motion removes travel and drag rotation while retaining a usable selection state. Identity follows the card through sorting and game updates.

The contextual move dock sits below the hand near the thumb. It exposes Pass when available and named Play for a pre-inspected card that becomes legal. The physical deck is the sole Draw control; its accessible name and adjacent label name penalty counts. Eligible UNO appears in the hand toolbar, not in the bottom dock. The toolbar button and U shortcut share one availability predicate: an active round, no pending color choice or action, a connected online session, enabled UNO declarations, one or two cards, and no declaration already made. The hint describes the same decision: exact-match jump-in, play or pass after drawing, pending color/action, penalty draw or reconnect state. A single local draw names its card in the existing hint when play or pass is available; a no-match draw says “No match. Passing…” to reflect automatic passing. Pending and disconnected actions cannot submit another move. Sorting and activity remain in the menu. The same native faces form the launch fan, so no separate raster illustration defines card appearance.

**The Direct Move Rule.** Play a legal face on its first activation. Keep nonmatching inspection and the full named fallback for a pre-inspected card that becomes legal. Reveal actual new local draws without forcing selection; every gesture, shortcut and hint follows current legal-action state.

**The Play Comes First Rule.** Motion and sound explain the current action without blocking controls, queuing stale actions or changing turn timing.

An actual newly added local draw is scrolled into view before hand rectangles and arrival destinations are measured. Card identity is found against the previous hand, so the reveal works in a sorted scrolling hand without forced selection. Initial deal, opponent draws and hand shuffles do not trigger this draw reveal or recenter the reader’s horizontal position. Reduced motion retains the reveal while removing the arrival flight.

Card flights use the actual release center, width and composed rotation, landing at the pile’s actual angle. The shared `getCardFlight` geometry bounds play, draw and deal to 190–262ms. The table stays still. Surviving cards reflow in their own fan transform over 180ms; local arrivals are capped at six representatives with 25ms stagger, including the newest in a large draw. Redistributed shuffle cards originate at the played pile. Hand inspection settles in 170ms and unsuccessful drag return in 180ms. A new snapshot interrupts obsolete animations and ghosts; hidden pages, unmount and a newly enabled reduced-motion preference cancel them too. Reduced motion removes spatial flights and entrances, retaining a 900ms opacity-only special-action signal. These durations never schedule the engine.

Pointer-down primes audio silently; vertical lift or explicit nonmatching-card inspection produces a pickup texture. Horizontal hand scrolling does not make pickup sounds. Ordinary plays, draws and action cards use paper/contact rather than melody. Pitched signatures are reserved for UNO, call-outs and results. `public/audio/card-play.wav` carries `card-play.source.json` provenance, with an immediate synthesized fallback while it loads. Pickup and every direct action through the shared action wrapper prime audio synchronously in the originating gesture; UNO also primes explicitly. Gesture unlock exposes honest audio readiness. Physical speaker quality has not been certified by a listening check. Only the latest action younger than 160ms may follow an in-progress unlock; old actions expire. Mute, disabled card sounds, zero volume and hidden pages suppress or stop feedback. Music and speech are not default turn feedback. If browser storage rejects writes, this session retains mute/volume settings in memory and still notifies controls and the audio engine.

## Do's and Don'ts

### Do:

- **Do** use the same authored face for launch, hand, piles and card motion.
- **Do** preserve stable deck colors and the written active-color label.
- **Do** use the scoped baize-and-leather table palette while honoring appearance on supporting screens.
- **Do** retain readable six-seat phone names, visible corner indices and an independently scrolling large hand.
- **Do** play legal cards on first activation and keep nonmatching inspection, turn state and situational actions clear with touch and keyboard.
- **Do** keep the full named Play action, selected card and current hint in agreement; retain dark ink on lime.
- **Do** reveal actual new local draws without selecting them and preserve horizontal position on unrelated updates.
- **Do** keep Draw on the deck, eligible UNO at hand level, and the dock limited to contextual Pass and the pre-inspected-card Play fallback; give button and keyboard the same availability rules.
- **Do** put secondary entry shortcuts after the primary choices and keep optional bot/friend details in disclosures.
- **Do** honor reduced motion, mute, audio readiness and interrupted gesture cleanup.
- **Do** keep presentation responsive to the current published state without delaying play.
- **Do** derive optional milestone cards from completed device-local rounds and keep result actions reachable inside the native dialog.
- **Do** attach pressure cues to their actual opponent hand or penalty deck and retain full accessible names.

### Don't:

- **Don't** restore clay hero art, Fredoka, a third font family or a parallel component library.
- **Don't** replace the held fan with a flat shrinking row or let large hands overflow the page.
- **Don't** show UNO when ineligible, duplicate Draw in the dock or turn sorting into a permanent table control.
- **Don't** use Unicode glyph icons in place of the established SVG icon system.
- **Don't** give general controls hard offset block shadows; physical deck edges are the intentional exception.
- **Don't** queue narration, wait for sound or animation, or add a blocking splash.
- **Don't** infer points or finishing ranks from cards left, grant rewards per click, or claim a milestone is new without before/after evidence.

Not canonized: vestigial sub-11px shell/progress captions and the unused tiny table-watermark styling do not establish a legibility floor or authorize new kickers and eyebrows. Superseded midnight-table declarations, old inspect-first guidance and the removed hard rail shadow are not reusable rules. The new 10px milestone descriptions and local-player annotations are also not a reusable typography floor. Detector advisories, including the earned-moments report’s 83 findings, are review evidence rather than new tokens. Physical speaker balance and reduced-motion browser rendering remain unverified; neither is legitimized as a system value.
