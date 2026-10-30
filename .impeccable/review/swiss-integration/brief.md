# Production card integration

Owner explicitly approved Swiss Minimal integration, wants Nordic Frost only as an optional Settings choice, asks to remove prototype ring/table/finish/movement controls, preserve existing table and motion, clean up, commit and push. They asked to avoid a manual multiplayer session to save credits. No manual multiplayer playthrough was performed; existing automated network assertions ran.

Pinned reference captures: approved-wilds.png and approved-discard.png, promoted from the finished prototype before retiring it. These are approved style references, not a new page comp. No new FORM seed/world: user-selected style and existing game arena stay authoritative.

Production source: components/UnoCard.tsx and .module.css, icons/UnoActionSymbol.tsx; shared hand/pile/flight/guide consumers retain their existing API, sizes and gestures. Root card font is Space Grotesk700; Outfit UI retained. Swiss is default; Nordic dark fields and colored indices/marks selected through Settings→Appearance→Card style. Preference is local, validated on read, storage-block fallback, cross-tab/same-tab notification, early application to avoid flash. No new dependencies.

Artwork promoted unchanged to public/artwork/cards with embedded origins, exact cleanup/recolor prompts and source histories. Shuffle remains genuine print; Roulette remains an AI-cleaned/recolored source-informed four-face derivative. Metadata scan2rasters0missing. Prototype and generated iteration folders retired; no public lab controls remain. Dead old oval/card-back/striped/four-color paint CSS removed; game table/hand layout and state-transition motion remain.

Captured UI: settings.png, swiss-desktop.png, nordic-desktop.png, swiss-mobile.png (supported phone landscape844x390), portrait-pause.png (existing phone orientation guard). Final production captures will replace previous same paths after build. No need to assess the unrelated room artwork, legacy game HUD or menu patterns in this card-scoped pass.

Technical checks: lint, types, game/assertions (including every card face, unique SVG refs, accessible backs, shipped images, preference validation and Settings-only2choices), audio, production build and automated multiplayer suites. Existing assertions that forbade Appearance were updated for the newly requested section; semantic data-card-symbol attributes retained. Core gameplay unchanged.

Detector ran once for touched card CSS/settings component; advisory only for newly authorized card accent palette before docs refresh. No second detector. Local DESIGN and sidecar refresh in progress over final source. Review scope: integration fidelity and settings correctness, not an unrelated site redesign.
