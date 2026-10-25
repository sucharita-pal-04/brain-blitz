import { motion } from 'framer-motion';
import { ArrowRight, Users, Timer, Trophy, Gamepad2 } from 'lucide-react';

const AVATARS = ['🤖', '👾', '🧠', '🦊', '🐲', '🦄', '👽', '⚡'];
export function Home({ nickname, avatar, code, error, onNickname, onAvatar, onCode, onCreate, onJoin }: {
  nickname: string; avatar: string; code: string; error?: string; onNickname: (v:string)=>void; onAvatar:(v:string)=>void; onCode:(v:string)=>void; onCreate:()=>void; onJoin:()=>void;
}) {
  return <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="relative">
      <div className="hero-orbit hidden sm:block"><div className="orbit-ring orbit-a"/><div className="orbit-ring orbit-b"/><div className="orbit-brain">🧠</div><span>✍️</span><span>🕵️</span><span>👑</span></div>
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-hot/30 bg-hot/10 px-4 py-2 text-xs font-bold tracking-widest text-hot"><Gamepad2 size={15}/> LIVE MULTIPLAYER TRIVIA</div>
      <h1 className="hero-title font-display text-5xl font-black leading-[.95] sm:text-7xl"><span>OUTTHINK.</span><br/><span className="neon-text">OUTSPEED.</span><br/><span className="gradient-title">BREAK REALITY.</span></h1>
      <p className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">Ten questions. Ten seconds. Ten unstable realities—drawing, deception, memory, teams, heists, and one final boss.</p>
      <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/55">
        <span className="feature-pill"><Users size={15}/> Up to 20 players</span><span className="feature-pill"><Timer size={15}/> Reality Glitches</span><span className="feature-pill"><Trophy size={15}/> Social chaos</span>
      </div>
    </motion.div>
    <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }} className="panel form-panel p-5 sm:p-7">
      <div className="mb-5 text-xs font-bold tracking-[.25em] text-cyan">BUILD YOUR PLAYER</div>
      <label className="label">NICKNAME</label><input className="arcade-input" maxLength={18} placeholder="Enter your nickname" value={nickname} onChange={(e)=>onNickname(e.target.value)} />
      <label className="label mt-5">CHOOSE YOUR AVATAR</label>
      <div className="grid grid-cols-8 gap-2">{AVATARS.map((item)=><button key={item} onClick={()=>onAvatar(item)} className={`avatar-button ${avatar===item?'avatar-selected':''}`}>{item}</button>)}</div>
      <button className="primary-button mt-6 w-full" onClick={onCreate}>CREATE ROOM <ArrowRight size={18}/></button>
      <div className="my-5 flex items-center gap-3 text-[10px] tracking-widest text-white/25"><span className="h-px flex-1 bg-white/10"/>OR JOIN A ROOM<span className="h-px flex-1 bg-white/10"/></div>
      <div className="flex gap-2"><input aria-label="Room code" className="arcade-input font-display uppercase tracking-[.35em]" maxLength={6} placeholder="CODE" value={code} onChange={(e)=>onCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''))}/><button className="secondary-button shrink-0" onClick={onJoin}>JOIN</button></div>
      {error && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
    </motion.div>
  </div>;
}
