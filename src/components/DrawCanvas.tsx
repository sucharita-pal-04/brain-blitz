import { useEffect, useRef, useState } from 'react';
import type { DrawStroke } from '../../shared/types';

const COLORS=['#22d3ee','#a855f7','#f472b6','#facc15','#ffffff'];
export function DrawCanvas({ strokes, canDraw, onStroke }: { strokes:DrawStroke[]; canDraw:boolean; onStroke:(stroke:DrawStroke)=>void }) {
  const canvas=useRef<HTMLCanvasElement>(null); const previous=useRef<[number,number]|undefined>(undefined); const [color,setColor]=useState(COLORS[0]);
  useEffect(()=>{const el=canvas.current;if(!el)return;const ctx=el.getContext('2d')!;ctx.clearRect(0,0,el.width,el.height);ctx.lineCap='round';for(const s of strokes){ctx.strokeStyle=s.color;ctx.lineWidth=s.size;ctx.beginPath();ctx.moveTo(s.from[0]*el.width,s.from[1]*el.height);ctx.lineTo(s.to[0]*el.width,s.to[1]*el.height);ctx.stroke();}},[strokes]);
  const point=(e:React.PointerEvent<HTMLCanvasElement>):[number,number]=>{const r=e.currentTarget.getBoundingClientRect();return[(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]};
  return <div className="draw-shell"><canvas ref={canvas} width={900} height={360} className={`h-48 w-full touch-none rounded-2xl bg-[#080511] sm:h-56 ${canDraw?'cursor-crosshair':''}`} onPointerDown={(e)=>{if(!canDraw)return;e.currentTarget.setPointerCapture(e.pointerId);previous.current=point(e)}} onPointerMove={(e)=>{if(!canDraw||!previous.current||!e.currentTarget.hasPointerCapture(e.pointerId))return;const next=point(e);onStroke({id:'local',from:previous.current,to:next,color,size:6});previous.current=next}} onPointerUp={()=>previous.current=undefined}/>{canDraw&&<div className="mt-2 flex justify-center gap-2">{COLORS.map((item)=><button aria-label={`Ink ${item}`} key={item} onClick={()=>setColor(item)} className={`h-6 w-6 rounded-full border-2 ${color===item?'border-white scale-110':'border-transparent'}`} style={{background:item}}/>)}</div>}</div>;
}
