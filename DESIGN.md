---
name: "UNO — Color play"
description: "A welcoming edition-colored card table with human portraits, vivid native cards and warm amber actions."
colors:
  club-ink: "#17345f"
  club-paper: "#fff7e7"
  club-red: "#df0735"
  club-yellow: "#ffd45a"
  club-blue: "#1254b5"
  club-green: "#00bc68"
  stage: "#123d86"
  stage-light: "#1d56a3"
  no-mercy-stage: "#140c12"
  no-mercy-stage-light: "#2c121d"
  all-wild-stage: "#26163b"
  all-wild-stage-light: "#482366"
  stack-stage: "#143975"
  stack-stage-light: "#2259a1"
  wild-stage: "#302247"
  wild-stage-light: "#523466"
  ui-surface: "#fffcf4"
  ui-muted: "#58687a"
  ui-line: "#ccd3da"
  portrait-selected: "#e8f0ff"
  draw-label-surface: "rgba(14, 25, 46, 0.9)"
  forced-draw-label-surface: "rgba(28, 20, 5, 0.95)"
  ui-accent-red: "#c50730"
  ui-accent-green: "#007943"
  cue-surface: "#09285c"
  cue-ink: "#38290c"
  cue-muted: "#5a410f"
  amber-edge: "#bf8a28"
  cream-hover: "#ffdc36"
  midnight-surface: "#153765"
  midnight-muted: "#c6d8f1"
  midnight-line: "#46628a"
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
  settings-title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  settings-title-short:
    fontFamily: "Outfit, sans-serif"
    fontSize: "24px"
    fontWeight: 750
    lineHeight: 1.15
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
  account-section:
    fontFamily: "Outfit, sans-serif"
    fontSize: "18px"
    fontWeight: 650
  preference-label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 600
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
  annotation: "4px"
  field: "6px"
  small: "8px"
  inset: "9px"
  control: "12px"
  action: "14px"
  identity: "16px"
  cue: "18px"
  panel: "20px"
  settings-sheet: "24px"
  pill: "999px"
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
  settings-choice:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    typography: "{typography.account-section}"
    padding: "16px 0"
    height: "76px"
  settings-sheet:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.settings-sheet}"
    width: "620px"
  settings-header:
    backgroundColor: "{colors.stage}"
    textColor: "{colors.club-paper}"
    typography: "{typography.settings-title}"
    padding: "18px 24px"
    height: "80px"
  setting-select:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    typography: "{typography.body-large}"
    rounded: "{rounded.control}"
    padding: "10px 40px 10px 14px"
    width: "132px"
    height: "48px"
  settings-switch:
    backgroundColor: "{colors.ui-line}"
    rounded: "{rounded.pill}"
    width: "44px"
    height: "26px"
  settings-switch-checked:
    backgroundColor: "{colors.club-blue}"
  settings-portrait-selected:
    backgroundColor: "{colors.portrait-selected}"
    rounded: "{rounded.identity}"
  account-menu-row:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.small}"
    padding: "12px"
    height: "48px"
  rule-profile-select:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    padding: "0"
    height: "48px"
  rule-profile-row-active:
    backgroundColor: "{colors.portrait-selected}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.control}"
    padding: "12px"
    height: "80px"
  rule-profile-active-check:
    textColor: "{colors.club-blue}"
    size: "16px"
  home-favorite:
    backgroundColor: "transparent"
    textColor: "#dce9ff"
    rounded: "{rounded.inset}"
    padding: "8px"
    height: "44px"
  home-favorite-active:
    backgroundColor: "{colors.club-paper}"
    textColor: "{colors.club-ink}"
  favorite-replacement:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "76px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
  player-label:
    backgroundColor: "{colors.cue-surface}"
    textColor: "{colors.club-paper}"
    rounded: "{rounded.identity}"
    padding: "4px 8px 4px 4px"
    width: "128px"
    height: "44px"
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

- Quiet blue, charcoal/crimson or plum edition fields keep attention on live cards and people.
- Human portraits, opaque nameplates and exact hand counts make the table social and readable.
- Outfit UI and Barlow Condensed deck lettering share one friendly voice.
- Amber pressed actions and a compact real countdown explain the current decision.
- A quarter-cropped curved held hand preserves direct legal play, readable overlap and independent large-hand scrolling.

The owner-approved October 25 geometry replacement inherits this world and FORM seed through `.impeccable/review/responsive-table/contract.md`. It replaces bottom-anchored piles with the centered, panel-bounded table. The subsequent owner-requested quarter crop in `.impeccable/review/quarter-hand/contract.md` supersedes that rebuild’s fully-visible-bottom requirement without changing the inherited world or FORM seed. Palette, lettering, portraits and native card print retain their existing authority.

