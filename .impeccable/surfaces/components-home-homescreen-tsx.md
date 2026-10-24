---
version: 1
slug: "components-home-homescreen-tsx"
primary_target: "components/home/HomeScreen.tsx"
related_targets:
  [
    "app/home.css",
    "app/club.css",
    "app/layout.tsx",
    "components/UnoCard.tsx",
    "components/UnoCard.module.css",
    "lib/rulePresets.ts",
  ]
---

Visitor mode: Experience. Scope: Color play title/start screen.
Job: start saved bots immediately, create a private room or join one. Separate bot setup, inline help and honest completed-round progress remain secondary.

Direction: October24 Color play composite approval replaces the congested Comic-card title screen. Current contract `.impeccable/review/experience-reset/contract.md`, FORM seed `2fba311c`; current system `DESIGN.md`. Approved refs `.impeccable/mocks/decision/reset-classic.png`, `reset-color-court.png`, `reset-after-hours.png` establish a coherent blue card world, friendly human material and amber emphasis. No catalog QUALITY BAR was selected. Home has one clear Play action and a small native fan, not the former painted-card buttons or giant corner cast. Earlier opening-hand/comic surface instructions and measurements are superseded; preserve their assets/prompt provenance as historical material.

Structure: semantic UNO heading/tagline, notification/settings header, decorative four-card native fan, supported-preset selector, explanatory preset line, dominant “Let’s play / Jump in with bots”, distinct Create/Join, Set up bots, How to play, actual `PlayerProgress` and no-signup footer. Presets precede start actions in DOM order. The fan is decorative (`aria-hidden`) and pointer-inert; real buttons retain live text. Play calls saved quick play, Create and Join retain separate callbacks, help uses `aria-expanded`/`aria-controls`.

World and mood: radial stage blue/blue-light from `home.css`, cream foreground, amber primary action and native red/yellow/green/blue fan. Classic uses the blue stage; Stack party deepens blue; Wild table uses plum. Presets compose engine-supported rules and preserve saved starting-hand/max-player settings. Custom rules get truthful fallback copy. No Mercy/Flip/Flex are future work, not selectable editions. Saved supporting UI appearances continue; home itself retains the selected preset mood.

Desktop: minimum100dvh flex-column stage with clipped decorative overflow. Header76px, responsive horizontal inset20–60px. Main caps760px, centered vertically with12px24px20px padding and16px gaps. UNO uses Barlow Condensed italic800 at96px/.85 with−.025em tracking and an amber dot; subtitle is Outfit19px/500. Native four-card fan240×118px, scaled.88,20px margin; card offsets38px,13° increments and a quadratic8px drop. This is a compact brand ornament, not interactive menu cards.

Action lane: cap400px. Preset track has12px corners,4px inset/gap,44px targets,14px600 labels,9px segment corners; selected segment is cream with blue text. Description13px/1.4, minimum38px and40ch cap. Play is full-width70px minimum high,14px corners,12px22px padding,24px750 Outfit label and13px500 supporting line. Amber bottom lip and blue contact shadow provide tactile weight. Create/Join form an equal two-column row with12px gap,52px targets,12px corners,14px labels, cream text and a translucent fine border. Extras retain44px targets and13px text. Settings explicitly keeps cream foreground at sufficient specificity in default/hover; focus is a visible3px amber ring with4px offset. Progress caps420px and only shows earned device-local history.

Portrait/mobile entry: at≤700px header64px with20px side inset; main20px24px padding/22px gaps. Title remains96px, subtitle17px, fan height128px/.93scale and24px top margin. Preset labels13px. The page can extend for help or actual progress; no blocking splash or forced landscape gate on home.

Short landscape: orientation landscape, height≤540px and width≥541px. Header48px with22px side inset. Main caps900px and uses0.85fr/1.15fr columns,16px36px gaps and8px32px16px padding. Title80px, subtitle15px, fan190×100px/.68scale/26px offsets. Play58px high with21px text/9px16px padding; room controls44px with12px labels; presets36px with12px text. Extras12px; progress spans both columns and footer hides. This entry composition is separate from the landscape-only live-game requirement.

Interaction/material: shared amber controls scale.97 on press over140ms standard out easing; fine-pointer hover warms yellow. Secondary stage controls have a restrained translucent hover fill. Preset transitions160ms; keyboard focus remains explicit. Reduced motion removes button transitions/animation and shared primary press travel. Existing `UnoCard` owns the decorative fan's native print/stock; this screen introduces no custom painted-card component and no idle character animation.

Evidence: `.impeccable/review/experience-reset/home-desktop.jpg` and `home-mobile.jpg` record the new hierarchy; these initial captures precede the final explicit-cream Settings correction. Final source is authoritative. Three approved composite refs are direction/material references, not screenshots to literalize. Static evidence does not certify physical touch, audible feedback or execution of reduced-motion fallbacks.
