import { Zap } from 'lucide-react';
export function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3">
    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan/40 bg-cyan/10 shadow-neon"><Zap className="fill-cyan text-cyan" /></span>
    {!compact && <div><div className="font-display text-xl font-black tracking-wider text-white">BRAIN <span className="text-cyan">BLITZ</span></div><div className="text-[9px] tracking-[.35em] text-white/40">THINK FAST. SCORE BIG.</div></div>}
  </div>;
}
