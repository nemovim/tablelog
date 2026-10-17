'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock3, Dices, ExternalLink, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { Data, Game, Mode, Outcome, Play, Player } from '@/lib/types';
import { catalog, demoData } from '@/lib/seed';
import { leaderboard, localDate, playerName, placements, timeStats, formatDuration, cooperativePlayers, outcomeLabels } from '@/lib/stats';
import { gameSchema, playSchema, playerSchema, validatePlayForGame } from '@/lib/validation';
import GameArt from './game-art';
import PlayerStats from './player-stats';
import { BoardMobileStats } from './mobile-stats';
import TimerPanel from './timer-panel';
import { timerMinutes, type SharedTimer } from '@/lib/timer';
const empty:Data={games:[],players:[],plays:[]};
const storageKey='tablelog-demo-v1';
const colors=['#dce7d9','#e7dcf3','#fae3ce','#dbeaf5','#f4dce4','#eae5ce'];
function Avatar({player,size=''}:{player?:Player;size?:string}) {return <span className={`avatar ${size}`} style={{background:player?.color||'#eee'}}>{player?.name.slice(0,1)||'?'}</span>;}
export function Modal({title,subtitle,onClose,children}:{title:string;subtitle?:string;onClose:()=>void;children:React.ReactNode}) {
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{const prev=document.activeElement as HTMLElement; const old=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.focus();return()=>{document.body.style.overflow=old;prev?.focus();};},[]);
 return <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)onClose();}}><div className="modal" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onKeyDown={e=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){const els=ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,textarea,a[href]');if(!els?.length)return;const first=els[0],last=els[els.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){e.preventDefault();first.focus();}}}}><div className="modal-heading"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div><button className="icon-button" aria-label="닫기" onClick={onClose}><X size={21}/></button></div>{children}</div></div>;
}
export default function Dashboard() {
 const [data,setData]=useState<Data>(empty),[mode,setMode]=useState<Mode>('loading');
 const [view,setView]=useState<'games'|'players'>('games');
 const [playerId,setPlayerId]=useState('');
 const [timerDraft,setTimerDraft]=useState<SharedTimer|null>(null);
 const [selectedId,setSelectedId]=useState(''),[query,setQuery]=useState('');
 const [modal,setModal]=useState<'play'|'game'|'player'|null>(null),[editing,setEditing]=useState<Play|null>(null);
 const [notice,setNotice]=useState(''),[error,setError]=useState(''),[deleting,setDeleting]=useState<Play|null>(null),[busy,setBusy]=useState(false);
  async function refresh() {try {const r=await fetch('/api/data',{cache:'no-store'}); const result=await r.json();if(!r.ok)throw Error(result.error);if(result.mode==='demo'){const saved=localStorage.getItem(storageKey);let value=demoData();if(saved){try {const parsed=JSON.parse(saved);if(Array.isArray(parsed.games)&&Array.isArray(parsed.players)&&Array.isArray(parsed.plays)&&parsed.games.every((g:unknown)=>gameSchema.safeParse(g).success)&&parsed.players.every((p:unknown)=>playerSchema.safeParse(p).success)&&parsed.plays.every((p:unknown)=>playSchema.safeParse(p).success))value={...parsed,games:[...catalog.slice(0,3).filter(g=>!parsed.games.some((x:Game)=>x.id===g.id||x.bggId===g.bggId)),...parsed.games]};}catch{}}setData(value);setMode('demo');}else{setData(result.data);setMode('mongo');}setError('');}catch(e){setError((e as Error).message);setMode('error');}}
 useEffect(()=>{void refresh();},[]);
 useEffect(()=>{window.scrollTo({top:0,behavior:'auto'});},[view,playerId]);
 useEffect(()=>{if(!notice)return;const id=setTimeout(()=>setNotice(''),4000);return()=>clearTimeout(id);},[notice]);
 async function save(collection:keyof Data,record:Game|Player|Play,action='create') {
  let saved=record;
  if(mode==='mongo'){const r=await fetch(`/api/records/${collection}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({record,action})});const result=await r.json();if(!r.ok)throw Error(result.error);saved=result.record;await refresh();}
  else if(mode==='demo'){if(action==='create'&&data[collection].some(r=>r.id===saved.id))throw Error('이미 저장된 기록입니다. 새로고침해 주세요.');if(action==='update'&&'version' in saved)saved={...saved,version:saved.version+1};const next={...data,[collection]:action==='update'?data[collection].map(r=>r.id===saved.id?saved:r):[...data[collection],saved]};localStorage.setItem(storageKey,JSON.stringify(next));setData(next as Data);}
  else throw Error('데이터 연결을 먼저 확인해 주세요.');
  setNotice(action==='update'?'기록을 수정했습니다.':'기록을 저장했습니다.');
 }
 async function removePlay(){if(!deleting)return;setBusy(true);try {if(mode==='mongo'){const r=await fetch('/api/records/plays',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id:deleting.id,version:deleting.version})});const result=await r.json();if(!r.ok)throw Error(result.error);await refresh();}else{const next={...data,plays:data.plays.filter(p=>p.id!==deleting.id)};localStorage.setItem(storageKey,JSON.stringify(next));setData(next);}setDeleting(null);setNotice('기록을 삭제했습니다.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}

 const game=data.games.find(g=>g.id===selectedId)||data.games[0];
 const rows=game?leaderboard(data,game.id):[];
 const coop=game?.scoring==='coop';
 const team=game?cooperativePlayers(data,game.id):[];
 const plays=data.plays.filter(p=>p.gameId===game?.id).sort((a,b)=>b.date.localeCompare(a.date));
 const timing=timeStats(plays);
 const visibleGames=data.games.filter(g=>`${g.name} ${g.english}`.toLowerCase().replace(/\s/g,'').includes(query.toLowerCase().replace(/\s/g,'')));
 function showPlayer(id:string){setPlayerId(id);setView('players');}
 const navigation=(<div className="page-heading"><h1 className="sr-only">{view==='games'?'스코어보드':'플레이어 통계'}</h1><nav className="view-tabs" aria-label="통계 보기"><button className={view==='games'?'selected':''} aria-pressed={view==='games'} onClick={()=>setView('games')}>스코어보드</button><button className={view==='players'?'selected':''} aria-pressed={view==='players'} onClick={()=>setView('players')}>플레이어 통계</button></nav></div>);
 function record(){setTimerDraft(null);setEditing(null);setModal('play');}
 return <div className="app">
  <header className="header"><a className="brand" href="/" aria-label="테이블로그 홈"><span className="brand-mark"><Dices size={22}/></span>tablelog<span className="brand-dot">.</span></a><div className="header-actions"><button className="secondary" onClick={()=>setModal('player')}><Plus size={16}/>플레이어 추가</button><button className="secondary" onClick={()=>setModal('game')}><Plus size={16}/>게임 추가</button></div></header>
  <main>
   {(mode==='demo'||mode==='mongo')&&<TimerPanel navigation={navigation} onAddRecord={record} data={data} mode={mode} gameId={game?.id||''} onRecord={t=>{setTimerDraft(t);setEditing(null);setModal('play');}}/>}
   {(mode==='loading'||mode==='error')&&navigation}
   {error&&<div className="error-banner" role="alert">{error}<button onClick={()=>void refresh()}>다시 불러오기</button></div>}
   {mode==='loading'?<div className="empty"><Loader2 className="spin"/>기록을 불러오는 중…</div>:mode==='error'?null:<>
    {view==='games'&&<><div className="game-picker"><div className="search-field"><Search size={15}/><input aria-label="내 게임 검색" placeholder="게임 찾기" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button className="search-clear" aria-label="게임 검색 지우기" onClick={()=>setQuery('')}><X size={15}/></button>}</div><div className="game-tabs" aria-label="게임 선택">{visibleGames.map(g=><button key={g.id} className={game?.id===g.id?'selected':''} aria-pressed={game?.id===g.id} onClick={()=>setSelectedId(g.id)}>{g.name}</button>)}</div></div></>}
    {view==='players'?<PlayerStats data={data} selectedId={playerId} onSelect={setPlayerId} onGame={id=>{setSelectedId(id);setQuery('');setView('games');}} onEdit={play=>{setTimerDraft(null);setEditing(play);setModal('play');}} onAdd={()=>setModal('player')}/>:<>
    {query&&!visibleGames.length&&<p className="search-message">일치하는 게임이 없습니다.</p>}
    {!game?<Empty label="등록된 게임이 없습니다." action="게임 추가" onClick={()=>setModal('game')}/>:<>
     <section className="scoreboard" aria-label={`${game.name} 통계`}>
      <div className="board-heading"><div className="game-title"><div><h2>{game.name}</h2><p>{coop?'협력형 · 판수 및 시간':`${game.scoring==='low'?'낮은':'높은'} 점수순 · 동점은 공동 등수`}</p></div></div><span className="total-plays">총 <strong>{plays.length}</strong>판</span></div>
      <div className="time-summary"><div><span>누적 플레이 시간</span><strong>{timing.recorded?formatDuration(timing.total):'미기록'}</strong></div><div><span>한 판 평균</span><strong>{formatDuration(timing.average)}</strong></div><small>시간 입력 {timing.recorded}/{plays.length}판</small></div>
      <BoardMobileStats rows={rows} team={team} coop={coop} onPlayer={showPlayer}/>
      {coop?<><p className="mobile-table-hint">옆으로 밀어 전체 통계 보기 <span aria-hidden="true">↔</span></p><div className="table-scroll" tabIndex={0} role="region" aria-label="게임 통계 표"><table className="coop-table"><thead><tr><th>플레이어</th><th>참가 판수</th><th>누적 시간</th><th>평균 시간</th></tr></thead><tbody>{team.map(p=><tr key={p.id}><td><button className="player-cell player-link" aria-label={`${p.name} 통계`} onClick={()=>showPlayer(p.id)}><Avatar player={p}/><strong>{p.name}</strong></button></td><td>{p.played}<span className="unit">판</span></td><td>{p.recorded?formatDuration(p.total):'미기록'}</td><td>{formatDuration(p.average)}</td></tr>)}</tbody></table></div>{!team.length&&<Empty label="플레이 기록이 없습니다." action="플레이 기록" onClick={record}/>}</>:<>      <p className="mobile-table-hint">옆으로 밀어 전체 통계 보기 <span aria-hidden="true">↔</span></p><div className="table-scroll" tabIndex={0} role="region" aria-label="게임 통계 표"><table className="ranking-table"><thead><tr><th>순위</th><th>플레이어</th><th>판수</th><th>최고 점수</th><th>평균 점수</th><th>평균 등수</th><th>등수별 판수</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><span className={`rank ${p.rank===1?'top-rank':''}`}>{p.rank}</span></td><td><button className="player-cell player-link" aria-label={`${p.name} 통계`} onClick={()=>showPlayer(p.id)}><Avatar player={p}/><strong>{p.name}</strong></button></td><td>{p.played}<span className="unit">판</span></td><td className="best-score">{p.best}<span className="unit">점</span></td><td>{p.average}<span className="unit">점</span></td><td>{p.averageRank}<span className="unit">등</span></td><td><div className="rank-counts">{Object.entries(p.rankCounts).map(([rank,count])=><span key={rank}><span>{rank}등</span><strong>{count}</strong></span>)}</div></td></tr>)}</tbody></table></div>
      {!rows.length&&<Empty label="플레이 기록이 없습니다." action="플레이 기록" onClick={record}/>}
</>}
      <div className="board-footnote">{coop?'이름순 · 실패·중단·재도전도 각각 한 판으로 기록합니다.':'순위는 개인 최고 점수 기준 · 평균 등수와 등수별 판수는 매 판의 결과 기준'} 시간은 입력한 기록만 합산합니다.</div>
     </section>
     <section className="history"><div className="section-heading"><h2>플레이 기록 <span>{plays.length}</span></h2><span>{coop?'시나리오 · 결과 · 시간':'날짜 · 점수 · 시간'}</span></div>
      {plays.length?<div className="play-list">{plays.map(play=><article className="play-row" key={play.id}><div className="play-meta"><time dateTime={play.date}>{play.date.replaceAll('-','. ')}</time><span><Clock3 size={11}/>{formatDuration(play.duration)}</span></div><div className="play-content">{coop?<><div className="scenario-result"><strong>{play.scenario?`시나리오 · ${play.scenario}`:'시나리오 미기록'}</strong>{play.outcome?<span className={`outcome ${play.outcome}`}>{outcomeLabels[play.outcome]}</span>:<span className="outcome">결과 미기록</span>}</div><div className="team-names">{play.scores.map(p=>playerName(data.players,p.playerId)).join(' · ')}</div></>:<div className="play-results">{placements(play,game).map(s=><span className="play-result" key={s.playerId}><span className={s.rank===1?'first-place':''}>{s.rank}등</span><strong>{playerName(data.players,s.playerId)}</strong><span>{s.score}<small>점</small></span></span>)}</div>}</div><div className="row-actions"><button className="icon-button" aria-label={`${game.name} ${play.date} 기록 수정`} onClick={()=>{setTimerDraft(null);setEditing(play);setModal('play');}}><Pencil size={15}/></button><button className="icon-button" aria-label={`${game.name} ${play.date} 기록 삭제`} onClick={()=>{setError('');setDeleting(play);}}><Trash2 size={15}/></button></div></article>)}</div>:<p className="empty-inline">플레이 기록이 없습니다.</p>}
     </section>
     {game.bggId&&<a className="bgg-link" href={`https://boardgamegeek.com/boardgame/${game.bggId}`} target="_blank" rel="noreferrer">BoardGameGeek <ExternalLink size={12}/></a>}
    </>}
    </>}
   </>}
   {mode==='demo'&&<p className="demo-banner">데모 모드 · 변경 사항은 이 브라우저에 저장됩니다.</p>}
  </main>
  {notice&&<div className="toast" role="status"><Check size={17}/>{notice}</div>}
  {modal==='play'&&<PlayModal data={data} draft={timerDraft} editing={editing} defaultGameId={game?.id||''} onClose={()=>setModal(null)} onSave={async p=>{await save('plays',p,editing?'update':'create');setSelectedId(p.gameId);setModal(null);}} onAddGame={()=>setModal('game')} onAddPlayer={()=>setModal('player')}/>}
  {modal==='game'&&<GameModal games={data.games} onClose={()=>setModal(null)} onSave={async g=>{await save('games',g);setSelectedId(g.id);setQuery('');setModal(null);}}/>}
  {modal==='player'&&<PlayerModal players={data.players} onClose={()=>setModal(null)} onSave={async p=>{await save('players',p);setPlayerId(p.id);setModal(null);}}/>}
  {deleting&&<Modal title="이 기록을 삭제할까요?" subtitle="플레이 통계에 반영됩니다. 되돌릴 수 없어요." onClose={()=>{if(!busy)setDeleting(null);}}>{error&&<p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button className="secondary" disabled={busy} onClick={()=>setDeleting(null)}>취소</button><button className="danger" disabled={busy} onClick={()=>void removePlay()}>{busy?'삭제 중…':'삭제'}</button></div></Modal>}
 </div>;
}
function Empty({label,action,onClick}:{label:string;action:string;onClick:()=>void}) {return <div className="empty"><p>{label}</p><button className="secondary" onClick={onClick}><Plus size={15}/>{action}</button></div>;}
function PlayModal({data,draft,editing,defaultGameId,onClose,onSave,onAddGame,onAddPlayer}:{data:Data;draft:SharedTimer|null;editing:Play|null;defaultGameId:string;onClose:()=>void;onSave:(p:Play)=>Promise<void>;onAddGame:()=>void;onAddPlayer:()=>void}) {
 const [gameId,setGame]=useState(editing?.gameId||draft?.gameId||defaultGameId||data.games[0]?.id||'');
 const [date,setDate]=useState(editing?.date||draft?.date||localDate());
 const [duration,setDuration]=useState(editing?.duration===undefined?(draft?String(timerMinutes(draft)):''):String(editing.duration));
 const [scenario,setScenario]=useState(editing?.scenario||'');
 const [outcome,setOutcome]=useState<Outcome|''>(editing?.outcome||'');
 const [scores,setScores]=useState<{playerId:string;score:string}[]>(editing?.scores.map(s=>({playerId:s.playerId,score:s.score===undefined?'':String(s.score)}))||(draft?draft.playerIds.map(id=>({playerId:id,score:''})):data.players.slice(0,4).map(p=>({playerId:p.id,score:''}))));
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const game=data.games.find(g=>g.id===gameId),coop=game?.scoring==='coop';
 async function submit(e:React.FormEvent){
  e.preventDefault();setError('');
  if(!game)return;
  if(!coop&&scores.some(s=>s.score.trim()==='')){setError('모든 참가자의 점수를 입력해 주세요.');return;}
  const play:Play={...editing,id:editing?.id||draft?.id||crypto.randomUUID(),gameId,date,
   duration:duration.trim()?Number(duration):undefined,
   scenario:coop&&scenario.trim()?scenario.trim():undefined,
   outcome:coop&&outcome?outcome:undefined,
   scores:scores.map(s=>coop?{playerId:s.playerId}:{playerId:s.playerId,score:Number(s.score)}),version:editing?.version||1};
  const parsed=playSchema.safeParse(play);
  if(!parsed.success){setError('날짜, 시간, 참가자를 확인해 주세요. 시간은 1~10,000분 사이의 정수로 입력해 주세요.');return;}
  const problem=validatePlayForGame(parsed.data,game);
  if(problem){setError(problem);return;}
  setBusy(true);try{await onSave(parsed.data);}catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <Modal title={editing?'플레이 기록 수정':'플레이 기록'} subtitle={coop?'참가자, 시간, 시나리오 결과를 입력합니다.':'점수를 입력하면 등수가 자동으로 계산됩니다.'} onClose={()=>{if(!busy)onClose();}}>
  {!data.games.length||!data.players.length?<div className="empty"><p>먼저 게임과 플레이어를 등록해 주세요.</p><button className="primary" onClick={!data.games.length?onAddGame:onAddPlayer}>{!data.games.length?'게임 등록하기':'플레이어 등록하기'}</button></div>:<form onSubmit={submit}>
   <label className="field">플레이한 게임<select disabled={!!draft} value={gameId} onChange={e=>setGame(e.target.value)}>{data.games.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
   <div className="form-row"><label className="field">플레이 날짜<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label><label className="field">플레이 시간 (분)<input type="number" step="1" min="1" max="10000" placeholder="선택 · 예: 90" value={duration} onChange={e=>setDuration(e.target.value)}/></label></div>
   {coop&&<div className="cooperative-fields"><label className="field">시나리오 <span className="field-hint">선택</span><input maxLength={100} value={scenario} onChange={e=>setScenario(e.target.value)} placeholder="번호 또는 이름 · 예: 3"/></label><label className="field">결과<select value={outcome} onChange={e=>setOutcome(e.target.value as Outcome|'')}><option value="">미기록</option><option value="cleared">성공</option><option value="failed">실패</option><option value="paused">중단</option></select></label></div>}
   <div className="scores-heading"><strong>{coop?'참가자':'참가자와 점수'}</strong><span>{coop?'함께한 사람만 선택해 주세요':`${game?.scoring==='low'?'낮은':'높은'} 점수가 우승해요`}</span></div>
   <div className="score-rows">{scores.map((score,i)=><div className="score-row" key={score.playerId}><Avatar player={data.players.find(p=>p.id===score.playerId)}/><strong>{playerName(data.players,score.playerId)}</strong>{!coop&&<><input aria-label={`${playerName(data.players,score.playerId)} 점수`} type="number" step="any" required placeholder="0" min="-1000000" max="1000000" value={score.score} onChange={e=>setScores(scores.map((s,j)=>j===i?{...s,score:e.target.value}:s))}/><span>점</span></>}<button type="button" className="icon-button" aria-label={`${playerName(data.players,score.playerId)} 제외`} onClick={()=>setScores(scores.filter((_,j)=>j!==i))}><X size={16}/></button></div>)}</div>
   {data.players.some(p=>!scores.some(s=>s.playerId===p.id))&&<select aria-label="참가자 추가" className="add-participant" value="" onChange={e=>{if(e.target.value)setScores([...scores,{playerId:e.target.value,score:''}]);}}><option value="">+ 참가자 추가</option>{data.players.filter(p=>!scores.some(s=>s.playerId===p.id)).map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select>}
   <p className="search-message">시간은 실제 플레이한 분으로 기록해 주세요. 비워 두면 시간 통계에서 제외됩니다.{coop?' 재도전은 새 기록으로 남기면 됩니다.':''}</p>
   {error&&<p className="form-error" role="alert">{error}</p>}
   <div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>취소</button><button className="primary" disabled={busy||!scores.length}>{busy?<Loader2 className="spin" size={17}/>:<Check size={17}/>} {busy?'저장 중…':'기록 저장하기'}</button></div>
  </form>}
 </Modal>;
}
function PlayerModal({players,onClose,onSave}:{players:Player[];onClose:()=>void;onSave:(p:Player)=>Promise<void>}) {const [name,setName]=useState(''),[color]=useState(colors[players.length%colors.length]),[busy,setBusy]=useState(false),[error,setError]=useState('');return <Modal title="플레이어 추가" subtitle="통계에 사용할 이름을 입력합니다." onClose={()=>{if(!busy)onClose();}}><form onSubmit={async e=>{e.preventDefault();if(players.some(p=>p.name.toLocaleLowerCase()===name.trim().toLocaleLowerCase())){setError('같은 이름의 친구가 있어요. 구분할 수 있는 이름을 입력해 주세요.');return;}setBusy(true);try{await onSave({id:crypto.randomUUID(),name:name.trim(),color});}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}><label className="field">이름 또는 닉네임<input required maxLength={30} value={name} onChange={e=>setName(e.target.value)} placeholder="이름 또는 닉네임"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>취소</button><button className="primary" disabled={busy||!name.trim()}>{busy?'등록 중…':'플레이어 등록'}</button></div></form></Modal>;}
function GameModal({games,onClose,onSave}:{games:Game[];onClose:()=>void;onSave:(g:Game)=>Promise<void>}) {
 const [query,setQuery]=useState(''),[results,setResults]=useState<Game[]>(catalog),[message,setMessage]=useState('기본 추천 게임 · BGG 검색은 영문 이름으로 검색하면 더 정확해요.'),[loading,setLoading]=useState(false),[manual,setManual]=useState(false),[selected,setSelected]=useState<Game|null>(null),[name,setName]=useState(''),[scoring,setScoring]=useState<Game['scoring']>('high'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();const timer=setTimeout(async()=>{setLoading(true);try{const r=await fetch(`/api/games/search?q=${encodeURIComponent(query)}`,{signal:controller.signal});if(!r.ok)throw Error();const result=await r.json();setResults(result.games);setMessage(result.message||(result.source==='bgg'?'BoardGameGeek 검색 결과':'기본 추천 게임'));}catch(e){if(!controller.signal.aborted)setMessage('검색에 실패했어요. 다시 시도하거나 직접 등록해 주세요.');}finally{if(!controller.signal.aborted)setLoading(false);}},350);return()=>{clearTimeout(timer);controller.abort();};},[query]);
 async function submit(e:React.FormEvent){e.preventDefault();if(!manual&&!selected)return;const g:Game=manual?{id:crypto.randomUUID(),name:name.trim(),english:'',color:'#dce7d5',motif:'hex',scoring}:{...selected!,scoring};if(!gameSchema.safeParse(g).success){setError('게임 이름과 점수 규칙을 확인해 주세요.');return;}setBusy(true);try{await onSave(g);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <Modal title="게임 추가" subtitle="게임 검색 또는 직접 등록" onClose={()=>{if(!busy)onClose();}}><div className="modal-tabs"><button className={!manual?'selected':''} onClick={()=>setManual(false)}><Search size={16}/>게임 검색</button><button className={manual?'selected':''} onClick={()=>setManual(true)}><Pencil size={16}/>직접 등록</button></div><form onSubmit={submit}>{manual?<><label className="field">게임 이름<input required value={name} maxLength={100} placeholder="게임 이름을 입력해 주세요" onChange={e=>setName(e.target.value)}/></label></>:<><div className="search-field modal-search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="예: 테라포밍 마스, 도미니언, 사자의 턱" aria-label="게임 검색"/>{loading&&<Loader2 className="spin" size={17}/>}</div><p className="search-message">{message}</p><div className="game-results">{results.map(g=>{const exists=games.some(x=>x.id===g.id||(x.bggId&&x.bggId===g.bggId));return <button type="button" disabled={exists} key={g.id} className={selected?.id===g.id?'selected':''} onClick={()=>{setSelected(g);setScoring(g.scoring);}}><GameArt game={g} small/><span><strong>{g.name}</strong><small>{g.english}</small></span>{exists?<small>등록됨</small>:selected?.id===g.id?<Check size={19}/>:<Plus size={17}/>}</button>;})}{!results.length&&!loading&&<p className="empty-inline">검색 결과가 없어요. 직접 등록해 주세요.</p>}</div></>}<label className="field">기록 방식<select value={scoring} onChange={e=>setScoring(e.target.value as Game['scoring'])}><option value="high">높은 점수가 승리</option><option value="low">낮은 점수가 승리</option><option value="coop">협력형 · 점수 없이 기록</option></select></label><p className="search-message">{scoring==='coop'?'참가자·시간·시나리오·결과를 기록합니다. 점수와 순위는 사용하지 않습니다.':'동점은 공동 등수로 기록합니다.'} 등록 후 기록 방식은 고정됩니다.</p>{error&&<p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" disabled={busy} onClick={onClose}>취소</button><button className="primary" disabled={busy||(!manual&&!selected)}>{busy?'등록 중…':'라이브러리에 추가'}</button></div></form></Modal>;
}