The October 26 focused-account extension (`.impeccable/review/focused-account/contract.md`, FORM `focused-account-20261026`) preserves this world. Optional identity, social and preference tasks live behind the avatar; joining and routine play remain visually quiet. No new shipping raster assets were introduced.

The October 26 settings redo (`.impeccable/review/settings-redo/contract.md`) supersedes the focused-account sidebar, mobile section picker and avatar creator. A compact warm-white sheet offers four choices, then one task at a time; the arena and native card world retain their authority.

The October 27 edition hardening (`.impeccable/review/edition-hardening/contract.md`) is a bounded extension of this world, inheriting FORM seed `2fba311c` under the narrow-extension exemption. It restores three playable fixed originals and home favorites, separates active identity from pins, and gives custom-copy editing its own native dialog. It changes no imagery or home title/card-fan/action composition. Latest product authority is the October 27 entry in `PRODUCT.md`; older single-Classic and removed-home-track guidance is superseded.

The October 27 settings refinement (`.impeccable/review/settings-spacing/contract.md`) inherits the same world and FORM seed `2fba311c` as a local refinement, with no new world roll or comp. It carries the homepage palette into blue settings headers, cream scrolling bodies, amber decisions, pale-blue active rows and native card miniatures. This supersedes all-cream headers, separate body back rows, blue-filled stars, three custom-row actions and the earlier settings gutters. The shipped profile rows use an 80px minimum including padding; the contract’s provisional 72px row target is not the implemented rule.

Source authority: `app/layout.tsx` imports globals, legacy table geometry, arena, home, club, then settings styles. `app/club.css` owns shared palette/chrome; `app/settings.css` owns the settings sheet, avatar popover, portrait picker and invitation surfaces; `app/home.css` owns home; `app/arena.css` owns live geometry/cues, with its final centered-board section superseding earlier geometry; `PlayerAvatar.module.css`, `OpponentSeat.module.css` and `UnoCard.module.css` own their materials. Component module specificity matters: the active portrait badge is cream, not the older arena yellow badge. Source takes precedence over older captures.

## Colors

The primary palette is saturated blue with cream and amber; the native deck retains its own brighter four-color print.

### Primary

- **Club blue and stage blue:** shared action/focus blue and the deeper arena ground. The same stage blue heads settings tasks, with cream titles and header icons. Stage light creates a broad radial lift rather than a competing object.
- **Edition grounds:** Classic UNO uses stage blue, UNO Show ’Em No Mercy uses charcoal with a crimson lift, and UNO All Wild uses plum. The selected edition carries the same ground through home, bot setup, room creation and its board; setup reads the shared edition stage colors. Named Classic custom profiles can still derive the inherited stack-blue or wild-plum house-rule moods; these are not additional original editions.

### Secondary

- **Club yellow:** primary controls, local-turn cue, catch action and portrait ring. Its darker amber edge supplies the pressed lip; cue ink and cue muted provide readable text.
- **Native red, blue, green and yellow:** card identity stays faithful to the code-rendered deck. Club blue/yellow are interface colors; card blue/yellow remain distinct tokens.

### Neutral

- **Club paper and UI surface:** warm foreground and default light native dialogs, account popover and invitation notices.
- **Club ink, UI muted and UI line:** supporting-page text, secondary text and field/divider strokes.
- **Cue surface:** opaque dark blue identity and remote-turn surfaces; no scene detail shows through names. Draw labels retain separate translucent navy and forced-draw brown overlay inks, scoped to readable pile status rather than general panel surfaces.
- **Portrait selected:** pale blue is the fixed-light picker and active game-profile row fill. Portrait tiles pair it with a blue border/check; game rows pair it with an inline blue check. Favorite stars have an amber fill and blue outline when pinned, independently of active selection.
- **Saved appearances:** paper is the default; midnight, forest and sunset override supporting UI tokens in `club.css`, including other native dialogs, the avatar popover and invitation notices. Midnight uses a navy surface and cream text rather than charcoal. The settings body always uses warm UI surface, club ink and the light supporting tokens, including blue focus and selected portrait states; its stage-blue header uses cream text/icons and yellow keyboard focus. No Appearance controls are offered; saved theme readers remain compatible. Home and arena retain their edition or supported custom-rule grounds.

