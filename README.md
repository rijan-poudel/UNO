# UNO — Small cards. Big rivalry.

A responsive UNO game for one human with bots, or private online rooms with up to six players. Built with Next.js 16.4, React 19, TypeScript, and Socket.IO.

## Start playing locally

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open [localhost:3004](http://localhost:3004). The frontend uses port 3004 and the socket server uses port 3001, so they cannot compete for the same port. Both start together; socket, engine and type changes restart the socket server. Restarting that process clears its in-memory rooms.

## What’s here

- A playful illustrated interface with four themes, readable card faces, and a touch-friendly scrolling hand.
- Local games with one human and one to five bots.
- Casual, Standard and Tactical bot challenges, shared by local play and online bot seats. Standard preserves the original card strategy; Tactical uses only its own hand and public information. Bots can miss UNO calls more often at easier levels; tap their badge when Catch appears. Spoken UNO is a basic game sound, respecting mute and effects volume even with the optional announcer off.
- Private online tables with room codes, invitation links, friend codes, bot seats, and rematches.
- Private online hands: each browser receives its own cards, public counts and discards; opponents’ hands and the draw deck remain on the server.
- After a round, hosts can edit the table and deal again in the same room, keeping everyone’s seats and invitation code.
- A running table score tracks completed-round wins across rematches. See it in results, table activity, and the online lobby; changing the crew starts a fresh score.
- Unfinished bot rounds save on the device and can be resumed from home after a refresh.
- A 45-second reconnect window, including a refresh by the last connected human.
- Active online rounds are protected from repeat Deal requests. Hosting follows connected humans, and temporary bots resume absent players’ turns when someone returns.
- House rules for stacking, jump-in, drawing, UNO calls, special cards, and finishing.
- Immediate card sounds, optional music, optional voice, master mute, and saved volume preferences.
- Transform-based card travel and hand repositioning, with reduced-motion support.
- Keyboard shortcuts: **D** draw, **P** pass, **U** call UNO. Cards also work with Tab and Enter/Space; Left/Right/Home/End browse the hand. UNO may be declared with two cards before a play or with one card afterward.

Choose a challenge under **Set up bots → Bot options**, in **Settings → Rules**, or in the host’s table rules before an online deal. Quick play uses the saved choice. Preset changes preserve the challenge; rematches and resumed local rounds keep the challenge they started with. Online bot choices require the updated socket service.

Table scores count wins, not official card points or account rankings. Local rematches and unfinished-round recovery retain the score; starting a fresh local table clears it. Online scores belong to the room and survive reconnects and rule editing, while adding or removing players resets them. Device-local completed-round history remains separate. In results, expand **Cards left this round** for the terminal hand counts.

## Verify changes

```sh
npm run lint
npm run check:types
npm run check:game
npm run check:audio
npm run build
```

For real socket acknowledgements, private-hand delivery, full rounds, room editing, reconnects, six-seat limits, and bot pacing:

```sh
# In one terminal
npm run dev:socket
# In another
npm run check:multiplayer
```

The checks use Node assertions and the installed TypeScript runner; no test framework is required. Set `UNO_CHECK_SOCKET_URL` to point the multiplayer check at a different local server. CI runs all of these checks.

## Project map

- `app/page.tsx` — view routing, shared preferences, local/online API selection.
- `components/home/HomeScreen.tsx` — quick bot play and distinct create/join entry.
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

- Rooms and match results are not durable across a socket server restart. Unfinished local bot rounds are saved in the current browser; they do not sync across devices.
- Hand privacy requires the updated socket service. Both deployment orders remain playable: the new client accepts legacy servers, and the new server sends anonymous card backs in the previous packet shape to older clients.
- Double-play pair detection exists in the engine, but playing a pair is not implemented as an action. The interface deliberately does not offer that rule.
- `agent/` is a separate legacy tool and remains excluded from lint/type checks.
- The production dependency audit is clean. The lint toolchain still reports an upstream `braces` advisory; npm’s proposed force fix downgrades Next’s ESLint configuration. Do not apply that incompatible downgrade.

Home centers Play/Create/Join beneath a small fan of native cards. The Color play arena uses a blue field, human portraits, amber turn cues, vivid card faces, a curved hand, Outfit UI type and Space Grotesk card numerals. Swiss Minimal is the default; choose Nordic Frost in Settings → Appearance → Card style. Both styles share the existing table geometry, direct card handling and game motion. Card-art provenance is retained in `public/artwork/cards/`. Tap a legal card or drag it upward to play; nonmatching cards remain inspectable. Draw from the physical deck. Pass and UNO appear only when eligible; a previously inspected card can retain a named Play fallback when it becomes legal. Sorting and activity live in the menu. Pickup feedback starts on actual activation, followed by snapshot contact audio; optional music and voice never hold up turns. Wins and streaks are honest device-local history. Classic UNO, UNO Show ’Em No Mercy and UNO All Wild have distinct decks and actions. The three originals are fixed. Settings → Game rules lets you choose one, create an editable custom copy, and pin up to three favorites to Home. No Mercy uses a charcoal/crimson field and All Wild uses plum; the table follows the edition. Flip and Flex remain future implementations. The game uses timed rounds and a completed-round win tally, without tournament point scoring or bluff/challenge play.

### Persistent multiplayer host

The existing deployed service is [uno-411x.onrender.com](https://uno-411x.onrender.com), supplied by the owner and verified against the full multiplayer protocol on October 20. The Vercel frontend already connects to it; no new host or sign-in is required.

The public frontend needs `NEXT_PUBLIC_SOCKET_URL` set to its separate Socket.IO host. Without it, online rooms show an unavailable state and offer local bot play; public visitors are never sent to an unserved port on the frontend domain. Explicit loopback/private-LAN socket addresses are also rejected on public hostnames; a developer’s running local server is not a public multiplayer deployment. Local development and local/LAN previews still resolve the local server automatically.

`Dockerfile.socket` packages the persistent service for a container host:

```sh
docker build -f Dockerfile.socket -t uno-socket .
docker run --rm -p 3001:3001 -e UNO_CORS_ORIGINS=https://uno-wheat-ten.vercel.app uno-socket
```

The host must accept WebSockets, expose `/health`, and set `PORT` if it uses a port other than 3001. Set `UNO_CORS_ORIGINS` to the frontend origin. Put the resulting HTTPS host URL in the Vercel production environment, then rebuild the frontend. One process owns in-memory rooms; restarting it clears them.
