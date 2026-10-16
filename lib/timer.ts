import { z } from 'zod';

export type SharedTimer = {
 id:string; gameId:string; playerIds:string[]; date:string;
 phase:'running'|'paused'|'finished'; elapsedMs:number; anchorAt:number|null; version:number;
 turnMinutes?:number; turnStartedElapsedMs?:number;
};
const id=z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const startTimerSchema=z.object({gameId:id,playerIds:z.array(id).min(1).max(100).refine(ids=>new Set(ids).size===ids.length),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),turnMinutes:z.number().min(0.5).max(60).multipleOf(0.5).optional()});
export type TimerStart=z.infer<typeof startTimerSchema>;
export type TimerAction='pause'|'resume'|'finish'|'discard'|'next';
export function elapsed(timer:SharedTimer,now:number) {
 return timer.elapsedMs+(timer.phase==='running'&&timer.anchorAt!==null?Math.max(0,now-timer.anchorAt):0);
}
export function createTimer(input:TimerStart,id:string,now:number):SharedTimer {
 return {...input,id,phase:'running',elapsedMs:0,anchorAt:now,version:1,...(input.turnMinutes?{turnStartedElapsedMs:0}:{})};
}
export function transitionTimer(timer:SharedTimer,action:Exclude<TimerAction,'discard'>,now:number):SharedTimer {
 if(action==='next'){
  if(timer.phase!=='running'||!timer.turnMinutes)throw Error('진행 중인 턴 타이머에서만 다음 턴으로 넘어갈 수 있습니다.');
  return {...timer,turnStartedElapsedMs:elapsed(timer,now),version:timer.version+1};
 }
 if(action==='pause'&&timer.phase!=='running'||action==='resume'&&timer.phase!=='paused'||action==='finish'&&timer.phase==='finished') throw Error('타이머 상태가 변경되었습니다. 다시 확인해 주세요.');
 return {...timer,phase:action==='pause'?'paused':action==='resume'?'running':'finished',elapsedMs:elapsed(timer,now),anchorAt:action==='resume'?now:null,version:timer.version+1};
}
export function turnRemaining(timer:SharedTimer,now:number) {
 const duration=(timer.turnMinutes||0)*60000;
 return Math.max(0,Math.min(duration,duration-(elapsed(timer,now)-(timer.turnStartedElapsedMs||0))));
}
export function turnClock(remainingMs:number) {
 const seconds=Math.ceil(Math.max(0,remainingMs)/1000);
 return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
}
export function timerMinutes(timer:SharedTimer) {return Math.max(1,Math.ceil(timer.elapsedMs/60000));}
export function timerClock(timer:SharedTimer,now:number) {
 const seconds=Math.floor(elapsed(timer,now)/1000);
 return [Math.floor(seconds/3600),Math.floor(seconds/60)%60,seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}
