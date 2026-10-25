# Table wins

Local Color play extension, October 25, 2026. Track completed-round wins for the current crew across rematches, online reconnects and recovery of unfinished bot rounds. Reuse the existing result rows in results, Table activity and the online lobby. No official UNO points, account standings, new artwork or arena HUD.

Independent finish review: **ship**, no material fixes. Source sampled; unrelated controller sections and application surfaces remain unread. PRODUCT.md, DESIGN.md and the inherited Color play contract agree on direction and FORM seed `2fba311c`. No new comp or quality-bar card applies to this extension.

Captures: desktop.png (1280×720), mobile.png (390×844), landscape.png (568×320). All show the same actual second completed round, with Cleo at two wins and You at zero. Screenshot bytes are JPEG under the conventional screenshot names. The short landscape adaptation hides only redundant winner artwork; both score rows and rematch/home actions are immediately visible. Outfit lettering, illustrated portraits, cream surfaces and yellow controls retain the established world. Table wins precede the native cards-left disclosure, with rematch primary.

Browser verification: finish two real engine rounds, rematch between them, inspect Table activity, refresh and recover the unfinished second round with the first win intact, and expand the actual terminal card counts. Phone and short landscape have no horizontal overflow. The scorecard is after the Deal action in the lobby.

Verification passed: lint, strict types, game, audio, live multiplayer and production build. Pure checks cover immutable updates, exactly-once completion, rematch carry, damaged score recovery, roster reset, private projection and device-history identity. Network checks cover authoritative counters, forged client metadata, repeat snapshots, lobby/rule carry, crew changes, reconnects and legacy clients.

Scores are honest crew-scoped round wins. A new crew resets them. Unfinished local saves carry them; finished local result screens are not saved. Online scores require the updated socket server. No new dependencies or design-detector suppressions. Retain restrained score rows, optional hand-count detail and immediately visible result actions; additional ornament would compete with the result.
