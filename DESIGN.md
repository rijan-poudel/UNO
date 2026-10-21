---
name: "UNO — Card club and open play field"
description: "Flat illustrated friends and vivid held cards in an open electric-blue UNO arena."
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
  arena-bg: "#123ac2"
  arena-surface: "#102966"
  arena-orbit-outer: "#1c49d5"
  arena-orbit-inner: "#2555df"
  arena-menu: "#0c2a91"
  arena-text: "#ffffff"
  arena-muted: "#d7e3ff"
  arena-line: "#6586ec"
  arena-accent-red: "#ff536f"
  arena-dark-ink: "#392700"
  move-action-ink: "#392700"
  card-red: "#df0735"
  card-yellow: "#ffce00"
  card-green: "#00bc68"
  card-blue: "#075bee"
  card-wild: "#101d3a"
  card-paper: "#ffffff"
  card-yellow-ink: "#482f00"
  card-yellow-value: "#805100"
  card-back: "#101d3a"
  active-red: "#ff727a"
  active-blue: "#79b5ff"
  active-green: "#5adeaa"
  active-yellow: "#f7d86a"
  action-light-ink: "#fffaf1"
  avatar-red: "#ff6942"
  avatar-blue: "#4892ff"
  avatar-yellow: "#ffcf18"
  avatar-green: "#43ce7d"
  avatar-lilac: "#a67aff"
  avatar-peach: "#ffae36"
  launch-bg: "#0b2038"
  launch-paper: "#f9f2df"
  launch-ink: "#392700"
  launch-yellow: "#ffd64a"
  launch-surface: "#132e4f"
  launch-muted: "#d5e3dd"
  launch-quiet: "#a9c2c1"
  turn-yellow: "#ffe329"
  action-yellow: "#ffd000"
  card-green-ink: "#00321e"
  card-green-value: "#00894a"
  launch-create-blue: "#1757df"
  launch-join-red: "#e71c3b"
  milestone-yellow: "#f7c934"
  milestone-ink: "#332810"
  milestone-border: "#8b600b"
  choice-blue: "#095be5"
  choice-green: "#008749"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  launch-primary:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1.25
  launch-secondary:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.25
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
  launch-action: "6px"
  launch-text: "4px"
  seat: "7px"
  inset: "8px"
  control: "14px"
  field: "10px"
  panel: "12px"
  dialog: "16px"
  card: "6px"
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
  launch-primary:
    backgroundColor: "{colors.action-yellow}"
    textColor: "{colors.launch-ink}"
    typography: "{typography.launch-primary}"
    rounded: "{rounded.launch-action}"
    padding: "14px 20px 16px"
    height: "64px"
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
  arena-menu:
    backgroundColor: "{colors.arena-menu}"
    textColor: "{colors.arena-text}"
    rounded: "{rounded.inset}"
    size: "44px"
  button-play-selected:
    backgroundColor: "{colors.action-yellow}"
    textColor: "{colors.move-action-ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "7px 14px"
    height: "44px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.ui-text}"
    rounded: "{rounded.dialog}"
    padding: "28px"
  opponent-badge:
    backgroundColor: "transparent"
    textColor: "{colors.arena-text}"
    rounded: "{rounded.seat}"
    padding: "5px 8px"
  opponent-badge-active:
    backgroundColor: "{colors.turn-yellow}"
    textColor: "{colors.arena-dark-ink}"
    rounded: "{rounded.seat}"
    padding: "5px 8px"
  player-character:
    backgroundColor: "{colors.avatar-red}"
    rounded: "{rounded.inset}"
    width: "33px"
    height: "41px"
  catch-button:
    backgroundColor: "{colors.action-yellow}"
    textColor: "{colors.move-action-ink}"
    rounded: "{rounded.inset}"
    padding: "5px 8px"
    width: "56px"
    height: "44px"
  milestone-stamp:
    textColor: "{colors.ui-muted}"
    rounded: "{rounded.card}"
    padding: "12px 5px 9px"
  milestone-stamp-earned:
    backgroundColor: "{colors.milestone-yellow}"
    textColor: "{colors.milestone-ink}"
    rounded: "{rounded.card}"
    padding: "12px 5px 9px"
  uno-card:
    backgroundColor: "{colors.card-red}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.card}"
    width: "82px"
    height: "122px"
  launch-create:
    backgroundColor: "{colors.launch-create-blue}"
    textColor: "{colors.card-paper}"
    typography: "{typography.launch-secondary}"
    rounded: "{rounded.launch-action}"
    padding: "14px 20px 16px"
    height: "54px"
  launch-join:
    backgroundColor: "{colors.launch-join-red}"
    textColor: "{colors.card-paper}"
    typography: "{typography.launch-secondary}"
    rounded: "{rounded.launch-action}"
    padding: "14px 20px 16px"
    height: "54px"
  color-choice-red:
    backgroundColor: "{colors.launch-join-red}"
    textColor: "{colors.card-paper}"
    rounded: "{rounded.launch-action}"
---

# Design System: UNO — Card club and open play field

## Overview

**Creative North Star: "The open UNO play field and after-hours card club"**

UNO feels like a held hand of vivid real cards in an open electric-blue play field. Two tonal blue card-orbit planes frame expressive players and centered piles without a bounded table. Cards are the controls: a legal face plays on its first activation; the foreground fan comes from below the viewport and makes pickup and deliberate upward release tangible.

Home remains a centered illustrated after-hours card club: a flat transparent original rabbit, red panda and crocodile scene sits directly on navy, with yellow Play and full-color blue Create and crimson Join actions. Settings and setup retain theme-aware supporting surfaces. Live play uses a fixed blue field, white lettering and yellow action/active-seat feedback. Outfit UI and Barlow Condensed card lettering remain the two pinned families. Small native card characters express published player state.

**Key Characteristics:**

