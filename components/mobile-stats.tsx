import { ChevronRight } from 'lucide-react';
import { formatDuration, type leaderboard, type cooperativePlayers, type playerStats } from '@/lib/stats';

function Metric({label,value,unit,accent=false}:{label:string;value:string|number;unit?:string;accent?:boolean}) {
 return <div className={accent?'card-metric emphasized':'card-metric'}><dt>{label}</dt><dd>{value}{unit&&<small>{unit}</small>}</dd></div>;
}
function RankCounts({counts}:{counts:Record<number,number>}) {
 return <div className="card-ranks"><span>등수별 판수</span><div>{Object.entries(counts).map(([rank,count])=><span key={rank}>{rank}등 <strong>{count}<small>판</small></strong></span>)}</div></div>;
}
export function BoardMobileStats({rows,team,coop,onPlayer}:{rows:ReturnType<typeof leaderboard>;team:ReturnType<typeof cooperativePlayers>;coop:boolean;onPlayer:(id:string)=>void}) {
 return <div className="mobile-stat-cards" aria-label={coop?'플레이어별 참가 통계':'플레이어 순위'}>
  {coop?team.map(p=><article className="mobile-stat-card" key={p.id}>
   <div className="card-heading"><button className="card-person" onClick={()=>onPlayer(p.id)} aria-label={`${p.name} 통계`}><span className="avatar" style={{background:p.color}}>{p.name.slice(0,1)}</span><strong>{p.name}</strong><ChevronRight size={15}/></button><span className="card-played">{p.played}판</span></div>
   <dl className="card-metrics two"><Metric label="누적 시간" value={p.recorded?formatDuration(p.total):'미기록'}/><Metric label="평균 시간" value={formatDuration(p.average)}/></dl>
  </article>):rows.map(p=><article className={`mobile-stat-card ${p.rank===1?'leader':''}`} key={p.id}>
   <div className="card-heading"><span className={`card-rank ${p.rank===1?'first':''}`}>{p.rank}<small>위</small></span><button className="card-person" onClick={()=>onPlayer(p.id)} aria-label={`${p.name} 통계`}><span className="avatar" style={{background:p.color}}>{p.name.slice(0,1)}</span><strong>{p.name}</strong><ChevronRight size={15}/></button><span className="card-played">{p.played}판</span></div>
   <dl className="card-metrics"><Metric label="최고 점수" value={p.best} unit="점" accent/><Metric label="평균 점수" value={p.average} unit="점"/><Metric label="평균 등수" value={p.averageRank} unit="등"/></dl>
   <RankCounts counts={p.rankCounts}/>
  </article>)}
 </div>;
}
export function PlayerGameCards({games,onGame}:{games:NonNullable<ReturnType<typeof playerStats>>['games'];onGame:(id:string)=>void}) {
 return <div className="mobile-stat-cards personal-cards" aria-label="게임별 통계 카드">{games.map(row=><article className="mobile-stat-card" key={row.game.id}>
  <div className="card-heading"><button className="card-game" onClick={()=>onGame(row.game.id)}><strong>{row.game.name}</strong><ChevronRight size={16}/></button><span className="card-played">{row.played}판</span></div>
  <p className="card-game-rule">{row.score?`스코어보드 ${row.score.rank}위 · ${row.game.scoring==='low'?'낮은':'높은'} 점수순`:'협력형 · 점수 없이 기록'}</p>
  {row.score&&<><dl className="card-metrics"><Metric label="최고 점수" value={row.score.best} unit="점" accent/><Metric label="평균 점수" value={row.score.average} unit="점"/><Metric label="평균 등수" value={row.score.averageRank} unit="등"/></dl><RankCounts counts={row.score.rankCounts}/></>}
  <dl className="card-metrics two card-time"><Metric label="누적 시간" value={row.recorded?formatDuration(row.total):'미기록'}/><Metric label="평균 시간" value={formatDuration(row.average)}/></dl>
  <p className="card-time-note">시간 입력 {row.recorded}/{row.played}판</p>
 </article>)}</div>;
}
