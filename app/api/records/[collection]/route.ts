import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gameSchema, playerSchema, playSchema, validatePlayForGame } from '@/lib/validation';
export const runtime='nodejs';
export async function POST(request: NextRequest, {params}:{params:Promise<{collection:string}>}) {
 if(request.headers.get('origin') && request.headers.get('origin')!==request.nextUrl.origin) return NextResponse.json({error:'허용되지 않은 요청입니다.'},{status:403});
 if(!process.env.MONGODB_URI) return NextResponse.json({error:'데모 모드에서는 브라우저에 저장됩니다.'},{status:503});
 const {collection}=await params;
 if(!['games','players','plays'].includes(collection)) return NextResponse.json({error:'잘못된 경로입니다.'},{status:404});
 try {
  const raw = await request.text(); if(raw.length>30000) return NextResponse.json({error:'기록이 너무 큽니다.'},{status:413});
  const body=JSON.parse(raw); const database=await db(); const store=database.collection(collection);
  if(body.action==='delete') {
   if(collection!=='plays'||typeof body.id!=='string'||!Number.isInteger(body.version)) return NextResponse.json({error:'삭제 요청을 확인해 주세요.'},{status:400});
   const result=await store.deleteOne({_id:body.id,version:body.version} as never);
   if(!result.deletedCount) return NextResponse.json({error:'다른 사람이 수정한 기록입니다. 새로고침 후 다시 시도해 주세요.'},{status:409});
   return NextResponse.json({ok:true});
  }
  const schema=collection==='games'?gameSchema:collection==='players'?playerSchema:playSchema;
  const parsed=schema.safeParse(body.record);
  if(!parsed.success) return NextResponse.json({error:'입력값을 확인해 주세요.',details:parsed.error.flatten()},{status:400});
  const record=collection==='plays'&&body.action==='create'?{...parsed.data,createdAt:new Date().toISOString()}:parsed.data;
  if(collection==='plays') {
   const play=playSchema.parse(record);
   const [game,playerCount]=await Promise.all([database.collection('games').findOne({id:play.gameId}),database.collection('players').countDocuments({id:{$in:play.scores.map(s=>s.playerId)}})]);
   if(!game||playerCount!==play.scores.length) return NextResponse.json({error:'게임이나 플레이어를 찾을 수 없습니다. 새로고침해 주세요.'},{status:400});
   const gameRule=gameSchema.safeParse(game);
   if(!gameRule.success) return NextResponse.json({error:'게임 설정을 확인해 주세요.'},{status:400});
   const validationError=validatePlayForGame(play,gameRule.data);
   if(validationError) return NextResponse.json({error:validationError},{status:400});
   if(body.action==='create'&&play.id.startsWith('timer-')) {
    const timer=await database.collection('timers').findOne({id:play.id,phase:'finished'});
    if(!timer||timer.gameId!==play.gameId)return NextResponse.json({error:'타이머가 변경되었거나 이미 저장되었습니다. 새로고침해 주세요.'},{status:409});
   }
   if(body.action==='update') {
    const existing=await store.findOne({_id:play.id,version:play.version} as never);
    delete play.createdAt;
    if(typeof existing?.createdAt==='string')play.createdAt=existing.createdAt;
    const result=await store.replaceOne({_id:play.id,version:play.version} as never,{...play,_id:play.id,version:play.version+1} as never);
    if(!result.matchedCount) return NextResponse.json({error:'다른 사람이 수정한 기록입니다. 새로고침 후 다시 시도해 주세요.'},{status:409});
    return NextResponse.json({record:{...play,version:play.version+1}});
   }
  }
  if(body.action!=='create') return NextResponse.json({error:'지원하지 않는 작업입니다.'},{status:400});
  await store.insertOne({...record,_id:record.id} as never);
  return NextResponse.json({record},{status:201});
 } catch(error) {
  if(error instanceof SyntaxError) return NextResponse.json({error:'잘못된 요청입니다.'},{status:400});
  if(typeof error==='object'&&error&&'code' in error&&error.code===11000) return NextResponse.json({error:'이미 등록되어 있습니다. 새로고침해 주세요.'},{status:409});
  return NextResponse.json({error:'저장하지 못했습니다. 연결을 확인하고 다시 시도해 주세요.'},{status:503});
 }
}