- A centered flat illustrated card-club welcome with complete silhouettes and visibly primary Play.
- One shared native card face across the live hand, piles and motion.
- Outfit interface lettering paired with Barlow Condensed card numerals.
- Fixed navy home, theme-aware settings/setup and an open electric-blue live arena.
- First-activation legal play, nonmatching-card inspection and deliberate upward release.
- Viewport-edge cropped held fan, bounded horizontal hand scrolling, contextual controls and paper/contact feedback that never delays a turn.
- Real round outcomes and optional device-local milestone cards.
- Original card characters with truthful expressions, bounded reactions and pressed control surfaces.

Historical evidence below preserves provenance; its live-table materials and HUD are superseded by the October 21 play-field correction.

Historical table evidence, recorded on 2026-10-19: The owner-directed replacement in `.impeccable/review/direct-play/contract.md` and `.impeccable/direction.md` supersedes the previous midnight table and inspect-first flow; that review retained the then-incumbent launch/settings. Its home composition is superseded below. Evidence is `app/table.css`, `components/UnoCard.tsx`, `components/HandCard.tsx`, `components/GameBoard.tsx`, `hooks/useGamePresentation.ts`, `lib/cardGesture.ts` and `lib/tableChimes.ts`, alongside unchanged shell primitives. This is code-led work with no approved raster comp. The fresh full material review is `finish-review-rebuild.md` in that review packet; `verdict.md` confirms the sole rail-shadow fix resolved. Six valid captures at 320, 390 and 1440px are seeded local fixtures, not public matches. Reduced-motion behavior is evidenced by source guards, not an emulated capture; screenshots and audio scheduling assertions do not certify physical speaker quality.

The earned-moments extension was recorded from `components/PlayerProgress.tsx`, `components/RoundSummary.tsx`, `components/GameBoard.tsx`, `components/GameFeedback.tsx`, `lib/playerProgress.ts` and the progress/earned-moments stylesheet blocks on 2026-10-20. Its contract, verification and ship review live in `.impeccable/review/table-rewards/`. Eleven 320/390/1440px captures cover synthetic local result/pressure states and a home capture using actual device history (one round, zero wins). The pure collection preview did not write history; its temporary route was removed before production. This extension retains the materials, deck, fonts and sound already recorded here.

The historical 2026-10-20 interaction audit in `.impeccable/review/interaction-audit/` records keyboard continuity, accurate release geometry, bounded interruption, arena action contrast and blocked-storage audio controls; its portrait gameplay and side-by-side landscape geometry are superseded by the shared-table correction below. Saved pressure captures use the existing loopback fixture; no synthetic completed rounds were recorded.

The playful-feedback extension was recorded from `components/PlayerAvatar.tsx`, `lib/playerExpression.ts`, home, hand, table and result components, and the final stylesheets on 2026-10-20. `.impeccable/review/playful-feedback/` contains its contract, verification and finish disposition: ship, scoped to the resolved expression-restart fix. Desktop, 390px, 320px and landscape captures use the existing local pressure fixture; home retains actual device history. That historical extension introduced no raster assets, dependencies or font families; its home treatment is superseded below. Reduced-motion expression behavior is source-guard evidence; physical listening and touch-device behavior remain unverified.

The historical centered-home replacement in `.impeccable/review/centered-home/` superseded the earlier side-column controls, plain cream field, floating card-face stickers, decorative 7 and broad rounded choice tiles. Its cinematic scene and cropped phone presentation are themselves superseded by the shared-table correction.

The foundational owner-directed shared-table correction was recorded on 2026-10-20 from `app/arena.css`, `app/table.css`, `app/home.css`, `components/GameBoard.tsx`, `components/home/HomeScreen.tsx`, `hooks/usePhonePortrait.ts`, `hooks/useUnoGame.ts` and the flat artwork. `app/arena.css` loads after the material stylesheet and owns current board geometry. The contract in `.impeccable/review/shared-table/contract.md` supersedes every earlier viewport and home-art verdict. This is a code-led extension of inherited seed `2e1e4271`, without an approved UI comp. Its verification records 17 opened captures covering home, the supplied 845 × 765 viewport, lifted/focused faces, six-seat large hands, two short landscape sizes, portrait guidance, menu and wild choice. The finish review passed visual corrections and requested this persistence update; this document does not assign the pending final verdict. Browser emulation establishes geometry and keyboard/mouse behavior, not real touch hardware or subjective speaker quality.

The vivid material extension is recorded from `components/UnoCard.module.css`, `components/UnoCard.tsx`, `components/PlayerAvatar.tsx`, `app/arena.css` and `app/home.css` on 2026-10-20. Its owner-directed contract, verification and material review are in `.impeccable/review/vivid-depth/`. It preserves inherited seed `2e1e4271`, table topology, home artwork, fonts, direct play and phone orientation behavior. The review accepted the material direction and requested short-landscape pile clearance plus this persistence refresh. The final source compacts identities and exposes pile tops/counts below 361px landscape height; the final opened 568 × 320 and 844 × 390 follow-up captures record the corrected clearance with root horizontal scroll held at zero. The final verdict belongs to that packet and is not assigned here. The packet reports passing lint, strict types, game/audio/multiplayer assertions, production build, small-index/control contrast and existing raster provenance checks. Its browser evidence is scoped to rendering and mouse/keyboard behavior; reduced motion and coarse-pointer behavior are source guards, not physical-device certification or an audit of all UI. Earlier teal home, ivory room actions, muted deck inks and lime feedback remain historical evidence and are superseded for these surfaces. Supporting theme and progress colors remain where their source still uses them.

