export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Arena {
 constructor(style='Boxer',record={}) {
  this.style=style; this.level=clamp(Number(record.level)||1,1,20); this.rep=clamp(Number(record.rep)||0,0,99999);
  this.wave=0; this.state='ready'; this.units=[]; this.events=[]; this.effects=[]; this.time=0; this.kills=0;
  this.p={x:0,y:2,hp:100,max:100,energy:100,face:0,attack:0,dodge:0,skill:0,inv:0,flash:0}; this.refresh();
 }
 refresh(){this.p.max=100+(this.level-1)*12;this.p.hp=this.p.max;this.p.energy=100;}
 start(){this.wave++; this.state='fight';this.refresh();this.p.x=0;this.p.y=2;
  const boss=this.wave===4; const n=boss?1:2+this.wave;
  this.units=Array.from({length:n},(_,i)=>({x:Math.cos(i/n*Math.PI*2)*5,y:Math.sin(i/n*Math.PI*2)*4-2,hp:boss?350:42+this.wave*8,max:boss?350:42+this.wave*8,boss,wind:0,cd:1+i*.3,flash:0,dead:false}));
  this.events.push(boss?'The Gatekeeper entra nel cortile.':'Sfida '+this.wave+' · Blood Gym Fighters');
 }
 hit(e,damage){if(e.dead)return;e.hp-=damage;e.flash=.16;this.effects.push({x:e.x,y:e.y,text:'−'+damage,life:.7});if(e.hp<=0){e.dead=true;this.kills++;this.rep+=e.boss?100:15;this.p.energy=clamp(this.p.energy+8,0,100);}}
 act(kind){if(this.state!=='fight')return false;const p=this.p;
  if(kind==='dodge'){if(p.dodge>0||p.energy<22)return false;p.dodge=1.15;p.inv=.42;p.energy-=22;p.x=clamp(p.x+Math.cos(p.face)*1.7,-7,7);p.y=clamp(p.y+Math.sin(p.face)*1.7,-6,6);return true;}
  const skill=kind==='skill';if((skill?p.skill:p.attack)>0||p.energy<(skill?38:0))return false;
  if(skill){p.skill=5;p.energy-=38;}else p.attack=this.style==='Boxer'?.32:.52;
  const radius=skill?2.6:1.65;const targets=this.units.filter(e=>!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<radius).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  if(targets.length)p.face=Math.atan2(targets[0].y-p.y,targets[0].x-p.x);
  for(const e of targets.slice(0,skill?99:1)){this.hit(e,(skill?(this.style==='Boxer'?35:42):(this.style==='Boxer'?13:20))+this.level*2);if(skill){e.wind=0;e.cd=1.4;}}
  this.effects.push({x:p.x,y:p.y,radius,life:.22,skill});this.events.push(skill?'skill':'punch');return true;
 }
 tick(dt,move={x:0,y:0}){if(this.state!=='fight')return;dt=clamp(dt,0,.05);this.time+=dt;const p=this.p;
  for(const key of ['attack','dodge','skill','inv','flash'])p[key]=Math.max(0,p[key]-dt);p.energy=clamp(p.energy+dt*11,0,100);
  const len=Math.hypot(move.x,move.y);if(len>.05){const speed=(this.style==='Boxer'?3.3:2.8)*dt/Math.max(1,len);p.x=clamp(p.x+move.x*speed,-7,7);p.y=clamp(p.y+move.y*speed,-6,6);p.face=Math.atan2(move.y,move.x);}
  for(const e of this.units){if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);e.cd-=dt;const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
   if(e.wind>0){e.wind-=dt;if(e.wind<=0){if(d<(e.boss?2.5:1.65)&&p.inv<=0){p.hp-=e.boss?26:9;p.flash=.25;this.events.push('hurt');}e.cd=e.boss?1.6:1.3;}}
   else if(d<(e.boss?2:1.2)&&e.cd<=0)e.wind=e.boss?.9:.65;
   else if(d>1){const speed=(e.boss?.85:1.15)*dt;e.x+=dx/d*speed;e.y+=dy/d*speed;}
  }
  // Separate opponents so a crowd stays legible and doesn't occupy one point.
  const alive=this.units.filter(e=>!e.dead);for(let i=0;i<alive.length;i++)for(let j=i+1;j<alive.length;j++){const a=alive[i],b=alive[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>0&&d<.75){const push=(.75-d)*.5;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;}}
  this.effects=this.effects.filter(e=>(e.life-=dt)>0);
  if(p.hp<=0){p.hp=0;this.state='lost';this.events.push('Sei a terra. Torna al cortile e riprova.');}
  else if(alive.length===0){this.state=this.wave===4?'won':'rest';this.events.push(this.state==='won'?'The Yard è tuo.':'Sfida completata. Riprendi fiato.');}
 }
 train(){if(!['rest','ready','won','lost'].includes(this.state)||this.rep<40||this.level>=20)return false;this.rep-=40;this.level++;this.refresh();return true;}
 record(){return {version:1,style:this.style,level:this.level,rep:this.rep};}
}
