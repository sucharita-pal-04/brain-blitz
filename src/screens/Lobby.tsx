import { Copy, Crown, Play, Radio, Users } from 'lucide-react';
import type { RoomState } from '../../shared/types';

export function Lobby({ state, me, onStart }: { state: RoomState; me?: string; onStart:()=>void }) {
  const self = state.players.find((p)=>p.id===me);
  const copy = () => navigator.clipboard.writeText(state.code);
  return <div className="w-full max-w-4xl">
    <div className="mb-8 text-center"><div className="mb-3 text-xs font-bold tracking-[.35em] text-cyan">YOUR ARENA IS READY</div><h1 className="font-display text-3xl font-black sm:text-5xl">WAITING FOR PLAYERS</h1>
      <button onClick={copy} className="group mt-6 inline-flex items-center gap-4 rounded-2xl border border-neon/40 bg-neon/10 px-6 py-4 shadow-purple"><span className="text-xs tracking-widest text-white/40">ROOM CODE</span><strong className="font-display text-3xl tracking-[.25em] text-white">{state.code}</strong><Copy className="text-cyan transition group-hover:scale-110" size={18}/></button>
    </div>
    <div className="panel arena-panel overflow-hidden"><div className="flex items-center justify-between border-b border-white/10 p-5"><div className="flex items-center gap-2 font-display text-sm"><Users className="text-cyan" size={18}/> PLAYERS <span className="text-white/35">{state.players.length}/20</span></div><div className="flex items-center gap-2 text-xs text-emerald-300"><Radio size={14}/> LIVE LOBBY</div></div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">{state.players.map((p,i)=><div key={p.id} className="player-capsule flex items-center gap-3 p-3" style={{animationDelay:`${i*.08}s`}}><span className="avatar-orb text-3xl">{p.avatar}</span><div className="min-w-0 flex-1"><div className="truncate font-bold">{p.nickname}{p.id===me && <span className="ml-2 text-xs text-cyan">YOU</span>}</div><div className={`text-[10px] tracking-widest ${p.connected?'text-emerald-300':'text-rose-300'}`}>{p.connected?'NEURAL LINK READY':'RECONNECTING'}</div></div>{p.isHost&&<Crown className="text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,.8)]" size={18}/>}</div>)}</div>
    </div>
    <div className="mt-6 text-center">{self?.isHost ? <button className="primary-button px-10" onClick={onStart}><Play size={18} className="fill-current"/> START REALITY GLITCH</button> : <p className="animate-pulse text-sm text-white/45">The host will fracture reality…</p>}</div>
    <div className="mt-7 rounded-2xl border border-fuchsia-400/15 bg-fuchsia-400/[.05] p-4 text-center"><div className="font-display text-xs tracking-[.25em] text-fuchsia-300">REALITY GLITCH DECK LOADED</div><div className="mt-3 flex flex-wrap justify-center gap-2 text-lg"><span title="Drawstorm">✍️</span><span title="Consensus Trap">🧲</span><span title="Impostor Pulse">🕵️</span><span title="Prediction Market">📈</span><span title="Memory Corruption">🧠</span><span title="Answer Heist">💎</span><span title="Team Fusion">🔗</span><span title="Chain Reaction">⚛️</span><span title="Reverse Reality">↩️</span><span title="Final Boss">👑</span></div><p className="mt-2 text-xs text-white/35">Ten rounds. Ten different realities. No two matches unfold the same way.</p></div>
  </div>;
}
