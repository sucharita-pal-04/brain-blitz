import { useCallback, useState } from 'react';

export function useSound() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem('brain-blitz-sound') !== 'off');
  const play = useCallback((kind: 'tap' | 'correct' | 'wrong' | 'win') => {
    if (!enabled) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
    const frequencies = { tap: 320, correct: 680, wrong: 140, win: 880 };
    osc.frequency.value = frequencies[kind]; osc.type = kind === 'wrong' ? 'sawtooth' : 'sine';
    gain.gain.setValueAtTime(.08, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .14);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .15);
  }, [enabled]);
  const toggle = () => setEnabled((current) => { localStorage.setItem('brain-blitz-sound', current ? 'off' : 'on'); return !current; });
  return { enabled, toggle, play };
}
