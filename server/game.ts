import { randomBytes, randomUUID } from 'node:crypto';
import type { Server } from 'socket.io';
import type { AnswerResult, ArenaWorld, DrawStroke, GlitchId, GlitchView, JoinPayload, JoinResult, PlayerView, RoomState } from '../shared/types.ts';
import { pickQuestions, type Question } from './questions.ts';

interface Player extends PlayerView { socketId: string; disconnectTimer?: NodeJS.Timeout; answerOption?: number; answerCorrect?: boolean; lastReactionAt?: number; lastAnswerOption?: number; fastestMs?: number; }
interface Room {
  code: string;
  phase: RoomState['phase'];
  players: Map<string, Player>;
  questions: Question[];
  questionIndex: number;
  questionEndsAt?: number;
  timer?: NodeJS.Timeout;
  fusionBonus?: boolean;
  glitchOrder: GlitchId[];
  artistId?: string;
  impostorId?: string;
  bossId?: string;
  chainBank: number;
  world: ArenaWorld;
  crowdEnergy: number;
  bossHealth?: number;
  duelistIds?: string[];
  cloneOption?: number;
}

const QUESTION_MS = process.env.NODE_ENV === 'test' ? 600 : 10_000;
const REVEAL_MS = process.env.NODE_ENV === 'test' ? 100 : 2_500;
const BOARD_MS = process.env.NODE_ENV === 'test' ? 100 : 2_500;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const WORLDS: ArenaWorld[] = ['cyber','ocean','volcano','dream','void','jungle'];
const MISSIONS = ['Finish in the top three','Build a 3-answer streak','Use every power card','Defeat the Final Boss','Score more than 2,500 points','Answer the finale correctly'];
const GLITCHES: Record<GlitchId, GlitchView> = {
  drawstorm: { id:'drawstorm', name:'DRAWSTORM', icon:'✍️', instruction:'One artist sees the answer. Read the live sketch before time collapses.' },
  consensus: { id:'consensus', name:'CONSENSUS TRAP', icon:'🧲', instruction:'Correct minority answers earn a rogue bonus. Do not blindly follow the crowd.' },
  impostor: { id:'impostor', name:'IMPOSTOR PULSE', icon:'🕵️', instruction:'One player receives a corrupted prompt. Watch who behaves strangely.' },
  prediction: { id:'prediction', name:'PREDICTION MARKET', icon:'📈', instruction:'Correct answers matching the room majority gain a market dividend.' },
  memory: { id:'memory', name:'MEMORY CORRUPTION', icon:'🧠', instruction:'The prompt vanishes after three seconds. Photograph it with your mind.' },
  heist: { id:'heist', name:'ANSWER HEIST', icon:'💎', instruction:'A correct answer steals points from the current leader.' },
  fusion: { id:'fusion', name:'TEAM FUSION', icon:'🔗', instruction:'Temporary cyan and pink teams combine their correct answers for a shared bonus.' },
  chain: { id:'chain', name:'CHAIN REACTION', icon:'⚛️', instruction:'Every consecutive room-wide correct answer grows the volatile chain bank.' },
  reverse: { id:'reverse', name:'REVERSE REALITY', icon:'↩️', instruction:'The correct answer is wrong. Pick any believable incorrect option.' },
  boss: { id:'boss', name:'FINAL BOSS', icon:'👑', instruction:'The leader becomes the boss. Everyone else unites to overthrow them.' }
};

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
      players: [...room.players.values()].map(({ socketId: _socketId, disconnectTimer: _disconnectTimer, answerOption: _answerOption, answerCorrect: _answerCorrect, lastReactionAt: _lastReactionAt, ...p }) => p).sort((a, b) => b.score - a.score),
      question: q && room.phase !== 'lobby' ? { text: q.text, options: q.options, category: q.category, number: room.questionIndex + 1, total: 10, glitch: GLITCHES[room.glitchOrder[room.questionIndex] || 'memory'] } : undefined,
      questionEndsAt: room.questionEndsAt,
      correctOption: room.phase === 'reveal' || room.phase === 'leaderboard' || room.phase === 'winner' ? q?.correct : undefined,
      currentQuestion: Math.max(0, room.questionIndex + 1),
      totalQuestions: 10,
      answerDistribution: room.phase === 'reveal' || room.phase === 'leaderboard' ? [0,1,2,3].map((i) => [...room.players.values()].filter((p) => p.answerOption === i).length) : undefined,
      fusionBonus: room.fusionBonus,
      artistId: room.artistId,
      impostorId: room.phase === 'reveal' || room.phase === 'leaderboard' ? room.impostorId : undefined,
      bossId: room.bossId,
      chainBank: room.chainBank
      ,world: room.world, crowdEnergy: room.crowdEnergy, bossHealth: room.bossHealth, duelistIds: room.duelistIds, cloneOption: room.phase==='reveal'?room.cloneOption:undefined,
      recap: room.phase==='winner' ? makeRecap(room) : undefined
    };
  }

  private emit(room: Room) { this.io.to(room.code).emit('room:state', this.view(room)); }

  create(socketId: string, nickname: string, avatar: string): JoinResult {
    const code = this.makeCode();
    const id = randomUUID();
    const player: Player = { id, socketId, nickname: cleanName(nickname), avatar, score: 0, connected: true, spectator: false, isHost: true, answered: false, streak: 0, maxStreak: 0, doubleDowns: 1, phaseShifts: 1, rewinds: 1 };
    const room: Room = { code, phase: 'lobby', players: new Map([[id, player]]), questions: [], questionIndex: -1, glitchOrder: makeGlitchOrder(), chainBank: 0, world:'cyber', crowdEnergy:0 };
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
    const player: Player = { id, socketId, nickname: cleanName(payload.nickname), avatar: payload.avatar, score: 0, connected: true, spectator: room.phase !== 'lobby', isHost: false, answered: false, streak: 0, maxStreak: 0, doubleDowns: 1, phaseShifts: 1, rewinds: 1 };
    room.players.set(id, player);
    return { ok: true, playerId: id, state: this.view(room) };
  }

  start(code: string, playerId: string): string | undefined {
    const room = this.rooms.get(code);
    const player = room?.players.get(playerId);
    if (!room || !player?.isHost) return 'Only the host can start.';
    if (room.phase !== 'lobby' && room.phase !== 'winner') return 'The game is already running.';
    room.questions = pickQuestions(10); room.questionIndex = -1; room.glitchOrder = makeGlitchOrder(); room.chainBank = 0; room.crowdEnergy=0; room.bossHealth=100;
    let missionIndex=0; for (const p of room.players.values()) { p.score = 0; p.streak = 0; p.maxStreak = 0; p.doubleDowns = 1; p.phaseShifts = 1; p.rewinds=1; p.activePower = undefined; p.spectator = false; p.mission=MISSIONS[missionIndex++%MISSIONS.length]; p.missionComplete=false; this.io.to(p.socketId).emit('secret:mission',{text:p.mission}); }
    this.nextQuestion(room);
  }

  answer(code: string, playerId: string, option: number): AnswerResult {
    const room = this.rooms.get(code); const player = room?.players.get(playerId);
    if (!room || !player) return { ok: false, error: 'Player not found.' };
    if (room.phase !== 'question' || !room.questionEndsAt) return { ok: false, error: 'Answers are closed.' };
    if (player.spectator) return { ok: false, error: 'Spectators join the next match.' };
    if (player.answered) return { ok: false, error: 'Answer already locked.' };
    if (!Number.isInteger(option) || option < 0 || option > 3) return { ok: false, error: 'Invalid answer.' };
    player.answered = true; player.answerOption = option;
    const mode = room.glitchOrder[room.questionIndex];
    if (mode === 'drawstorm' && player.id === room.artistId) return { ok: false, error: 'The artist draws; the arena guesses.' };
    const factuallyCorrect = room.questions[room.questionIndex].correct === option;
    const correct = mode === 'reverse' ? !factuallyCorrect : factuallyCorrect;
    player.answerCorrect = correct;
    player.fastestMs=Math.min(player.fastestMs??QUESTION_MS,QUESTION_MS-Math.max(0,room.questionEndsAt-Date.now())); player.lastAnswerOption=option;
    if (correct) { player.streak += 1; player.maxStreak = Math.max(player.maxStreak, player.streak); } else player.streak = 0;
    const base = Math.max(100, Math.round(100 + 900 * Math.max(0, room.questionEndsAt - Date.now()) / QUESTION_MS));
    const combo = 1 + Math.min(5, Math.max(0, player.streak - 1)) * .12;
    let points = correct ? Math.round(base * combo * (player.activePower === 'double' ? 2 : 1)) : player.activePower === 'double' ? -150 : 0;
    if (correct && mode === 'heist') {
      const leader = [...room.players.values()].filter((p)=>p.id!==player.id&&!p.spectator).sort((a,b)=>b.score-a.score)[0];
      const stolen = leader ? Math.min(150, Math.max(0, leader.score)) : 0; if (leader) leader.score -= stolen; points += stolen;
    }
    if (mode === 'chain') { if (correct) { points += room.chainBank; room.chainBank += 100; } else room.chainBank = 0; }
    if (mode === 'boss' && correct) { points = Math.round(points * (player.id === room.bossId ? 1.5 : 1.25)); if(player.id!==room.bossId)room.bossHealth=Math.max(0,(room.bossHealth??100)-25); }
    player.score += points;
    player.activePower = undefined;
    this.emit(room);
    return { ok: true, correct, points };
  }

  draw(code: string, playerId: string, stroke: DrawStroke) {
    const room = this.rooms.get(code); if (!room || room.phase !== 'question' || room.artistId !== playerId || room.glitchOrder[room.questionIndex] !== 'drawstorm') return;
    const safe: DrawStroke = { id: randomUUID(), from: clampPoint(stroke.from), to: clampPoint(stroke.to), color: ['#22d3ee','#a855f7','#f472b6','#facc15','#ffffff'].includes(stroke.color) ? stroke.color : '#22d3ee', size: Math.max(2,Math.min(14,Number(stroke.size)||5)) };
    this.io.to(code).emit('draw:stroke', safe);
  }

  usePower(code: string, playerId: string, power: 'double' | 'phase' | 'rewind') {
    const room = this.rooms.get(code); const player = room?.players.get(playerId);
    if (!room || !player) return { ok: false, error: 'Player not found.' };
    if (room.phase !== 'question' || player.spectator) return { ok: false, error: 'Power cards are locked.' };
    if (power==='rewind') { if(!player.answered||player.rewinds<1)return {ok:false,error:'Rewind needs a locked answer.'}; player.rewinds-=1; player.answered=false; player.answerOption=undefined; player.answerCorrect=undefined; player.activePower='rewind'; this.emit(room); return {ok:true}; }
    if (player.answered) return { ok:false,error:'Power cards are locked.' };
    if (player.activePower) return { ok: false, error: 'One power per question.' };
    if (power === 'double') {
      if (player.doubleDowns < 1) return { ok: false, error: 'Double Down already used.' };
      player.doubleDowns -= 1; player.activePower = 'double'; this.emit(room); return { ok: true };
    }
    if (player.phaseShifts < 1) return { ok: false, error: 'Phase Shift already used.' };
    player.phaseShifts -= 1; player.activePower = 'phase'; this.emit(room);
    const correct = room.questions[room.questionIndex].correct;
    const eliminated = [0,1,2,3].filter((i) => i !== correct).sort(() => Math.random() - .5).slice(0, 2);
    return { ok: true, eliminated };
  }

  react(code: string, playerId: string, emoji: string) {
    const room = this.rooms.get(code); const player = room?.players.get(playerId);
    if (!room || !player || !['🔥','🤯','😂','⚡','👀','💀'].includes(emoji)) return;
    if (player.lastReactionAt && Date.now() - player.lastReactionAt < 700) return;
    player.lastReactionAt = Date.now();
    room.crowdEnergy=Math.min(100,room.crowdEnergy+5); if(room.crowdEnergy===100){room.crowdEnergy=0; for(const p of room.players.values())if(!p.spectator)p.score+=50; this.emit(room);}
    this.io.to(code).emit('reaction:new', { id: randomUUID(), playerId, nickname: player.nickname, avatar: player.avatar, emoji });
  }

  setWorld(code:string,playerId:string,world:ArenaWorld){const room=this.rooms.get(code);const player=room?.players.get(playerId);if(!room||!player||!WORLDS.includes(world))return {ok:false,error:'World signal rejected.'};const leader=[...room.players.values()].filter(p=>!p.spectator).sort((a,b)=>b.score-a.score)[0];if(!player.isHost&&leader?.id!==playerId)return {ok:false,error:'Only the host or round leader controls reality.'};room.world=world;this.emit(room);return {ok:true};}

  haunt(code:string,playerId:string){const room=this.rooms.get(code);const player=room?.players.get(playerId);if(!room||!player?.spectator)return {ok:false,error:'Only ghosts can haunt the arena.'};room.crowdEnergy=Math.min(100,room.crowdEnergy+20);if(room.bossId)room.bossHealth=Math.max(0,(room.bossHealth??100)-5);this.emit(room);return {ok:true};}

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
    room.phase = 'question'; room.questionEndsAt = Date.now() + QUESTION_MS; room.fusionBonus = false; room.artistId = undefined; room.impostorId = undefined; room.bossId = undefined; room.duelistIds=undefined; room.cloneOption=undefined;
    const contenders = [...room.players.values()].filter((p)=>p.connected&&!p.spectator);
    if(room.questionIndex===4&&contenders.length>1)room.duelistIds=[...contenders].sort((a,b)=>b.score-a.score).slice(0,2).map(p=>p.id);
    if(room.questionIndex===7&&contenders.length)room.cloneOption=contenders[room.questionIndex%contenders.length].lastAnswerOption;
    contenders.forEach((p,i)=>p.team = i%2===0?'cyan':'pink');
    const mode = room.glitchOrder[room.questionIndex];
    let secretTarget: Player | undefined; let secretPayload: {kind:'artist'|'impostor';text:string} | undefined;
    if (mode === 'drawstorm' && contenders.length) {
      const artist = contenders[room.questionIndex % contenders.length]; room.artistId = artist.id;
      secretTarget=artist; secretPayload={ kind:'artist', text: room.questions[room.questionIndex].options[room.questions[room.questionIndex].correct] };
    }
    if (mode === 'impostor' && contenders.length>1) {
      const impostor = contenders[(room.questionIndex+1)%contenders.length]; room.impostorId = impostor.id;
      const decoy = room.questions[(room.questionIndex+1)%room.questions.length];
      secretTarget=impostor; secretPayload={ kind:'impostor', text: decoy.text };
    }
    if (mode === 'boss' && contenders.length) room.bossId = [...contenders].sort((a,b)=>b.score-a.score)[0].id;
    for (const p of room.players.values()) { p.answered = false; p.answerOption = undefined; p.answerCorrect = undefined; p.activePower = undefined; }
    this.emit(room);
    if(secretTarget&&secretPayload)this.io.to(secretTarget.socketId).emit('secret:prompt',secretPayload);
    room.timer = setTimeout(() => this.reveal(room), QUESTION_MS);
  }

  private reveal(room: Room) {
    const contenders = [...room.players.values()].filter((p) => p.connected && !p.spectator);
    const mode = room.glitchOrder[room.questionIndex];
    room.fusionBonus = contenders.length > 1 && contenders.filter((p)=>p.id!==room.artistId).every((p) => p.answerCorrect);
    if (room.fusionBonus) contenders.forEach((p) => p.score += 150);
    if (mode === 'drawstorm' && room.artistId) {
      const artist = room.players.get(room.artistId); const solved = contenders.filter((p)=>p.id!==room.artistId&&p.answerCorrect).length; if (artist) artist.score += solved*180;
    }
    if (mode === 'consensus' || mode === 'prediction') {
      const counts=[0,1,2,3].map((i)=>contenders.filter((p)=>p.answerOption===i).length); const majority=counts.indexOf(Math.max(...counts));
      contenders.forEach((p)=>{if(p.answerCorrect && ((mode==='consensus'&&p.answerOption!==majority)||(mode==='prediction'&&p.answerOption===majority)))p.score+=250;});
    }
    if (mode === 'fusion') {
      (['cyan','pink'] as const).forEach((team)=>{const members=contenders.filter((p)=>p.team===team); if(members.some((p)=>p.answerCorrect))members.forEach((p)=>p.score+=100);});
    }
    if (mode === 'boss' && room.bossId) {
      const boss=room.players.get(room.bossId); const rebels=contenders.filter((p)=>p.id!==room.bossId); if(boss&&!boss.answerCorrect&&rebels.some((p)=>p.answerCorrect))rebels.forEach((p)=>p.score+=300);
    }
    contenders.forEach((p)=>{const achieved=p.mission==='Build a 3-answer streak'?p.maxStreak>=3:p.mission==='Score more than 2,500 points'?p.score>=2500:p.mission==='Defeat the Final Boss'?mode==='boss'&&p.id!==room.bossId&&!!p.answerCorrect:p.mission==='Answer the finale correctly'?room.questionIndex===9&&!!p.answerCorrect:p.mission==='Finish in the top three'?false:(p.doubleDowns===0&&p.phaseShifts===0); if(achieved&&!p.missionComplete){p.missionComplete=true;p.score+=300;}});
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

function makeGlitchOrder(): GlitchId[] { const modes=(Object.keys(GLITCHES) as GlitchId[]).filter((m)=>m!=='boss').sort(()=>Math.random()-.5); return [...modes,'boss']; }
function clampPoint(point: [number,number]): [number,number] { return [Math.max(0,Math.min(1,Number(point?.[0])||0)),Math.max(0,Math.min(1,Number(point?.[1])||0))]; }
function makeRecap(room:Room){const players=[...room.players.values()].filter(p=>!p.spectator).sort((a,b)=>b.score-a.score); const fastest=[...players].sort((a,b)=>(a.fastestMs??Infinity)-(b.fastestMs??Infinity))[0]; const combo=[...players].sort((a,b)=>b.maxStreak-a.maxStreak)[0]; players.slice(0,3).forEach(p=>{if(p.mission==='Finish in the top three'&&!p.missionComplete){p.missionComplete=true;p.score+=300;}}); return {champion:players[0]?.nickname,fastest:fastest?.nickname,combo:combo?.nickname,world:room.world};}
