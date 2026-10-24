---
name: "UNO — Color play"
description: "A welcoming blue card table with human portraits, vivid native cards and warm amber actions."
colors:
  club-ink: "#17345f"
  club-paper: "#fff7e7"
  club-red: "#df0735"
  club-yellow: "#ffd45a"
  club-blue: "#1254b5"
  club-green: "#00bc68"
  stage: "#123d86"
  stage-light: "#1d56a3"
  stack-stage: "#143975"
  stack-stage-light: "#2259a1"
  wild-stage: "#302247"
  wild-stage-light: "#523466"
  ui-surface: "#fffcf4"
  ui-muted: "#58687a"
  ui-line: "#ccd3da"
  ui-accent-red: "#c50730"
  ui-accent-green: "#007943"
  cue-surface: "#09285c"
  cue-ink: "#38290c"
  cue-muted: "#5a410f"
  amber-edge: "#bf8a28"
  cream-hover: "#ffdc36"
  midnight-surface: "#26262f"
  midnight-muted: "#c8c4b9"
  midnight-line: "#56565f"
  midnight-accent-red: "#ff637c"
  midnight-accent-blue: "#83afff"
  midnight-accent-green: "#53dea0"
  forest-bg: "#e8f6e9"
  forest-surface: "#f5fff3"
  forest-text: "#14271e"
  forest-muted: "#4e6256"
  forest-line: "#adbfad"
  sunset-bg: "#ffe7df"
  sunset-surface: "#fff5ed"
  sunset-text: "#321a20"
  sunset-muted: "#6e4c50"
  sunset-line: "#d7b2ad"
  card-paper: "#ffffff"
  card-blue: "#075bee"
  card-yellow: "#ffce00"
  card-back: "#101d3a"
  card-green-index: "#00321e"
  card-green-value: "#00894a"
  card-yellow-index: "#482f00"
  card-yellow-value: "#805100"
  arena-focus: "#ffe329"
typography:
  home-display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 0.85
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(32px, 4vw, 42px)"
    fontWeight: 750
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  dialog-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "28px"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "28px"
    fontWeight: 750
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-large:
    fontFamily: "Outfit, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 750
    lineHeight: 1.25
  support:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  compact:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  compact-count:
    fontFamily: "Outfit, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.25
  compact-status:
    fontFamily: "Outfit, sans-serif"
    fontSize: "10px"
    fontWeight: 400
  player-name:
    fontFamily: "Outfit, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
  player-count:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.25
  compact-player-name:
    fontFamily: "Outfit, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.2
  cue-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 750
    lineHeight: 1.1
  compact-cue-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "13px"
    fontWeight: 750
    lineHeight: 1.1
  play-control:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.25
  card-value:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "calc(70px * var(--card-scale, 1))"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
  card-index:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "calc(19px * var(--card-scale, 1))"
    fontWeight: 800
    lineHeight: 1
rounded:
  field: "6px"
  small: "8px"
  inset: "9px"
  control: "12px"
  action: "14px"
  identity: "16px"
  cue: "18px"
  panel: "20px"
  portrait: "50%"
spacing:
  micro: "4px"
  detail: "6px"
  tight: "8px"
  compact: "12px"
  regular: "16px"
  group: "20px"
  section: "24px"
  dialog: "28px"
  wide: "32px"
  panel: "44px"
components:
  button-primary:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.club-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.cream-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
    height: "48px"
  launch-primary:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.cue-ink}"
    typography: "{typography.play-control}"
    rounded: "{rounded.action}"
    padding: "12px 22px"
    height: "70px"
  input:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.field}"
    padding: "12px 15px"
    height: "50px"
  settings-navigation:
    textColor: "{colors.club-ink}"
    rounded: "{rounded.field}"
    padding: "9px 6px"
    height: "48px"
  preset-selected:
    backgroundColor: "{colors.club-paper}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.inset}"
    padding: "8px"
    height: "44px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
  player-label:
    backgroundColor: "{colors.cue-surface}"
    textColor: "{colors.club-paper}"
    rounded: "{rounded.identity}"
    padding: "8px 14px 8px 0"
    width: "172px"
    height: "66px"
  player-label-active:
    backgroundColor: "{colors.club-paper}"
    textColor: "#19385e"
  player-label-catch:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.cue-ink}"
  cue-local:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.cue-ink}"
    rounded: "{rounded.cue}"
    padding: "10px 20px 10px 12px"
    height: "64px"