The owner-directed open play field was recorded on 2026-10-21 from `app/arena.css`, `components/GameBoard.tsx` and the retained `components/UnoCard.module.css`. `.impeccable/review/play-field/contract.md` supersedes earlier baize/leather, deck-count, routine turn/color HUD and header-sound guidance for live play. This is code-led work with seed `457003dd`, grounded candidate 4, and no approved raster comp. The packet's verification and finish review record eight opened captures: desktop 1440 × 900, owner viewport 848 × 765 and hover, six-seat 20-card landscape 844 × 390 and 568 × 320, portrait 390 × 844 gate, wild chosen-color and menu. They support browser geometry, keyboard End-key reveal, direct upward drag, wild first activation and sound control operation; they do not certify real-phone touch, speaker quality or exhaustive accessibility. Verification records passing lint, strict types, game/audio/multiplayer checks and production build. No new raster was added; existing home artwork and historical texture provenance remain preserved. The finish review found no material UI repair and requested this design-record refresh; this document does not assign the packet's final verdict.

## Colors

Navy and ivory frame the illustrated invitation; yellow makes Play immediate. Theme-aware paper supports setup and settings, while stable saturated card colors float over electric-blue orbit planes in play.

### Primary

- **Coral action:** `ui-accent-red` identifies primary shell actions, selected preferences and the wordmark period. The midnight appearance uses its lighter coral counterpart.
- **Turn yellow:** `turn-yellow` marks the live active opponent, available draw and arena keyboard focus. Local turn and legal readiness use card lift/growth. `action-yellow` fills contextual Play, UNO and Catch controls with `move-action-ink`; retain this dark ink through appearance overrides. Both yellows belong to meaningful game state.
- **Club actions:** `action-yellow` fills primary home Play with `launch-ink`. `launch-create-blue` and `launch-join-red` distinguish Create and Join with white lettering. `launch-yellow` remains the lighter wordmark/focus and collection-fan highlight; `launch-paper` remains title lettering and the focus outline against yellow Play.

### Secondary

- **Card spectrum:** `card-red`, `card-yellow`, `card-green`, `card-blue` and `card-wild` belong to the deck. Green and yellow keep vivid shells with separate dark `card-green-ink` / `card-yellow-ink` corner indices and `card-green-value` / `card-yellow-value` center ranks on white. Red and blue indices remain white; their large center ranks retain the face color. The Wild+4 center depicts four full-color physical cards while its corner indices remain +4. `milestone-yellow`, `milestone-ink` and `milestone-border` preserve the existing earned collection colors on supporting surfaces; home earned cards use its blue action fill. Unearned cards retain scoped muted ink and line borders. Native color choices use crimson, `choice-blue`, `choice-green` and `action-yellow` with contrasting labels.
- **Active-color spectrum:** the brighter `active-*` swatches accompany the written chosen-color name only when the top discard is wild. Ordinary color and routine turn remain in the accessible tree; the face and raised hand carry their visible identity.
- **Player palette:** the six `avatar-*` colors identify small original card-face badges. These remain supporting identity marks rather than a separate illustration system.

### Neutral

- **Club navy and ivory:** `launch-bg` is the home field; `launch-paper` is its title lettering. `launch-surface` supports home utilities and collection cards; `launch-muted` and `launch-quiet` carry secondary copy. These scoped home colors remain fixed across appearance choices.
- **Warm paper and ink:** `ui-bg`, `ui-surface`, `ui-text`, `ui-muted` and `ui-line` form the supporting shell. Paper, midnight, forest and sunset appearances change these root variables.
- **Open play field:** `arena-bg` is the solid live base; `arena-orbit-outer` and `arena-orbit-inner` are the two open tonal planes. `arena-surface` backs contextual hints, waiting and called-UNO status; `arena-menu` backs the icon-only header control. `arena-text`, `arena-muted`, `arena-line` and `arena-accent-red` scope the supporting UI roles inside live play. These fixed arena colors do not replace appearance variables in settings/setup.
- **White stock and dark back:** `card-paper`, navy `card-back` and `arena-dark-ink` anchor the deck and dark text on the active yellow seat. The back carries a crimson diagonal mark and white Outfit lettering.

**The Scoped Worlds Rule.** Keep home in its fixed navy/ivory/full-color club palette, honor appearance variables in settings and setup, and scope the open electric-blue orbit field with white lettering and yellow state feedback to live play. The native deck remains stable across appearances.

## Typography

**Display and Body Font:** Outfit, with sans-serif fallback.
**Card Font:** Barlow Condensed, with sans-serif fallback; card faces use italic lettering at weight 800.

**Character:** A geometric UI voice stays direct and legible while narrow, large card numerals preserve the physical deck's energy. The font-display variable aliases the body font; it is not a third family.

### Hierarchy

- **Display:** the frontmatter display role leads home, reducing to 42px at 700px and below and 36px at 360px and below. Its centered subtitle is 17px desktop and 15px phone.
- **Headline:** the fluid headline role introduces setup. Dialog titles use the separate dialog-title role and its phone variant. Setup headlines reduce to 35px on phones.
- **Home action:** launch-primary lettering reduces to 22px on phones; launch-secondary reduces to 16px at 700px and 15px at 360px. Quiet home text actions use 14px/600. Routine turn/color copy is accessible-only; it is not an arena display type role.
- **Body and label:** body, muted body, form labels, buttons and table labels use the compact roles in frontmatter. Live seat names and counts use the compact source roles, reducing to 11px in short landscape; contextual pile/wild labels are 13px, reducing to 11px there.
- **Wordmark:** the compact shell mark uses its frontmatter role, with the wordmark-phone variant on phones; the arena uses 34px, then 28px in short landscape.
- **Card typography:** card-value, card-index and card-action sizes describe the unscaled 82 × 122px face. They scale together with the entire card through its multiplier; these are card graphics, not extra interface text levels.

Milestone names and progress values use compact Outfit labels; the terminal count column uses 17px tabular numerals with weight 600. Last-card and deck-penalty numerals reuse the condensed italic card face. These extend the existing roles rather than introducing a reward font or a new display hierarchy.