**The Published Color Rule.** Amber, cream active badges, legal-card outlines and wild swatches describe actual published state. Retain names, counts and written action/color labels alongside color.

## Typography

**Display Font:** Barlow Condensed, sans-serif, for the home UNO mark, native card faces and selected game actions; display lettering is italic where implemented.
**Body Font:** Outfit, sans-serif, for headings, forms, controls, names, help and countdowns. Both are loaded through `next/font` in `app/layout.tsx`.

The ramp is role-based, not a geometric scale. The frontmatter records the actual range, including compact roles; small phone text is subordinate metadata rather than the primary action label.

### Hierarchy

- **Home display:** home-only condensed italic mark; switches to an 80px role in short landscape. Do not reuse its scale for routine headings.
- **Headline / section / dialog:** Outfit with compact tracking and weight 750. Setup headline is responsive; dialog and section titles use their own roles. Settings uses the distinct 26px title role with 1.15 line height on desktop and phones, then 24px at heights of 500px or less; other dialogs retain their own responsive roles.
- **Body / large body:** supporting content and setup explanations, with measured line lengths (setup 50ch, home rules explanatory copy).
- **Account section / preference label:** medium-weight Outfit identifies overview choices and Friends groups (18px, 650); disclosures and preference labels use a quieter 14px, 600 role.
- **Control / support:** regular button and field labels, rule descriptions and secondary actions. Home Play is a larger Outfit role with a smaller explanatory line.
- **Player name / count:** names are 13px by default, 12px in narrow or short usable panels and 11px at the shortest panel tier. Counts remain 11px and inline status 10px in the identity module. Outfit carries both name and count. Tabular numerals keep counts and the clock stable.
- **Cue:** existing viewport rules retain the 18px/16px title roles and compact helper/clock roles; the centered board overrides titles to 12px and helper copy to 10px when usable panel height is at most 600px. A 28px clock fits that panel tier. The board container, rather than whole-window phone width, owns compact control placement.
- **Native deck:** face values and corner indices scale together through `--card-scale`. Preserve the native card-back Outfit wordmark and Barlow Condensed face numerals.

**The Two Lettering Roles Rule.** Outfit carries ordinary interface headings. Condensed italic lettering belongs to brand/deck expression and the existing emphatic game actions; it is not a global heading transform.

## Layout

Home is a centered title/start composition: main width capped at 760px and play lane at 400px. A small decorative native-card fan sits above up to three compact pinned profile choices and one dominant Play action; Create/Join share the secondary row. The favorite track uses equal flexible buttons with a 44px minimum height, a cream selected state and short edition labels; the active profile description remains below it even when the active profile is not pinned. Pinning and selecting are independent. The top-right avatar opens optional identity, social and settings tasks; bot setup and help are reached through Game rules, and completed-round progress through Profile. Setup and rooms do not repeat the avatar editor or decorative footer slogans. Under 700px width, spacing and type adapt; short landscape (height ≤540px, width ≥541px) uses a 900px two-column composition with an 0.85fr/1.15fr split.

The arena fills the usable `100dvh` viewport, clips page overflow and caps its internal stage at 1600px. The draw/discard pair anchors the optical center: its vertical target is 48% of the board height, bounded upward when the full hand needs clearance. Opponents occupy the perimeter. A separate lower grid row holds the curved hand with only its bottom quarter intentionally beyond the screen edge, as the owner requested on October 25. The full-height scrollport extends beyond the clipped page; shared fan geometry bounds the deepest resting corner to about 25% cropping. Focused or inspected cards lift fully into view. The measured negative bottom margin includes the fan’s lower-corner excursion around its 50% 120% pivot and the 26px scrollport tail budget. Hidden portrait measurements retain the last stable fit until landscape returns. The hand scrollport reserves 44px paging gutters on each side; large hands overflow horizontally inside it. Safe-area insets protect the outer edges.

Density follows the usable board size through container queries. Default hand/pile scales are 1.35/1.25; panels at least 1000px wide and 900px high use 1.55/1.5. At most 700px high they use 1.1/1; at most 600px high, 0.94/0.78; at most 360px high, 0.78/0.66. At most 300px high, pile scale becomes 0.6 and its center targets 45% of board height minus header height; upper seats move to −8px and flanks to 6%, while ordinary draw-pile bobbing stops to keep inspection and identities clear. The wide short-laptop exception (width at least 1000px, height 501–600px) uses 1.1/1.05. These are panel-density decisions, never a response to hand count. `app/arena.css` is the exact geometry authority; `lib/handLayout.ts` computes overlap from the measured scrollport and current card width, and shares `getHandFan` geometry between the rendered cards and `getHandCropMargin`.

