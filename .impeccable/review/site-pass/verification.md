# Site-wide improvement pass — October 29

Completed a coordinated pass across entry/setup, online rooms, settings/social, card handling, results, controllers, persistence and the socket server. Existing uncommitted work was preserved. No dependencies, protocol fields or test framework were added.

## Material changes

- Shortened entry/setup/room, audio/social, card-choice and portrait guidance; removed repeated result progress and verbose rematch coaching. Rematch readiness is one native disclosure with optional seats.
- Corrected custom-profile favorite selection, invitation-link parsing, and operation-specific room labels/locks.
- Shared profile names follow external changes without overwriting dirty edits. Profile deletion defaults to Keep; Escape cancels the innermost decision and returns to the parent sheet.
- Room invitations validate their destination before transferring membership, preserving the old table on failure. Confirmation stays busy until completion, keeps retry focus, and suspends invitation popups. Expired invitations recover with feedback.
- Wild color choices preserve copied play options, delayed auto-pass rechecks live state, reconnect updates both player-name snapshots, and profile storage has one shared event listener.
- Held-card return motion and hand paging follow both saved and operating-system reduced motion. Card choices are cached per snapshot. Invalid local setup errors recover in setup instead of escaping the click handler.
- Removed obsolete and overridden global styles, aligned the functional Wild motif to existing palette tokens, and retained rounded portrait identity.

## Verification

- Lint, strict types, game/controller/entry regressions, audio and production build passed.
- The complete multiplayer suite passed, including atomic invitation transfer, full-destination preservation/retry, reconnect names, private hands, all three editions and authoritative clocks.
- Production browser checks covered the 568×320 six-seat large scrolling hand, arrow-key browsing, keyboard Wild selection, and the 390×844 portrait pause. The browser's actual viewport and board bounds were checked at 568×320 with no document-width overflow.
- Final profile-deletion confirmation focuses Keep profile. Escape returns to editing and focuses Delete; another Escape returns to Game rules without closing Settings.
- Browser warning/error logs were empty. Physical touch, audible quality and physical hinge devices were not certified.
- Prior source review and assertions cover disconnected readiness counts, bot readiness, custom-link shapes, profile subscriber cleanup and canceled Wild options. No temporary preview route remains in the build.

## Detector triage

The original global scan reported 45 advisory token mismatches. Obsolete/fully overridden values were deleted; the remaining legacy feedback colors were removed or replaced with existing palette variables. The final scan across globals, GameBoard, RematchStatus, ChoiceDialog and Modal is clear. Two narrowly file-scoped radius exceptions are recorded in .impeccable/config.json: 3px for confetti/tiny collection-card geometry, and 4px for the existing keyboard-focus outline. These are functional details, not panel radii. No files or rules were ignored wholesale; no uncertain findings remain.