---

# Design System: UNO — Color play

## Overview

**Creative North Star: "Color play"**

A welcoming shared card table combines a rich blue field, warm cream foreground, vivid native UNO cards and expressive illustrated human portraits. Outfit keeps the interface friendly and direct; Barlow Condensed gives the deck, wordmark and selected game actions their familiar energy. Soft contact shadows and inset press edges make cards and controls feel physical.

This records the shipped October 24 composite: Classic supplies the blue field and card prominence, Color court supplies the portraits, and After-hours supplies amber turn and action emphasis. The approved direction is `.impeccable/review/experience-reset/contract.md` (FORM seed `2fba311c`); its three references are `reset-classic.png`, `reset-color-court.png` and `reset-after-hours.png` under `.impeccable/mocks/decision/`. No catalog quality-bar world was selected. Earlier Comic-card showdown, giant-cast/painted-menu, violet-corner, illustrated-room and poker-table instructions are historical and superseded. Their assets and provenance remain recoverable; they are not current surface guidance.

**Key Characteristics:**

- Quiet blue or plum preset fields keep attention on live cards and people.
- Human portraits, opaque nameplates and exact hand counts make the table social and readable.
- Outfit UI and Barlow Condensed deck lettering share one friendly voice.
- Amber pressed actions and a compact real countdown explain the current decision.
- A bottom-cropped curved hand preserves direct legal play and independent large-hand scrolling.

Source authority: `app/layout.tsx` imports globals, legacy table geometry, arena, home, then club styles. `app/club.css` owns final shared palette/chrome; `app/home.css` owns home; `app/arena.css` owns live geometry/cues; `PlayerAvatar.module.css`, `OpponentSeat.module.css` and `UnoCard.module.css` own their materials. Component module specificity matters: the active portrait badge is cream, not the older arena yellow badge. Source takes precedence over older captures.

## Colors

The primary palette is saturated blue with cream and amber; the native deck retains its own brighter four-color print.

### Primary

- **Club blue and stage blue:** shared action/focus blue and the deeper arena ground. Stage light creates a broad radial lift rather than a competing object.
- **Stack blue and Wild plum:** supported rule presets change the stage mood in both home and arena. Classic uses the default stage; stacking deepens blue; jump-in/shuffle/discard-all rules choose plum.

### Secondary

- **Club yellow:** primary controls, local-turn cue, catch action and portrait ring. Its darker amber edge supplies the pressed lip; cue ink and cue muted provide readable text.
- **Native red, blue, green and yellow:** card identity stays faithful to the code-rendered deck. Club blue/yellow are interface colors; card blue/yellow remain distinct tokens.

### Neutral

- **Club paper and UI surface:** warm foreground, selected home preset and consistently light native dialogs.
- **Club ink, UI muted and UI line:** supporting-page text, secondary text and field/divider strokes.
- **Cue surface:** opaque dark blue identity and remote-turn surfaces; no scene detail shows through names.
- **Saved appearances:** paper is the default; midnight, forest and sunset override supporting UI tokens in `club.css`. Home and arena retain preset moods; dialogs set their own light token scope. Do not remove these working appearances during new surface work.

**The Published Color Rule.** Amber, cream active badges, legal-card outlines and wild swatches describe actual published state. Retain names, counts and written action/color labels alongside color.

## Typography

**Display Font:** Barlow Condensed, sans-serif, for the home UNO mark, native card faces and selected game actions; display lettering is italic where implemented.
**Body Font:** Outfit, sans-serif, for headings, forms, controls, names, help and countdowns. Both are loaded through `next/font` in `app/layout.tsx`.

The ramp is role-based, not a geometric scale. The frontmatter records the actual range, including compact roles; small phone text is subordinate metadata rather than the primary action label.

### Hierarchy