**The Deck Lettering Rule.** Use Outfit for UI, headings and the card-back wordmark; reserve Barlow Condensed for indexed card faces. Preserve italic numerals and the shared face proportions when scaling.

This is a role-based hierarchy with responsive sizes, not a mathematical modular scale. The documented display, headline, dialog, body, label and card roles intentionally describe the built system; incidental tiny decorative text does not establish a reusable type token.

## Layout

Home is one centered column with heading, flat transparent scene, Play, paired Create/Join actions, secondary Set up bots/How to play, optional honest progress and footer. The header is 64px high, bounded to 1440px with 40px desktop side padding; main padding is 8px 24px 0. The scene retains its intrinsic 1729:910 aspect ratio with `object-fit: contain`: width is `min(820px, 96vw)`, reducing to `min(740px, 94vw)` at 701–1250px. The action group is bounded to 560px and follows the scene with an 8px overlap. Play has a 64px minimum height; equal room columns have a 12px gap and 54px minimum height. Image loading never gates these real HTML controls.

At 700px and below main padding is 12px 20px 0, the scene is 230px high and contains the whole illustration, and the action group has no negative overlap. Play is at least 62px high and the room gap becomes 10px. At 360px and below main side padding is 16px, the scene is 184px high and Play at least 58px. Preserve full ears, arms and table edges at every width. Transparent pixels integrate the artwork directly with navy; no boxed scenery or fade patch is part of this composition. Setup remains bounded to 650px. Common spacing repeats the compact 4–32px vocabulary rather than a strict single interval.

Live play is an open `100dvh` flex column with page `overflow: clip`. The 60px header keeps the leave-game wordmark and one 44 × 44px icon-only Game menu control at opposite corners. There is no bot-round sentence, header sound control, remaining-deck count or visible routine turn/color HUD. Sound, room-code copy, written direction/next player, sorting and activity live in the native menu. Accessible turn/color/action status and the hand's full count remain available.

`game-main` is bounded to 1600px, with one `minmax(0, 1fr)` column and rows `minmax(0, 1fr) var(--hand-height)`. Ordinary side padding is 24px. Two borderless ellipse planes, rotated −19 degrees, extend behind opponents and centered piles: the outer is `min(1120px, 112vw)` × 84%, the inner `min(900px, 90vw)` × 63%. Their open edges have no felt, seam, rail or raster background. Piles sit at `calc(50% + 34px)` within the upper play region with 40px separation; opponents keep independent perimeter lanes.

The hand intentionally enters from below the viewport: roughly its lower quarter is clipped by the page. Ordinary hand/pile multipliers are 1.65/1.35 with a 188px hand row; at heights at least 900px and widths at least 701px they become 1.95/1.65 with a 216px row. The horizontal scrollport contains complete card boxes below that page clip: its height is `calc(122px * var(--hand-scale) + 120px)`, with 42px top padding, horizontal scrolling and hidden vertical overflow. Preserve this distinction so keyboard focus never vertically scrolls away the card tops. Cards overlap by 44px; their bounded fan drop is multiplied by 0.45. Local turn raises the hand 8px; legal cards rise 19px and grow to 1.025. Focus/inspection rises 32px and straightens to 1.04; fine-pointer hover rises 34px. These source distances are response geometry, not extra spacing primitives.

Keyboard focus uses `preventScroll`; horizontal reveal keeps an 18px visibility margin. Home/End reach the ends of a large hand, including the cropped final card without page movement. New local draws reveal without forced selection; unrelated snapshots preserve scroll position. Hover wins over neighboring focus; dragging owns the highest card layer. The contextual dock floats above the hand with 44px actions, only showing an actual decision or inspection hint. Draw remains on the physical deck; eligible UNO stays at the hand's upper-right edge.

Phone gameplay is landscape only. `(orientation: portrait) and (max-width: 700px)` removes gameplay/header/reconnect/error regions from layout/accessibility and shows rotate guidance plus Leave table. Local bot and auto-pass work pauses and resumes with landscape; online guidance says the round continues. Home and setup remain portrait-friendly.

At 680px high and below the hand/pile multipliers are 1.35/1.08, the hand row 152px, top clearance 36px and overlap 34px. Short landscape (`max-height: 460px` and `min-width: 541px`) uses a 44px header, 16px main padding, 1.08/0.72 multipliers and 110px hand row. Five compact opponent identities occupy top lanes at 10/30/50/70/90%; back fans hide. Hand top clearance is 30px, overlap 30px, turn/legal lift 5/12px, fan angle 30% of ordinary, and focused/inspected/hovered lift 22px at 1.025. At 360px high and below use 0.88/0.61 multipliers, an 86px hand row, 25px top clearance, 21px overlap, 4/10px turn/legal lift and 18px focus lift. Avatars hide in this shortest rule, leaving 28px one-line identity badges. Pile names become visually hidden with semantics retained. There is no deck-count badge or left turn HUD. Large hands keep native horizontal scrolling and complete internal card boxes at both landscape sizes. Reduced motion removes the 200ms hand transform transition and card-face transitions while retaining static lift and legal growth.

The optional collection follows the primary play choices on phone home layouts. Its four mini cards stay in a four-column grid, with 7px gaps reduced to 5px at 380px and below; the summary has a 44px minimum target. The progress block shares the home action group’s 560px bound and fills the result dialog. Results scroll inside the native modal; their action group sticks at bottom zero within the dialog, with its own themed background and no negative bottom margin. At 540px and below the result actions stack at full width. Long winner and player names wrap rather than push counts or rematch outside the bounds.

Compact opponent labels keep their card-face avatar visible except in the shortest landscape rule above; short-landscape badges otherwise use a 22 × 25px face. Names and actual counts retain priority; yellow opponent identity and raised local cards identify the current seat, with full turn/color semantics retained for assistive technology. Long names retain deliberate ellipsis with the full name in the accessible tree.

