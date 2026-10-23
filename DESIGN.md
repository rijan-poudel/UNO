---
name: "UNO — Comic-card showdown"
description: "Confident comic ink, warm paper and vivid held cards across a shared card night."
colors:
  club-ink: "#15151b"
  club-paper: "#fff4d6"
  club-red: "#df0735"
  club-yellow: "#ffce00"
  club-blue: "#075bee"
  club-green: "#00bc68"
  ui-surface: "#fff9e8"
  ui-muted: "#57524a"
  ui-line: "#c6bfae"
  ui-accent-red: "#c50730"
  ui-accent-green: "#007943"
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
  card-back: "#101d3a"
  card-green-index: "#00321e"
  card-green-value: "#00894a"
  card-yellow-index: "#482f00"
  card-yellow-value: "#805100"
  turn-yellow: "#ffe329"
typography:
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(42px, 6vw, 64px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  dialog-title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 750
  control:
    fontFamily: "Outfit, sans-serif"
    fontSize: "14px"
    fontWeight: 750
    lineHeight: 1.25
  launch-control:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "32px"
    fontWeight: 800
    lineHeight: 1.15
rounded:
  field: "6px"
  control: "8px"
  panel: "12px"
spacing:
  tight: "8px"
  compact: "12px"
  regular: "16px"
  group: "20px"
  section: "24px"
  dialog: "28px"
components:
  button-primary:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.club-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "14px 22px"
  launch-primary:
    backgroundColor: "{colors.club-yellow}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px 13px"
  launch-create:
    backgroundColor: "{colors.club-red}"
    textColor: "{colors.card-paper}"
    typography: "{typography.launch-control}"
    rounded: "{rounded.control}"
    padding: "10px 18px 13px"
  launch-join:
    backgroundColor: "{colors.club-blue}"
    textColor: "{colors.card-paper}"
    typography: "{typography.launch-control}"
    rounded: "{rounded.control}"
    padding: "10px 18px 13px"
  input:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.field}"
    padding: "12px 15px"
    height: "50px"
  settings-navigation:
    textColor: "{colors.club-ink}"
    rounded: "{rounded.field}"
  rule-preset:
    backgroundColor: "transparent"
    textColor: "{colors.club-ink}"
    rounded: "0px"
    padding: "14px 16px"
  dialog:
    backgroundColor: "{colors.ui-surface}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.panel}"
    padding: "28px"
  opponent-label:
    backgroundColor: "{colors.club-paper}"
    textColor: "{colors.club-ink}"
    rounded: "{rounded.field}"
---

# Design System: UNO — Comic-card showdown

## Overview

**Creative North Star: "Comic-card showdown"**

UNO feels like a shared competitive card night, expressed through confident comic print. Almost-black ink, warm paper, vivid native card colors and condensed italic headings carry one identity across entry, setup, rooms, preferences, notifications, results and live play. Outlined controls press into their bottom edge; original expressive characters provide energy without competing with decisions.

This records the shipped whole-site identity replacement selected by the owner on October 23. The approved panel comp establishes the home composition; its illustration and oversized UNO graphic are specific to that surface. Supporting screens inherit the ink, paper, lettering and control grammar. Live play keeps a calm ink field, opaque player identities and the existing vivid native deck. The archived prior system is at `.impeccable/review/site-redesign/DESIGN.before.md`.

**Key Characteristics:**

- Warm paper against almost-black ink, with native red, yellow, green and blue as purposeful accents.
- Barlow Condensed italic display lettering paired with Outfit interface text.
- Crisp outlines, restrained corners and shallow pressed control lips.
- Original comic artwork with full silhouettes, real raster ink swashes and recorded provenance.
- A bottom-cropped held hand, nearby piles and immediate legal-card play.
- Real published game state, bounded reactions and sound that never delays a turn.

## Colors

The palette takes its saturation from the native deck and its reading surfaces from warm printed paper. Frontmatter holds normative primitives; theme assignments below describe their application rather than introducing parallel values.

