import { motion } from 'framer-motion';
import { Eye, LockKeyhole } from 'lucide-react';
import type { AnswerResult, RoomState } from '../../shared/types';

const letters = ['A','B','C','D'];
export function Quiz({ state, me, seconds, selected, result, onAnswer }: { state:RoomState; me?:string; seconds:number; selected?:number; result?:AnswerResult; onAnswer:(i:number)=>void }) {
  const self=state.players.find((p)=>p.id===me); const reveal=state.phase==='reveal';
  if (!state.question) return null;
  return <div className="w-full max-w-4xl">
    <div className="mb-5 flex items-center justify-between"><div><div className="text-[10px] tracking-[.3em] text-white/35">QUESTION {state.question.number} / {state.question.total}</div><div className="mt-1 text-xs font-bold tracking-widest text-cyan">{state.question.category}</div></div><div className={`timer ${seconds<=3?'timer-danger':''}`}>{seconds}</div></div>
    <div className="mb-7 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-neon to-cyan transition-all duration-200" style={{width:`${seconds*10}%`}}/></div>
    <motion.h1 key={state.question.text} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className="mb-8 text-center font-display text-2xl font-bold leading-snug sm:text-4xl">{state.question.text}</motion.h1>
    {self?.spectator && <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan"><Eye size={17}/> Spectating — you’ll play in the next match.</div>}
    <div className="grid gap-3 sm:grid-cols-2">{state.question.options.map((option,i)=>{
      const correct=reveal&&state.correctOption===i; const wrong=reveal&&selected===i&&!correct;
      return <motion.button whileHover={!selected&&!self?.spectator?{scale:1.015}:undefined} whileTap={!selected?{scale:.98}:undefined} disabled={selected!==undefined||self?.spectator||reveal} onClick={()=>onAnswer(i)} key={option} className={`answer ${selected===i?'answer-selected':''} ${correct?'answer-correct':''} ${wrong?'answer-wrong':''}`}><span className="answer-letter">{letters[i]}</span><span>{option}</span>{selected===i&&!reveal&&<LockKeyhole className="ml-auto text-cyan" size={17}/>}</motion.button>})}</div>
    {result && <motion.div initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} className={`mx-auto mt-6 w-fit rounded-full border px-5 py-2 text-sm font-bold ${result.correct?'border-emerald-400/30 bg-emerald-400/10 text-emerald-300':'border-rose-400/30 bg-rose-400/10 text-rose-300'}`}>{result.correct?`+${result.points} POINTS — NICE!`:'NOT THIS TIME — KEEP BLITZING!'}</motion.div>}
  </div>;
}
