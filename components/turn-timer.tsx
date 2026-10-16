'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, Pause, Play, Minimize2, Maximize2 } from 'lucide-react';
import { turnRemaining, turnClock, timerClock, type SharedTimer } from '@/lib/timer';

export default function TurnTimer({timer,now,busy,onNext,onPause}:{timer:SharedTimer;now:number;busy:boolean;onNext:()=>void;onPause:()=>void}) {
 const [sound,setSound]=useState(false),[audioError,setAudioError]=useState('');
 const [expanded,setExpanded]=useState(true);
 const surface=useRef<HTMLElement>(null);
 useEffect(()=>{if(!expanded)return;const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';surface.current?.focus();return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[expanded]);
 const audio=useRef<AudioContext|null>(null);
 const sounded=useRef({turn:'',warning:false,expired:false});
 const remaining=turnRemaining(timer,now),paused=timer.phase==='paused';
 const warning=remaining>0&&remaining<=10000,expired=remaining===0;
 function beep(end=false){const ctx=audio.current;if(!ctx||ctx.state!=='running')return;
  const count=end?3:1;
  for(let i=0;i<count;i++){const oscillator=ctx.createOscillator(),gain=ctx.createGain();const at=ctx.currentTime+i*.22;
   oscillator.type='sine';oscillator.frequency.value=end?660:880;
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.12,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.17);
   oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start(at);oscillator.stop(at+.18);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
 }
 async function toggleSound(){if(sound){setSound(false);return;}try{const ctx=audio.current||new AudioContext();audio.current=ctx;await ctx.resume();if(ctx.state!=='running')throw Error();setSound(true);setAudioError('');beep();}catch{setAudioError('소리를 켤 수 없습니다. 화면 알림을 확인해 주세요.');}}
 useEffect(()=>()=>{void audio.current?.close();},[]);
 useEffect(()=>{
  const turn=`${timer.id}:${timer.turnStartedElapsedMs||0}`;
  if(sounded.current.turn!==turn)sounded.current={turn,warning:false,expired:false};
  if(paused||document.visibilityState!=='visible')return;
  if(expired&&!sounded.current.expired){sounded.current.expired=true;sounded.current.warning=true;if(sound)beep(true);}
  else if(warning&&!sounded.current.warning){sounded.current.warning=true;if(sound)beep();}
 },[timer.id,timer.turnStartedElapsedMs,paused,warning,expired,sound]);
 const status=paused?'일시정지':expired?'시간 종료 · 터치해서 다음 턴':warning?'10초 이하 남았어요':'터치하면 다음 턴이 시작됩니다';
 return <section ref={surface} tabIndex={-1} role={expanded?'dialog':'region'} aria-modal={expanded?true:undefined} onKeyDown={e=>{if(!expanded)return;if(e.key==='Escape'){e.stopPropagation();setExpanded(false);}if(e.key==='Tab'){const nodes=surface.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===surface.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===surface.current)){e.preventDefault();first.focus();}}}} className={`turn-timer ${expanded?'turn-fullscreen':''} ${paused?'is-paused':expired?'is-expired':warning?'is-warning':''}`} aria-label="턴 타이머">
  <div className="turn-heading"><span><strong>전체 {timerClock(timer,now)}</strong><small>턴 제한 {timer.turnMinutes}분</small></span><div className="turn-controls"><button className="secondary" disabled={busy} onClick={onPause}>{paused?<Play size={16}/>:<Pause size={16}/>} {paused?'계속':'일시정지'}</button><button className="secondary" aria-label={sound?'소리 끄기':'소리 켜기'} aria-pressed={sound} onClick={()=>void toggleSound()}>{sound?<Volume2 size={18}/>:<VolumeX size={18}/>}</button><button className="secondary" aria-label={expanded?'스코어보드로 돌아가기':'턴 타이머 크게 보기'} title={expanded?'스코어보드로 돌아가기 · 타이머는 계속됩니다':'턴 타이머 크게 보기'} onClick={()=>setExpanded(!expanded)}>{expanded?<Minimize2 size={18}/>:<Maximize2 size={18}/>}</button></div></div>
  <button className="turn-pad" disabled={busy||paused} onClick={onNext} aria-label="다음 턴 · 제한 시간 다시 시작">
   <span className="turn-digits" aria-live="off" aria-label={turnClock(remaining)}>{[...turnClock(remaining)].map((digit,index)=><span key={index} aria-hidden="true">{digit}</span>)}</span>
   <span className="turn-details"><span className="turn-status" role="status">{status}</span>
   <span className="turn-next">다음 턴 <ArrowRight size={18}/></span></span>
   <span className="turn-progress" aria-hidden="true"><span style={{width:`${remaining/((timer.turnMinutes||1)*60000)*100}%`}}/></span>
  </button>
  <p className="turn-note">{paused?'전체 시간과 턴 시간이 함께 멈춰 있습니다.':'턴을 넘겨도 전체 플레이 시간은 계속 누적됩니다.'} 알림은 이 화면을 열어 둔 상태에서 확인해 주세요.</p>
  {audioError&&<p className="form-error" role="alert">{audioError}</p>}
 </section>;
}
