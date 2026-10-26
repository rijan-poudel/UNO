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

- Quiet blue or plum preset fields keep attention on live cards and people.
- Human portraits, opaque nameplates and exact hand counts make the table social and readable.
- Outfit UI and Barlow Condensed deck lettering share one friendly voice.
- Amber pressed actions and a compact real countdown explain the current decision.
- A quarter-cropped curved held hand preserves direct legal play, readable overlap and independent large-hand scrolling.

The owner-approved October 25 geometry replacement inherits this world and FORM seed through `.impeccable/review/responsive-table/contract.md`. It replaces bottom-anchored piles with the centered, panel-bounded table. The subsequent owner-requested quarter crop in `.impeccable/review/quarter-hand/contract.md` supersedes that rebuild’s fully-visible-bottom requirement without changing the inherited world or FORM seed. Palette, lettering, portraits and native card print retain their existing authority.

Source authority: `app/layout.tsx` imports globals, legacy table geometry, arena, home, then club styles. `app/club.css` owns final shared palette/chrome; `app/home.css` owns home; `app/arena.css` owns live geometry/cues, with its final centered-board section superseding earlier geometry; `PlayerAvatar.module.css`, `OpponentSeat.module.css` and `UnoCard.module.css` own their materials. Component module specificity matters: the active portrait badge is cream, not the older arena yellow badge. Source takes precedence over older captures.

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
- **Player name / count:** names are 13px by default, 12px in narrow or short usable panels and 11px at the shortest panel tier. Counts remain 11px and inline status 10px in the identity module. Outfit carries both name and count. Tabular numerals keep counts and the clock stable.
- **Cue:** existing viewport rules retain the 18px/16px title roles and compact helper/clock roles; the centered board overrides titles to 12px and helper copy to 10px when usable panel height is at most 600px. A 28px clock fits that panel tier. The board container, rather than whole-window phone width, owns compact control placement.
- **Native deck:** face values and corner indices scale together through `--card-scale`. Preserve the native card-back Outfit wordmark and Barlow Condensed face numerals.

**The Two Lettering Roles Rule.** Outfit carries ordinary interface headings. Condensed italic lettering belongs to brand/deck expression and the existing emphatic game actions; it is not a global heading transform.

## Layout

Home is a centered title/start composition: main width capped at 760px, play lane at 400px, supporting progress at 420px. A small decorative native-card fan sits above one dominant Play action; Create/Join share a secondary row, with bot setup and help below. Portrait entry remains usable. Under 700px width, spacing and type adapt; short landscape (height ≤540px, width ≥541px) uses a 900px two-column composition with an 0.85fr/1.15fr split.

The arena fills the usable `100dvh` viewport, clips page overflow and caps its internal stage at 1600px. The draw/discard pair anchors the optical center: its vertical target is 48% of the board height, bounded upward when the full hand needs clearance. Opponents occupy the perimeter. A separate lower grid row holds the curved hand with only its bottom quarter intentionally beyond the screen edge, as the owner requested on October 25. The full-height scrollport extends beyond the clipped page; shared fan geometry bounds the deepest resting corner to about 25% cropping. Focused or inspected cards lift fully into view. The measured negative bottom margin includes the fan’s lower-corner excursion around its 50% 120% pivot and the 26px scrollport tail budget. Hidden portrait measurements retain the last stable fit until landscape returns. The hand scrollport reserves 44px paging gutters on each side; large hands overflow horizontally inside it. Safe-area insets protect the outer edges.

Density follows the usable board size through container queries. Default hand/pile scales are 1.35/1.25; panels at least 1000px wide and 900px high use 1.55/1.5. At most 700px high they use 1.1/1; at most 600px high, 0.94/0.78; at most 360px high, 0.78/0.66. At most 300px high, pile scale becomes 0.6 and its center targets 45% of board height minus header height; upper seats move to −8px and flanks to 6%, while ordinary draw-pile bobbing stops to keep inspection and identities clear. The wide short-laptop exception (width at least 1000px, height 501–600px) uses 1.1/1.05. These are panel-density decisions, never a response to hand count. `app/arena.css` is the exact geometry authority; `lib/handLayout.ts` computes overlap from the measured scrollport and current card width, and shares `getHandFan` geometry between the rendered cards and `getHandCropMargin`.

Default identity badges are 128px wide with 32px portraits and 13px names. Panels at most 1000px wide use 112px/28px/12px; at most 600px high use 104px/26px/12px; at most 360px high use 96px/24px/11px. All retain the 44px target floor, opaque backing, exact count and inline status. Decorative opponent back fans scale with panel height; short panels hide side fans and all fans at five or six seats, and the shortest tier hides every fan. Pointer hover on visible back fans retains its existing dock response.

Desktop turn and inspection cues occupy the central hand-toolbar slot, while UNO/Pass occupy the right slot. At most 600px panel height, the cue and actions flank a reserved central pile lane. Inspection has a separate bounded lane below the player badges with a 44px dismiss target. At most 360px height, Draw is inset into its card back and the complete chosen-wild label into its pile, clear of identities and the hand.