Default identity badges are 128px wide with 32px portraits and 13px names. Panels at most 1000px wide use 112px/28px/12px; at most 600px high use 104px/26px/12px; at most 360px high use 96px/24px/11px. All retain the 44px target floor, opaque backing, exact count and inline status. Decorative opponent back fans scale with panel height; short panels hide side fans and all fans at five or six seats, and the shortest tier hides every fan. Pointer hover on visible back fans retains its existing dock response.

Desktop turn and inspection cues occupy the central hand-toolbar slot, while UNO/Pass occupy the right slot. At most 600px panel height, the cue and actions flank a reserved central pile lane. Inspection has a separate bounded lane below the player badges with a 44px dismiss target. At most 360px height, Draw is inset into its card back and the complete chosen-wild label into its pile, clear of identities and the hand.

Duo means a dual-screen or foldable device. When the browser reports two viewport segments, both the arena and native game dialogs stay in the first uninterrupted segment; dialogs retain a 12px inset. Container queries follow that panel. The phone portrait gate uses exact `window.viewport.segments` dimensions when available, then the reported segment arrangement, then the ordinary viewport. An upright panel at most 700px wide shows the rotate gate; local play pauses and online play continues. Browsers without segment reporting keep the ordinary responsive viewport layout. Panel-sized screenshots establish layout, not physical hinge or touch behavior.

Join and Create are compact focused forms: a centered panel capped at 560px with 28px desktop padding and 24px gaps. On phones at most 640px wide, the panel has a 12px viewport inset and 20px horizontal padding. At heights of 540px or less, 12px vertical padding and 10px gaps preserve the scrolling body and fixed decision. The primary Join/Create action uses the existing 18px Outfit role without condensed, italic or uppercase treatment. Open rooms and local bot setup retain the larger seat-ready shell.

Setup and room flows use a viewport-bounded panel with one independently scrolling content body and a separate, nonshrinking primary footer. Long names, avatar choices, expanded rules and room details consume body space rather than pushing Deal/Create/Join beyond the viewport. At heights of 540px or less, compact header, panel padding and body gaps take precedence over narrow-width styling; the supporting footnote hides while the primary target retains at least 44px. Help follows the same separation inside its native dialog: heading and Back/Next remain outside the scrolling examples and rule reference.

Account settings uses a content-sized native dialog (up to 620px wide; maximum height 800px or viewport minus 40px). Its blue heading and cream Done footer stay outside one cream scrolling task region. Heading, body and footer align to a shared 24px desktop gutter. The heading has an 80px minimum height and 18px vertical padding; the body uses 20px above and 16px below, and the footer 16px above and 20px below. The overview has four divider-separated rows: Profile, Friends, Game rules and Audio, with a 76px minimum height. One 44px back-arrow target inside the task header, accessibly named All settings, returns to this list without closing the dialog. Only the active view is mounted. At widths of 640px or less, the sheet uses a 12px viewport inset, a shared 20px gutter, a 72px-minimum header and unchanged 76px overview rows; body padding is 16px vertically and footer padding is 12px above / 16px below. At heights of 500px or less, an 8px viewport inset, 52px-minimum header and compact heading/footer retain the scrolling body and reachable decisions. Profile shows thirteen ready-made avatar choices immediately: seven columns on desktop, four on phones, seven again in short landscape. Progress stays collapsed beneath the portraits until opened. Joining uses one code/link field with the saved identity displayed as context. Room actions pair Add a bot and Invite friends at equal width and a 48px minimum height.

Game rules uses divider-separated profile rows with an 80px minimum including 12px padding. Each row has a native card miniature, short name, one-line description, inline active check and two secondary actions. Selected rows use pale blue; originals offer star/copy and customs star/edit. A 32×44px mark holds the actual UnoCard face at scale 0.34. The list exposes no house-rule toggles. Copy or Create custom profile opens a separate native task dialog; a named draft owns the scrolling body while Save and use / Cancel stay in its footer. The parent settings Done action is inaccessible while that top-layer editor is open. Make a copy lives inside an existing custom draft; delete retains its footer action. A full favorite set opens a narrower replacement task (up to 520px), with a short caption and three 76px-minimum choices using native card marks, short names and arrows, plus fixed Cancel. Nested dialogs inherit the same header/gutter/body/footer structure; heading/content layout rules are scoped to each sheet’s direct children. Game rules keeps only the short pin caption above profiles and places Bot seats / How to play links below them. The custom draft uses a short edition-rules caption and field labels, with no repeated explanatory introduction.

