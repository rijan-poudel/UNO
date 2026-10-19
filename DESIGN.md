---
name: "UNO — Tactile table"
description: "Vivid held cards, a quiet midnight arena, and immediate play."
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
  arena-bg: "#111925"
  arena-surface: "#1c293a"
  arena-text: "#f1f4fa"
  arena-muted: "#b1bfd2"
  arena-line: "#3a4b63"
  arena-accent-red: "#f17d82"
  table-felt: "#1b293b"
  table-line: "#34455e"
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
  card-back: "#202938"
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
  card: "9px"
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
    height: "38px"
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
    backgroundColor: "{colors.arena-bg}"
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
  uno-card:
    backgroundColor: "{colors.card-red}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.card}"
    width: "82px"
    height: "122px"
---

# Design System: UNO — Tactile table

## Overview

**Creative North Star: "The held-card table"**

UNO feels like a hand of real cards over a quiet modern playing arena. Vivid faces, ivory stock, condensed italic numerals and a curved foreground fan carry the energy. Outfit lettering gives navigation and game information one clear voice.

The launch and settings shell retains warm, theme-aware surfaces and compact card-face player identities. Live play uses a fixed midnight palette with lime turn feedback, independent of the selected appearance. The launch illustration is a fan of the same authored deck used in play; the owner-rejected clay/Fredoka world is superseded.

**Key Characteristics:**

- One shared native card face across launch, hand, piles and motion.
- Outfit interface lettering paired with Barlow Condensed card numerals.
- Warm themed supporting surfaces and a fixed midnight live arena.
- A held fan with immediate inspection, upward drag and bounded scrolling.
- Situational controls and brief feedback that never delays a turn.

Refreshed from the finished journey source on 2026-10-19. Visual authority is `.impeccable/direction.md`, with the owner-authorized journey adaptation in `.impeccable/review/journey/contract.md` superseding the earlier duplicate-Draw prohibition. This is code-led work with no approved raster comp. Evidence includes `app/page.tsx`, `app/globals.css`, `app/table.css`, `components/GameBoard.tsx`, `components/GameSetup.tsx`, `components/TableRules.tsx`, `components/OnlineLobby.tsx`, `components/home/HomeScreen.tsx`, `lib/roomCodes.ts` and `lib/playerNames.ts`, alongside the incumbent card and presentation components. The journey review packet lives in `.impeccable/review/journey/`; current source takes precedence over captures made before the material fixes.

## Colors

Warm interface paper frames the invitation to play; stable saturated card colors and a subdued midnight arena make the hand the focal point.

### Primary

- **Coral action:** `ui-accent-red` identifies primary shell actions, selected preferences and the wordmark period. The midnight appearance uses its lighter coral counterpart.
- **Turn lime:** `turn-lime` marks the live active seat, local turn cue, available draw, selected-card Play action and arena keyboard focus. The Play label uses `move-action-ink`, the dark green ink paired with lime; retain this final foreground through appearance overrides. It belongs to meaningful game state.
- **Play yellow and play green:** `play-yellow` and `play-green` distinguish immediate bot play and room creation. Green uses `play-green-ink`; each choice has its own muted supporting ink and lighter hover tone. These are supporting entry controls, not new card colors.

### Secondary

- **Card spectrum:** `card-red`, `card-yellow`, `card-green`, `card-blue` and `card-wild` belong to the deck. The yellow face uses dark corner ink; other faces use ivory corner ink. The ivory ellipse holds a large value in the face color.
- **Active-color spectrum:** the brighter `active-*` swatches accompany a written color name on the dark arena; color alone never carries this state.
- **Player palette:** the six `avatar-*` colors identify small original card-face badges. These remain supporting identity marks rather than a separate illustration system.

### Neutral

- **Warm paper and ink:** `ui-bg`, `ui-surface`, `ui-text`, `ui-muted` and `ui-line` form the supporting shell. Paper, midnight, forest and sunset appearances change these root variables.
- **Midnight arena:** `arena-bg`, `arena-surface`, `arena-text`, `arena-muted` and `arena-line` override interface roles inside the game page. `table-felt` and `table-line` give the oval its quiet material boundary.
- **Ivory stock and dark back:** `card-paper`, `card-back` and `arena-dark-ink` anchor card material and the lime-backed UNO mark.

**The Two Surfaces Rule.** Honor root appearance variables on supporting screens; scope the fixed midnight palette to live play. Card colors and ivory stock stay stable across both.

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

