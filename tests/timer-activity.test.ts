import { test } from 'node:test';
import assert from 'node:assert/strict';
import { watchTimer } from '../lib/timer-activity';
function setup(phase:Parameters<typeof watchTimer>[0],visible=true){
 const jobs=new Map<number,()=>void>();let visibility:(()=>void)|undefined;let reads=0,ticks=0;
 const stop=watchTimer(phase,()=>reads++,()=>ticks++,{
  visible:()=>visible,
  every:(fn,ms)=>{jobs.set(ms,fn);return()=>{jobs.delete(ms);};},
  onVisibility:fn=>{visibility=fn;return()=>{visibility=undefined;};}
 });
 return {jobs,stop,counts:()=>({reads,ticks}),show:(value:boolean)=>{visible=value;visibility?.();},hasListener:()=>!!visibility};
}
test('unused and finished timers schedule no work or visibility fetches',()=>{
 for(const phase of [undefined,'finished'] as const){const s=setup(phase);assert.equal(s.jobs.size,0);s.show(false);s.show(true);assert.deepEqual(s.counts(),{reads:0,ticks:0});assert.equal(s.hasListener(),false);s.stop();}
});
test('running timer polls and ticks only while visible and cleans up',()=>{
 const s=setup('running');assert.deepEqual([...s.jobs.keys()],[3000,1000]);s.jobs.get(3000)!();s.jobs.get(1000)!();assert.deepEqual(s.counts(),{reads:1,ticks:2});s.show(false);assert.equal(s.jobs.size,0);s.show(true);assert.deepEqual(s.counts(),{reads:2,ticks:3});assert.equal(s.jobs.size,2);s.stop();assert.equal(s.jobs.size,0);assert.equal(s.hasListener(),false);
});
test('paused timer syncs without rerender ticks',()=>{const s=setup('paused');assert.deepEqual([...s.jobs.keys()],[3000]);assert.equal(s.counts().ticks,0);s.stop();});
test('hidden initial tab waits until visible',()=>{const s=setup('running',false);assert.equal(s.jobs.size,0);s.show(true);assert.equal(s.jobs.size,2);assert.deepEqual(s.counts(),{reads:1,ticks:1});s.stop();});
