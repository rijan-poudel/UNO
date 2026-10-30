# Production verification

Swiss Minimal is the default production card face; Nordic Frost is the sole optional style in Settings→Appearance→Card style. Style persists locally and is applied before paint, with a live root subscription and storage-failure fallback. Existing table, hand geometry, tap/drag handling, motion, audio and rules remain.

Passed: npm run lint; npm run check:types; npm run check:game; npm run check:audio; npm run build; npm run check:multiplayer; npm run format; git diff --check. Game assertions include every supported card, nonempty action symbols, amounts, unique SVG masks/filters and valid resources, accessible backs/buttons, preference default/save/invalid/blocked storage/notifications, and exactly two Appearance options. Existing overview assertion was updated to allow the newly authorized section while keeping controls out of overview. No dependencies or test framework added.

Browser work was limited to production/local preview and Settings, not a manual multiplayer playthrough. Verified Swiss/Nordic live switch, saved Nordic on reload, actual Space Grotesk font and expected Swiss colors, no landscape phone overflow, native selector180px at390px with full labels, and reset the saved choice to Swiss. Phone portrait retains the existing pause/orientation guard; gameplay is checked at844x390. No console errors observed in the initial live verification. New final build served successfully after cleanup.

Images in this folder are direct browser captures: final production swiss-desktop/nordic-desktop, swiss-mobile, and final fixed settings/settings-mobile. approved-wilds/approved-discard are retained prototype references. Portrait-pause records unchanged orientation handling, not a missing gameplay capture. Browser error arose only from a stale tab after preview-server restart; fresh tab loaded the healthy production server.

Cleanup: standalone prototype and its generation/iteration folders retired after approved artwork was promoted. Native React symbols replace old card rendering. Dead oval/back-stripe/four-color paint rules removed. No public ring/table/finish/movement controls added. Public artwork has embedded provenance, exact prompts and source histories; scan2rasters0missing. Shuffle is a genuine sourced crop; Roulette is an AI-cleaned/recolored source-informed derivative. No new raster generation during integration.

Detector ran once on changed card CSS/settings: one advisory for newly authorized accent before docs refresh. Documentation now records palette/type/styles and PRODUCT.md explicitly supersedes old Appearance restrictions. No clean-audit claim for unrelated surfaces.

Fresh integration review preserved approved card fidelity and found three material fixes: clipped style select, two orphan CSS rules, and missing product authorization. Applied one batch, rebuilt, captured fixed desktop/phone controls, and documenter resynced. Reviewer scored all three resolved, disposition ship. Final verdict is scoped to those three fixes, not a new whole-site review.

Temporary servers/tabs cleaned up after verification. No manual multiplayer session performed.
