---
name: "UNO — Playful card world"
description: "Original card characters, tactile play and a seat for your people."
colors:
  ui-bg: "#fff8ec"
  ui-surface: "#fffcf5"
  ui-text: "#2c2c32"
  ui-muted: "#706b65"
  ui-line: "#e3dbce"
  ui-accent-red: "#c74531"
  ui-accent-green: "#28694c"
  ui-accent-blue: "#3265a0"
  ui-table: "#345d4c"
  ui-table-deep: "#294d3e"
  ui-table-text: "#f4f1e6"
  ui-table-muted: "#c1d2c3"
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
  sunset-table: "#6a4b40"
  sunset-table-deep: "#51382f"
  sunset-table-muted: "#e2c7b7"
  card-red: "#bd4430"
  card-yellow: "#edbf45"
  card-green: "#317257"
  card-blue: "#3265a0"
  card-wild: "#30352e"
  card-paper: "#fcf6e7"
  card-dark-ink: "#30372c"
  action-light-ink: "#fffaf1"
  active-red: "#e57c64"
  active-yellow: "#edbf45"
  active-green: "#8ac695"
  active-blue: "#8cb8ea"
  play-yellow: "#f1c95b"
  play-green: "#c9dcb4"
  play-ink: "#2c2c32"
  avatar-red: "#ef755d"
  avatar-blue: "#8db6ed"
  avatar-yellow: "#e4c455"
  avatar-green: "#a8c991"
  avatar-lilac: "#c5afe5"
  avatar-peach: "#edae86"
typography:
  display:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(56px, 6.1vw, 88px)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "clamp(34px, 4vw, 46px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  dialog-title:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "29px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-muted:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "14px"
    lineHeight: 1.6
  label:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  button:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.25
  wordmark:
    fontFamily: "Fredoka, sans-serif"
    fontSize: "42px"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "-0.04em"
rounded:
  inset: "8px"
  control: "14px"
  field: "10px"
  play-choice: "21px"
  table: "34px"
  panel: "12px"
  dialog: "16px"
  pill: "20px"
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
    rounded: "{rounded.control}"
    size: "42px"
  field:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.field}"
    padding: "12px 15px"
    height: "50px"
  play-choice-primary:
    backgroundColor: "{colors.play-yellow}"
    textColor: "{colors.play-ink}"
    rounded: "{rounded.play-choice}"
    padding: "14px 19px 14px 14px"
  room-panel:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.panel}"
    padding: "22px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.dialog}"
    padding: "28px"
  player-character:
    backgroundColor: "{colors.avatar-red}"
    rounded: "{rounded.inset}"
    width: "33px"
    height: "41px"
  local-turn-badge:
    backgroundColor: "#e8bd4e"
    textColor: "#30372c"
    rounded: "{rounded.inset}"
    padding: "5px 13px"
  uno-card:
    backgroundColor: "{colors.card-red}"
    textColor: "{colors.card-paper}"
    width: "82px"
    height: "122px"
---

# Design System: UNO — Playful card world

## Overview

**Creative North Star: "The card playground"**

UNO feels like a playful gathering around physical cards. Original clay card characters, rounded Fredoka lettering, cream surfaces and cheerful color establish the personality. Controls stay clear and direct so the game can carry the fun.

The home screen is led by graphics and two illustrated play choices. During a round, the table, hand and player identities take over. Reactions belong to meaningful plays and results; ordinary navigation stays quiet. The owner explicitly replaced the earlier restrained, text-heavy treatment with this direction.

**Key Characteristics:**

- Original clay characters and small card-face player identities.
- Rounded display lettering with readable, friendly control text.
- Warm cream, coral actions, yellow and mint choices, and a deep green table.
- Physical indexed cards, spatial continuity and immediate sound.
- Sparse navigation, readable phone seats and an independently scrolling hand.

Recorded from the completed source and production captures on 2026-10-17. The canonical direction and provenance are in `.impeccable/direction.md` and `.impeccable/seed.md`. Current evidence lives in `.impeccable/review/playful/`. The independent review cleared all five material fixes. The documentation agent was unavailable because of a usage limit; this record was refreshed in the build thread from the shipped source. No approved raster comp or external catalog quality-bar image was used.

## Colors

Warm cream and ink frame the game. Stable card colors remain distinct from theme-aware interface colors.

### Primary

- **Coral action:** `ui-accent-red` identifies primary actions, the wordmark period and selected preferences. Midnight uses a lighter coral for contrast.
- **Play yellow and play green:** `play-yellow` and `play-green` identify the two large home choices, with stable dark `play-ink` text.

