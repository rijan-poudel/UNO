# Browser fixtures

These are explicitly seeded local preview states, not public matches. They use the real engine and preserve unique cards. They do not run bots so screenshots are stable.

Stop your local socket server, then run `npx tsx .impeccable/review/play-feedback/fixture.mjs`. Keep the built frontend on localhost:3000. Join `ABC234` for two cards including a long action name and eligible UNO, or `DRAW23` for a twelve-card hand with a matching green Reverse next in the draw pile. Draw responses intentionally wait 1.2 seconds to expose the pending-action state. The fixture binds only to loopback. Stop it and restart `npm run dev:socket` before running the real multiplayer checks. Do not deploy it.