- **Home display:** home-only condensed italic mark; switches to an 80px role in short landscape. Do not reuse its scale for routine headings.
- **Headline / section / dialog:** Outfit with compact tracking and weight 750. Setup headline is responsive; dialog and section titles use their own roles. The mobile dialog title grows to 32px; short landscape dialogs use 28px after the last shared override.
- **Body / large body:** supporting content and setup explanations, with measured line lengths (setup 50ch, home rules explanatory copy).
- **Control / support:** regular button and field labels, preset descriptions and secondary actions. Home Play is a larger Outfit role with a smaller explanatory line.
- **Player name / count:** names are 16px desktop and 12px compact; counts are 13px desktop and 11px compact. Inline status is 11px desktop and 10px compact. Tabular numerals keep counts and the clock stable.
- **Cue:** title is 18px, 16px under 680px height, and 13px under 460px height; helper copy is 12px then 10px. Clock numerals are 16px then 12px.
- **Native deck:** face values and corner indices scale together through `--card-scale`. Preserve the native card-back Outfit wordmark and Barlow Condensed face numerals.

**The Two Lettering Roles Rule.** Outfit carries ordinary interface headings. Condensed italic lettering belongs to brand/deck expression and the existing emphatic game actions; it is not a global heading transform.

## Layout

Home is a centered title/start composition: main width capped at 760px, play lane at 400px, supporting progress at 420px. A small decorative native-card fan sits above one dominant Play action; Create/Join share a secondary row, with bot setup and help below. Portrait entry remains usable. Under 700px width, spacing and type adapt; short landscape (height ≤540px, width ≥541px) uses a 900px two-column composition with an 0.85fr/1.15fr split.

The arena fills `100dvh`, clips page overflow and caps its internal stage at 1600px. Opponents occupy the upper/perimeter field; central tilted draw/discard piles sit directly above the bottom-held hand. The hand owns horizontal overflow, headroom and paging controls. Use safe-area insets at the screen edges. Legal cards rise; focus/inspection rises further without clipping. Contextual decisions sit beside the centered turn cue rather than displacing piles.

Height determines live density: large desktop starts at 900px height with width ≥701px; compact stages apply below 680px; landscape phone applies below 460px with width ≥541px; the shortest variant applies below 360px. At the phone thresholds, portrait badges become 126px then 100px wide while retaining a 44px minimum target, exact count and inline status. The name/status wrapper stays a row. Compact opponent back fans disappear; native card indices remain readable. Phone gameplay uses a rotate gate in portrait.

The observed spacing vocabulary runs from micro/detail gaps through compact, regular, section and dialog steps. It is not an instruction to normalize every card-specific overlap. See the two surface briefs for geometry and the sidecar for exact responsive conditions.

**The Hand Owns Its Width Rule.** Large hands scroll inside their own fan; do not shrink them into an unreadable row or allow document-width overflow.

## Elevation & Depth

Depth comes from native card stock, soft blue contact shadows, floating portrait/cue surfaces and shallow inset control lips. Containers do not inherit a comic outline or hard offset shadow. The amber bottom lip is intentional material feedback, not a side accent border.

### Shadow Vocabulary

- **Primary press:** inset amber lip plus a small blue shadow; the home Play enlarges the same relationship.
- **Identity and cue:** soft blue contact shadows beneath an opaque surface.
- **Native stock:** fine white highlight, thin layered grey stock and a soft dark contact shadow; the draw pile adds stacked edges.
- **Dialog:** broad blue ambient shadow, with a dark native backdrop.

Exact shadow values and motion durations live in `.impeccable/design.json` extensions. Primary controls use a small scale press; card fan lift uses the standard out easing. Portrait reactions are bounded to a short state-triggered bounce. Skip/reverse/penalty feedback is brief and derived from the move; reduced motion removes travel and preserves legible state. Thinking dots may pulse only while waiting for the actual actor; no decorative idle character loop is part of the system.

**The Contact Rule.** Use inset press depth for actions and stock/contact depth for cards. Preserve readable resting geometry and keyboard focus; sound and animation never determine turn timing.

## Shapes

Forms use gently rounded rectangles: small field/tab corners, medium controls, larger identity/cue surfaces and soft panel corners. Home Play has its own action radius. Portraits are circular with a cream rim. Native cards keep their scaled small corners and white oval print. These distinct silhouettes identify material and function; do not flatten them to one radius.

## Components

### Buttons

