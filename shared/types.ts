export type GamePhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'winner';
export type GlitchId = 'drawstorm' | 'consensus' | 'impostor' | 'prediction' | 'memory' | 'heist' | 'fusion' | 'chain' | 'reverse' | 'boss';
export interface GlitchView { id: GlitchId; name: string; icon: string; instruction: string; }
export interface DrawStroke { id: string; from: [number, number]; to: [number, number]; color: string; size: number; }

export interface PlayerView {
  id: string;
  nickname: string;
  avatar: string;
  score: number;
  connected: boolean;
  spectator: boolean;
  isHost: boolean;
  answered: boolean;
  streak: number;
  maxStreak: number;
  doubleDowns: number;
  phaseShifts: number;
  activePower?: 'double' | 'phase';
  team?: 'cyan' | 'pink';
}

export interface QuestionView {
  text: string;
  options: string[];
  category: string;
  number: number;
  total: number;
  glitch: GlitchView;
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
  answerDistribution?: number[];
  fusionBonus?: boolean;
  artistId?: string;
  impostorId?: string;
  bossId?: string;
  chainBank?: number;
}

export interface JoinPayload { code: string; nickname: string; avatar: string; playerId?: string; }
export interface JoinResult { ok: boolean; error?: string; playerId?: string; state?: RoomState; }
export interface AnswerResult { ok: boolean; error?: string; correct?: boolean; points?: number; }
export interface PowerResult { ok: boolean; error?: string; eliminated?: number[]; }
export interface ReactionEvent { id: string; playerId: string; nickname: string; avatar: string; emoji: string; }
