import { motion } from 'framer-motion';
import { Eye, LockKeyhole, Sparkles, Zap } from 'lucide-react';
import type { AnswerResult, RoomState } from '../../shared/types';

const letters = ['A','B','C','D'];
export function Quiz({ state, me, seconds, selected, result, eliminated, onPower, onAnswer }: { state:RoomState; me?:string; seconds:number; selected?:number; result?:AnswerResult; eliminated:number[]; onPower:(p:'double'|'phase')=>void; onAnswer:(i:number)=>void }) {
  const self=state.players.find((p)=>p.id===me); const reveal=state.phase==='reveal';
  if (!state.question) return null;
  return <div className="w-full max-w-4xl">
    <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] tracking-[.3em] text-white/35">QUESTION {state.question.number} / {state.question.total}</div><div className="mt-1 flex items-center gap-3 text-xs font-bold tracking-widest text-cyan"><span>{state.question.category}</span>{self && self.streak>1 && <span className="rounded-full bg-orange-400/10 px-2 py-1 text-orange-300">🔥 {self.streak} COMBO</span>}</div></div><div className={`timer ${seconds<=3?'timer-danger':''}`}>{seconds}</div></div>
    <div className="mb-7 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-neon to-cyan transition-all duration-200" style={{width:`${seconds*10}%`}}/></div>
    <motion.h1 key={state.question.text} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="mb-8 text-center font-display text-2xl font-bold leading-snug sm:text-4xl">{state.question.text}</motion.h1>
    {self?.spectator && <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan"><Eye size={17}/> Spectating — you’ll play in the next match.</div>}
    {!reveal && !self?.spectator && <div className="mb-5 flex flex-wrap justify-center gap-2"><button disabled={!!self?.activePower||self?.doubleDowns===0||selected!==undefined} onClick={()=>onPower('double')} className={`power-card ${self?.activePower==='double'?'power-active':''}`}><Zap size={15}/> DOUBLE DOWN <span>{self?.doubleDowns||0}</span><small>2× score · −150 if wrong</small></button><button disabled={!!self?.activePower||self?.phaseShifts===0||selected!==undefined} onClick={()=>onPower('phase')} className={`power-card ${self?.activePower==='phase'?'power-active':''}`}><Sparkles size={15}/> PHASE SHIFT <span>{self?.phaseShifts||0}</span><small>erase 2 wrong answers</small></button></div>}
    <div className="grid gap-3 sm:grid-cols-2">{state.question.options.map((option,i)=>{
      const correct=reveal&&state.correctOption===i; const wrong=reveal&&selected===i&&!correct;
      const phased=eliminated.includes(i);
      return <motion.button animate={phased?{opacity:.16,scale:.96}:undefined} whileHover={!selected&&!self?.spectator&&!phased?{scale:1.015}:undefined} whileTap={!selected?{scale:.98}:undefined} disabled={selected!==undefined||self?.spectator||reveal||phased} onClick={()=>onAnswer(i)} key={option} className={`answer ${selected===i?'answer-selected':''} ${correct?'answer-correct':''} ${wrong?'answer-wrong':''}`}><span className="answer-letter">{letters[i]}</span><span>{phased?'PHASED OUT':option}</span>{selected===i&&!reveal&&<LockKeyhole className="ml-auto text-cyan" size={17}/>}</motion.button>})}</div>
    {reveal && state.answerDistribution && <div className="mt-5 grid grid-cols-4 gap-2">{state.answerDistribution.map((count,i)=><div key={i} className="rounded-xl border border-white/10 bg-white/[.03] p-2 text-center"><div className="mb-1 text-[9px] tracking-widest text-white/35">PULSE {letters[i]}</div><div className="font-display text-lg text-cyan">{count}</div></div>)}</div>}
    {reveal && state.fusionBonus && <motion.div initial={{scale:.6,opacity:0}} animate={{scale:1,opacity:1}} className="mx-auto mt-4 w-fit rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-5 py-2 font-display text-sm text-fuchsia-300 shadow-purple">⚡ MIND FUSION! EVERYONE CORRECT +150</motion.div>}
    {result && <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} className={`mx-auto mt-6 w-fit rounded-full border px-5 py-2 text-sm font-bold ${result.correct?'border-emerald-400/30 bg-emerald-400/10 text-emerald-300':'border-rose-400/30 bg-rose-400/10 text-rose-300'}`}>{result.correct?`+${result.points} POINTS — NICE!`:'NOT THIS TIME — KEEP BLITZING!'}</motion.div>}
  </div>;
}