**The Deck Lettering Rule.** Use Outfit for UI, headings and the card-back wordmark; reserve Barlow Condensed for indexed card faces. Preserve italic numerals and the shared face proportions when scaling.

This is a role-based hierarchy with responsive sizes, not a mathematical modular scale. The documented display, headline, dialog, body, label and card roles intentionally describe the built system; incidental tiny decorative text does not establish a reusable type token.

## Layout

The supporting shell uses centered content: the launch reaches 1450px and setup stays within 650px. Desktop launch pairs copy and choices with the native card fan. At 700px and below, the heading, fan and two primary choices stack; secondary setup/join shortcuts follow the primary group, then optional help. The introductory sentence yields to the visual. Primary choices precede shortcuts in keyboard order as well. Common spacing repeats the frontmatter's compact 4–32px vocabulary rather than a strict single interval.

Live play has a sparse header, an oval table with opponents around two physical piles, and the local fan in the foreground. The game container reaches 1440px. Desktop uses a 68px header and 40px side padding; the 800px breakpoint reduces the header to 62px and side padding to 16px; phones use 12px game padding. The table may extend beyond the phone edges while seats, piles and active-color text remain readable.

The active-color swatch and written name sit in normal flow after the turn heading inside one wrapping cue. The cue stays within the table width minus 24px, with a 3px row gap; the heading can wrap long names at any character. This shared placement follows the cue across every viewport and seat count. Phone seats hide decorative avatars and keep names and counts readable; five- and six-seat counts use a compact card icon where needed. The 360px breakpoint further compacts pile and opponent-card sizes. Large desktop viewports and short desktop heights have separate card-scale adjustments.

The hand owns horizontal overflow. It keeps generous upper clearance for lift and focus, with cards at useful physical sizes instead of reducing the entire row. Fan position is normalized and bounded: rotation stays within ±16 degrees and the arc drops at most 34px. Large phone hands reduce overlap and scroll. Selection scrolls its card into view when selected, sorted or resized; the Play action also names that card. Safe-area padding protects the move dock below the hand. The dock places hints beside actions on desktop and stacks them at 540px and below. Short phone viewports compact the arena and opponent backs to keep move controls reachable.

**The Hand Owns Its Width Rule.** Keep overflow inside the hand, preserve corner identity and focus clearance, and bound the fan arc as the card count grows.

## Elevation & Depth

Soft cast shadows, an inset oval and real card overlap establish physical depth. Controls receive modest lift; cards deepen as they rise, are inspected or travel. The deck's narrow hard edges depict a physical stack. They are native to this card world and do not establish block shadows for general controls.

### Shadow Vocabulary

- **Supporting surface:** `--ui-shadow` supplies the ambient dialog shadow and varies with appearance.
- **Card at rest:** `0 5px 10px #070c1659` makes an ordinary face physical.
- **Held fan:** `-4px 7px 11px #060c1759` separates overlapping cards; inspection deepens to `0 14px 25px #060c1780`.
- **Draw stack:** `1px 3px 0 #cad2db, 3px 6px 0 #67768a, 4px 13px 15px #080f1e80` distinguishes a usable deck from one face.
- **Launch choice:** `0 6px 14px #2c2c3228` adds soft lift to the broad play controls.

**The Paper Lift Rule.** A moving or inspected card changes its own depth and reveals its face. Keep unrelated chrome quiet and reserve hard stacked edges for actual piles.

## Shapes

The native face is a rounded rectangle with ivory edging and a filled, rotated ivory ellipse. Its base dimensions, radius and index geometry scale as one unit. Wilds use the same silhouette with a four-color circular symbol; action faces use shared SVG symbols or large draw values. The back uses a lime ellipse and Outfit UNO mark.

Controls, fields, panels and dialogs use the observed rounded vocabulary in frontmatter. Launch choices have broader corners, reducing to 18px on phones. Circular color swatches and count badges communicate state. The table's oval boundary and the hand's curved overlap carry the large forms; do not transfer card rotation to ordinary information containers.

## Components

### Buttons

Broad shell actions use the button role, a 50px minimum height, rounded control corners and 14px × 22px padding. Primary actions use coral; secondary actions are outlined and transparent; text actions remain quiet. Compact utilities retain the field radius and have a 44px minimum hit area; small buttons also have a 44px minimum height. Hover changes surface tone; press feedback is immediate. Global keyboard focus uses a blue outline; arena focus uses lime. Disabled actions reduce opacity, while the physical deck remains visibly present when unavailable.

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

