import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as client, type Socket as ClientSocket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import { createAppServer } from '../server/index.ts';
import type { JoinResult, RoomState } from '../shared/types.ts';

describe('Brain Blitz multiplayer', () => {
  let server: ReturnType<typeof createAppServer>; let url: string; const clients: ClientSocket[] = [];
  beforeEach(async () => { server = createAppServer(0); await server.listen(); url = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}`; });
  afterEach(() => { clients.forEach((s)=>s.disconnect()); clients.length=0; server.io.close(); server.httpServer.closeAllConnections(); });
  const connect = () => new Promise<ClientSocket>((resolve, reject) => { const s=client(url,{forceNew:true,timeout:1500}); clients.push(s); s.on('connect',()=>resolve(s)); s.on('connect_error', reject); });
  const emitAck = <T,>(s:ClientSocket,event:string,payload:unknown) => new Promise<T>((resolve,reject)=>{ const timer=setTimeout(()=>reject(new Error(`No acknowledgement for ${event}`)),1000); s.emit(event,payload,(value:T)=>{clearTimeout(timer);resolve(value);}); });

  it('creates a room, joins a second player, syncs questions, scores, and reconnects', async () => {
    const host=await connect(); const guest=await connect();
    const created=await emitAck<JoinResult>(host,'room:create',{nickname:'Nova',avatar:'🧠'});
    expect(created.ok).toBe(true); expect(created.state?.code).toMatch(/^[A-Z0-9]{6}$/);
    const joined=await emitAck<JoinResult>(guest,'room:join',{code:created.state!.code,nickname:'Pixel',avatar:'👾'});
    expect(joined.state?.players).toHaveLength(2);
    const questionPromise=new Promise<RoomState>((resolve)=>guest.on('room:state',(s:RoomState)=>{if(s.phase==='question')resolve(s);}));
    const started=await emitAck<{ok:boolean}>(host,'game:start',{code:created.state!.code,playerId:created.playerId});
    expect(started.ok).toBe(true); const question=await questionPromise; expect(question.question?.options).toHaveLength(4); expect(question.correctOption).toBeUndefined();
    const power=await emitAck<{ok:boolean}>(guest,'power:use',{code:created.state!.code,playerId:joined.playerId,power:'double'});
    expect(power.ok).toBe(true);
    const internal=server.games.rooms.get(created.state!.code)!; const correct=internal.questions[0].correct;
    const answered=await emitAck<{ok:boolean;correct:boolean;points:number}>(guest,'answer:submit',{code:created.state!.code,playerId:joined.playerId,option:correct});
    expect(answered.correct).toBe(true); expect(answered.points).toBeGreaterThanOrEqual(200);
    const reactionPromise=new Promise<{emoji:string;nickname:string}>((resolve)=>host.once('reaction:new',resolve));
    guest.emit('reaction:send',{code:created.state!.code,playerId:joined.playerId,emoji:'🤯'});
    expect(await reactionPromise).toMatchObject({emoji:'🤯',nickname:'Pixel'});
    guest.disconnect(); const reconnect=await connect();
    const restored=await emitAck<JoinResult>(reconnect,'room:join',{code:created.state!.code,nickname:'Pixel',avatar:'👾',playerId:joined.playerId});
    expect(restored.ok).toBe(true); expect(restored.state?.players.find(p=>p.id===joined.playerId)?.score).toBe(answered.points);
  });

  it('makes late joiners spectators and rejects their answers', async () => {
    const host=await connect(); const created=await emitAck<JoinResult>(host,'room:create',{nickname:'Host',avatar:'🤖'});
    await emitAck(host,'game:start',{code:created.state!.code,playerId:created.playerId});
    const late=await connect(); const joined=await emitAck<JoinResult>(late,'room:join',{code:created.state!.code,nickname:'Late',avatar:'👽'});
    expect(joined.state?.players.find(p=>p.id===joined.playerId)?.spectator).toBe(true);
    const answer=await emitAck<{ok:boolean;error:string}>(late,'answer:submit',{code:created.state!.code,playerId:joined.playerId,option:0});
    expect(answer.ok).toBe(false); expect(answer.error).toContain('Spectators');
  });
});
