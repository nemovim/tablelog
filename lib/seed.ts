import type { Data, Game, Play } from './types';
import { localDate } from './stats';
export const catalog: Game[] = [
 {id:'g-mars',name:'테라포밍 마스',english:'Terraforming Mars',bggId:167791,color:'#eed9ce',motif:'planet',scoring:'high'},
 {id:'g-dominion',name:'도미니언',english:'Dominion',bggId:36218,color:'#e9e1c9',motif:'crown',scoring:'high'},
 {id:'g-jaws',name:'글룸헤이븐: 사자의 턱',english:'Gloomhaven: Jaws of the Lion',bggId:291457,color:'#dfe2e9',motif:'sword',scoring:'coop'},
 {id:'g-burgundy',name:'버건디의 성',english:'The Castles of Burgundy',bggId:84876,color:'#e7dfcb',motif:'castle',scoring:'high'},
 {id:'g-white-castle',name:'백로성',english:'The White Castle',bggId:371942,color:'#e3e5db',motif:'pagoda',scoring:'high'},
 {id:'g-bang',name:'뱅',english:'BANG!',bggId:3955,color:'#edd9c5',motif:'sheriff',scoring:'high'},
 {id:'g-ark-nova',name:'아크노바',english:'Ark Nova',bggId:342942,color:'#dce7d5',motif:'paw',scoring:'high'},
 {id:'g-imperium-classics',name:'임페리움',english:'Imperium',bggId:318184,color:'#e7dccd',motif:'temple',scoring:'high'},
 {id:'g-wingspan',name:'윙스팬',english:'Wingspan',bggId:266192,minPlayers:1,maxPlayers:5,minutes:70,color:'#d8e5db',motif:'bird',scoring:'high'},
 {id:'g-azul',name:'아줄',english:'Azul',bggId:230802,minPlayers:2,maxPlayers:4,minutes:40,color:'#dbe7ef',motif:'tile',scoring:'high'},
 {id:'g-splendor',name:'스플렌더',english:'Splendor',bggId:148228,minPlayers:2,maxPlayers:4,minutes:30,color:'#e9e0f2',motif:'gem',scoring:'high'},
 {id:'g-catan',name:'카탄',english:'CATAN',bggId:13,minPlayers:3,maxPlayers:4,minutes:90,color:'#f2e4c9',motif:'hex',scoring:'high'},
 {id:'g-cascadia',name:'캐스캐디아',english:'Cascadia',bggId:295947,minPlayers:1,maxPlayers:4,minutes:45,color:'#dce7d5',motif:'mountain',scoring:'high'},
 {id:'g-ticket',name:'티켓 투 라이드',english:'Ticket to Ride',bggId:9209,minPlayers:2,maxPlayers:5,minutes:60,color:'#f1dbd1',motif:'train',scoring:'high'},
];
export function demoData(): Data {
 const players = [{id:'p1',name:'지민',color:'#dce7d9'},{id:'p2',name:'수현',color:'#e7dcf3'},{id:'p3',name:'민준',color:'#fae3ce'},{id:'p4',name:'서연',color:'#dbeaf5'}];
 const plays:Play[] = Array.from({length:18},(_,i) => {
  const game=catalog[i%3],d=new Date();d.setDate(d.getDate()-i*3);
  const base={id:`demo-v2-${i}`,gameId:game.id,date:localDate(d),duration:i===17?undefined:game.scoring==='coop'?90+(i%4)*15:game.id==='g-mars'?120+(i%4)*15:30+(i%4)*5,version:1};
  if(game.scoring==='coop')return {...base,scores:players.slice(0,3).map(p=>({playerId:p.id})),scenario:String(Math.max(1,6-Math.floor(i/3))),outcome:i===5?'failed':i===2?'paused':'cleared'};
  return {...base,scores:players.slice(0,i%4===0?3:4).map((p,j)=>({playerId:p.id,score:game.id==='g-mars'?65+(i*7+j*13)%50:20+(i*3+j*7)%35}))};
 });
 return {games:catalog.slice(0,3),players,plays};
}

// Keep the existing ID so records remain attached to the shared series entry.
export function normalizeCatalogNames(data: Data): Data {
 return {...data,games:data.games.map(game=>{ const preset=catalog.find(g=>g.id===game.id||(game.bggId!==undefined&&g.bggId===game.bggId)); const renamed=game.id==='g-imperium-classics'||game.bggId===318184?{...game,name:'임페리움',english:'Imperium'}:game; return preset?{...renamed,motif:preset.motif}:renamed; })};
}
