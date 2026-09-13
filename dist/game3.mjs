import {Arena,clamp} from './engine.mjs';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/utils/SkeletonUtils.js';

const $=s=>document.querySelector(s), canvas=$('#arena');
let saved={}; try{ saved=JSON.parse(localStorage.getItem('miracle-v1')||'{}')||{} }catch{}
let style=['Boxer','Wrestler'].includes(saved.style)?saved.style:'Boxer';
let game=new Arena(style,saved), paused=false, held=false, move={x:0,y:0}, keys=new Set(), last=0, toastTime=0, sound=false, audio=null, stickId=null, W=innerWidth, H=innerHeight;

// ----- renderer -----
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.18;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x6d86a0); scene.fog=new THREE.Fog(0x6d7680,35,95);
const camera=new THREE.PerspectiveCamera(48,W/H,.1,180);
scene.add(new THREE.HemisphereLight(0xc7dcff,0x514334,1.55));
const sun=new THREE.DirectionalLight(0xffc78f,3.8); sun.position.set(-14,22,10); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-28; sun.shadow.camera.right=28; sun.shadow.camera.top=28; sun.shadow.camera.bottom=-28; scene.add(sun);
const fill=new THREE.DirectionalLight(0x7ca7ff,.9); fill.position.set(14,10,-14); scene.add(fill);

const world=new THREE.Group(), actors=new THREE.Group(), fx=new THREE.Group(); scene.add(world,actors,fx);
const std=(c,r=.75,m=.05)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const asphalt=std(0x2c3136,.98,.02), sidewalk=std(0x8a877e,.92,.02), concrete=std(0x707276,.9,.03), brick=std(0x7b463e,.9,.02), dark=std(0x1f252b,.7,.15), metal=std(0x56616a,.45,.65), glass=std(0x294b5f,.18,.35), yellow=std(0xc7a84a,.8,.05), red=std(0x8d2f2c,.55,.25), blue=std(0x355978,.5,.35);
const addBox=(x,y,z,sx,sy,sz,mat=concrete,parent=world,cast=true)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;parent.add(o);return o};
const addCyl=(x,y,z,r,h,mat=metal,parent=world)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};

// ----- city block -----
addBox(0,-.3,0,44,.6,34,asphalt,world,false);
// sidewalks
addBox(0,.02,-13.2,44,.18,4.6,sidewalk,world,false); addBox(0,.02,13.2,44,.18,4.6,sidewalk,world,false);
addBox(-18.5,.02,0,7,.18,22,sidewalk,world,false); addBox(18.5,.02,0,7,.18,22,sidewalk,world,false);
// road markings
for(let x=-15;x<=15;x+=5) addBox(x,.025,7.8,2.6,.02,.11,yellow,world,false);
for(let x=-15;x<=15;x+=5) addBox(x,.025,-7.8,2.6,.02,.11,yellow,world,false);
// curb lines
addBox(0,.05,-10.8,34,.08,.16,std(0xd0c8b9,.9,0),world,false); addBox(0,.05,10.8,34,.08,.16,std(0xd0c8b9,.9,0),world,false);

function building(x,z,w,d,h,c,accent=0x1f2c38){
  const g=new THREE.Group(); addBox(0,h/2,0,w,h,d,std(c,.86,.03),g,true);
  // roof lip
  addBox(0,h+.12,0,w+.3,.24,d+.3,dark,g,false);
  // shopfront / door band
  addBox(0,1.5,-d/2-.03,w*.88,2.8,.08,std(accent,.32,.28),g,false);
  // windows
  for(let yy=4;yy<h-1;yy+=2.6) for(let xx=-w/2+1.3;xx<w/2-1;xx+=2.5){
    const win=addBox(xx,yy,-d/2-.05,1.25,1.35,.06,glass,g,false); win.material.emissive=new THREE.Color(0x0f2737); win.material.emissiveIntensity=.28;
  }
  g.position.set(x,0,z); world.add(g); return g;
}
building(-10,-20,16,8,12,0x79463f,0x18242d); building(9,-20,18,8,15,0x5b4b45,0x233546);
building(-21,0,8,14,10,0x4e535a,0x18212a).rotation.y=Math.PI/2; building(21,0,8,14,13,0x6a5142,0x22303b).rotation.y=Math.PI/2;

