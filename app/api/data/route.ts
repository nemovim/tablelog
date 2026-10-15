import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
 if(!process.env.MONGODB_URI) return NextResponse.json({mode:'demo'});
 try { const database = await db(); const [games,players,plays] = await Promise.all(['games','players','plays'].map(c=>database.collection(c).find({},{projection:{_id:0}}).toArray())); return NextResponse.json({mode:'mongo',data:{games,players,plays}},{headers:{'Cache-Control':'no-store'}}); }
 catch { return NextResponse.json({error:'데이터베이스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:503}); }
}
