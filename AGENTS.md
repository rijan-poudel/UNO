# AGENTS.md

## Project Overview

UNO multiplayer card game built with Next.js 16.4 (App Router) frontend and Socket.IO real-time multiplayer server. Uses TypeScript in strict mode, React 19, Tailwind CSS 4, native dialog primitives, and lucide-react icons.

## Build & Development Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Start both frontend (Next.js) and socket server concurrently
npm run dev:web              # Start Next.js dev server only (uses webpack)
npm run dev:socket           # Watch and restart Socket.IO server
npm run build                # Production build (next build)
npm run lint                 # Run ESLint
npm run start:socket         # Start socket server in production
npm run agent                # Run the agent tool (tsx agent/agent.ts)
```

**Verification**: Run `npm run lint`, `npm run check:types`, `npm run check:game`, `npm run check:audio`, and `npm run build`. With the socket server running, run `npm run check:multiplayer`. These checks use Node assertions, with no test framework. Ask the user before installing a test framework.

## Project Structure

```
app/           # Next.js App Router pages and layouts
components/    # React components (PascalCase .tsx files)
  ui/          # Shared page primitives (PageChrome.tsx)
hooks/         # Custom React hooks (use*.ts)
lib/           # Pure game logic, utilities - no React dependencies
server/        # Socket.IO multiplayer server (socketServer.ts)
types/         # TypeScript type definitions and interfaces
agent/         # AI assistant agent tool (excluded from tsc/eslint)
```

Path alias: `@/*` maps to the project root (e.g., `@/lib/utils`, `@/components/GameBoard`).

## TypeScript & Imports

- **Strict mode enabled** - all code must pass `tsc` strict checks
- Type-only imports: `import type { Card } from '../types/card'`
- Group imports: external packages first, then internal relative paths
- Named exports preferred; default exports reserved for React components
- All game state (`GameState`, `Player`, `Card`) must be JSON-serializable

## Naming Conventions

- **Components**: PascalCase files & exports (`GameBoard.tsx`, `UnoCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useUnoGame.ts`, `useAudioManager.ts`)
- **Types/Interfaces**: PascalCase (`GameState`, `CardColor`, `GameRules`)
- **Constants**: SCREAMING_SNAKE_CASE (`BOT_ACTION_DELAY_MS`, `MAX_DRAW_UNTIL_PLAYABLE`)
- **Functions**: camelCase (`playCard`, `getPlayableCards`, `advanceTurn`)

## Code Patterns

### Pure game logic (`lib/`)

- Every function accepts a `GameState` and returns a **new** `GameState`
- No mutation of input objects - spread operator for immutable updates
- Throw `Error` with descriptive messages on illegal inputs
- See `lib/gameActions.ts` for the canonical pattern

### React components

- Use `"use client"` directive for client components
- Prefer `useReducer` for complex state (see `hooks/useUnoGame.ts`)
- Memoize with `memo()` + explicit comparator for expensive renders
- Use `useCallback` / `useMemo` for stable references in deps arrays
- Inline styles common for game animations and dynamic values

### Error handling

- Game logic: throw on invalid state, callers catch and log
- Hooks: `reportHookError()` helper logs in dev only
- Socket server: `try/catch` with `ackError()` pattern for acknowledgements

### Validation helpers

- Use inline validation functions for runtime checks (e.g., `requireChosenColor()` in `lib/gameActions.ts`)
- Replace TypeScript non-null assertions (`!`) with runtime validation when the value comes from external input
- Example: `requireChosenColor()` validates and returns `CardColor`, throws with clear message if invalid

### Multiplayer server patterns

- Use `crypto.randomBytes()` for generating secure IDs (room codes, invite IDs)
- Implement periodic cleanup intervals for memory management (presence records, invites, orphaned sockets)
- Add timeouts for user interactions that can block the game (e.g., pending color choice)
- Pass `io` server instance to handlers that need to broadcast updates

### Bot logic patterns

- Use `useRef` to access latest state in async callbacks (avoid stale closures)
- Read from `gameRef.current` inside timeout callbacks instead of captured state variables
- Cap iteration limits to prevent infinite loops (e.g., `MAX_DRAW_UNTIL_PLAYABLE`)

### ESLint compliance

- Avoid calling `setState` synchronously within `useEffect` bodies
- Use lazy `useState` initializers for values derived from localStorage or window
- Derive computed state with `useMemo` or simple const instead of `useState` + `useEffect`
- Move `setState` calls into `setTimeout` callbacks when they need to run after effects

## Formatting & Style

- Single quotes in server code, double quotes in components (match adjacent code)
- Semicolons at statement ends
- Trailing commas in multiline structures
- File headers: `//` comment block describing module purpose
- Section separators: `// ── Section Name ──` style dividers

## CSS / Theming

- Tailwind CSS 4 via PostCSS (`postcss.config.mjs`)
- Theme colors as CSS custom properties (`--ui-bg`, `--ui-text`, `--ui-accent-red`, etc.)
- `cn()` utility from `lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- Design authority: `DESIGN.md`; product intent: `PRODUCT.md`; boundaries and state flow: `docs/ARCHITECTURE.md`.
- Theme values live in `app/globals.css`, selected with `data-theme` on the root.
- Keep card faces in `UnoCard`, state-transition motion/audio in `useGamePresentation`, and dialogs in the native `Modal` primitive.
- Sound never gates turns. Do not queue voice or wait for clip durations.
- Online bots advance one published snapshot at a time; reconnect callbacks recheck live state.
- Match the tactile card world: Outfit UI lettering, Barlow Condensed card numerals, vivid native card graphics, and an after-hours baize table with a dark leather rail. Cards live in UnoCard; direct tap/drag interaction lives in HandCard and table styling in app/table.css. Legal cards play on first activation; the shared cardGesture release predicate also drives drag readiness. Preserve generated table materials and their prompt provenance in public/textures. Do not add blocking splashes, mixed font systems, or another parallel component library.
- Presets compose only engine-supported rules in `lib/rulePresets.ts`; do not label No Mercy, Flip or Flex playable until their decks and actions exist.
- Progress is honest device-local completed-round history (`lib/playerProgress.ts`), with idempotent result recording.
- Check phone layouts with six seats and a large scrolling hand, keyboard navigation, and reduced motion.
- Use `npm run format` for formatting. Do not edit managed `.delta/` worktrees as part of this checkout.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
