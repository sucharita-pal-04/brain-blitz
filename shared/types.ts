export type GamePhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'winner';

export interface PlayerView {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  connected: boolean;
  spectator: boolean;
  isHost: boolean;
  answered: boolean;
}

export interface QuestionView {
  text: string;
  options: string[];
  category: string;
  number: number;
  total: number;
}

export interface RoomState {
  code: string;
  phase: GamePhase;
  players: PlayerView[];
  question?: QuestionView;
  questionEndsAt?: number;
  correctOption?: number;
  currentQuestion: number;
  totalQuestions: number;
}

export interface JoinPayload { code: string; nickname: string; avatar: string; playerId?: string; }
export interface JoinResult { ok: boolean; error?: string; playerId?: string; state?: RoomState; }
export interface AnswerResult { ok: boolean; error?: string; correct?: boolean; points?: number; }
