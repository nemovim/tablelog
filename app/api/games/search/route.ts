import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { catalog } from '@/lib/seed';
export const runtime='nodejs';
const list=(v:any):any[]=>v?Array.isArray(v)?v:[v]:[];
export async function GET(request:NextRequest) {
 const query=(request.nextUrl.searchParams.get('q')||'').trim().slice(0,100);
 const local=catalog.filter(g=>`${g.name} ${g.english}`.toLowerCase().replace(/\s/g,'').includes(query.toLowerCase().replace(/\s/g,'')));
 if(!query||!process.env.BGG_API_TOKEN) return NextResponse.json({games:local,source:'catalog',message:query?'기본 목록 검색 · BGG 전체 검색은 서버 토큰 설정 후 사용할 수 있어요.':undefined});
 try {
  const headers={Authorization:`Bearer ${process.env.BGG_API_TOKEN}`};
  const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:''});
  const search=await fetch(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query)}`,{headers,next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
  if(!search.ok||search.status===202) throw new Error('BGG unavailable');
  const ids=list(parser.parse(await search.text()).items?.item).slice(0,12).map(x=>Number(x.id)).filter(Number.isFinite);
  if(!ids.length) return NextResponse.json({games:local,source:'bgg'});
  const details=await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}`,{headers,next:{revalidate:86400},signal:AbortSignal.timeout(10000)});
  if(!details.ok||details.status===202) throw new Error('BGG unavailable');
  const games=list(parser.parse(await details.text()).items?.item).map((g,i)=>({id:`bgg-${g.id}`,bggId:Number(g.id),name:list(g.name).find(n=>n.type==='primary')?.value||'Unknown',english:list(g.name).find(n=>n.type==='primary')?.value||'',minPlayers:Math.max(1,Number(g.minplayers?.value)||1),maxPlayers:Math.max(1,Number(g.maxplayers?.value)||4),minutes:Math.max(1,Number(g.playingtime?.value)||30),color:catalog[i%catalog.length].color,motif:catalog[i%catalog.length].motif,scoring:Number(g.id)===291457?'coop':'high',...(typeof g.thumbnail==='string'&&g.thumbnail.startsWith('https://')?{image:g.thumbnail}:{})}));
  return NextResponse.json({games:[...local,...games.filter(g=>!local.some(l=>l.bggId===g.bggId))],source:'bgg'});
 } catch { return NextResponse.json({games:local,source:'catalog',message:'BGG에 연결하지 못했어요. 기본 목록에서 선택하거나 직접 등록해 주세요.'}); }
}
