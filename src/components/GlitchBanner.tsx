import { motion } from 'framer-motion';
import type { GlitchView } from '../../shared/types';
export function GlitchBanner({glitch}:{glitch:GlitchView}) { return <motion.div initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}} className="glitch-banner"><div className="text-3xl">{glitch.icon}</div><div><div className="font-display text-xs font-black tracking-[.22em] text-fuchsia-300">REALITY GLITCH // {glitch.name}</div><div className="mt-1 text-xs text-white/50">{glitch.instruction}</div></div></motion.div> }
