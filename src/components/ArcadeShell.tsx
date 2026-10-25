import type { ReactNode } from 'react';
import { Volume2, VolumeX, Wifi } from 'lucide-react';
import { Logo } from './Logo';

export function ArcadeShell({ children, sound, onSound, connected = true, room }: { children: ReactNode; sound: boolean; onSound: () => void; connected?: boolean; room?: string }) {
  return <main className="min-h-screen overflow-hidden bg-ink text-white">
    <div className="fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(124,58,237,.24),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(34,211,238,.15),transparent_35%)]" />
    <div className="grid-floor fixed inset-x-0 bottom-0 h-1/2 opacity-30" />
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-8">
      <header className="flex items-center justify-between"><Logo /><div className="flex items-center gap-2">
        {room && <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 font-display text-xs tracking-widest text-white/60 sm:block">ROOM {room}</span>}
        <span className={`flex items-center gap-1 rounded-full px-3 py-2 text-[10px] font-bold ${connected ? 'text-emerald-300' : 'text-rose-300'}`}><Wifi size={13}/>{connected ? 'LIVE' : 'RECONNECTING'}</span>
        <button aria-label="Toggle sound" className="icon-button" onClick={onSound}>{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
      </div></header>
      <section className="flex flex-1 items-center justify-center py-8">{children}</section>
      <footer className="text-center text-[10px] tracking-[.3em] text-white/25">REAL-TIME NEURAL SHOWDOWN • NO LOGIN REQUIRED</footer>
    </div>
  </main>;
}