### Secondary

- **Deep green table:** `ui-table` and `ui-table-deep` establish the play area and player badges; `ui-table-text` and `ui-table-muted` carry readable information on it.
- **Card spectrum:** stable red, yellow, green, blue and wild colors belong to `UnoCard`. Gold and active-color swatches convey state alongside text and symbols.
- **Character palette:** warm red, blue, yellow, mint, lilac and peach identify the small card avatars. This palette complements the original art rather than recoloring the card rules.

### Neutral

- **Cream paper:** `ui-bg` is the page; `ui-surface` is the lighter field, panel and dialog material.
- **Ink and quiet ink:** `ui-text` carries actions and headings, `ui-muted` supports descriptions, and `ui-line` separates rows and controls.
- **Appearance:** Daylight, After hours, Club green and Clay change interface variables. Card colors and their cream frame remain stable.

**The Shared Table Rule.** Use theme-aware interface variables around the game; preserve stable card colors and explicit color names on the table.

## Typography

**Display Font:** Fredoka, sans-serif fallback.

**Body Font:** Nunito Sans, sans-serif fallback.

Both variable families load through `next/font/google` with Latin subsets and swap display. Fredoka carries headings, the wordmark, room codes and card values. Nunito Sans carries controls, names and supporting text. The pairing is rounded and playful without turning instructions into illustrations.

The home display uses the frontmatter display role, reducing to a centered phone heading. Setup headlines use the headline role; dialogs use the dialog-title role. Buttons use strong body type. The compact wordmark uses the frontmatter wordmark role, with smaller game and phone variants. Wordmark tracking remains at the −0.04em floor.

**The Two Voices Rule.** Use Fredoka for expressive display and game values; use Nunito Sans for controls and information people must act on quickly.

## Layout

The home container is centered within 1450px. Desktop pairs a compact invitation and two play choices with a larger original character scene. At 700px and below it becomes a centered heading, artwork, two stacked choices, optional local progress and compact friend invitation. Artwork stays inside the viewport; the page does not scroll sideways.

Setup and lobby use a centered 650px column with clear rows. Setup keeps player names editable, then offers the three actual rule presets before dealing. Settings uses a scrollable native dialog and four tabs. The home header keeps one labeled Settings action, adding invitations only when present. The board keeps mute and a labeled Menu.

The live game uses a maximum width of 1500px and three areas: turn status, flexible playing table and local hand. Opponents keep stable seats around the draw/discard center. Desktop overlap makes the hand compact; phones preserve large cards and horizontal scrolling. The page may grow vertically; do not shrink every card to force a large hand onto one screen.

- **1000px and below:** the active-color label moves beneath the piles and table spacing contracts.
- **700px and below:** the home flow stacks, game header becomes compact, toolbar wraps, and swipe guidance replaces keyboard hints.
- **Five/six seats on phones:** names and counts use readable 12px type. A small stack symbol saves repeated count-label space while the accessible label still says the full count.
- **380px and below:** redundant opponent card fans are omitted in crowded tables, keeping character badges and counts readable. The hand scroller matches the 10px page inset without widening the document.
- **Short desktops:** table and hand spacing contract; the local hand remains independently scrollable.

**The Hand Owns Its Width Rule.** Keep horizontal overflow inside the hand, with room above cards for focus and lift; preserve a readable playing surface at 320px, 390px and 688px.

## Elevation & Depth

Depth follows the soft lighting of the clay art. Choices, avatars, action feedback and the table use blurred offset shadows. Fine row rules organize settings and setup. Dialogs use the shared ambient shadow and a dark backdrop. Physical stacked edges belong to the draw deck itself.

- **Play choices:** soft low lift (`0 6px 14px #2c2c3228`).
- **Character badge:** a smaller soft offset (`1px 3px 6px #32313938`), reduced for phone badges.
- **Card at rest:** compact material shadow (`0 3px 5px #071b2526`); legal hand cards and discard have their own stronger soft shadows.
- **Table:** inset light plus ambient separation (`inset 0 2px 0 #ffffff14, 0 5px 14px #23362a20`). The inset is a material highlight, not a cast block shadow.
- **Draw deck:** two hard card-edge offsets plus a soft shadow represent actual stacked cards.

**The Physical Stack Rule.** Reserve hard stacked edges for physical card piles; use soft cast shadows on controls, avatars and containers.

## Shapes

Playing cards keep a cream frame, mirrored indices and a slanted oval outline. Their base dimensions are 82 × 122px and every face detail scales through `--card-scale`. Wilds use a four-color symbol; action cards use the existing Lucide icon system.