### Primary

- **Card Yellow:** primary start/submit actions, selected rules, earned milestones and active player labels; always paired with dark ink.
- **Card Red:** home title, Create action and red native cards. **Readable Red** (`ui-accent-red`) serves supporting error and action text.

### Secondary

- **Card Blue:** Join action, native blue cards and the default focus ring.
- **Card Green:** native green cards and registration marks; **Readable Green** (`ui-accent-green`) serves online/winner text on paper.

### Neutral

- **Club Ink:** page surround, live arena, outlines and primary paper text.
- **Club Paper / UI Surface:** home and player-label paper, then the lighter supporting content surface.
- **UI Muted / UI Line:** supporting copy and structural dividers.
- **Card Paper / Card Back:** white printed faces and the retained navy native backs. Green and yellow keep distinct index/value inks for legibility.

### Named Rules

**The Paper Scope Rule.** Home, native dialogs, toasts and live player badges retain the comic paper/ink palette. Supporting setup and room content honors the saved appearance; the native deck stays unchanged.

The four appearance choices are paper, midnight, forest and sunset. Paper uses Club Paper as background and Club Ink as text. Midnight swaps those roles, with its named surface, muted, line and readable accent tokens. Forest and sunset use their named background/surface/text/muted/line sets; red and blue use the default readable accents. Green and yellow inherit the default roles outside midnight. Every native dialog resets to the paper palette and light color scheme, including dialogs opened from a dark arena or midnight setup. Arena focus/state yellow remains the separate `turn-yellow` role.

**The Published Color Rule.** A selected yellow row, active badge, chosen wild color or penalty cue describes real state. Do not use color as the only label for a decision.

## Typography

**Display Font:** Barlow Condensed, sans-serif; italic, uppercase and weight 800 on page/dialog headings and major start actions.
**Body Font:** Outfit, sans-serif; readable sentence-case copy, labels and dense settings rows.

**Character:** Narrow, forceful display lettering supplies the comic voice while the softer interface face keeps rules, names and decisions readable. These are the two pinned font families, loaded in `app/layout.tsx`.

### Hierarchy

- **Headline:** setup and room page titles; the phone override uses 46px.
- **Dialog title:** compact native dialog heading; 32px on narrow screens and 28px in short landscape game dialogs.
- **Title:** setup section headings; 25px on narrow screens.
- **Body:** default copy; setup introductions use 16px with a 50ch limit, returning to 15px on phones.
- **Label / Control:** Outfit for form labels, row choices and shared controls. Supporting descriptions use 13px; secondary table text may use 12px where the compact geometry requires it.
- **Launch control:** condensed italic major home actions; primary action grows to 40px on tall desktop and contracts with the home-specific responsive composition.

**The Brand Graphic Rule.** The home UNO word is a surface-specific brand graphic, not a general display scale: tall desktop uses a 144–208px clamp, shorter desktop 128px and narrow entry 112px, with outline, stretched lettering and seven-pixel desktop ink shadow. Keep those rules in the home brief; do not apply them to forms or dialogs.

**The Deck Lettering Rule.** Preserve Barlow Condensed native face numerals, Outfit card-back lettering, italic indices and the shared card proportions. The retained native card-back wordmark is separate from the uppercase UNO brand wordmark in page chrome.

## Layout

Use one clear content surface rather than nested decorative tiles. Supporting setup/room pages sit within a 1280px header boundary and a content sheet capped at 780px, with 36px/44px vertical/horizontal padding. At 700px and below, the content boundary becomes viewport minus 24px with 24px/20px padding. The observed spacing rhythm uses the frontmatter's tight through dialog steps; controls preserve at least 44px interaction targets.

Home is one centered cream sheet with the title, complete comic cast and immediately available Play/Create/Join. Its deliberate illustration/action overlap belongs to its surface brief. Artwork loading never gates the controls. Portrait and short-landscape entry both remain usable; short landscape lets header UNO carry the identity while the semantic main heading stays accessible.

