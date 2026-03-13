# UNO Multiplayer

UNO game built with Next.js (frontend) and Socket.IO (multiplayer server).

## Requirements

- Node.js 20+
- npm 10+

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start frontend and socket server together:

```bash
npm run dev
```

3. Open:

- Frontend: http://localhost:3000
- Socket server health: http://localhost:3001/health

## Environment Variables

Create `.env.local` for frontend values and set server variables in your host.

Frontend:

- `NEXT_PUBLIC_SOCKET_URL` (required in production)

Socket server:

- `PORT` (host-provided in production)
- `UNO_SOCKET_PORT` (local fallback if `PORT` is not set)
- `UNO_CORS_ORIGINS` (comma-separated list of allowed origins)

Example:

```env
NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.example.com
UNO_CORS_ORIGINS=https://your-app.vercel.app,https://your-domain.com
```

## Deployment Topology

Use two deployments:

1. Frontend on Vercel (Next.js app)
2. Socket server on a Node host (Render, Railway, Fly, VM, etc.)

Vercel does not run this repo's long-lived custom Socket.IO process directly.

## Deploy Frontend (Vercel)

1. Import this repo in Vercel.
2. Set environment variable:
	- `NEXT_PUBLIC_SOCKET_URL=https://your-socket-service.example.com`
3. Deploy.

## Deploy Socket Server (Render Example)

1. Create a Web Service from this repo.
2. Set Root Directory to `uno`.
3. Build command:

```bash
npm install
```

4. Start command:

```bash
npm run start:socket
```

5. Add env vars:
	- `UNO_CORS_ORIGINS=https://your-app.vercel.app`

## Production Verification

1. Open frontend on Vercel.
2. Create room in one browser.
3. Join room from second browser/device.
4. Confirm realtime updates and turn sync.

