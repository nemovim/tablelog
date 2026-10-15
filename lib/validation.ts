import { z } from 'zod';
import type { Game, Play } from './types';
const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const gameSchema = z.object({id,name:z.string().trim().min(1).max(100),english:z.string().trim().max(150),bggId:z.number().int().positive().optional(),minPlayers:z.number().int().min(1).max(100).optional(),maxPlayers:z.number().int().min(1).max(100).optional(),minutes:z.number().int().min(1).max(10000).optional(),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),motif:z.enum(['bird','tile','gem','hex','mountain','train','planet','crown','sword']),scoring:z.enum(['high','low','coop']),image:z.string().url().max(2000).refine(v=>v.startsWith('https://')).optional()}).refine(g=>g.maxPlayers===undefined||g.minPlayers===undefined||g.maxPlayers>=g.minPlayers,{message:'최대 인원을 확인해 주세요.'});
export const playerSchema = z.object({id,name:z.string().trim().min(1).max(30),color:z.string().regex(/^#[0-9a-fA-F]{6}$/)});
export const playSchema = z.object({id,gameId:id,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v),duration:z.number().int().min(1).max(10000).optional(),scores:z.array(z.object({playerId:id,score:z.number().finite().min(-1000000).max(1000000).optional()})).min(1).max(100),scenario:z.string().trim().min(1).max(100).optional(),outcome:z.enum(['cleared','failed','paused']).optional(),note:z.string().trim().max(1000).optional(),version:z.number().int().min(1)}).refine(p=>new Set(p.scores.map(s=>s.playerId)).size===p.scores.length,{message:'중복된 플레이어가 있습니다.'});
// Used by the API and demo UI so a scoreless competitive record cannot bypass validation.
export function validatePlayForGame(play:Play,game:Pick<Game,'id'|'scoring'>):string|null {
 if(play.gameId!==game.id) return '게임을 확인해 주세요.';
 if(game.scoring==='coop') return play.scores.some(s=>s.score!==undefined)?'협력 게임은 참가자만 기록하고 점수는 입력하지 않습니다.':null;
 if(play.scores.some(s=>s.score===undefined)) return '모든 참가자의 점수를 입력해 주세요.';
 if(play.scenario!==undefined||play.outcome!==undefined) return '시나리오와 결과는 협력 게임에만 기록할 수 있습니다.';
 return null;
}
