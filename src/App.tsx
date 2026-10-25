import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AnswerResult, DrawStroke, JoinResult, PowerResult, ReactionEvent, RoomState } from '../shared/types';
import { ArcadeShell } from './components/ArcadeShell';
import { useSound } from './hooks/useSound';
import { clearSession, loadSession, saveSession } from './lib/session';
import { socket } from './lib/socket';
import { Home } from './screens/Home';
import { Lobby } from './screens/Lobby';
import { Quiz } from './screens/Quiz';
import { Leaderboard } from './screens/Leaderboard';
import { Winner } from './screens/Winner';
import { ReactionDock } from './components/ReactionDock';

export function App() {
  const saved = useMemo(loadSession, []);
  const [nickname, setNickname] = useState(saved?.nickname || '');
  const [avatar, setAvatar] = useState(saved?.avatar || '🤖');
  const [code, setCode] = useState(saved?.code || '');
  const [playerId, setPlayerId] = useState(saved?.playerId);
  const [state, setState] = useState<RoomState>();
  const [error, setError] = useState<string>();
  const [connected, setConnected] = useState(socket.connected);
  const [seconds, setSeconds] = useState(10);
  const [selected, setSelected] = useState<number>();
  const [result, setResult] = useState<AnswerResult>();
  const [eliminated, setEliminated] = useState<number[]>([]);
  const [reactions, setReactions] = useState<ReactionEvent[]>([]);
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [secret, setSecret] = useState<{kind:'artist'|'impostor';text:string}>();
  const { enabled: sound, toggle: toggleSound, play } = useSound();

  const enterRoom = useCallback((result: JoinResult, profile: {nickname:string;avatar:string}) => {
    if (!result.ok || !result.playerId || !result.state) { setError(result.error || 'Could not enter room.'); return; }
    setPlayerId(result.playerId); setState(result.state); setCode(result.state.code); setError(undefined);
    saveSession({ code: result.state.code, playerId: result.playerId, ...profile });
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setConnected(true); const current = loadSession();
      if (current) socket.emit('room:join', current, (response: JoinResult) => enterRoom(response, current));
    };
    const onState = (next: RoomState) => setState((previous) => {
      if (previous?.currentQuestion !== next.currentQuestion || previous?.phase !== next.phase) { setSelected(undefined); setResult(undefined); if (next.phase === 'question') {setEliminated([]);setStrokes([]);setSecret(undefined);} }
      return next;
    });
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect); socket.on('disconnect', onDisconnect); socket.on('room:state', onState);
    const onReaction = (reaction: ReactionEvent) => { setReactions((current)=>[...current.slice(-5),reaction]); window.setTimeout(()=>setReactions((current)=>current.filter((item)=>item.id!==reaction.id)),2400); };
    socket.on('reaction:new', onReaction);
    const onStroke = (stroke:DrawStroke) => setStrokes((current)=>[...current.slice(-1500),stroke]);
    const onSecret = (payload:{kind:'artist'|'impostor';text:string}) => setSecret(payload);
    socket.on('draw:stroke',onStroke); socket.on('secret:prompt',onSecret);
    if (socket.connected) onConnect();
    return () => { socket.off('connect', onConnect); socket.off('disconnect', onDisconnect); socket.off('room:state', onState); socket.off('reaction:new', onReaction); socket.off('draw:stroke',onStroke); socket.off('secret:prompt',onSecret); };
  }, [enterRoom]);

  useEffect(() => {
    if (!state?.questionEndsAt || state.phase !== 'question') { setSeconds(state?.phase === 'question' ? 10 : 0); return; }
    const update = () => setSeconds(Math.max(0, Math.ceil((state.questionEndsAt! - Date.now()) / 1000)));
    update(); const interval = window.setInterval(update, 100); return () => clearInterval(interval);
  }, [state?.questionEndsAt, state?.phase]);

  const validProfile = () => { if (!nickname.trim()) { setError('Pick a nickname before entering the arena.'); return false; } return true; };
  const create = () => { if (!validProfile()) return; play('tap'); socket.emit('room:create', {nickname,avatar}, (r:JoinResult)=>enterRoom(r,{nickname,avatar})); };
  const join = () => { if (!validProfile()) return; if (code.length!==6) {setError('Room codes are six characters.');return;} play('tap'); socket.emit('room:join',{code,nickname,avatar},(r:JoinResult)=>enterRoom(r,{nickname,avatar})); };
  const start = () => socket.emit('game:start',{code:state!.code,playerId},(r:{ok:boolean;error?:string})=>!r.ok&&setError(r.error));
  const answer = (option:number) => { setSelected(option); play('tap'); socket.emit('answer:submit',{code:state!.code,playerId,option},(r:AnswerResult)=>{setResult(r); play(r.correct?'correct':'wrong');}); };
  const usePower = (power:'double'|'phase') => socket.emit('power:use',{code:state!.code,playerId,power},(r:PowerResult)=>{if(!r.ok)setError(r.error);else{setEliminated(r.eliminated||[]);play('tap');}});
  const react = (emoji:string) => state && socket.emit('reaction:send',{code:state.code,playerId,emoji});
  const draw = (stroke:DrawStroke) => state && socket.emit('draw:send',{code:state.code,playerId,stroke});
  const home = () => { clearSession(); setState(undefined); setPlayerId(undefined); setCode(''); setResult(undefined); setSelected(undefined); };

  let content = <Home {...{nickname,avatar,code,error}} onNickname={setNickname} onAvatar={setAvatar} onCode={setCode} onCreate={create} onJoin={join}/>;
  if (state?.phase === 'lobby') content = <Lobby state={state} me={playerId} onStart={start}/>;
  if (state?.phase === 'question' || state?.phase === 'reveal') content = <Quiz state={state} me={playerId} seconds={seconds} selected={selected} result={result} eliminated={eliminated} strokes={strokes} secret={secret} onDraw={draw} onPower={usePower} onAnswer={answer}/>;
  if (state?.phase === 'leaderboard') content = <Leaderboard state={state} me={playerId}/>;
  if (state?.phase === 'winner') content = <Winner state={state} me={playerId} onAgain={start} onHome={home}/>;
  return <ArcadeShell sound={sound} onSound={toggleSound} connected={connected} room={state?.code}>{content}{state && <ReactionDock reactions={reactions} onReact={react}/>}</ArcadeShell>;
}