**The Hand Owns Its Width Rule.** Keep overflow inside the hand, preserve corner identity and focus clearance, and bound the fan arc as the card count grows.

## Elevation & Depth

Two tonal blue planes supply arena depth without physical furniture. The shared face retains a thin white laminate edge, short stock layers and directional cast shadows; held and inspected cards deepen as they rise. Controls retain bevel highlights, inset pressed lips and soft contact depth. Ordinary information containers do not inherit card stock shadows.

Historical `public/textures/green-baize.jpg` and `public/textures/padded-leather.jpg`, their exact adjacent `.prompt.txt` prompts and embedded provenance stay preserved as historical assets. They are not current arena materials and do not authorize a felt or leather extension.

### Shadow Vocabulary

- **Supporting surface:** `--ui-shadow` supplies the ambient dialog shadow and varies with appearance.
- **Laminated face at rest:** `inset 0 1px 2px #ffffffb0, inset 0 -1px 1px #17234145, 0 1px 1px #c4ccdf, 0 3px 1px #68748e, 0 8px 12px #02071880` supplies thin white stock layers and contact depth.
- **Raised face:** `inset 0 1px 2px #ffffffb0, 0 1px 1px #c4ccdf, 0 3px 1px #68748e, -3px 15px 20px #06185a80` separates a hovered, focused or inspected card from its neighbors.
- **Draw stack:** `inset 0 1px 2px #ffffffb0, 1px 3px 1px #d5dcec, 3px 6px 1px #7d8ba8, 4px 10px 1px #35435e, 4px 17px 18px #06185a70` distinguishes a usable deck from one face.
- **Supporting pressed control surface:** shared supporting-screen primary buttons use `inset 0 -4px 0 #15292626, 0 5px 9px #15292620`, compressing to `inset 0 -1px 0 #15292626, 0 1px 3px #15292620`.
- **Club actions:** Play uses `inset 0 2px 2px #ffffff70, inset 0 -4px 2px #bd7600, 0 6px 16px #04191d70`; room actions use `inset 0 1px 2px #ffffff60, inset 0 -3px 2px var(--action-edge, #06339c), 0 5px 10px #02071870`, with a crimson edge for Join. Press compresses the inset to 1px with `0 1px 4px #04191d50` contact depth. Native color choices use `inset 0 2px 2px #ffffff40, inset 0 -4px 3px #00000028, 0 5px 10px #02071820`. These are inset contact and soft cast depth.

**The Paper Lift Rule.** A moving or inspected card changes its own depth and reveals its face. Keep unrelated chrome quiet and reserve short stock layers for physical cards and piles.

The shared face tilts through CSS only at fine-pointer hover with no reduced-motion preference: perspective 650px, rotateX 5 degrees and rotateY −5 degrees, settling over 130ms. A bounded 180ms laminate highlight crosses the face once per hover transition. Active contact immediately resets tilt and removes the moving sheen before gesture geometry is captured. Touch/coarse pointers keep static material depth; reduced motion removes face/sheen transitions and their hover movement. The face module remains attached to clones in the motion layer. There is no pointer-tracking render loop or idle animation.

**The Contact Before Flight Rule.** Settle hover tilt on contact before capturing drag or flight geometry; preserve readable static color, edge and focus when spatial motion is disabled.

## Shapes

The native face is a tightly rounded rectangle (6px base radius) with white edging and a white diagonal ellipse (116% width, 64% height, rotated −34 degrees). Its base dimensions, radius and index geometry scale as one unit. Wilds use the same silhouette with a four-color circular symbol; action faces use shared SVG symbols or large draw values. The back uses a navy base, a crimson diagonal ellipse, faint diagonal stripes and a white Outfit UNO mark. Reverse uses the shared Repeat2 SVG. Wild draw four centers a fan of four saturated, white-edged small cards; +4 remains in both corner indices and its accessible label remains “Wild draw four.”

Milestone collectibles reuse the tight card corner and flat geometric icon language. Their small four-card disclosure fan inherits the deck's overlap; it is supporting progress, not another photographic material.

Controls, fields, panels and dialogs use the observed rounded vocabulary in frontmatter. Home actions and header utilities use sharper 6px corners at all widths; quiet home text actions use 4px corners. Circular color swatches and count badges communicate state. The arena's two open elliptical orbit planes and the hand's curved overlap carry the large forms; do not transfer card rotation to ordinary information containers.

## Components

### Buttons

Broad shell actions use the button role, a 50px minimum height, rounded control corners and 14px × 22px padding. Supporting-screen primary actions use coral; the contextual live Play action uses action yellow and dark ink in every shell appearance. Secondary actions are outlined and transparent; text actions remain quiet. Compact utilities retain the field radius and have a 44px minimum hit area; small buttons also have a 44px minimum height. Hover changes surface tone; press feedback is immediate. Shared primary actions and native color choices compress their inset edge and soft shadow with a 3px downward response and a 120ms easing. Home actions instead use 130ms transitions with `cubic-bezier(0.16, 1, 0.3, 1)` for transform, a 2px hover lift only on fine hover pointers, and a 2px press. Home reduced-motion guards remove transitions and travel while retaining visible surface feedback. Home focus is a 3px yellow outline offset by 5px, switching to ivory on yellow Play; native dialogs retain their own focus styling. Global keyboard focus uses a blue outline; arena focus uses yellow. Disabled actions reduce opacity, while the physical deck remains visibly present when unavailable.

### Inputs / Fields

Native labeled fields use the themed surface, a fine line border, the field radius and a 50px height. The local human-name label and input form one compact field rather than separate setup-grid rows. Its 8px grid gap and existing 8px label margin produce 16px of visible separation. At 800px and below native inputs and selects use 16px text. Focus strengthens the border and retains the visible outline. Placeholder ink stays muted. Range inputs use the accent color without custom replacement controls.