Live play is one clipped dynamic viewport. `app/arena.css` owns opponent, pile and hand geometry; `app/club.css`, imported last, owns current shared chrome and visual roles. Piles sit near the held fan; the lower hand is cropped at the viewport edge while complete card boxes and focus clearance remain inside its scrollport. Large hands scroll horizontally without scrolling the document. Contextual decisions use their separate right-side lane. Phone gameplay uses the landscape gate; local bots pause in portrait, while online continuation is disclosed. Retain five readable compact opponent identities at six seats.

**The Hand Owns Its Width Rule.** Bound the fan arc and keep large-hand overflow inside the hand, preserving corner identity, focus clearance and usable card size.

## Elevation & Depth

Depth comes from printed outlines, shallow control lips and the native card's thin stock/laminate layers. Content sheets remain visually quiet. Native dialogs use a diffuse ambient shadow over a dark unblurred backdrop; the oversized title's hard ink shadow is a home graphic exception.

### Shadow Vocabulary

- **Pressed control:** `inset 0 -3px 0 #15151b35`; active shared/home buttons reduce it to a one-pixel bottom lip while translating down two pixels.
- **Native card stock:** `inset 0 1px 2px #ffffffb0, inset 0 -1px 1px #17234145, 0 1px 1px #c4ccdf, 0 3px 1px #68748e, 0 8px 12px #02071880`; shared face depth from `UnoCard.module.css`.
- **Native dialog:** `0 16px 48px #00000066`; supporting the modal above the `#0b0b10ce` backdrop.

**The Contact Before Flight Rule.** Settle hover tilt on contact before capturing drag or flight geometry. Preserve scale and composed rotation through pickup/return; clean up interrupted copies and retain readable static color, edge and focus when spatial motion is disabled.

Motion communicates current intent: home controls use 140ms transitions; native dialogs enter over 180ms with `cubic-bezier(0.2, 0.8, 0.2, 1)`. Card response uses `cubic-bezier(0.16, 1, 0.3, 1)`. Fine-pointer tilt/sheen stays within hover/no-reduced-motion guards. Reduced-motion rules remove decorative travel and retain state. Sound and animation never delay a turn, queue narration or wait for clip duration.

## Shapes

Use crisp dark outlines with restrained corners: field/badge corners, control corners and panel corners are the three reusable radius roles. Home uses a surface-specific larger sheet corner on desktop. Shared controls and paper panels use two-pixel outlines; home start actions strengthen to three pixels. Rule choices are flat divider rows, not independent rounded cards. The four equal native-color registration segments appear above supporting content and dialogs and along the arena header. Brand chrome uses uppercase UNO and four skewed native-color marks; home/game header suppress the little marks where the composition already carries color.

**The Printed Edge Rule.** Use a control's bottom lip to acknowledge pressing. Keep information containers flat; physical card stock and the authored title graphic retain their own depth language.

## Components

### Buttons

Confident printed controls. Shared primary actions use Card Yellow and Club Ink; secondary actions are transparent with a structural outline and theme-aware text. Shared buttons use the control radius, two-pixel border and 48px minimum height; small/icon controls retain 44px targets. Home actions use heavier borders and condensed italic lettering, with a full-width yellow Play ahead of paired red Create and blue Join. Disabled shared/start actions use half opacity and remove the lip. Fine-pointer primary hover lightens yellow; focus uses a three-pixel ring offset four pixels, switching to Turn Yellow in live play.

### Selection rows and navigation

Rule presets form a single divider list with an original miniature card marker, Outfit label, description and explicit selected check. The entire selected row turns yellow. Only engine-supported presets are offered. Segmented controls and settings tabs have a strong enclosing outline; selected segments use dark ink with light surface text. Settings tabs stack their icon and text on phones. Switches use a rectangular track and small square thumb rather than a new decorative pill language.

### Cards / Containers