The observed spacing vocabulary runs from micro/detail gaps through compact, regular, section and dialog steps. It is not an instruction to normalize every card-specific overlap. See the two surface briefs for geometry and the sidecar for exact responsive conditions.

**The Hand Owns Its Width Rule.** Fit by overlap alone: retain an exposed strip of at least 44px or the full card width when smaller. A large hand scrolls at the panel's existing face size; hand count never shrinks cards or creates document-width overflow. The owner-requested bottom-quarter crop is independent of count and compensates for the fan corners.

**The Uninterrupted Panel Rule.** Keep identities, piles, the exposed held hand and native game dialogs within the first reported usable segment; only the intentional lower-quarter crop crosses its bottom edge. Place compact controls in reserved lanes so no identity, label or decision covers a card face.

**The Reachable Decision Rule.** In setup, room, account and help flows, scroll the content body while keeping the primary decision or lesson navigation visible. Short-height adjustments preserve target size and readable content instead of shrinking the entire panel.

**The One Open Task Rule.** Keep optional identity, progress and social controls behind the avatar. Show the four-choice settings overview or one selected task; mount optional progress and pickers when opened. Ready-made profile portraits remain immediately visible. The current task keeps its heading and decision reachable; custom-profile drafts use their own native dialog and explicit save/cancel boundary.

## Elevation & Depth

Depth comes from native card stock, soft blue contact shadows, floating portrait/cue surfaces and shallow inset control lips. Containers do not inherit a comic outline or hard offset shadow. The amber bottom lip is intentional material feedback, not a side accent border.

### Shadow Vocabulary

- **Primary press:** inset amber lip plus a small blue shadow; the home Play enlarges the same relationship.
- **Identity and cue:** soft blue contact shadows beneath an opaque surface.
- **Native stock:** fine white highlight, thin layered grey stock and a soft dark contact shadow; the draw pile adds stacked edges.
- **Dialog:** broad blue ambient shadow, with a dark native backdrop.
- **Popover and invitation:** the shared UI shadow lifts theme-aware surfaces above the current screen; invitation notices join the topmost open native dialog so they remain visible and actionable.

Exact shadow values and motion durations live in `.impeccable/design.json` extensions. Primary controls use a small scale press; card fan lift uses the standard out easing. Portrait reactions use distinct, bounded nod, surprise, UNO and win motions, with small decorative reaction badges above the face. Reduced motion keeps the static badge. Skip/reverse/penalty feedback is brief and derived from the move; reduced motion removes travel and preserves legible state. Thinking dots may pulse only while waiting for the actual actor; no decorative idle character loop is part of the system.

Card motion follows a shallow paper arc with a small airborne lift and direct contact, without a rebound. Ordinary travel lasts 240–300 ms; the opening deal uses short rounds across seats with at most 320 ms of stagger. Hover gently straightens the held card and eases neighboring cards apart; pointer focus does not pin the keyboard inspection pose. Motion stays interruptible, and independent arrivals finish through later moves.

Avatar popovers use a brief 160ms reveal, and incoming invitation notices use 180ms, sharing the standard out easing. Native disclosure chevrons rotate on opening. Both OS reduced motion and the previously saved reduced-motion preference suppress motion; master audio mute and the separate invitation-sound preference govern notification cues without delaying decisions.

**The Contact Rule.** Use inset press depth for actions and stock/contact depth for cards. Preserve readable resting geometry and keyboard focus; sound and animation never determine turn timing.

## Shapes

The small composite action-symbol annotations use the annotation radius to keep the white quantity marker legible across Skip Two, Reverse Draw Four and Target Draw Two. This is card-print geometry, not a new panel shape.

Forms use gently rounded rectangles: small field corners, medium controls, larger identity/cue surfaces and soft panel corners. Home Play has its own action radius. Portraits are circular with a cream rim. Native cards keep their scaled small corners and white oval print. These distinct silhouettes identify material and function; do not flatten them to one radius. The settings sheet uses its own soft corners (24px desktop, 20px phone). Its plain sliding switches use a full pill radius (999px, geometrically capped at 13px by the 26px track height); this is native control geometry, not a general container radius.

## Components

### Buttons

Warm yellow primary controls have club ink text, weight 750, a shallow amber bottom edge and a soft contact shadow. Shared targets are at least 48px tall; small/icon controls retain 44px targets. Home Play is a larger 70px action, 58px in short landscape. Hover warms the yellow on fine pointers; active scales to 0.97. Secondary buttons use a fine divider stroke; blue-stage room controls explicitly keep cream text. The avatar supplies the shared account entry across home, setup, rooms and play. Focus rings stay visible and outside the control.