### Navigation

Settings use four equal tabs with a fine baseline and a coral selected underline. Phone tabs hide their decorative SVGs and preserve their text. In-game sorting and activity live in the game menu; the header contains the wordmark and one 44px icon-only menu; sound and room-code copy live inside it.

### Cards / Containers

Use the native dialog primitive for settings, game menu, color choice and results. Dialogs use the themed surface, ambient shadow, bounded viewport height and internal scrolling. Supporting panels and separated rows stay visually subordinate to the cards. Original small card-face player badges identify seats and results; compact phone seats retain reduced badges beside readable names except for the shortest-landscape one-line identity treatment.

### Entry, setup and room choices

The full-width yellow Play action deals immediately with the saved local crew and rules. Equal blue Create a room and crimson Join a room actions follow together, both with white labels. Quiet Set up bots and How to play actions come next; help expands inline through an `aria-expanded` button without hiding the main choices. Header settings and invitations retain the native components. Honest progress follows the action group and remains absent before a completed round. Setup shows the human name, two-to-six-seat count and a compact bot crew; bot renaming stays inside a native disclosure. Local setup and room hosts share the same rule-preset and starting-hand controls before dealing, with custom rules as a secondary text action.

Creation and joining are distinct labeled choices. Joining accepts either the six-character room code or an invitation URL in one field, normalizes the code without truncation, and places validation guidance beside it. Persistent friend codes remain inside the separate Friends & invitations disclosure. Room sharing uses named copy-code and invitation-link actions. Bot seats are identified as bots; host controls and the guest waiting message reflect their actual roles.

### Flat illustrated card-club scene

`public/artwork/card-night-flat.webp` is the static, original 1729 × 910 transparent cut-out scene: a blue rabbit, coral red panda and mint crocodile play around one small teal table. Flat shapes, confident contours and complete silhouettes replace the superseded furry cinematic room. The raster supplies atmosphere; all controls remain HTML. Its 220786-byte (215.6KiB) WebP preserves the full source dimensions and alpha plane through quality-90 RGB conversion with lossless alpha. HomeScreen references its public URL with explicit intrinsic dimensions, Next Image `preload`, responsive `sizes` and `unoptimized` to avoid a second encode. Preserve the exact generation prompt and creation provenance in `public/artwork/card-night-flat.webp.json`, the matching `.impeccable/review/shared-table/art-prompt.txt`, and conversion/alpha evidence in that packet’s `assets.md`. Contain fitting preserves ears, arms and table edges at all widths. No crop, boxed background, scenery fade, dependency, extra font or idle loop is part of this treatment.

**The Central Play Rule.** Keep Play on the home’s center axis ahead of room actions and secondary help; preserve the complete flat transparent scene and real, immediately available controls.

### Original player expressions

`PlayerAvatar` is the same small original card character in seat badges and the winning result. It does not define the home’s illustrated animal scene. Its deterministic seed picks one of the existing six identity colors and a small resting tilt. Eyes and mouth use native CSS shapes; the badge is decorative (`aria-hidden`), leaving names, actual counts, accessible turn status and native controls authoritative. The completed-round winner celebrates.

`getPlayerExpression` derives the live face from the published snapshot in priority order: the winner celebrates and other seats become neutral; a multi-card draw or the target of a call-out looks surprised; the current seat thinks, or looks surprised while a draw penalty is pending; the last player to play or declare UNO looks happy; everyone else is neutral. Reconnecting opponents show neutral. These are present-state expressions rather than timers, reward counters or narration.

A non-neutral opponent face reacts once over 260ms using the shared easing, only under `prefers-reduced-motion: no-preference`. The decorative root is keyed by expression: a genuine expression change restarts the bounded reaction, including consecutive non-neutral states; an unrelated snapshot with the same expression preserves it without replay. Static facial differences remain under reduced motion. There are no idle loops.

**The Honest Expression Rule.** Derive player reactions from published game facts, restart the decorative one-shot only when expression changes, and preserve readable state without spatial animation under reduced motion.

### Active seat and turn cue

An active opponent badge fills bright yellow with `move-action-ink`; inactive badges are transparent over blue with white names and pale secondary counts. Local turn raises all held cards 8px; legal cards rise 19px and grow 2.5%, with the smaller landscape distances in Layout. This is a bounded 200ms transform transition, absent under reduced motion; the raised static state stays readable. The old legal-card bottom mark is hidden and quiet cards keep their vivid ink.

Routine turn heading and active color are accessible-only. The top discard itself supplies ordinary color. Only a wild top discard exposes a written chosen-color label plus bordered 16px swatch. Waiting for a remote wild choice, penalties, invalid inspection, drawn-card decisions, optional Pass and reconnect/error states keep contextual guidance. No permanent Your move sentence, ordinary color caption or remaining-deck badge is part of live play.

### Earned pressure and action signals

A one-card opponent gets one yellow numeral/UNO marker attached inside the opponent hand, clear of seat labels and the physical deck. It settles once in 240ms; reduced motion removes that animation and preserves the static marker. The label still carries the actual count or called-UNO state for assistive technology. An eligible missed call exposes a compact 56 × 44px Catch control with the full accessible name “Catch [player]’s missed UNO”; it disappears when the state is resolved. Pending actions, color choice and disconnection prevent unavailable catches.

A real pending draw overlays its count on the physical deck and dims the back wordmark; the deck's accessible name retains the complete penalty count. Never manufacture pressure from a decorative value. The brief reverse action graphic uses the same Repeat2 icon as the deck. Discard-all feedback displays the negative total actually removed, including the played card (`1 + discardAllCount`), rather than an invented score. Existing feedback stays bounded and reduced motion suppresses its spatial burst. Call-out feedback reads the actual penalty from the engine; audio event identity follows the played action card.

