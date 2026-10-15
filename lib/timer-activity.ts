import type { SharedTimer } from './timer';

type Environment = {
 visible:()=>boolean;
 every:(callback:()=>void,ms:number)=>()=>void;
 onVisibility:(callback:()=>void)=>()=>void;
};

// Paused timers still sync so another player's resume is discovered.
// Finished timers need no background work until the user interacts again.
export function watchTimer(phase:SharedTimer['phase']|undefined,read:()=>void,tick:()=>void,env:Environment) {
 if(!phase||phase==='finished')return ()=>{};
 let stops:(()=>void)[]=[];
 function stop(){stops.forEach(fn=>fn());stops=[];}
 function start(){
  if(!env.visible())return;
  stops.push(env.every(read,3000));
  if(phase==='running'){tick();stops.push(env.every(tick,1000));}
 }
 function visibility(){stop();if(env.visible()){read();start();}}
 start();
 const unsubscribe=env.onVisibility(visibility);
 return ()=>{stop();unsubscribe();};
}
