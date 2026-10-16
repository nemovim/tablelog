import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createTimer, startTimerSchema, transitionTimer, type SharedTimer } from '@/lib/timer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type TimerDoc=SharedTimer & {_id:string};
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'no-store'}});
async function current() {
 const database=await db(),store=database.collection<TimerDoc>('timers');
 const found=await store.findOne({_id:'shared'});
 // Saving a play and cleaning up are retry-safe without a multi-document transaction.
 if(found&&await database.collection('plays').findOne({id:found.id},{projection:{_id:1}})){
  await store.deleteOne({_id:'shared',id:found.id,version:found.version});
  return {database,store,timer:null};
 }
 if(!found)return {database,store,timer:null};
 const {_id,...timer}=found;
 return {database,store,timer};
}
export async function GET() {
 if(!process.env.MONGODB_URI)return json({mode:'demo',timer:null,now:Date.now()});
 try {const {timer}=await current();return json({timer,now:Date.now()});}
 catch{return json({error:'타이머를 불러오지 못했습니다.'},503);}
}
export async function POST(request:NextRequest) {
 if(request.headers.get('origin')&&request.headers.get('origin')!==request.nextUrl.origin)return json({error:'허용되지 않은 요청입니다.'},403);
 if(!process.env.MONGODB_URI)return json({error:'데모 타이머는 브라우저에 저장됩니다.'},503);
 try {
  const raw=await request.text();if(raw.length>16000)return json({error:'요청이 너무 큽니다.'},413);
  const body=JSON.parse(raw);if(!body||typeof body!=='object')return json({error:'잘못된 요청입니다.'},400);
  const {database,store,timer}=await current();const now=Date.now();
  if(body.action==='start') {
   const parsed=startTimerSchema.safeParse(body.input);if(!parsed.success)return json({error:'게임과 참가자를 선택해 주세요.'},400);
   if(timer)return json({error:'진행 중이거나 저장 대기 중인 타이머가 있습니다.'},409);
   const input=parsed.data;
   const [game,count]=await Promise.all([database.collection('games').findOne({id:input.gameId}),database.collection('players').countDocuments({id:{$in:input.playerIds}})]);
   if(!game||count!==input.playerIds.length)return json({error:'게임 또는 참가자를 찾을 수 없습니다. 새로고침해 주세요.'},400);
   const next=createTimer(input,`timer-${crypto.randomUUID()}`,now);
   await store.insertOne({...next,_id:'shared'});
   return json({timer:next,now},201);
  }
  if(!['pause','resume','finish','discard','next'].includes(body.action))return json({error:'잘못된 작업입니다.'},400);
  if(!timer||body.id!==timer.id||body.version!==timer.version)return json({error:'다른 사람이 타이머를 변경했습니다. 최신 상태를 확인해 주세요.'},409);
  const filter={_id:'shared',id:timer.id,version:timer.version};
  if(body.action==='discard') {
   if(timer.phase!=='finished')return json({error:'종료한 타이머만 삭제할 수 있습니다.'},400);
   const result=await store.deleteOne(filter);
   if(!result.deletedCount)return json({error:'타이머 상태가 변경되었습니다.'},409);
   return json({timer:null,now});
  }
  let next:SharedTimer;
  try{next=transitionTimer(timer,body.action,now);}catch(e){return json({error:(e as Error).message},409);}
  const result=await store.replaceOne(filter,{...next});
  if(!result.matchedCount)return json({error:'타이머 상태가 변경되었습니다.'},409);
  return json({timer:next,now});
 }catch(error){
  if(error instanceof SyntaxError)return json({error:'잘못된 요청입니다.'},400);
  if(typeof error==='object'&&error&&'code' in error&&error.code===11000)return json({error:'다른 사람이 먼저 타이머를 시작했습니다.'},409);
  return json({error:'타이머를 변경하지 못했습니다. 연결을 확인해 주세요.'},503);
 }
}