### Completed round and milestone collection

The native result dialog uses the winner's existing card backs, player identity and trophy, then a terminal “Cards left” list. The winner comes first; all other rows retain their seat order. Counts are actual remaining hands, with a tabular count column and a distinct winner cue. They do not establish points or finishing ranks. The local player keeps a textual identity cue. The existing local/host “One more round,” online guest readiness and “Back to home” handlers remain the real actions; online rematch controls are unavailable while disconnected; the scrollable dialog keeps them reachable when the collection is expanded.

`PlayerProgress` reads validated device history and delegates to the exported pure `ProgressCollection`; no progress UI is shown before the first completed round. The compact record names rounds, wins and the device scope. Current streak appears only when greater than one. A native details/summary disclosure shows the earned count and optional four-card collection: **First win** (one win), **Hat trick** (three wins), **Table regular** (ten completed rounds), and **On fire** (best streak of three). Progress fractions cap at their goals. Collected cards use the retained supporting milestone yellow, dark ink and a check; home scopes earned cards to blue and white. Unearned cards use themed muted ink, a line border and their fraction. Their icons use the established SVG system.

The collection derives from the existing idempotent completed-round record; it introduces no separate reward storage. Best streak keeps On fire earned after later losses, while the record's current streak reflects the current run. Rendering illustrative data through the pure collection must not mount result recording or write synthetic history.

**The Earned History Rule.** Show rewards only from validated completed rounds. Keep best-streak collectibles earned after a loss, keep current streak separate, and present terminal hand counts without inferred points or finishing ranks.

### Held hand and piles

`UnoCard` and its scoped `UnoCard.module.css` own the shared native face finish, white stock, print inks, Wild+4 fan and guarded CSS tilt/sheen; `HandCard` owns inspection and gestures; `app/table.css` owns inherited base card geometry; the later-imported `app/arena.css` owns the open blue live world, viewport geometry and hand clearance; `app/home.css` owns the separate title screen. The first tap or native keyboard activation plays a legal card immediately. A nonmatching card remains inspectable; explicit named Play is a fallback if that inspected card later becomes legal. Waiting players can inspect their hands; a legal exact-match jump-in follows the same direct-play availability. Cancelled dialogs return focus to their opener. A locally played focused card hands keyboard focus to a surviving neighbor without stealing focus from another dialog/control. Arrow keys browse the hand with wrapping; Home and End reach its ends, keeping focused cards in view. A legal card can also be dragged upward. Readiness and release use the same `canReleaseCard` predicate: `dy < -65` and `abs(dy) > abs(dx) * 0.8`, with finite coordinates. The table says “Slide up to play” during lift and “Release to play” only when that exact predicate passes. Focus lifts a card, native button activation preserves keyboard access, and legal lift/growth identifies availability without dimming native inks.

Pointer capture starts on the face. Nonprimary pointers and nonleft clicks are ignored; button loss, pointer cancellation, capture loss, blur, visibility changes and unmount cancel or clean up the gesture. An unsuccessful drag returns quickly. Reduced motion removes travel and drag rotation while retaining a usable selection state. Identity follows the card through sorting and game updates.

The contextual move dock floats immediately above the hand. It exposes Pass when available and named Play for a pre-inspected card that becomes legal. The physical deck is the sole Draw control; its accessible name and adjacent label name penalty counts. Eligible UNO floats at the hand’s upper-right edge. The contextual button and U shortcut share one availability predicate: an active round, no pending color choice or action, a connected online session, enabled UNO declarations, one or two cards, and no declaration already made. Its status text describes the same legal decision, but routine copy stays accessible-only; selected-card inspection, a local draw and disconnection can reveal the contextual hint. A penalty count remains on the deck, and optional Pass remains a real action. A single local draw names its card in the existing hint when play or pass is available; a no-match draw says “No match. Passing…” to reflect automatic passing. Pending and disconnected actions cannot submit another move. Sorting and activity remain in the menu. The illustrated home scene does not redefine the native deck’s faces or interactive geometry.

**The Direct Move Rule.** Play a legal face on its first activation. Keep nonmatching inspection and the full named fallback for a pre-inspected card that becomes legal. Reveal actual new local draws without forcing selection; every gesture, shortcut and hint follows current legal-action state.

**The Play Comes First Rule.** Motion and sound explain the current action without blocking controls, queuing stale actions or changing turn timing.

An actual newly added local draw is scrolled into view before hand rectangles and arrival destinations are measured. Card identity is found against the previous hand, so the reveal works in a sorted scrolling hand without forced selection. Initial deal, opponent draws and hand shuffles do not trigger this draw reveal or recenter the reader’s horizontal position. Reduced motion retains the reveal while removing the arrival flight.

Card flights use the actual release center, width and composed rotation, landing at the pile’s actual angle. The shared `getCardFlight` geometry bounds play, draw and deal to 190–262ms. The table stays still. The arena hand transform settles over 200ms; local arrivals are capped at six representatives with 25ms stagger, including the newest in a large draw. Redistributed shuffle cards originate at the played pile. Arena inspection uses that same 200ms hand transition; unsuccessful drag return remains bounded at 180ms. A new snapshot interrupts obsolete animations and ghosts; hidden pages, unmount and a newly enabled reduced-motion preference cancel them too. Reduced motion removes spatial flights and entrances, retaining a 900ms opacity-only special-action signal. These durations never schedule the engine.

