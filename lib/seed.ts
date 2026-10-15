import type { Data, Game } from './types';
import { localDate } from './stats';
export const catalog: Game[] = [
 {id:'g-wingspan',name:'윙스팬',english:'Wingspan',bggId:266192,minPlayers:1,maxPlayers:5,minutes:70,color:'#d8e5db',motif:'bird',scoring:'high'},
 {id:'g-azul',name:'아줄',english:'Azul',bggId:230802,minPlayers:2,maxPlayers:4,minutes:40,color:'#dbe7ef',motif:'tile',scoring:'high'},
 {id:'g-splendor',name:'스플렌더',english:'Splendor',bggId:148228,minPlayers:2,maxPlayers:4,minutes:30,color:'#e9e0f2',motif:'gem',scoring:'high'},
 {id:'g-catan',name:'카탄',english:'CATAN',bggId:13,minPlayers:3,maxPlayers:4,minutes:90,color:'#f2e4c9',motif:'hex',scoring:'high'},
 {id:'g-cascadia',name:'캐스캐디아',english:'Cascadia',bggId:295947,minPlayers:1,maxPlayers:4,minutes:45,color:'#dce7d5',motif:'mountain',scoring:'high'},
 {id:'g-ticket',name:'티켓 투 라이드',english:'Ticket to Ride',bggId:9209,minPlayers:2,maxPlayers:5,minutes:60,color:'#f1dbd1',motif:'train',scoring:'high'},
];
export function demoData(): Data {
 const players = [{id:'p1',name:'지민',color:'#dce7d9'},{id:'p2',name:'수현',color:'#e7dcf3'},{id:'p3',name:'민준',color:'#fae3ce'},{id:'p4',name:'서연',color:'#dbeaf5'}];
 const plays = Array.from({length:32},(_,i) => { const game = catalog[i%6]; const d = new Date(); d.setDate(d.getDate()-Math.floor(i*2.8)); return { id:`demo-${i}`,gameId:game.id,date:localDate(d),duration:game.minutes+(i%3)*5,scores:players.slice(0,i%4===0?3:4).map((p,j) => ({playerId:p.id,score:game.id==='g-splendor'||game.id==='g-catan'? 7+(i*3+j*7)%12: 42+(i*13+j*17)%61})),note:i===0?'새 확장으로 첫 플레이! 마지막 라운드까지 치열했던 한 판.':i===1?'주말 보드게임 모임 ☕':'',version:1}; });
 return {games:catalog,players,plays};
}