Warm yellow primary controls have club ink text, weight 750, a shallow amber bottom edge and a soft contact shadow. Shared targets are at least 48px tall; small/icon controls retain 44px targets. Home Play is a larger 70px action, 58px in short landscape. Hover warms the yellow on fine pointers; active scales to 0.97. Secondary buttons use a fine divider stroke; blue-stage room controls explicitly keep cream text. Home Settings explicitly keeps cream text in default and hover states. Focus rings stay visible and outside the control.

### Chips and preset choices

Home's supported-preset selector is a dark blue rounded track with cream selected segments and a small contact shadow. Supporting setup uses full-width flat rule rows with native miniature-card markers, written descriptions and an explicit check; its selection is amber. These are two contexts for the same real presets, not interchangeable decoration.

### Cards / containers

Setup uses a centered rounded theme-aware panel. Native dialogs are fixed light surfaces with Outfit headings, explicit Close and reachable decisions in short landscape. Settings, rules, results and earned progress use the same shared palette/control vocabulary; progress always reflects completed-round device-local data. Keep the native `Modal` primitive.

### Inputs / fields

Theme-aware fields use UI surface/text, a two-pixel divider border, 50px height and a darker text-colored focus stroke. Invalid fields use accent red. Labels remain explicit; room codes and room links share the existing input flow.

### Navigation

Small wordmark and restrained Settings/Menu chrome sit at the perimeter. Settings tabs use an outlined segmented container with ink selected background and cream text; mobile tabs stack icon/label while keeping their full target. Do not add a parallel navigation library.

### Portrait identities

`PlayerAvatar` selects one of six original human portraits from `/artwork/player-portraits.webp`; preserve its companion prompt provenance. Opaque dark blue nameplates hold a name/status row and exact count below. The active player's badge turns cream and portrait gains an amber outline; a catchable badge turns amber. Compact states retain the same footprint and inline status instead of creating a third text tier.

### Held cards and live turn cue

`UnoCard` owns card print; `HandCard` owns direct tap/drag handling; `useGamePresentation` owns transitions/audio. Legal cards play on first activation, with the shared gesture predicate governing drag readiness. Inspection, roving keyboard navigation and overflow paging stay available. Wild decisions preserve written chosen-color state and accessible counts.

`TurnCue` presents the real actor, direction, current action and deadline. Human turns last 30 seconds; the ring and tabular number derive from the published deadline, never a sample comp value. Drawing and metadata do not restart it; online timing belongs to the server. Forced penalties show the actual total/target and resolve automatically when no stack response exists. At five seconds or fewer the cue uses its urgency treatment. Local portrait gating pauses local timing; online rounds continue. Music and sound respect saved preferences and never gate a turn.

## Do's and Don'ts

### Do:

- **Do** use the quiet preset field, warm cream, human portraits and vivid native deck as one shared identity.
- **Do** keep Outfit ordinary headings and the separate Barlow Condensed brand/deck roles.
- **Do** retain saved supporting appearances and the explicit light native-dialog scope.
- **Do** keep exact hand counts, inline compact status, a real turn clock and written action/color cues.
- **Do** preserve the curved bottom-held fan, independent overflow, direct legal play and visible keyboard focus.
- **Do** use soft contact depth and the intentional inset amber pressed-control lip.
- **Do** keep original artwork and exact provenance, even when earlier artwork is superseded.
- **Do** verify six-seat landscape phones, large hands and reduced motion when extending the interface.

### Don't:

- **Don't** restore giant background cast, painted menu-card actions, ink swashes, poker felt/rail or the giant orbit field.
- **Don't** add decoration behind the piles or allow compact player states to expand into their space.
- **Don't** add another font family, glyph icons, mixed display systems or a parallel component library.
- **Don't** replace the live deadline with a decorative countdown or reset it after a draw or metadata update.
- **Don't** add blocking splashes or let audio, reactions or motion gate game turns.
- **Don't** label No Mercy, Flip or Flex playable before their actual decks/actions exist.

Not canonized: legacy comments and historical selectors describing an ink-only field, geometric avatars or no visible routine HUD are superseded by the shipped composite. Their presence in source/history is not a rule. The former compact status-column collision and low-contrast Settings control were defects; the corrected row and explicit cream foreground are the recorded behavior. Static screenshots do not certify physical touch, audible quality or execution of reduced-motion fallbacks.
