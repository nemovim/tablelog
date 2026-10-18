import { Check, Plus } from 'lucide-react';
import type { Player } from '@/lib/types';

export default function ParticipantPicker({players,selected,disabled,onToggle}:{players:Player[];selected:string[];disabled?:boolean;onToggle:(id:string)=>void}) {
 return <><div className="scores-heading"><strong>참가자 <span className="participant-count">{selected.length}명</span></strong><span>눌러서 선택 · 다시 누르면 해제</span></div>
 <div className="participant-options" role="group" aria-label="참가자 선택">{players.map(player=>{const active=selected.includes(player.id);return <button type="button" key={player.id} aria-pressed={active} disabled={disabled} onClick={()=>onToggle(player.id)}><span className="avatar" style={{background:player.color}}>{player.name.slice(0,1)}</span><span>{player.name}</span>{active?<Check size={16}/>:<Plus size={16}/>}</button>;})}</div>
 {!selected.length&&<p className="participant-hint">함께 플레이한 사람을 선택해 주세요.</p>}</>;
}
