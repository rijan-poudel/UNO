# UNO interaction audit — 20 October 2026

Scope: home, saved bot setup, room join/create/host, live card play, wild choice, hand scrolling, keyboard access, settings, finished-round controls, motion and sound. The owner authorizes fixes and publishing. This is a refinement of the established baize/leather table and native deck, not another visual-world replacement. No added library or engine rule change.

## Implementation integrity

Pass with concrete defects. The shared deck, two font families, native dialogs, device-local completed history and authoritative multiplayer state form a coherent product. The detector ran once over changed UI: 89 advisory findings (45 color, 28 type size, 16 radius). Most refer to incumbent card graphics/materials and compact game labels against a narrower token catalog; no non-advisory finding, suppression or repeat scan. These counts do not certify visual quality.

## Health score

Measured implementation review, not a WCAG or physical-device certification. Baseline 11/20: accessibility 2, performance 2, responsive 2, theming 3, integrity 2. After fixes 15/20: each dimension 3. The score remains conservative: real touch hardware, physical speaker balance and reduced-motion browser emulation are outside this environment's evidence.

## Findings and disposition

1. **P1 — Keyboard focus disappears after play or cancelled wild.** HandCard, Modal, useGamePresentation. Removing the played button or unmounting the dialog left focus on the document, forcing keyboard players to traverse navigation again. Fixed: activate/focus the card, return a cancelled dialog to its opener, then focus a surviving neighbor after a local play. Do not steal focus from an open dialog or another active control. Browser confirmation: Escape returned to Wild +4; Enter on red 2 left focus on the adjacent red 5. Accessibility, WCAG 2.4.3/2.4.7. Recommended workflow: harden; completed.

2. **P1 — Sideways phones put the whole hand below the viewport.** app/table.css. At 844×390 the original page was about 780px tall. Fixed: table/hand columns for landscape phones, compact cards/seats and reachable action dock. Add a compact portrait composition for 320×568 as well. A first inspection caught the centered seats crossing into the header; corrected the center positions in the same batch. Responsive. Recommended workflow: adapt; completed.

3. **P1 — Arena primary action has insufficient contrast in daylight appearance.** app/globals.css and app/table.css. The fixed arena's pale coral inherited white ink from the daylight shell. Fixed: arena primary actions share the existing lime/dark-green action pairing, independent of shell appearance. Supporting settings remain theme-aware. Accessibility/theming, WCAG 1.4.3. Recommended workflow: colorize; completed.

4. **P2 — Card flight changes size/angle at pickup and landing.** useGamePresentation. Fixed: capture the actual release center, width and composed rotation; use the same pure geometry for play, draw and deal. Preserve the fan transform while reflowing surviving cards. Remove the entire table's 2px bounce. A flight is 190–262ms; deal/draw stagger is capped at six representative cards, including the newest in a large draw. Geometry has executable assertions. Motion/performance. Recommended workflow: animate; completed.

5. **P2 — Rapid state changes leave competing ghosts; motion preference changes do not interrupt flights.** useGamePresentation. Fixed: cancel stale picture/endpoint animations and remove ghosts before the next snapshot; cancel on visibility loss, unmount and a newly enabled reduced-motion preference. Game state publishes independently of all effects. Motion/performance. Recommended workflow: animate; completed.

6. **P2 — Reduced-motion mode erases special-action feedback.** globals.css. A global 0.01ms kill plus display:none hid the action signal. Fixed: targeted spatial-animation removal, static fan/focus state and a short opacity-only action signal. Setup rows/dialogs do not translate. Reduced-motion behavior is source-reviewed; browser emulation is not available. Accessibility, WCAG 2.3.3. Recommended workflow: animate; completed.

7. **P2 — Hand scrolling produces pickup audio before a card is picked up.** HandCard. Fixed: pointer-down only primes audio. Vertical pickup or explicit nonmatching-card inspection produces the pickup texture; horizontal scroll and cancelled contact do not. Actual plays/draws retain immediate snapshot audio. No extra melody, wait or audio queue. UX/motion. Recommended workflow: polish; completed.

