import { randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import type { AnswerResult, JoinPayload, JoinResult, PlayerView, RoomState } from '../shared/types.ts';
import { pickQuestions, type Question } from './questions.ts';

interface Player extends PlayerView { socketId: string; disconnectTimer?: NodeJS.Timeout; }
interface Room {
  code: string;
  phase: RoomState['phase'];
  players: Map<string, Player>;
  questions: Question[];
  questionIndex: number;
  questionEndsAt?: number;
  timer?: NodeJS.Timeout;
}

const QUESTION_MS = process.env.NODE_ENV === 'test' ? 600 : 10_000;
const REVEAL_MS = process.env.NODE_ENV === 'test' ? 100 : 2_500;
const BOARD_MS = process.env.NODE_ENV === 'test' ? 100 : 2_500;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export class GameManager {
  rooms = new Map<string, Room>();
  constructor(private io: Server) {}

  private makeCode() {
    let code = '';
    do {
      const bytes = randomBytes(6);
      code = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    } while (this.rooms.has(code));
    return code;
  }

  private view(room: Room): RoomState {
    const q = room.questions[room.questionIndex];
    return {
      code: room.code,
      phase: room.phase,
      players: [...room.players.values()].map(({ socketId: _socketId, disconnectTimer: _disconnectTimer, ...p }) => p).sort((a, b) => b.score - a.score),
      question: q && room.phase !== 'lobby' ? { text: q.text, options: q.options, category: q.category, number: room.questionIndex + 1, total: 10 } : undefined,
      questionEndsAt: room.questionEndsAt,
      correctOption: room.phase === 'reveal' || room.phase === 'leaderboard' || room.phase === 'winner' ? q?.correct : undefined,
      currentQuestion: Math.max(0, room.questionIndex + 1),
      totalQuestions: 10
    };
  }

  private emit(room: Room) { this.io.to(room.code).emit('room:state', this.view(room)); }

  create(socketId: string, nickname: string, avatar: string): JoinResult {
    const code = this.makeCode();
    const id = randomUUID();
    const player: Player = { id, socketId, nickname: cleanName(nickname), avatar, score: 0, connected: true, spectator: false, isHost: true, answered: false };
    const room: Room = { code, phase: 'lobby', players: new Map([[id, player]]), questions: [], questionIndex: -1 };
    this.rooms.set(code, room);
    return { ok: true, playerId: id, state: this.view(room) };
  }

  join(socketId: string, payload: JoinPayload): JoinResult {
    const room = this.rooms.get(payload.code.toUpperCase());
    if (!room) return { ok: false, error: 'Room not found. Check the code and try again.' };
    if (payload.playerId && room.players.has(payload.playerId)) {
      const player = room.players.get(payload.playerId)!;
      clearTimeout(player.disconnectTimer); player.disconnectTimer = undefined;
      player.socketId = socketId; player.connected = true;
      return { ok: true, playerId: player.id, state: this.view(room) };
    }
    if (room.players.size >= 20) return { ok: false, error: 'This room is full.' };
    const id = randomUUID();
    const player: Player = { id, socketId, nickname: cleanName(payload.nickname), avatar: payload.avatar, score: 0, connected: true, spectator: room.phase !== 'lobby', isHost: false, answered: false };
    room.players.set(id, player);
    return { ok: true, playerId: id, state: this.view(room) };
  }

  start(code: string, playerId: string): string | undefined {
    const room = this.rooms.get(code);
    const player = room?.players.get(playerId);
    if (!room || !player?.isHost) return 'Only the host can start.';
    if (room.phase !== 'lobby' && room.phase !== 'winner') return 'The game is already running.';
    room.questions = pickQuestions(10); room.questionIndex = -1;
    for (const p of room.players.values()) { p.score = 0; p.spectator = false; }
    this.nextQuestion(room);
  }

  answer(code: string, playerId: string, option: number): AnswerResult {
    const room = this.rooms.get(code); const player = room?.players.get(playerId);
    if (!room || !player) return { ok: false, error: 'Player not found.' };
    if (room.phase !== 'question' || !room.questionEndsAt) return { ok: false, error: 'Answers are closed.' };
    if (player.spectator) return { ok: false, error: 'Spectators join the next match.' };
    if (player.answered) return { ok: false, error: 'Answer already locked.' };
    if (!Number.isInteger(option) || option < 0 || option > 3) return { ok: false, error: 'Invalid answer.' };
    player.answered = true;
    const correct = room.questions[room.questionIndex].correct === option;
    const points = correct ? Math.max(100, Math.round(100 + 900 * Math.max(0, room.questionEndsAt - Date.now()) / QUESTION_MS)) : 0;
    player.score += points;
    this.emit(room);
    return { ok: true, correct, points };
  }

  disconnect(socketId: string) {
    for (const room of this.rooms.values()) {
      const player = [...room.players.values()].find((p) => p.socketId === socketId);
      if (!player) continue;
      player.connected = false; this.emit(room);
      player.disconnectTimer = setTimeout(() => {
        room.players.delete(player.id);
        if (player.isHost) {
          const next = [...room.players.values()].find((p) => p.connected) || room.players.values().next().value as Player | undefined;
          if (next) next.isHost = true;
        }
        if (!room.players.size) { clearTimeout(room.timer); this.rooms.delete(room.code); }
        else this.emit(room);
      }, 30_000);
      break;
    }
  }

  state(code: string) { const room = this.rooms.get(code); return room ? this.view(room) : undefined; }
  broadcast(code: string) { const room = this.rooms.get(code); if (room) this.emit(room); }

  private nextQuestion(room: Room) {
    room.questionIndex += 1;
    if (room.questionIndex >= room.questions.length) {
      room.phase = 'winner'; room.questionEndsAt = undefined; this.emit(room); return;
    }
    room.phase = 'question'; room.questionEndsAt = Date.now() + QUESTION_MS;
    for (const p of room.players.values()) p.answered = false;
    this.emit(room);
    room.timer = setTimeout(() => this.reveal(room), QUESTION_MS);
  }

  private reveal(room: Room) {
    room.phase = 'reveal'; room.questionEndsAt = undefined; this.emit(room);
    room.timer = setTimeout(() => {
      room.phase = 'leaderboard'; this.emit(room);
      room.timer = setTimeout(() => this.nextQuestion(room), BOARD_MS);
    }, REVEAL_MS);
  }
}

function cleanName(value: string) {
  const name = String(value || '').replace(/[<>]/g, '').trim().slice(0, 18);
  return name || 'Player';
}
