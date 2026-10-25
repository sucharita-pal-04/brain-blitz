import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Server } from 'socket.io';
import type { JoinPayload } from '../shared/types.ts';
import { GameManager } from './game.ts';

export function createAppServer(port = Number(process.env.PORT) || 3001) {
  const app = express();
  app.use(cors()); app.use(express.json());
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: { origin: true, credentials: true } });
  const games = new GameManager(io);

  app.get('/api/health', (_req, res) => res.json({ ok: true, rooms: games.rooms.size }));
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => req.path.startsWith('/api') ? next() : res.sendFile(path.join(dist, 'index.html')));

  io.on('connection', (socket) => {
    socket.on('room:create', ({ nickname, avatar }, done) => {
      const result = games.create(socket.id, nickname, avatar);
      socket.join(result.state!.code); done(result); games.broadcast(result.state!.code);
    });
    socket.on('room:join', (payload: JoinPayload, done) => {
      const result = games.join(socket.id, payload);
      if (result.ok) { socket.join(result.state!.code); done(result); games.broadcast(result.state!.code); }
      else done(result);
    });
    socket.on('game:start', ({ code, playerId }, done) => {
      const error = games.start(code, playerId); done({ ok: !error, error });
    });
    socket.on('answer:submit', ({ code, playerId, option }, done) => done(games.answer(code, playerId, option)));
    socket.on('power:use', ({ code, playerId, power }, done) => done(games.usePower(code, playerId, power)));
    socket.on('reaction:send', ({ code, playerId, emoji }) => games.react(code, playerId, emoji));
    socket.on('disconnect', () => games.disconnect(socket.id));
  });

  return { app, io, games, httpServer, listen: () => new Promise<void>((resolve) => httpServer.listen(port, resolve)) };
}

if (process.env.NODE_ENV !== 'test') {
  const server = createAppServer();
  server.listen().then(() => console.log(`Brain Blitz server listening on http://localhost:${process.env.PORT || 3001}`));
}
