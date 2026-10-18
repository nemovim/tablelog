'use client';
import { useMemo } from 'react';
import { PlayerGameCards } from './mobile-stats';
import { Pencil } from 'lucide-react';
import type { Data, Play } from '@/lib/types';
import { formatDuration, outcomeLabels, placements, playerStats } from '@/lib/stats';

export default function PlayerStats({data,selectedId,onSelect,onGame,onEdit,onAdd}:{data:Data;selectedId:string;onSelect:(id:string)=>void;onGame:(id:string)=>void;onEdit:(play:Play)=>void;onAdd:()=>void}) {
 const selected=data.players.find(p=>p.id===selectedId)||data.players[0];
 const stats=useMemo(()=>selected?playerStats(data,selected.id):null,[data,selected]);
 if(!stats)return <div className="empty"><p>등록된 플레이어가 없습니다.</p><button className="secondary" onClick={onAdd}>플레이어 추가</button></div>;
 return <div className="player-stats">
  <div className="player-selector" aria-label="플레이어 선택">{[...data.players].sort((a,b)=>a.name.localeCompare(b.name,'ko')).map(p=><button key={p.id} className={p.id===stats.player.id?'selected':''} aria-pressed={p.id===stats.player.id} onClick={()=>onSelect(p.id)}><span className="avatar" style={{background:p.color}}>{p.name.slice(0,1)}</span>{p.name}</button>)}</div>
  <section className="player-summary" aria-label={`${stats.player.name} 전체 통계`}><h2>{stats.player.name}<small>전체 기록</small></h2><dl><div><dt>플레이</dt><dd>{stats.played}<small>판</small></dd></div><div><dt>게임</dt><dd>{stats.games.length}<small>개</small></dd></div><div><dt>누적 시간</dt><dd>{stats.recorded?formatDuration(stats.total):'미기록'}</dd></div><div><dt>평균 시간</dt><dd>{formatDuration(stats.average)}</dd></div></dl><p>시간 입력 {stats.recorded}/{stats.played}판</p></section>
  <section className="scoreboard" aria-label={`${stats.player.name} 게임별 통계`}><div className="section-heading panel-heading"><h2>게임별 통계</h2><span>참가한 기록 기준</span></div><PlayerGameCards games={stats.games} onGame={onGame}/>{!stats.games.length&&<p className="empty-inline">참가한 기록이 없습니다.</p>}<div className="board-footnote">점수와 등수는 게임별로 계산합니다. 협력형 게임에는 점수·등수가 없습니다.</div></section>
  <section className="history"><div className="section-heading"><h2>최근 기록</h2><span>최근 {Math.min(stats.plays.length,10)}판</span></div>{!stats.plays.length?<p className="empty-inline">참가한 기록이 없습니다.</p>:<div className="play-list">{stats.plays.slice(0,10).map(play=>{
   const game=data.games.find(g=>g.id===play.gameId);
   const result=game?placements(play,game).find(s=>s.playerId===stats.player.id):undefined;
   return <article className="play-row personal-play" key={play.id}><div className="play-meta"><time dateTime={play.date}>{play.date.replaceAll('-','. ')}</time><span>{formatDuration(play.duration)}</span></div><div className="play-content"><button className="game-link" onClick={()=>onGame(play.gameId)}>{game?.name||'알 수 없는 게임'}</button>{game?.scoring==='coop'?<div className="personal-result">{play.scenario?`시나리오 · ${play.scenario}`:'시나리오 미기록'}<span className={`outcome ${play.outcome||''}`}>{play.outcome?outcomeLabels[play.outcome]:'결과 미기록'}</span></div>:<div className="personal-result">{result?`${result.score}점 · ${result.rank}등`:'점수 미기록'}</div>}{play.note&&<p className="play-note">{play.note}</p>}</div><div className="row-actions"><button className="icon-button" aria-label={`${game?.name||'게임'} ${play.date} 기록 수정`} onClick={()=>onEdit(play)}><Pencil size={15}/></button></div></article>;
  })}</div>}</section>
 </div>;
}