// gym wall / yard frontage
addBox(0,4.2,-11.3,26,8.4,.65,brick); for(let x=-10;x<=10;x+=5){addBox(x,1.6,-10.95,3.2,3.1,.08,dark,world,false); addBox(x,5.4,-10.94,2.6,1.65,.06,glass,world,false)}
// chain link / yard fence
for(const z of [-8.7,8.7]){for(let x=-12;x<=12;x+=1.3){addBox(x,1.35,z,.035,2.7,.035,metal,world,false); const d=addBox(x+.45,1.35,z,.035,3.05,.035,metal,world,false); d.rotation.z=.72;}}

function car(x,z,rot,color){
 const g=new THREE.Group(); const body=addBox(0,.62,0,3.25,.6,1.45,std(color,.3,.62),g,true); body.geometry.translate(0,0,0);
 addBox(-.15,1.02,0,1.85,.48,1.2,glass,g,true);
 for(const dx of [-1.05,1.05])for(const dz of [-.65,.65]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.2,14),dark);w.rotation.x=Math.PI/2;w.position.set(dx,.35,dz);w.castShadow=true;g.add(w)}
 const hl=new THREE.PointLight(0xffe5b5,5,6,2);hl.position.set(1.7,.7,-.48);g.add(hl); g.position.set(x,0,z);g.rotation.y=rot;world.add(g);return g;
}
car(-13,6.3,.08,0x7a2630); car(12,-6.3,Math.PI-.1,0x2f5478); car(-11,-6.2,Math.PI+.08,0x5d5f62);

// props / urban clutter
for(const [x,z] of [[-7,6.5],[-5.8,6.7],[7.4,-6.7]]) addCyl(x,.6,z,.35,1.2,std(0x6e4939,.7,.25));
addBox(-8,.55,4.2,2.4,1.1,1.6,std(0x405c60,.65,.3)); addBox(7,.45,5.1,2.4,.9,1.5,std(0x52565a,.55,.45));
// benches and bollards
for(const x of [-3,3]){addBox(x,.35,9.8,2,.16,.55,dark); addBox(x-.75,.18,9.8,.12,.36,.12,metal); addBox(x+.75,.18,9.8,.12,.36,.12,metal)}
for(let x=-8;x<=8;x+=4)addCyl(x,.42,10.2,.12,.84,metal);

function lamp(x,z,color=0xffca8d){addCyl(x,2.7,z,.08,5.4,metal); const l=new THREE.PointLight(color,12,14,2);l.position.set(x,5.15,z);scene.add(l);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.1,10,8),new THREE.MeshBasicMaterial({color}));bulb.position.copy(l.position);scene.add(bulb)}
lamp(-12,9.6);lamp(12,-9.6,0x8dbfff);lamp(0,9.8);

function sign(text,x,y,z,w,h,color,rotY=0){const c=document.createElement('canvas');c.width=1024;c.height=256;const ct=c.getContext('2d');ct.fillStyle='#101318';ct.fillRect(0,0,1024,256);ct.font='900 112px Arial';ct.textAlign='center';ct.textBaseline='middle';ct.fillStyle=color;ct.shadowColor=color;ct.shadowBlur=30;ct.fillText(text,512,132);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true}));p.position.set(x,y,z);p.rotation.y=rotY;world.add(p)}
sign('MIRACLE ARENA',0,6.45,-10.92,10.5,1.8,'#f0bf73'); sign('THE YARD',-20.85,4.4,-1.5,4.1,1.1,'#72c5ff',Math.PI/2);

