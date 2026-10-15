import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer, elapsed, transitionTimer, timerMinutes, timerClock, startTimerSchema } from '../lib/timer';
const input={gameId:'terra',playerIds:['a','b'],date:'2026-10-15'};
test('elapsed uses timestamps across sleep and refresh',()=>{const t=createTimer(input,'timer-a',1000);assert.equal(elapsed(JSON.parse(JSON.stringify(t)),7201000),7200000);assert.equal(timerClock(t,7201000),'02:00:00');assert.equal(elapsed(t,0),0);});
test('paused time excluded when resumed and finished',()=>{let t=createTimer(input,'timer-a',0);t=transitionTimer(t,'pause',30000);assert.equal(elapsed(t,90000),30000);t=transitionTimer(t,'resume',90000);t=transitionTimer(t,'finish',120000);assert.equal(t.elapsedMs,60000);assert.equal(timerMinutes(t),1);assert.equal(elapsed(t,999999),60000);assert.equal(t.version,4);});
test('finish while paused and round up partial minute',()=>{let t=transitionTimer(createTimer(input,'timer-a',0),'pause',60001);t=transitionTimer(t,'finish',999999);assert.equal(timerMinutes(t),2);assert.equal(timerMinutes(createTimer(input,'timer-b',0)),1);});
test('reject invalid state transitions',()=>{const t=createTimer(input,'timer-a',0);assert.throws(()=>transitionTimer(t,'resume',1));const f=transitionTimer(t,'finish',1);for(const action of ['pause','resume','finish'] as const)assert.throws(()=>transitionTimer(f,action,2));});
test('start requires unique participants and a valid date',()=>{assert.ok(startTimerSchema.safeParse(input).success);for(const bad of [{...input,playerIds:[]},{...input,playerIds:['a','a']},{...input,date:'2026-02-30'}])assert.equal(startTimerSchema.safeParse(bad).success,false);});
