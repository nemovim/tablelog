import type { Data, Game, Play, Player } from './types';

// Competition ranking: equal scores share a place (1, 1, 3).
export function placements(play: Play, game: Game) {
 if(game.scoring==='coop') return [];
 const ordered = play.scores.filter((s):s is {playerId:string;score:number}=>typeof s.score==='number').sort((a,b) => game.scoring === 'low' ? a.score-b.score : b.score-a.score);
 let rank = 1;
 return ordered.map((score,index) => {
  if(index && score.score !== ordered[index-1].score) rank = index+1;
  return {...score,rank};
 });
}

export function leaderboard(data: Data, gameId: string) {
 const game = data.games.find(g=>g.id===gameId);
 if(!game || game.scoring==='coop') return [];
 const results = data.plays.filter(p=>p.gameId===gameId).map(p=>placements(p,game));
 const rows = data.players.map(player=>{
  const mine = results.flatMap(scores=>scores.filter(s=>s.playerId===player.id));
  const scores = mine.map(s=>s.score);
  const rankCounts:Record<number,number> = {};
  for(const result of mine) rankCounts[result.rank]=(rankCounts[result.rank]||0)+1;
  return {...player,played:mine.length,
   best:scores.length?(game.scoring==='low'?Math.min(...scores):Math.max(...scores)):0,
   average:mine.length?Math.round(scores.reduce((a,b)=>a+b,0)/mine.length*10)/10:0,
   averageRank:mine.length?Math.round(mine.reduce((sum,s)=>sum+s.rank,0)/mine.length*10)/10:0,
   rankCounts,
  };
 }).filter(p=>p.played).sort((a,b)=>(game.scoring==='low'?a.best-b.best:b.best-a.best)||a.name.localeCompare(b.name,'ko'));
 let rank=1;
 return rows.map((row,index)=>{
  if(index && row.best!==rows[index-1].best) rank=index+1;
  return {...row,rank};
 });
}
export function localDate(date = new Date()) { const y = date.getFullYear(); return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function playerName(players: Player[], id: string) { return players.find(p => p.id === id)?.name ?? '삭제된 플레이어'; }

export function timeStats(plays: Play[]) {
 const timed=plays.filter((p):p is Play & {duration:number}=>typeof p.duration==='number'&&p.duration>0);
 const total=timed.reduce((sum,p)=>sum+p.duration,0);
 return {total,recorded:timed.length,average:timed.length?Math.round(total/timed.length):null};
}
export function formatDuration(minutes: number | null | undefined) {
 if(minutes===undefined||minutes===null) return '미기록';
 const hours=Math.floor(minutes/60),rest=minutes%60;
 return hours?`${hours}시간${rest?` ${rest}분`:''}`:`${rest}분`;
}
export function cooperativePlayers(data: Data, gameId: string) {
 return data.players.map(player=>{
  const mine=data.plays.filter(p=>p.gameId===gameId&&p.scores.some(s=>s.playerId===player.id));
  return {...player,played:mine.length,...timeStats(mine)};
 }).filter(p=>p.played).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
}
export const outcomeLabels = {cleared:'성공',failed:'실패',paused:'중단'};

export function playerStats(data: Data, playerId: string) {
 const player=data.players.find(p=>p.id===playerId);
 if(!player) return null;
 const plays=data.plays.filter(p=>p.scores.some(s=>s.playerId===playerId)).sort((a,b)=>b.date.localeCompare(a.date));
 const games=data.games.flatMap(game=>{
  const mine=plays.filter(p=>p.gameId===game.id);
  if(!mine.length) return [];
  const score=game.scoring==='coop'?null:leaderboard(data,game.id).find(p=>p.id===playerId)||null;
  return [{game,played:mine.length,...timeStats(mine),score}];
 }).sort((a,b)=>b.played-a.played||a.game.name.localeCompare(b.game.name,'ko'));
 return {player,played:plays.length,...timeStats(plays),games,plays};
}