### Held hand and piles

`UnoCard` owns all native faces; `HandCard` owns inspection and gestures; `app/table.css` owns the deck, arena, fan and launch preview. The first tap inspects a card; explicit Play in the dock names the selected legal card. A second activation remains a shortcut. Waiting players can inspect their hands, and a legal exact-match jump-in exposes Play. Arrow keys browse the hand with wrapping; Home and End reach its ends, keeping focused cards in view. A legal card can also be dragged upward; releases beyond the 65px lift threshold play. Focus lifts a card, native button activation preserves keyboard access, and a small ivory bottom mark identifies legal cards beyond saturation alone.

Pointer capture starts on the face. Nonprimary pointers and nonleft clicks are ignored; button loss, pointer cancellation, capture loss, blur, visibility changes and unmount cancel or clean up the gesture. An unsuccessful drag returns quickly. Reduced motion removes travel and drag rotation while retaining a usable selection state. Identity follows the card through sorting and game updates.

The contextual move dock sits below the hand near the thumb. It exposes named Play for a legal selection and Draw or Pass according to the live action state; penalty draws name their count. The physical draw pile remains usable. UNO appears only when eligible. The hint describes the same decision: exact-match jump-in, play or pass after drawing, pending color/action, penalty draw or reconnect state. Pending and disconnected actions cannot submit another move. Sorting and activity remain in the menu. The same native faces form the launch fan, so no separate raster illustration defines card appearance.

**The Named Move Rule.** Keep the inspected card identifiable through selection and resize, and name it in the Play action. Every dock hint and control follows current legal-action state.

**The Play Comes First Rule.** Motion and sound explain the current action without blocking controls, queuing stale actions or changing turn timing.

Card plays travel in 280ms, draws in 260ms and hand reflow in 180ms. Hand inspection settles in 170ms and unsuccessful drag return in 180ms. Reduced motion removes flights and nonessential reactions. These durations are presentation values, never scheduling rules for the engine.

Short card texture and immediate contact support plays; special actions add distinct brief signatures. `public/audio/card-play.wav` carries `card-play.source.json` provenance, with an immediate synthesized fallback while it loads. Gesture unlock exposes honest audio readiness. Only the latest action younger than 160ms may follow an in-progress unlock; old actions expire. Mute, disabled card sounds, zero volume and hidden pages suppress or stop feedback. Music and speech are not default turn feedback.

## Do's and Don'ts

### Do:

- **Do** use the same authored face for launch, hand, piles and card motion.
- **Do** preserve stable deck colors and the written active-color label.
- **Do** use scoped midnight arena variables while honoring appearance on supporting screens.
- **Do** retain readable six-seat phone names, visible corner indices and an independently scrolling large hand.
- **Do** make inspection, legal plays, turn state and situational actions clear with touch and keyboard.
- **Do** keep the named Play action, selected card and current hint in agreement; retain dark ink on lime.
- **Do** put secondary entry shortcuts after the primary choices and keep optional bot/friend details in disclosures.
- **Do** honor reduced motion, mute, audio readiness and interrupted gesture cleanup.
- **Do** keep presentation responsive to the current published state without delaying play.

### Don't:

- **Don't** restore clay hero art, Fredoka, a third font family or a parallel component library.
- **Don't** replace the held fan with a flat shrinking row or let large hands overflow the page.
- **Don't** show UNO when ineligible or turn sorting into a permanent table control. Keep dock Draw/Pass contextual and preserve the physical deck action.
- **Don't** use Unicode glyph icons in place of the established SVG icon system.
- **Don't** give general controls hard offset block shadows; physical deck edges are the intentional exception.
- **Don't** queue narration, wait for sound or animation, or add a blocking splash.

Not canonized: the build's tiny decorative arena watermark and vestigial sub-11px shell/progress captions are not reusable typography rules; their presence does not establish a legibility floor or authorize new kickers and eyebrows. Superseded green-table variables and overridden stylesheet declarations are likewise not authority over the final scoped arena. The existing journey detector’s 72 palette/type/radius advisories are not a token inventory: only current entry-control inks/hover tones, the phone choice radius and selected-Play treatment are reconciled here. Decorative one-offs and superseded values remain outside the reusable system; the report is preserved without suppression or a new detector run.
