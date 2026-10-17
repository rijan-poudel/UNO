# UNO — Small cards. Big rivalry.

A responsive UNO game for one human with bots, or private online rooms with up to six players. Built with Next.js 16.4, React 19, TypeScript, and Socket.IO.

## Start playing locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The frontend and socket server start together; socket, engine and type changes restart the socket server. Restarting that process clears its in-memory rooms.

## What’s here

- A playful illustrated interface with four themes, readable card faces, and a touch-friendly scrolling hand.
- Local games with one human and one to five bots.
- Private online tables with room codes, invitation links, friend codes, bot seats, and rematches.
- A 45-second reconnect window, including a refresh by the last connected human.
- House rules for stacking, jump-in, drawing, UNO calls, special cards, and finishing.
- Immediate card sounds, optional music, optional voice, master mute, and saved volume preferences.
- Transform-based card travel and hand repositioning, with reduced-motion support.
- Keyboard shortcuts: **D** draw, **P** pass, **U** call UNO. Cards also work with Tab and Enter/Space. UNO may be declared with two cards before a play or with one card afterward.

## Verify changes

```sh
npm run lint
npm run check:types
npm run check:game
npm run build
```

For real socket acknowledgements, reconnects, six-seat limits, and bot pacing:

```sh
# In one terminal
npm run dev:socket
# In another
npm run check:multiplayer
```

The checks use Node assertions and the installed TypeScript runner; no test framework is required. Set `UNO_CHECK_SOCKET_URL` to point the multiplayer check at a different local server. CI runs all of these checks.

## Project map

- `app/page.tsx` — view routing, shared preferences, local/online API selection.
- `components/home/HomeScreen.tsx` — entry screen and saved friends.
- `components/GameSetup.tsx`, `OnlineLobby.tsx` — local seats and online room flow.
- `components/GameBoard.tsx` — table, hand, available actions, result and help dialogs.
- `components/UnoCard.tsx` — the shared card face and accessible labels.
- `components/Modal.tsx` — native modal with focus containment and return.
- `app/globals.css` — themes, components, breakpoints, and reduced motion.
- `hooks/useGamePresentation.ts` — card travel, hand repositioning, and audio tied to snapshots.
- `hooks/useUnoGame.ts`, `useUnoOnlineGame.ts` — local reducer and socket client.
- `lib/` — immutable engine, rules, deck, bot choices, and audio.
- `server/socketServer.ts` — authoritative online actions, room membership, invitations, reconnects, and timed bot turns.
- `scripts/` — framework-free checks and reproducible audio preparation.

Read [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), [AGENTS.md](AGENTS.md), and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before changing the product.

## Audio assets

Playable voice files live in `public/audio/voice/`; optional music is `public/audio/music.mp3`. The original recordings remain in `public/audios/` as source material. Do not load those originals during a card interaction.

Regenerate with ffmpeg installed:

```sh
npm run audio:prepare
```

The preparation script removes leading/trailing silence from voice, normalizes loudness, and writes compressed files. Preferences are in `lib/audioSettings.ts`. Sound never controls turn timing. Voice is one interruptible lane: a newer event cancels the previous event, and an unavailable clip expires rather than playing late.

## Deployment

Use a Next.js host for the frontend and a persistent Node process for Socket.IO. Rooms are in memory; restarting the socket process ends active rooms. A serverless frontend deployment does not run the long-lived socket process.

Frontend environment:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.example.com
```

Socket host environment:

```env
PORT=3001
UNO_CORS_ORIGINS=https://your-app.example.com
```

`UNO_SOCKET_PORT` is the local fallback when `PORT` is unset. Start the socket process with `npm run start:socket`. Start a built frontend with `npm start`. Socket health is `/health` on the socket host. Check room creation and joining from separate devices after deploying.

For a phone on the same Wi-Fi, use the network URL printed by `npm run dev`. Both frontend and socket ports must be reachable. Localhost and private LAN origins are accepted by the development server.

## Current boundaries

- Casual private rooms: snapshots currently include the full game state. Hidden information is concealed by the UI, not protected from a modified client. Anti-cheat transport is separate work.
- Rooms and match results are not durable across a socket server restart. Local rounds are not saved across reloads.
- Double-play pair detection exists in the engine, but playing a pair is not implemented as an action. The interface deliberately does not offer that rule.
- `agent/` is a separate legacy tool and remains excluded from lint/type checks.
- The production dependency audit is clean. The lint toolchain still reports an upstream `braces` advisory; npm’s proposed force fix downgrades Next’s ESLint configuration. Do not apply that incompatible downgrade.

The current visual direction is playful and led by original card-character graphics, with Fredoka/Nunito Sans typography, a compact navigation bar, fast card motion, immediate paper-and-tap sound, and device-local wins and streaks. Choose Classic, Stack party, or Wild table before dealing, then fine-tune individual house rules in Settings. No Mercy, Flip and Flex remain future implementations; these presets do not claim to implement those editions.

### Persistent multiplayer host

The public frontend needs `NEXT_PUBLIC_SOCKET_URL` set to its separate Socket.IO host. Without it, online rooms show an unavailable state and offer local bot play; public visitors are never sent to an unserved port on the frontend domain. Local development and port-3000 previews still resolve the local server automatically.

`Dockerfile.socket` packages the persistent service for a container host:

```sh
docker build -f Dockerfile.socket -t uno-socket .
docker run --rm -p 3001:3001 -e UNO_CORS_ORIGINS=https://uno-wheat-ten.vercel.app uno-socket
```

The host must accept WebSockets, expose `/health`, and set `PORT` if it uses a port other than 3001. Set `UNO_CORS_ORIGINS` to the frontend origin. Put the resulting HTTPS host URL in the Vercel production environment, then rebuild the frontend. One process owns in-memory rooms; restarting it clears them.