### Chips and preset choices

Three fixed playable originals—Classic UNO, UNO Show ’Em No Mercy and UNO All Wild—anchor the profile list. The home track shows up to three pinned originals or named custom profiles; its cream selected button reflects active identity, while amber-filled, blue-outlined stars in Game rules reflect pinning. A selected unpinned profile remains active. Do not collapse those states or infer identity only from identical rule values.

Game rules uses divider-separated rows with native card miniatures, concise written names/descriptions and an inline blue active check on a pale-blue selected row. Each row has exactly two secondary actions: star/copy for originals, star/edit for customs. Originals are copied into a named draft rather than edited in place. Only the separate custom editor mounts supported rule groups and controls. Save and use saves the named profile and applies its rules; only successful application closes the draft and reports success. A failed room update keeps the saved draft open for retry, restores the previous selected game and reuses the saved profile rather than creating another copy. Cancel leaves the active game unchanged. An active custom name remains visible even when its rules match an original. Existing custom drafts offer Make a copy in their body. When all three pins are occupied, an explicit replacement dialog offers three named card choices. These focused views retain the sheet’s scrolling body and fixed decision footer.

**The Distinct State Rule.** The active check identifies the selected profile; the star identifies a home favorite. Saving a custom draft is the explicit boundary before its rules become active.

### Cards / containers

Setup uses a centered rounded theme-aware panel. Native dialogs use Outfit headings, explicit Close and reachable decisions in short landscape. Other dialogs follow saved appearances; Settings combines a blue/cream header, warm-white scrolling body with navy text and amber decisions. Settings, rules, results and earned progress use the same shared palette/control vocabulary; progress always reflects completed-round device-local data. Keep the native `Modal` primitive.

Settings and results bound their scrolling to the content body: the settings heading, All settings back action and Done remain visible, as do result rematch/home decisions. Related rule toggles use native fieldsets with ordinary Outfit legends. Profile has one labeled name field; edits apply on blur, Enter, All settings or close, with no separate Save step. Bot setup keeps rule editing in a native disclosure, names the active preset/hand size beside the pinned deal action, and uses the same portraits as the subsequent round. Its shared setup shell keeps the primary decision visible in portrait and short landscape, including when rules are expanded; profile customization remains in its separate dialog.

Room footers pair the primary action with a short readiness or connection explanation. Pending labels describe the actual operation, such as opening, joining or dealing; unavailable room actions retain a visible explanation and an available bot-play recovery path. Moving a submit button into the footer preserves native form submission, including Enter from a field.

Help uses the native dialog heading and Close, one scrolling lesson body and pinned Back/Next/Done controls. The compact step marks retain 44px activation targets. A native disclosure separates the read-only current-rule reference from interactive basic-play examples. Guests and help share the same written rule rows: a quiet label/value grid with fine dividers, explicit off states and wrapped values. Show the published room settings for guests; basic examples are identified as practice rather than presented as the chosen table rules.

### Inputs / fields

Theme-aware fields use UI surface/text, a two-pixel divider border, 50px height and a darker text-colored focus stroke. Invalid fields use accent red. Labels remain explicit; room codes and room links share the existing input flow. Native SettingSelect controls share a 132×48px column, a one-pixel divider stroke, 12px radius, 16px values and padding of 10px 40px 10px 14px. A separate decorative 16px Lucide chevron sits 14px from the right with pointer events disabled; the reserved end inset prevents crowding without replacing native select semantics. Bot challenge descriptions are screen-reader-only in Settings and remain associated through aria-describedby; the shared control can still display explanations elsewhere. Disclosure summaries retain a 52px minimum height. Dependent settings remain visible and explain their prerequisite: same-color matching is disabled until matching-number pairs are enabled, without discarding its saved value.

### Navigation

A small wordmark and one top-right avatar keep account navigation at the perimeter. The circular 48px trigger opens a native auto popover containing the saved portrait/name and Edit profile, Friends and Game settings actions. Rows are at least 48px tall with 12px padding, an 8px radius and written labels beside Lucide icons. Counts describe actual outstanding invitations/requests. The popover closes before opening its chosen task and focus returns through the shared native dialog.

