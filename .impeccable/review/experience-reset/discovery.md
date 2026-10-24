# Experience reset — October 24

The owner rejects the current congested homepage and sparse game board and requests a complete UI/UX rethink. Preserve working engine and multiplayer behavior, not the discarded frontend identity. New explicit requirements supersede old constraints against visible routine turn status: show turn direction, clear legal actions, and a countdown with automatic draw/pass (confirmed October 24).

Mechanism: a shared circle of players moves a four-color discard game through immediate card choices, stacking and reversals.
Audience scene: friends or a solo player on phone landscape and desktop, wanting a lively round without account setup.
Cultural home: casual card-night rituals and approachable arcade games.
First surface must prove: players can see who acts, which way turns travel, what they can touch and what just happened.
Avoid both the congested character poster and the empty flat dashboard.

Seven grounded directions, in resonance order:
1. Color court — friendly sports-court color blocking turns the table into one readable shared field.
2. Kitchen-table club — familiar card-night ritual, intimate scale and physical paper handling.
3. Pocket arcade — crisp handheld-console hierarchy and a single immediate start control.
4. After-hours arcade — a plum game stage, spotlighted native cards and restrained amber controls.
5. Broadcast match — clear player order and real turn data expressed like a small live match.
6. Game-box print — bold four-color printed components, quiet paper and tactile controls.
7. Sticker league — collectible-style identities and game-earned reactions, with generous blank space.

Seed 2fba311c assigns index 4, After-hours arcade. All six foreign-system challengers decline on both audience identification and product clarity; each fused proposal and retained discipline is recorded in directions.json. No borrowing of their motifs. The active comparison is After-hours arcade, the Color court pick, and the subordinate category-standard exit.

Backend findings: local and online bots currently act after 760ms. Local UI exposes forced penalty draw as a manual button, while online behavior also requires a draw action. Existing useGamePresentation and audio provide reusable mechanisms, not a reason to keep the visual design. Background music exists and is optional. Server currently has a color-choice timeout but no human-turn deadline.

Working assumption: 30-second human turns; forced penalty auto-resolves only when no legal stack response exists. A voluntary draw does not reset the turn deadline. Online timing must be server-authoritative and survive reconnect/metadata snapshots. Sound must not gate turns.
