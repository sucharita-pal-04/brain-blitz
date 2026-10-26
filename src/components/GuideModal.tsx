import { useEffect } from 'react';
import { BookOpen, Crown, Ghost, Sparkles, Timer, Users, X, Zap } from 'lucide-react';

type GuideModalProps = { open: boolean; onClose: () => void };

const steps = [
  { icon: Users, title: 'Enter the arena', text: 'Create a room or join with its 6-character code. Invite up to 20 players—no login needed.' },
  { icon: Crown, title: 'The host launches', text: 'The room creator starts the match when the crew is ready. Late arrivals join as spectators.' },
  { icon: Timer, title: 'Think at light-speed', text: 'Answer 10 mixed-trivia questions. You get 10 seconds each, and faster correct answers earn more.' },
  { icon: Zap, title: 'Survive the glitches', text: 'Reality Glitches can scramble choices, trigger duels, add drawing rounds, or completely bend the rules.' },
];

const powers = [
  ['×2', 'Double Down', 'Risk it for a boosted score.'],
  ['◫', 'Phase Shift', 'Remove bad options from view.'],
  ['↶', 'Timeline Rewind', 'Take back an answer and try again.'],
];

export function GuideModal({ open, onClose }: GuideModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="guide-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <div className="guide-glow" />
      <header className="guide-heading">
        <div className="guide-emblem"><BookOpen size={24}/></div>
        <div><span className="guide-kicker">ARENA TRANSMISSION</span><h2 id="guide-title">How to Play</h2></div>
        <button className="icon-button guide-close" aria-label="Close guide" onClick={onClose}><X size={19}/></button>
      </header>

      <div className="guide-scroll">
        <p className="guide-intro">Outthink the room, bend reality, and become the last brilliant mind standing.</p>
        <div className="guide-grid">
          {steps.map(({ icon: Icon, title, text }, index) => <article className="guide-card" key={title}>
            <span className="guide-number">0{index + 1}</span><Icon size={22}/><div><h3>{title}</h3><p>{text}</p></div>
          </article>)}
        </div>

        <div className="guide-section-title"><Sparkles size={16}/><span>POWER CARDS</span></div>
        <div className="guide-powers">
          {powers.map(([symbol, title, text]) => <div className="guide-power" key={title}><b>{symbol}</b><span><strong>{title}</strong><small>{text}</small></span></div>)}
        </div>

        <div className="guide-tip">
          <Ghost size={25}/><div><strong>The arena remembers you.</strong><p>Complete secret missions, fuel Crowd Energy, switch reality worlds, haunt rivals as a ghost, and unite against the Final Boss.</p></div>
        </div>
      </div>

      <button className="primary-button guide-enter" onClick={onClose}>GOT IT — ENTER THE ARENA <Zap size={16}/></button>
    </section>
  </div>;
}