Settings navigation is a four-row overview with 18px labels, 14px secondary descriptions, Lucide destination icons and chevrons. A task replaces the list and integrates its All settings back arrow into the blue header; no sidebar, tabs or phone section select is rendered. Direct avatar-menu Profile and Friends shortcuts remain. Focus uses a visible three-pixel blue outline in the body and yellow against the blue header. Do not add a parallel navigation library.

### Friends and room invitations

Friends separates Add a friend, room invitations, incoming requests, accepted friends and sent requests. Human portraits, names and written presence/operation labels share divider-separated rows; accept, decline, remove and invite remain explicit actions. The room picker uses the shared blue task heading, cream scrolling body and fixed amber decision, with a compact 520px width cap. It contains only accepted friends and explains offline, invited and already-seated states. An empty picker gives one concise explanation and an Add friends footer action; a populated picker ends with Done. Pending invitations remain labeled Invited and disable repeated sends in both the picker and Friends. Friendship requires acceptance independently of room invitations.

Incoming invitations are nonblocking, theme-aware notices with an explicit room, Accept, Decline and Dismiss. They remain available above the topmost open dialog and use polite accessible announcements. The shared muted-aware cue accompanies new invitations and friend requests. Master mute preserves individual audio settings; Invitation sounds is its own preference. The existing saved reduced-motion preference still supplements the OS setting; its Appearance control is removed.

### Multi-card choices

Ordinary legal cards still play immediately. When a table permits matching-number pairs, activating either matching number opens a native choice dialog. The card that can lead goes first automatically; a card that cannot play alone only offers the legal pair. Equivalent physical copies produce one visible outcome. Discard All directly plays every matching-color card without opening a choice dialog, including an atomic UNO declaration when one card remains. Matching-number choices show the remaining hand size; a pair leaving one card explicitly offers Call UNO + play as one action. An empty hand wins automatically. Matching pairs carry a small ×2 cue in the exposed left strip of their held card; Discard All carries its removal count, with the full remaining-hand preview on hover or keyboard focus. UNO and Pass have fixed 72px / 84px slots with a 44px target floor, so contextual availability does not move either action. Every publicly discarded face travels in a short shared throw; total stagger stays at or below 120ms and reduced motion skips travel. Short landscape dialogs keep the choices and cancel control visible. Game Menu offers a native Color / Number / Original hand-order selector; the display preference persists on the device without changing the authoritative hand. Inspecting a blocked card explains the applicable rule in a short sentence.

### Portrait identities

`PlayerAvatar` renders the neutral player icon or a chosen original portrait; it also renders historical customized recipes for saved-round compatibility. Profile directly presents the neutral choice and twelve original portraits across `/artwork/player-portraits.webp` and `/artwork/player-portraits-extended.webp`; preserve both artwork and companion prompt provenance. Portrait changes apply on tap. Selection uses a blue border, explicit check badge and the portrait-selected pale blue fill, on a rounded 16px tile. The source getter normalizes old custom profile IDs to the neutral choice. Custom avatar creation is deferred: no sticky preview, feature selectors, swatches or color editor is offered. Bot portraits remain deterministic; setup and rooms use the saved profile. Opaque dark blue nameplates pair a small portrait with the name above a quiet Outfit card-count line. Status sits beside the count. This compact two-line structure gives names more space and lets native cards lead; the oversized count chip is removed. The active player's badge turns cream and portrait gains an amber outline; a catchable badge turns amber. Compact tiers keep the 44px floor and inline status, shrinking width and type instead of creating a third text tier.

### Audio preferences

Plain sliding pill switches retain native checkbox/switch semantics, a 44×26px track and an 18px white thumb. Checked tracks use club blue and shift the thumb 18px; the thumb stays circular when pressed. One Music switch controls both existing lobby and game contexts. Master mute preserves individual card, invitation and voice settings; effects/voice and music volumes remain independent. No sound delays a decision.

### Held cards and live turn cue

`UnoCard` owns card print; `HandCard` owns direct tap/drag handling; `useGamePresentation` owns transitions/audio. Legal cards play on first activation, with the shared gesture predicate governing drag readiness. Inspection, roving keyboard navigation and overflow paging stay available. On pointers, hovering a held card magnifies it dock-style, spreads its neighbors and lifts the quiet-card dim; touch and keyboard paths stay unchanged. Legal-card lift and 1.04 growth are static, with stable resting stacking so neighboring corners remain visible; the ordinary legal-card idle breathe is removed. Inspection and keyboard focus use a lift of 30.5px × hand scale + 8px and headroom of 30.5px × hand scale + 16px, revealing the complete face. Their growth is 1 and extra pointer-hover lift/growth is suppressed; ordinary legal cards retain their static 1.04 growth. Wild decisions preserve written chosen-color state and accessible counts.