8. **P2 — Sound controls silently fail with blocked storage.** audioSettings.ts. Updating storage threw before notifying controls/audio. Fixed: retain this session's settings in memory and always notify subscribers. Assertions cover enable/mute/volume and notifications with failed writes. The existing card recording starts above a 1% signal threshold within 5ms, with no clipping; no new recording is claimed. Implementation integrity. Recommended workflow: harden; completed.

9. **P2 — Small header/text actions and incomplete settings tab keys.** table.css, globals.css, SettingsModal. Fixed: 44px header/menu/text targets and Home/End alongside arrow navigation for the tablist. The custom switch has a full clickable label and retained focus ring. Browser confirmation: End moved Rules to Look. Accessibility/responsive. Recommended workflow: adapt/harden; completed.

10. **P2 — Next-round rule copy promises changes that a rematch does not use.** SettingsModal. Fixed: say settings apply to the next table setup; rematches retain this table's rules. No unannounced rule mutation mid-round. Implementation integrity. Recommended workflow: clarify; completed.

11. **P2 — Rematch controls remain enabled offline; call-out signal hardcodes +2.** GameBoard, GameFeedback. Fixed: disable host and guest rematch controls while disconnected, and show the engine's actual call-out penalty. Implementation integrity. Recommended workflow: harden; completed.

12. **P1 — Leaving during a live bot update can re-open the room.** useUnoOnlineGame, OnlineLobby. Observed against the public service: the leave dialog closed, then a late bot snapshot put the game back on screen. Fixed at the shared membership boundary: room broadcasts must match an existing membership; create/join/invite/reconnect acknowledgements carry an intent revision, and leave/kick invalidates old work. An abandoned late join releases its server room. Start/kick/add-bot/readiness acknowledgements are discarded after leaving. Back cancels pending acquisition too. A loopback fixture intentionally delivers a snapshot 100ms after leave and a join acknowledgement 1500ms after Back; browser remains home in both cases. Implementation integrity. Recommended workflow: harden; completed.

Four P1 and eight P2 findings addressed; no known P0 in this scoped review.

## Whole-journey positives and checks

- Home prioritizes play, with milestones optional. Names, rule presets and card graphic grammar remain shared. No claims of unimplemented Flip/Flex/No Mercy decks.
- Room codes accept links or six-character codes. Browser validation rejected a three-character code with a usable explanation and disabled submission.
- Local real Socket.IO browser path: create RP444A, add bot, deal a 12-card round, open/cancel wild, play red 2, leave. Room cleaned up after inspection. No invitations sent.
- Keyboard action stayed immediate; game/bot progress did not wait for sound or animation. Progress history stayed at the existing one completed round/zero wins during inspection; no synthetic completed results were recorded.
- Native modal scroll/focus containment, written active color, contextual Draw/Pass/UNO and six-seat large-hand scrolling remain intact.
- Engine/audio assertions and real six-client protocol checks cover immutable state, complete rounds, reconnect, bot snapshots, timing, no stale audio backlog and offline audio fallback.

## Shipping boundary

No promise that every possible UX issue is eliminated. Confirm the supported desktop, narrow portrait and sideways-phone compositions together; fix only material findings from that pass. The public multiplayer service was reachable: created room K8PPGC, added a bot, dealt, and played yellow 3. This exposed the leave race above. Deployment success alone is not used as proof of multiplayer; leaving is checked again on the published fix.

## Operational follow-up — resolved October 20

The owner confirmed the existing public backend https://uno-411x.onrender.com. Root/health checks and the full remote multiplayer suite passed. With the local socket process stopped, the published frontend connected, created YTN9KK and returned Home after leaving. The earlier local-dependency inference was incorrect; temporary remote readiness was not distinguished from local startup. No Vercel configuration changed and sign-in is no longer required. Current service availability is established; continuous uptime is outside this review.