// skyline blocks for depth
for(let i=0;i<16;i++){const h=5+Math.random()*11,w=3+Math.random()*4;const b=addBox(-28+i*4,h/2,-29-Math.random()*8,w,h,5,std(0x3b4652,.82,.06),world,false);b.material.emissive=new THREE.Color(0x111821);b.material.emissiveIntensity=.2}

// ----- actors -----
let template=null, clips=[], playerV=null; const enemyV=new Map(), mixers=[]; const loader=new GLTFLoader();
function fallbackHuman(color=0x9b552f,boss=false){const g=new THREE.Group(),skin=std(0xb88b6d,.58,.02),cloth=std(color,.5,.12),pants=std(0x20262c,.62,.15);const part=(geo,ma,x,y,z)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};part(new THREE.CapsuleGeometry(boss?.34:.3,boss?.9:.75,5,10),cloth,0,boss?1.35:1.25,0);part(new THREE.SphereGeometry(boss?.29:.25,18,14),skin,0,boss?2.15:2.0,0);part(new THREE.CapsuleGeometry(.11,.62,5,10),pants,-.18,.48,0);part(new THREE.CapsuleGeometry(.11,.62,5,10),pants,.18,.48,0);part(new THREE.CapsuleGeometry(.09,.5,5,10),skin,-.4,1.3,0);part(new THREE.CapsuleGeometry(.09,.5,5,10),skin,.4,1.3,0);return {group:g,mixer:null,actions:{},current:null};}
function visual(kind='player',boss=false){
 if(!template)return fallbackHuman(kind==='player'?(style==='Boxer'?0xc17a37:0x477784):(boss?0x4f1817:0x7d2c27),boss);
 const root=SkeletonUtils.clone(template);root.scale.setScalar(boss?1.2:.96);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material=o.material.clone();if(kind==='player')o.material.color.multiply(new THREE.Color(style==='Boxer'?0xe6a260:0x79aeb6));else o.material.color.multiply(new THREE.Color(boss?0x81312e:0xb3554f));}}});
 const g=new THREE.Group();g.add(root);const glove=std(kind==='player'?0xd39842:0xb32e2e,.26,.25);for(const x of [-.26,.26]){const q=new THREE.Mesh(new THREE.SphereGeometry(.13,14,12),glove.clone());q.position.set(x,1.35,-.2);q.castShadow=true;g.add(q)}
 const mixer=new THREE.AnimationMixer(root),actions={};for(const clip of clips)actions[clip.name]=mixer.clipAction(clip);const idle=actions.Idle||Object.values(actions)[0];idle?.play();mixers.push(mixer);return {group:g,mixer,actions,current:idle};
}
function setAnim(v,n){if(!v?.mixer)return;const next=v.actions[n]||v.actions.Idle||Object.values(v.actions)[0];if(!next||next===v.current)return;v.current?.fadeOut(.12);next.reset().fadeIn(.12).play();v.current=next}
function rebuildPlayer(){if(playerV)actors.remove(playerV.group);playerV=visual('player');actors.add(playerV.group)}
rebuildPlayer();
loader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r180/examples/models/gltf/Soldier.glb',g=>{template=g.scene;clips=g.animations;rebuildPlayer();$('#loadStatus').textContent='Personaggio animato caricato · qualità alta attiva.';document.body.dataset.character='loaded'},undefined,()=>{$('#loadStatus').textContent='Errore modello 3D';document.body.dataset.character='fallback'});

function clearEnemies(){for(const v of enemyV.values())actors.remove(v.group);enemyV.clear()}
function syncActors(dt){if(!playerV)return;const p=game.p;playerV.group.position.set(p.x,0,p.y);playerV.group.rotation.y=-p.face+Math.PI;setAnim(playerV,Math.hypot(move.x,move.y)>.08?'Run':'Idle');if(p.attack>0){playerV.group.position.x+=Math.cos(p.face)*.13;playerV.group.position.z+=Math.sin(p.face)*.13}playerV.group.scale.setScalar(p.flash>0?1.04:1);
 const alive=new Set();for(const e of game.units){if(e.dead)continue;alive.add(e);let v=enemyV.get(e);if(!v){v=visual('enemy',e.boss);enemyV.set(e,v);actors.add(v.group)}v.group.position.set(e.x,0,e.y);v.group.rotation.y=-Math.atan2(p.y-e.y,p.x-e.x)+Math.PI;setAnim(v,e.wind>0?'Idle':'Walk');v.group.scale.setScalar(e.boss?1.18:1)}for(const [e,v] of enemyV)if(!alive.has(e)){actors.remove(v.group);enemyV.delete(e)}for(const m of mixers)m.update(dt)}