Routine hand captions, browse/tap/drag coaching and recurring move tips stay visually quiet; accessible status, the real turn clock, explicit penalties and deliberate blocked-card inspection remain.

`TurnCue` presents the real actor, direction, current action and deadline. Human turns last 30 seconds; the ring and tabular number derive from the published deadline, never a sample comp value. Drawing and metadata do not restart it; online timing belongs to the server. Forced penalties show the actual total/target and resolve automatically when no stack response exists. At five seconds or fewer the cue uses its urgency treatment. Local portrait gating pauses local timing; online rounds continue. Music and sound respect saved preferences and never gate a turn.

## Do's and Don'ts

### Do:

- **Do** use the quiet edition field, warm cream, human portraits and vivid native deck as one shared identity.
- **Do** keep Outfit ordinary headings and the separate Barlow Condensed brand/deck roles.
- **Do** retain saved appearances on other dialogs, the avatar popover and invitation notices, while keeping Settings bodies warm-white with navy text, blue/cream headers and amber decisions.
- **Do** keep exact hand counts, inline compact status, a real turn clock and written action/color cues.
- **Do** preserve the quarter-cropped curved held hand, readable overlap, independent overflow, direct legal play and visible keyboard focus.
- **Do** keep compact cues, inspection and actions clear of identities and piles, and confine game dialogs to the reported usable panel.
- **Do** keep setup, account and help decisions outside the scrolling content body, and distinguish actual table rules from practice examples.
- **Do** show the four-choice settings overview or one task, keep ready-made portraits visible, and expose rule controls only inside a named custom-profile draft.
- **Do** use soft contact depth and the intentional inset amber pressed-control lip.
- **Do** keep original artwork and exact provenance, even when earlier artwork is superseded.
- **Do** verify six-seat landscape phones, large hands and reduced motion when extending the interface.

### Don't:

- **Don't** restore giant background cast, painted menu-card actions, ink swashes, poker felt/rail or the giant orbit field.
- **Don't** add decoration behind the piles or allow compact player states to expand into their space.
- **Don't** add another font family, glyph icons, mixed display systems or a parallel component library.
- **Don't** replace the live deadline with a decorative countdown or reset it after a draw or metadata update.
- **Don't** add blocking splashes or let audio, reactions or motion gate game turns.
- **Don't** repeat identity editors in joining or room setup, or add routine hand coaching.
- **Don't** offer Stack party or Wild table as built-in choices; use named custom profiles for house rules.
- **Don't** label Flip or Flex playable before their actual decks/actions exist, or describe the three originals as editable house-rule presets.

Not canonized: the former crowded selects, long repeated settings explanations, 32px settings gutters, all-cream headers, separate body back row, circular active check, solid-blue favorite stars and third custom-row action were corrected or superseded; none is a reusable rule. The rejected settings sidebar/mobile selector, Appearance controls, persistence slogan and custom avatar creator are superseded by the compact task sheet; none should be restored as a system rule. Historical custom recipes remain compatible data, not an editing pattern. Legacy tab selectors, the earlier single-Classic restriction, the removed-home-track instruction and the earlier tabbed blue-title-bar preference layout remain superseded; the current integrated blue settings header is intentional, not a restoration of that old navigation; the current compact favorites are intentional. The replacement dialog’s former flush-left body was a padding defect, corrected with the shared inset task body and fixed footer; that defect is not a density rule. Old charcoal midnight colors and historical global fixed-light-dialog guidance do not override theme-aware surfaces; the current fixed-light treatment is scoped to Settings. Historical no-visible-HUD guidance does not remove the real actor/deadline or accessible status; the shipped quieting removes routine coaching. None of these superseded patterns is a rule for future surfaces. The former compact status-column collision and low-contrast Settings control were defects; the corrected row and explicit cream foreground are the recorded behavior. The earlier unmeasured deep crop, hand-count scale reduction, fixed lift/headroom tiers and superseded viewport-only arena tiers are not current rules; the owner-approved, fan-compensated quarter crop is intentional. The reviewed compact inspection/badge and Draw/wild-label collisions were defects, resolved in the final recaptures; their overlap is not a spacing precedent. Earlier setup footer overflow and narrow-width overrides defeating short-height spacing were defects, not density rules; the final bounded body/footer composition is the precedent. Static screenshots do not certify physical hinge behavior, physical touch, audible quality or execution of reduced-motion fallbacks.
