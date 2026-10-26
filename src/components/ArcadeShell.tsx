import type { ReactNode } from 'react';
import { Volume2, VolumeX, Wifi } from 'lucide-react';
import { Logo } from './Logo';
import { WorldBackdrop } from './WorldBackdrop';

export function ArcadeShell({ children, sound, onSound, connected = true, room, scene = 'home', world = 'cyber' }: { children: ReactNode; sound: boolean; onSound: () => void; connected?: boolean; room?: string; scene?: string; world?: string }) {
  return <main className="min-h-screen overflow-hidden bg-ink text-white">
    <WorldBackdrop scene={scene} world={world}/>
    <div className="grid-floor fixed inset-x-0 bottom-0 h-1/2 opacity-30" />
    <div className="world-3d relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-8">
      <header className="hud-header flex items-center justify-between"><Logo /><div className="flex items-center gap-2">
        {room && <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-2 font-display text-xs tracking-widest text-white/60 sm:block">ROOM {room}</span>}
        <span className={`flex items-center gap-1 rounded-full px-3 py-2 text-[10px] font-bold ${connected ? 'text-emerald-300' : 'text-rose-300'}`}><Wifi size={13}/>{connected ? 'LIVE' : 'RECONNECTING'}</span>
        <button aria-label="Toggle sound" className="icon-button" onClick={onSound}>{sound ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
      </div></header>
      <section className="flex flex-1 items-center justify-center py-8">{children}</section>
      <footer className="hud-footer text-center text-[10px] tracking-[.3em] text-white/25"><span>◈</span> REAL-TIME NEURAL SHOWDOWN <span>◈</span> NO LOGIN REQUIRED <span>◈</span></footer>
    </div>
  </main>;
}