const effects=[];function spawnFx(){for(const e of game.effects){if(e._v)continue;e._v=true;const r=e.radius||.5,m=new THREE.Mesh(new THREE.RingGeometry(r*.72,r,34),new THREE.MeshBasicMaterial({color:e.skill?0xffc469:0xffffff,transparent:true,opacity:e.skill?.7:.32,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(e.x,.05,e.y);m.userData={life:.25,max:.25};fx.add(m);effects.push(m)}}
function tickFx(dt){for(let i=effects.length-1;i>=0;i--){const m=effects[i];m.userData.life-=dt;const q=Math.max(0,m.userData.life/m.userData.max);m.material.opacity=q*.6;m.scale.setScalar(1+(1-q)*.65);if(m.userData.life<=0){fx.remove(m);effects.splice(i,1)}}}

function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,W<900?1.45:1.75));camera.aspect=W/H;camera.updateProjectionMatrix();if(H>W&&game.state==='fight')setPause(true)}addEventListener('resize',resize);resize();
function render3D(dt){syncActors(dt);spawnFx();tickFx(dt);const p=game.p;const yaw=p.face;const behind=new THREE.Vector3(-Math.cos(yaw)*5.7,3.25,-Math.sin(yaw)*5.7);const side=new THREE.Vector3(-Math.sin(yaw)*1.2,0,Math.cos(yaw)*1.2);const desired=new THREE.Vector3(p.x,1.4,p.y).add(behind).add(side);camera.position.lerp(desired,1-Math.pow(.002,dt));const near=game.units.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];const look=new THREE.Vector3(p.x,1.35,p.y);if(near)look.lerp(new THREE.Vector3(near.x,1.3,near.y),.16);camera.lookAt(look);renderer.render(scene,camera)}