Supporting content uses one lightly rounded paper surface with a four-color registration bar and simple divisions. Theme-aware setup/room surfaces preserve reading contrast in all four appearances. Native dialogs consistently reset to paper with compact italic heading, visible Close, and reachable decisions inside the dialog scroll boundary. Toasts share paper, dark outline and Outfit copy. Progress stamps remain compact; earned state is yellow and reflects completed device-local rounds rather than clicks.

### Inputs / Fields

Theme-aware light/dark surfaces, two-pixel structural stroke and the field radius, with 50px height and 12px/15px vertical/horizontal padding. Focus changes the stroke to current text and retains the global focus ring; invalid input uses readable red. Room codes are large explicit text on a divider-framed panel with Copy/Share, distinct from the ordinary input.

### Native deck and held hand

One `UnoCard` face serves hand, piles and flight. Preserve vivid faces, white orbit/index structure, dark green/yellow inks and original stock edges. Legal cards play on first activation; drag readiness and release share the canonical gesture predicate. Nonmatching cards stay inspectable, with a full named Play fallback when a pre-inspected card becomes legal. Actual new local draws reveal without forced selection. Draw lives on the deck; eligible UNO stays at hand level, Pass and fallback Play stay contextual, and sorting lives in Menu.

Opponents keep original expressive card avatars and opaque paper name badges. Active or catchable badges turn yellow and retain explicit names/state. A representative opponent flight uses a visible native fan card; when compact geometry hides that fan, the avatar supplies destination pose only. Draws clone the face-down deck, never the avatar. Reactions derive from published facts, restart only when expression changes and remain bounded.

### Original imagery

The shipped comic cast, frame swashes and character energy are raster assets at `public/artwork/card-night-comic.webp`, `comic-frame.webp` and `comic-energy.webp`, each with prompt provenance. Preserve complete character silhouettes and use the authored alpha edges. Frame swashes sit outside the content sheet; the live arena leaves its central field calm. Historical artwork/table assets retain provenance without defining the current world. Do not synthesize substitute characters with CSS or copy external mascots.

Not canonized: dormant home/arena literals in legacy stylesheets, stale detector palette/type/radius advisories and the oversized home wordmark as a reusable type role. They do not define the current shared system. No unresolved craft-floor device is promoted into house style; the functional pressed lips and approved title shadow belong to this printed world.

## Do's and Don'ts

### Do:

- **Do** use cream paper, black ink, native four-color accents and one shared comic control grammar across the journey.
- **Do** pair condensed italic display lettering with Outfit interface text, preserving native deck lettering.
- **Do** honor saved appearance on supporting pages while keeping native dialogs, toasts and live identity badges in their explicit paper scope.
- **Do** retain the complete original comic cast, real ink artwork and exact prompt provenance.
- **Do** preserve nearby piles, a bottom-cropped held fan, independent hand scrolling and readable six-seat phone identities.
- **Do** keep legal-card activation immediate and give touch, drag and keyboard the same current availability rules.
- **Do** retain a written chosen-color marker for wild discards and accessible routine turn/color announcements without a visible routine HUD.
- **Do** keep motion, sound, reactions and earned history tied to actual published or completed game state.
- **Do** use the native Modal, visible Close, reachable short-landscape decisions and the established SVG icon system.

### Don't:

- **Don't** restore the rejected assistant-like identity, navy title screen, side-column start actions or feature-tile grid.
- **Don't** apply the home title's stretched size or ink shadow to routine content headings.
- **Don't** restore poker felt/rails, illustrated room backgrounds, electric-blue orbit planes or decoration behind the central piles.
- **Don't** replace the held fan with a flat shrinking row, let large hands overflow the page or add portrait phone gameplay.
- **Don't** add a third font family, Unicode glyph icons, a parallel component library or idle character loops.
- **Don't** add decorative hard offset shadows to information containers; preserve native stock edges, pressed control lips and the approved title graphic.
- **Don't** add blocking splashes, queue stale sound/reactions or let presentation control turn timing.
- **Don't** infer points, finishing ranks or new rewards without completed-round evidence.
