# Brain Blitz

Brain Blitz is a real-time multiplayer trivia game for up to 20 players. It uses React, TypeScript, Vite, Tailwind CSS, Express, and Socket.IO.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies Socket.IO and API traffic to the Express server on port 3001.

## Verify and build

```bash
npm run typecheck
npm test
npm run build
npm start
```

The production server uses `PORT` when supplied and serves both the built React client and Socket.IO from the same origin.

## Architecture

- `server/game.ts` is the authoritative room state machine. It owns question selection, 10-second deadlines, answer validation, and speed-based scoring.
- Clients receive sanitized question state; the correct answer is withheld until the reveal phase.
- A session-scoped player ID supports reconnection while keeping separate browser tabs independent.
- Players joining after a match begins enter spectator mode until the next match.
- Rooms accept up to 20 players and use unambiguous six-character codes.

## Deployment

Deploy to a WebSocket-capable Node host (Render, Railway, Fly.io, or similar):

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check: `/api/health`
- Runtime: Node 20+

The app is single-service and uses the host-provided `PORT`, so the frontend and WebSocket endpoint share one public HTTPS origin.

For Render, connect the repository and choose **Blueprint**; the included `render.yaml` configures the build, start command, Node version, and health check. A production-ready `Dockerfile` is also included for any container host.