Buttons use the control radius, fields the smaller field radius, broad play choices the play-choice radius and dialogs the dialog radius. The table is more generously rounded, with a narrow dashed inset boundary. Small card characters are rounded rectangles with simple eyes and a smile; circles remain status dots, swatches and the home sticker.

## Components

### Buttons

Strong, readable controls with soft physical lift. Primary actions use coral, secondary actions use the page material and fine border, text actions stay quiet, and icon buttons always have accessible names. Home choices are larger graphic controls: a yellow bot choice and a mint friends choice, each with short labels and a directional arrow. Fine-pointer hover gives a slight lift; pressing moves down and reduces scale. Reduced motion removes travel.

### Inputs / Fields

Native text fields and selects use cream surfaces, fine borders and clear labels. Seat-name fields are an inline variant. Focus changes the border and keeps a visible blue outline. Native range inputs control audio; preference switches are labeled checkbox inputs with switch semantics. Errors name the problem and recovery action.

### Navigation

The wordmark stays visible without a row of unrelated utilities. Home and setup have Settings; incoming invitations appear only when needed. The board uses mute and Menu, with help, settings, activity and leave actions inside. Settings tabs are Profile, Rules, Audio and Look, with selected semantics and arrow-key navigation.

### UNO cards and hand

`UnoCard` is the shared face used by hands, piles and flight clones. Interactive cards are labeled buttons; noninteractive cards remain labeled images. Legal cards keep stronger color and explicit Play hints; other cards remain visible at a quieter intensity. Focus and fine-pointer hover lift the card. The draw pile is a real action target, and the hand retains a swipe/keyboard path.

### Player characters and status

`PlayerAvatar` derives a stable small card character from the player seed. Deep table badges pair identity with a count, a special UNO state or reconnection status. Active seats use gold outlines and markers. The local turn badge and named active color keep the turn readable beyond color alone.

### Rule presets and progress

`RulePresets` shares the same picker between setup and Settings. Classic, Stack party and Wild table compose supported engine rules; their marks use actual number/action language and Lucide icons. No Mercy, Flip and Flex are future deck/action systems, not alternate labels for these presets. Local progress shows completed rounds, earned wins and active streaks only when meaningful; it is explicitly marked as belonging to this device.

### Dialogs, feedback, sound and motion

Use `Modal` and native `showModal()` for focus containment, Escape and focus return. The wild picker is a two-column grid of four large, labeled color choices; yellow has dark text. Required result dialogs lead to home or a fresh round.

Movement follows the cards: throws arc and settle over 280ms, draws arrive over 260ms, hand reordering takes 180ms, and deal staggering is capped in 35ms steps. Special cards get a bounded 850ms graphic reaction; results get a short particle burst. OS reduced motion removes nonessential travel and celebration. Hiding the page cancels running flight nodes. A rematch resets the deal baseline.

Sound follows the same published transition: an immediate paper swipe, a landing tap on the interactive audio clock, and distinct short tones for special actions. Voice and music remain optional. Muting, disabling effects, zero effects volume or hiding the document cancels scheduled feedback. Nothing waits for an animation or a sound before accepting the next legal move.

**The Play Comes First Rule.** Reactions explain real plays and results without queuing old actions, blocking controls or changing turn timing.

## Do's and Don'ts

### Do:

- **Do** lead with original graphics, cards and player identities; keep supporting copy short.
- **Do** use the theme variables for interface surfaces and the shared card face for gameplay.
- **Do** keep navigation sparse and move preferences into the existing Settings tabs.
- **Do** preserve readable six-seat phone badges and an independently scrolling hand.
- **Do** keep turn, active color, legal plays and UNO status explicit beyond color alone.
- **Do** honor keyboard focus, reduced motion, mute and hidden-page cleanup.
- **Do** tie motion and sound to current published state without delaying play.

### Don't:

- **Don't** reintroduce long marketing copy, a third font family or a parallel component library.
- **Don't** use Unicode glyphs in place of the established icon system.
- **Don't** use hard cast block shadows on controls or player badges.
- **Don't** shrink player information to make room for redundant card fans.
- **Don't** queue narration or block the game on sound, animations or splashes.
- **Don't** present unimplemented variants or unearned ranks as playable progress.

Not canonized: the smallest table metadata sizes, local artwork positioning and avatar tilts remain component details. Derived sidecar tonal ramps are preview aids, not additional runtime theme tokens. The unused accent-yellow variable is omitted. No craft-floor refusal is promoted to a reusable rule; draw-deck offsets remain a literal depiction of stacked cards.