// ----- UI / gameplay -----
function save(){try{localStorage.setItem('miracle-v1',JSON.stringify(game.record()))}catch{}}
function beep(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='triangle';o.frequency.setValueAtTime(type==='hurt'?85:type==='skill'?240:145,audio.currentTime);o.frequency.exponentialRampToValueAtTime(45,audio.currentTime+.12);g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.start();o.stop(audio.currentTime+.16)}catch{}}
function toast(text){$('#toast').textContent=text;toastTime=3.4}
function hud(){const p=game.p;$('#fighter').textContent=style.toUpperCase();$('#level').textContent='LV '+String(game.level).padStart(2,'0');$('#hp').style.width=p.hp/p.max*100+'%';$('#energy').style.width=p.energy+'%';$('#stats').textContent=Math.ceil(p.hp)+' / '+p.max+' · MOMENTUM '+Math.floor(p.energy);$('#reputation').textContent='REPUTAZIONE '+game.rep;$('#objective').textContent=game.wave?game.wave===4?'Sconfiggi The Gatekeeper':'ONDATA '+game.wave+' · '+game.units.filter(e=>!e.dead).length+' OSTILI':'Conquista il quartiere';$('#skill').firstChild.textContent=p.skill>0?p.skill.toFixed(1)+'s':style==='Boxer'?'RAFFICA':'PROIEZIONE';$('#dodge').firstChild.textContent=p.dodge>0?p.dodge.toFixed(1)+'s':'SCHIVA';const boss=game.units.find(e=>e.boss&&!e.dead);$('#boss').style.display=boss?'block':'none';if(boss)$('#bosshp').style.width=Math.max(0,boss.hp/boss.max)*100+'%'}
function intermission(){save();$('#intermission').classList.remove('hidden');const won=game.state==='won',lost=game.state==='lost';$('#resultTitle').textContent=won?'QUARTIERE CONQUISTATO.':lost?'RIALZATI.':'ONDATA SUPERATA.';$('#resultText').textContent=won?'Hai sconfitto The Gatekeeper.':lost?'Riprova mantenendo progressione e reputazione.':'Reputazione: '+game.rep+'. Allenati oppure continua.';$('#next').textContent=won||lost?'TORNA IN STRADA':game.wave===3?'AFFRONTA THE GATEKEEPER':'PROSSIMA ONDATA';$('#train').disabled=game.rep<40||game.level>=20}
function resetInput(){held=false;keys.clear();move={x:0,y:0};stickId=null;$('#knob').style.transform='none';$('#attack').classList.remove('active')}
function setPause(v){if(game.state!=='fight')return;paused=v;resetInput();$('#paused').classList.toggle('hidden',!v)}
$('#pause').onclick=()=>setPause(true);$('#resume').onclick=()=>{if(W>H)setPause(false)};document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true)});addEventListener('blur',()=>{resetInput();setPause(true)});
document.querySelectorAll('[data-style]').forEach(b=>{b.classList.toggle('selected',b.dataset.style===style);b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('[data-style]').forEach(x=>x.classList.toggle('selected',x===b));game=new Arena(style,saved);rebuildPlayer();hud()}});
$('#start').onclick=()=>{game=new Arena(style,saved);game.start();clearEnemies();rebuildPlayer();$('#menu').classList.add('hidden');$('#controls').style.display='block';save()};
$('#next').onclick=()=>{resetInput();if(['won','lost'].includes(game.state)){saved=game.record();game=new Arena(style,saved)}game.start();$('#intermission').classList.add('hidden')};
$('#train').onclick=()=>{if(game.train()){save();hud();$('#resultText').textContent='Livello '+game.level+' raggiunto. Reputazione: '+game.rep;$('#train').disabled=game.rep<40||game.level>=20}};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent='AUDIO '+(sound?'ON':'OFF');if(sound)beep('skill')};
const stick=$('#stick');function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=clamp((e.clientX-r.left-r.width/2)/35,-1,1),dy=clamp((e.clientY-r.top-r.height/2)/35,-1,1),n=Math.max(1,Math.hypot(dx,dy));move={x:(dx+dy)/n*.707,y:(dy-dx)/n*.707};$('#knob').style.transform=`translate(${dx/n*28}px,${dy/n*28}px)`}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=stickMove;stick.onpointerup=stick.onpointercancel=()=>{stickId=null;move={x:0,y:0};$('#knob').style.transform='none'};
$('#attack').onpointerdown=e=>{e.preventDefault();held=true;e.currentTarget.setPointerCapture(e.pointerId);$('#attack').classList.add('active')};$('#attack').onpointerup=$('#attack').onpointercancel=()=>{held=false;$('#attack').classList.remove('active')};$('#skill').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('skill')};$('#dodge').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('dodge')};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.key==='Escape')setPause(!paused);if(!paused){if(e.key.toLowerCase()==='e')game.act('skill');if(e.key===' ')game.act('dodge')}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function frame(t){const dt=Math.min((t-last)/1000,.05)||0;last=t;const state=game.state;if(!paused&&W>H){let m=move;if(keys.size){const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||y)m={x:(x+y)*.707,y:(y-x)*.707}}if(held||keys.has('j'))game.act('attack');game.tick(dt,m);if(state==='fight'&&game.state!=='fight'){resetInput();intermission()}}while(game.events.length){const ev=game.events.shift();if(['punch','skill','hurt'].includes(ev))beep(ev);else toast(ev)}if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('#toast').textContent=''}hud();render3D(dt);requestAnimationFrame(frame)}
hud();requestAnimationFrame(frame);