Duo means a dual-screen or foldable device. When the browser reports two viewport segments, both the arena and native game dialogs stay in the first uninterrupted segment; dialogs retain a 12px inset. Container queries follow that panel. The phone portrait gate uses exact `window.viewport.segments` dimensions when available, then the reported segment arrangement, then the ordinary viewport. An upright panel at most 700px wide shows the rotate gate; local play pauses and online play continues. Browsers without segment reporting keep the ordinary responsive viewport layout. Panel-sized screenshots establish layout, not physical hinge or touch behavior.

Setup and room flows use a viewport-bounded panel with one independently scrolling content body and a separate, nonshrinking primary footer. Long names, avatar choices, expanded rules and room details consume body space rather than pushing Deal/Create/Join beyond the viewport. At heights of 540px or less, compact header, panel padding and body gaps take precedence over narrow-width styling; the supporting footnote hides while the primary target retains at least 44px. Help follows the same separation inside its native dialog: heading and Back/Next remain outside the scrolling examples and rule reference.

The observed spacing vocabulary runs from micro/detail gaps through compact, regular, section and dialog steps. It is not an instruction to normalize every card-specific overlap. See the two surface briefs for geometry and the sidecar for exact responsive conditions.

**The Hand Owns Its Width Rule.** Fit by overlap alone: retain an exposed strip of at least 44px or the full card width when smaller. A large hand scrolls at the panel's existing face size; hand count never shrinks cards or creates document-width overflow. The owner-requested bottom-quarter crop is independent of count and compensates for the fan corners.

**The Uninterrupted Panel Rule.** Keep identities, piles, the exposed held hand and native game dialogs within the first reported usable segment; only the intentional lower-quarter crop crosses its bottom edge. Place compact controls in reserved lanes so no identity, label or decision covers a card face.

**The Reachable Decision Rule.** In setup, room and help flows, scroll the content body while keeping the primary decision or lesson navigation visible. Short-height adjustments preserve target size and readable content instead of shrinking the entire panel.

## Elevation & Depth

Depth comes from native card stock, soft blue contact shadows, floating portrait/cue surfaces and shallow inset control lips. Containers do not inherit a comic outline or hard offset shadow. The amber bottom lip is intentional material feedback, not a side accent border.

### Shadow Vocabulary

- **Primary press:** inset amber lip plus a small blue shadow; the home Play enlarges the same relationship.
- **Identity and cue:** soft blue contact shadows beneath an opaque surface.
- **Native stock:** fine white highlight, thin layered grey stock and a soft dark contact shadow; the draw pile adds stacked edges.
- **Dialog:** broad blue ambient shadow, with a dark native backdrop.

Exact shadow values and motion durations live in `.impeccable/design.json` extensions. Primary controls use a small scale press; card fan lift uses the standard out easing. Portrait reactions use distinct, bounded nod, surprise, UNO and win motions, with small decorative reaction badges above the face. Reduced motion keeps the static badge. Skip/reverse/penalty feedback is brief and derived from the move; reduced motion removes travel and preserves legible state. Thinking dots may pulse only while waiting for the actual actor; no decorative idle character loop is part of the system.

Card motion follows a shallow paper arc with a small airborne lift and direct contact, without a rebound. Ordinary travel lasts 240–300 ms; the opening deal uses short rounds across seats with at most 320 ms of stagger. Hover gently straightens the held card and eases neighboring cards apart; pointer focus does not pin the keyboard inspection pose. Motion stays interruptible, and independent arrivals finish through later moves.

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

Settings and results bound their scrolling to the content body: the Settings heading, category tabs and Done remain visible, as do result rematch/home decisions. Related rule toggles use native fieldsets with ordinary Outfit legends. Profile save feedback distinguishes drafts from applied names. Bot setup keeps rule editing in a native disclosure, names the active preset/hand size beside the pinned deal action, and uses the same portraits as the subsequent round. Its shared setup shell keeps the primary decision visible in portrait and short landscape, including when rules are expanded.

Room footers pair the primary action with a short readiness or connection explanation. Pending labels describe the actual operation, such as opening, joining or dealing; unavailable room actions retain a visible explanation and an available bot-play recovery path. Moving a submit button into the footer preserves native form submission, including Enter from a field.

Help uses the native dialog heading and Close, one scrolling lesson body and pinned Back/Next/Done controls. The compact step marks retain 44px activation targets. A native disclosure separates the read-only current-rule reference from interactive basic-play examples. Guests and help share the same written rule rows: a quiet label/value grid with fine dividers, explicit off states and wrapped values. Show the published room settings for guests; basic examples are identified as practice rather than presented as the chosen table rules.

### Inputs / fields

Theme-aware fields use UI surface/text, a two-pixel divider border, 50px height and a darker text-colored focus stroke. Invalid fields use accent red. Labels remain explicit; room codes and room links share the existing input flow. Dependent settings remain visible and explain their prerequisite: same-color matching is disabled until matching-number pairs are enabled, without discarding its saved value.

### Navigation

