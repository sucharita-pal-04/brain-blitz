import { AnimatePresence, motion } from 'framer-motion';
import type { ReactionEvent } from '../../shared/types';

const EMOJIS = ['🔥','🤯','😂','⚡','👀','💀'];
export function ReactionDock({ reactions, onReact }: { reactions: ReactionEvent[]; onReact: (emoji:string)=>void }) {
  return <><div className="fixed bottom-16 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-full border border-white/10 bg-[#0c0818]/90 p-1.5 shadow-purple backdrop-blur-xl">{EMOJIS.map((emoji)=><button key={emoji} onClick={()=>onReact(emoji)} className="grid h-9 w-9 place-items-center rounded-full text-lg transition hover:-translate-y-1 hover:bg-white/10">{emoji}</button>)}</div>
  <div className="pointer-events-none fixed inset-x-0 bottom-28 z-20 mx-auto h-64 max-w-4xl overflow-hidden"><AnimatePresence>{reactions.map((r,i)=><motion.div key={r.id} initial={{opacity:0,y:120,x:`${15+(i*17)%70}%`,scale:.5}} animate={{opacity:1,y:0,scale:1.15}} exit={{opacity:0,y:-80}} transition={{duration:2.4}} className="absolute bottom-0 text-center"><div className="text-4xl drop-shadow-[0_0_12px_rgba(34,211,238,.8)]">{r.emoji}</div><div className="rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white/60">{r.nickname}</div></motion.div>)}</AnimatePresence></div></>;
}
