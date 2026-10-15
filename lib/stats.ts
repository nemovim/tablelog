import type { Data, Game, Play, Player } from './types';
export function winners(play: Play, game: Game) { const scores = play.scores.map(s => s.score); const best = game.scoring === 'low' ? Math.min(...scores) : Math.max(...scores); return play.scores.filter(s => s.score === best).map(s => s.playerId); }
export function leaderboard(data: Data, gameId?: string) {
  const plays = data.plays.filter(p => !gameId || p.gameId === gameId);
  const game = data.games.find(g => g.id === gameId);
  return data.players.map(player => {
    const mine = plays.filter(p => p.scores.some(s => s.playerId === player.id));
    const scores = mine.map(p => p.scores.find(s => s.playerId === player.id)!.score);
    const wins = mine.filter(p => { const g = data.games.find(g => g.id === p.gameId); return g && winners(p, g).includes(player.id); }).length;
    return { ...player, played: mine.length, wins, rate: mine.length ? Math.round(wins / mine.length * 100) : 0, best: scores.length ? (game?.scoring === 'low' ? Math.min(...scores) : Math.max(...scores)) : 0, average: scores.length ? Math.round(scores.reduce((a,b) => a+b,0) / scores.length * 10) / 10 : 0 };
  }).filter(p => p.played).sort((a,b) => game ? (game.scoring === 'low' ? a.best-b.best : b.best-a.best) || b.rate-a.rate : b.wins-a.wins || b.rate-a.rate || b.played-a.played);
}
export function localDate(date = new Date()) { const y = date.getFullYear(); return `${y}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export function monthBars(plays: Play[], now = new Date()) { return Array.from({length:6}, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth()-5+i,1); const key = localDate(d).slice(0,7); return { label: `${d.getMonth()+1}월`, count: plays.filter(p => p.date.startsWith(key)).length }; }); }
export function playerName(players: Player[], id: string) { return players.find(p => p.id === id)?.name ?? '삭제된 플레이어'; }