Small wordmark and restrained Settings/Menu chrome sit at the perimeter. Settings tabs use an outlined segmented container with ink selected background and cream text; mobile tabs stack icon/label while keeping their full target. Do not add a parallel navigation library.

### Multi-card choices

Ordinary legal cards still play immediately. When a table permits matching-number pairs, activating either matching number opens a native choice dialog. The card that can lead goes first automatically; a card that cannot play alone only offers the legal pair. Equivalent physical copies produce one visible outcome. Discard All previews the whole color being cleared. Each choice shows the remaining hand size; a move leaving one card explicitly offers Call UNO + play/discard as one action. An empty hand wins automatically. Matching pairs carry a small ×2 cue in the exposed left strip of their held card; Discard All carries its removal count, with the full remaining-hand preview on hover or keyboard focus. UNO and Pass have fixed 72px / 84px slots with a 44px target floor, so contextual availability does not move either action. Every publicly discarded face travels in a short shared throw; total stagger stays at or below 120ms and reduced motion skips travel. Short landscape dialogs keep the choices and cancel control visible. Game Menu offers a native Color / Number / Original hand-order selector; the display preference persists on the device without changing the authoritative hand. Inspecting a blocked card explains the applicable rule in a short sentence.

### Portrait identities

`PlayerAvatar` renders a player-chosen portrait from twelve original portraits across `/artwork/player-portraits.webp` and `/artwork/player-portraits-extended.webp`, or a neutral player icon until a human chooses. The shared avatar picker pairs a 96px selected portrait with the options (72px preview and 40px options on short landscape screens) and appears in setup, room setup and Profile; the small in-game portrait opens Profile. Bot portraits remain deterministic. Preserve the artwork and its companion prompt provenance. Opaque dark blue nameplates pair a small portrait with the name above a quiet Outfit card-count line. Status sits beside the count. This compact two-line structure gives names more space and lets native cards lead; the oversized count chip is removed. The active player's badge turns cream and portrait gains an amber outline; a catchable badge turns amber. Compact tiers keep the 44px floor and inline status, shrinking width and type instead of creating a third text tier.

### Held cards and live turn cue

`UnoCard` owns card print; `HandCard` owns direct tap/drag handling; `useGamePresentation` owns transitions/audio. Legal cards play on first activation, with the shared gesture predicate governing drag readiness. Inspection, roving keyboard navigation and overflow paging stay available. On pointers, hovering a held card magnifies it dock-style, spreads its neighbors and lifts the quiet-card dim; touch and keyboard paths stay unchanged. Legal-card lift and 1.04 growth are static, with stable resting stacking so neighboring corners remain visible; the ordinary legal-card idle breathe is removed. Inspection and keyboard focus use a lift of 30.5px × hand scale + 8px and headroom of 30.5px × hand scale + 16px, revealing the complete face. Their growth is 1 and extra pointer-hover lift/growth is suppressed; ordinary legal cards retain their static 1.04 growth. Wild decisions preserve written chosen-color state and accessible counts.

`TurnCue` presents the real actor, direction, current action and deadline. Human turns last 30 seconds; the ring and tabular number derive from the published deadline, never a sample comp value. Drawing and metadata do not restart it; online timing belongs to the server. Forced penalties show the actual total/target and resolve automatically when no stack response exists. At five seconds or fewer the cue uses its urgency treatment. Local portrait gating pauses local timing; online rounds continue. Music and sound respect saved preferences and never gate a turn.

## Do's and Don'ts

### Do:

- **Do** use the quiet preset field, warm cream, human portraits and vivid native deck as one shared identity.
- **Do** keep Outfit ordinary headings and the separate Barlow Condensed brand/deck roles.
- **Do** retain saved supporting appearances and the explicit light native-dialog scope.
- **Do** keep exact hand counts, inline compact status, a real turn clock and written action/color cues.
- **Do** preserve the quarter-cropped curved held hand, readable overlap, independent overflow, direct legal play and visible keyboard focus.
- **Do** keep compact cues, inspection and actions clear of identities and piles, and confine game dialogs to the reported usable panel.
- **Do** keep setup decisions and help navigation outside the scrolling content body, and distinguish actual table rules from practice examples.
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

Not canonized: legacy comments and historical selectors describing an ink-only field, geometric avatars or no visible routine HUD are superseded by the shipped composite. Their presence in source/history is not a rule. The former compact status-column collision and low-contrast Settings control were defects; the corrected row and explicit cream foreground are the recorded behavior. The earlier unmeasured deep crop, hand-count scale reduction, fixed lift/headroom tiers and superseded viewport-only arena tiers are not current rules; the owner-approved, fan-compensated quarter crop is intentional. The reviewed compact inspection/badge and Draw/wild-label collisions were defects, resolved in the final recaptures; their overlap is not a spacing precedent. Earlier setup footer overflow and narrow-width overrides defeating short-height spacing were defects, not density rules; the final bounded body/footer composition is the precedent. Static screenshots do not certify physical hinge behavior, physical touch, audible quality or execution of reduced-motion fallbacks.