Pointer-down primes audio silently. Actual tap or keyboard activation produces a quiet pickup immediately for both direct legal play and nonmatching inspection; upward drag starts pickup only after a deliberate vertical lift. Snapshot contact remains the actual play sound. Horizontal hand scrolling does not make pickup sounds. Ordinary plays, draws and action cards use paper/contact rather than melody. Pitched signatures are reserved for UNO, call-outs and results. `public/audio/card-play.wav` carries `card-play.source.json` provenance, with an immediate synthesized fallback while it loads. Pickup and every direct action through the shared action wrapper prime audio synchronously in the originating gesture; UNO also primes explicitly. Gesture unlock exposes honest audio readiness. Physical speaker quality has not been certified by a listening check. Only the latest action younger than 160ms may follow an in-progress unlock; old actions expire. Mute, disabled card sounds, zero volume and hidden pages suppress or stop feedback. Music and speech are not default turn feedback. If browser storage rejects writes, this session retains mute/volume settings in memory and still notifies controls and the audio engine.

## Do's and Don'ts

### Do:

- **Do** use the same authored native face for the hand, piles and card motion.
- **Do** keep home Play central, Create/Join paired, sharper 6px action corners and complete flat transparent silhouettes with their prompt provenance.
- **Do** preserve vivid deck colors, white faces, distinct dark green/yellow index and center inks, and a written chosen-color label for wild top discards.
- **Do** retain the fixed home club palette, scoped open electric-blue arena and theme-aware settings/setup.
- **Do** keep one clipped viewport with centered piles and a bottom-cropped fan, complete internal card boxes, top focus clearance and independent horizontal large-hand scrolling.
- **Do** retain distinct six-seat landscape identities and the portrait rotate gate, local pause and online-continuation disclosure.
- **Do** play legal cards on first activation and keep nonmatching inspection, turn state and situational actions clear with touch and keyboard.
- **Do** keep the full named Play action, selected card and current hint in agreement; retain dark ink on yellow.
- **Do** reveal actual new local draws without selecting them and preserve horizontal position on unrelated updates.
- **Do** keep Draw on the deck, eligible UNO at hand level, and the dock limited to contextual Pass and the pre-inspected-card Play fallback; give button and keyboard the same availability rules.
- **Do** put Set up bots and How to play after Play/Create/Join, and keep optional bot/friend details in disclosures.
- **Do** keep face tilt and sheen within fine-pointer/no-reduced-motion guards, settle on contact before gesture capture, and honor mute, audio readiness and interrupted gesture cleanup.
- **Do** keep presentation responsive to the current published state without delaying play.
- **Do** derive optional milestone cards from completed device-local rounds and keep result actions reachable inside the native dialog.
- **Do** attach pressure cues to their actual opponent hand or penalty deck and retain full accessible names.
- **Do** use original expressive card characters, preserve compact phone identities, and restart their bounded reaction only on a real expression change.
- **Do** acknowledge actual card activation with immediate pickup while keeping horizontal scroll silent.

### Don't:

- **Don't** restore the rejected home side column, floating card-face fan/stickers, plain cream field, arbitrary decorative 7 or broad rounded action tiles.
- **Don't** restore clay hero art, Fredoka, a third font family or a parallel component library.
- **Don't** replace the held fan with a flat shrinking row or let large hands overflow the page.
- **Don't** restore the separate local-hand toolbar, standalone direction arrow, portrait phone gameplay or side-by-side landscape table/hand.
- **Don't** crop the flat home silhouettes or restore cinematic scenery and a boxed or patched background.
- **Don't** restore poker furniture, felt/leather live backgrounds, a remaining-deck badge, header sound controls or a routine visible turn/color HUD.
- **Don't** show UNO when ineligible, duplicate Draw in the dock or turn sorting into a permanent table control.
- **Don't** use Unicode glyph icons in place of the established SVG icon system.
- **Don't** give information containers decorative block shadows; thin card-stock edges and pressed control bevels remain native to this tactile world.
- **Don't** queue narration, wait for sound or animation, or add a blocking splash.
- **Don't** copy a reference mascot, add idle character loops or replay reactions on unrelated snapshots.
- **Don't** infer points or finishing ranks from cards left, grant rewards per click, or claim a milestone is new without before/after evidence.

Not canonized: obsolete `.home-*`/`.primary-choice` rules still present in shared CSS, including the old 21px/18px choices and native-fan launch treatment, are dormant historical code rather than current home authority. Earlier home review verdicts and cropped pre-correction scene captures do not establish current geometry. Vestigial sub-11px shell/progress captions and the unused tiny table-watermark styling do not establish a legibility floor or authorize new kickers and eyebrows. Superseded midnight-table declarations, old inspect-first guidance and the removed hard rail shadow are not reusable rules. The new 10px milestone descriptions and local-player annotations are also not a reusable typography floor. Detector advisories, including the earned-moments report’s 83 findings, are review evidence rather than new tokens. The playful-feedback ramp/palette detector advisories are not new tokens, and compact sub-11px counts or pile labels do not establish a reusable type floor. The shared-table detector’s small landscape labels and inherited palette/rail advisories do not establish new tokens or a reusable legibility floor; functional pressed-button inset lips remain native to the confirmed tactile world. Physical speaker balance and real-device touch remain unverified; none is legitimized as a system value.

The vivid-depth detector’s 59 material/palette advisories are review evidence rather than permission to add new tokens. Superseded muted card inks, teal home, ivory room buttons and lime live feedback are not current authority. The shortest landscape’s 10px counts and hidden visual pile labels are a bounded space treatment, not a general type-size or labeling rule; no claim of an all-UI accessibility audit is made.

The October 21 play-field detector’s 19 advisories are review evidence, not new system tokens or exemptions. Superseded felt/leather shadows, hidden turn-cue type roles and retired deck-count geometry are deliberately not canonized. The intentional foreground crop is a viewport treatment with complete internal scrollport cards, not permission to clip card tops or keyboard focus. Compact 11px landscape text is a bounded density treatment, not a general typography floor. No new raster comp, physical phone test, speaker listening check or exhaustive accessibility audit is claimed.
