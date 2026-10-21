# Verification — open UNO play field

Scope: October21 owner feedback replaces the prior felt/leather live arena. No engine/protocol/audio scheduling or raster edits. The main checkout's unrelated globals.css/table.css/GameFeedback edits are preserved outside this isolated worktree.

- User848×765 and desktop1440×900: centered piles, foreground hand cropped at the screen edge, legal-card lift, icon-only header, accessible turn/color retained. No remaining-deck badge.
- Landscape844×390 and568×320: six identities, actual pending8 penalty, a20-card hand after taking it, End-key final-card reveal. Document dimensions match viewport, root scrollLeft0. Full-size scrollport extends below the clipped viewport; scrollTop0 keeps card tops/focus visible. At568 focused final-card top237.8 and scrollport top234, bottom347.8 intentionally cropped at320.
- Portrait390×844: rotate/Leave prompt; online continuation copy truthful. Local pause implementation unchanged.
- Menu: sound toggled off and on; existing readiness and gesture intent handling retained. Room copy moved intact into menu. Header44px target accessible Game menu.
- Wild: first activation opens native picker, blue chosen, active identity advances and blue marker appears only with the wild discard.
- Direct upward drag of green Discard all moved it into the discard immediately and advanced the active identity; first-tap Wild opened the picker in a separate seeded round.
- No idle/pulsing effects or new pointer loop. Turn lift is a bounded200ms transform transition; reduced motion removes it. Native card CSS3D is already guarded by fine hover and no reduced motion. Direct tap/drag engine contract unchanged.
- Existing required game check:60completed rounds, conservation, immutable inputs, gestures, motion, presets/progress passed. Audio unlock/fallback/mute/expiry/lifecycle passed. Multiplayer protocol/six seats/bot snapshots/reconnect/handoff passed. Lint and strict types passed; production build passed with actual local dependencies (initial external node_modules symlink was rejected by Turbopack's root boundary and replaced by npm ci).
- Contrast calculation: white on lightest orbit blue6.10:1; secondary#d7e3ff on that blue4.74:1; action dark#392700 on yellow11.11:1; white on hint navy13.72:1.
- Detector:19advisories,0warnings; intended replacement palette, functional elevation and landing radius differ from the prior DESIGN. No ignore rules. One detector invocation, not rerun after fixes.

Captures here are native/browser viewport captures, all opened before review. Initial keyboard scroll crop and plane-over-header issues were corrected in one bounded confirmation batch. Preview uses loopback-only fixture from shared-table on3011 and frontend3010; fixture never deployed. Screens show Next's dev indicator, not a product control. Physical hardware/speaker quality and exhaustive accessibility are not claimed.
