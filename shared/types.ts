export type GamePhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'winner';
export type GlitchId = 'drawstorm' | 'consensus' | 'impostor' | 'prediction' | 'memory' | 'heist' | 'fusion' | 'chain' | 'reverse' | 'boss';
export type ArenaWorld = 'cyber' | 'ocean' | 'volcano' | 'dream' | 'void' | 'jungle';
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
  activePower?: 'double' | 'phase' | 'rewind';
  team?: 'cyan' | 'pink';
  rewinds: number;
  mission?: string;
  missionComplete?: boolean;
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
  world: ArenaWorld;
  crowdEnergy: number;
  bossHealth?: number;
  duelistIds?: string[];
  cloneOption?: number;
  recap?: { fastest?: string; combo?: string; champion?: string; world: ArenaWorld };
}

export interface JoinPayload { code: string; nickname: string; avatar: string; playerId?: string; }
export interface JoinResult { ok: boolean; error?: string; playerId?: string; state?: RoomState; }
export interface AnswerResult { ok: boolean; error?: string; correct?: boolean; points?: number; }
export interface PowerResult { ok: boolean; error?: string; eliminated?: number[]; }
export interface ReactionEvent { id: string; playerId: string; nickname: string; avatar: string; emoji: string; }
