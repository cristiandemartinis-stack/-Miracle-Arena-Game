import {Arena,clamp} from './engine.mjs';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/utils/SkeletonUtils.js';

const $=s=>document.querySelector(s),canvas=$('#arena');
let saved={};try{saved=JSON.parse(localStorage.getItem('miracle-v1')||'{}')||{};}catch{}
let style=['Boxer','Wrestler'].includes(saved.style)?saved.style:'Boxer';
let game=new Arena(style,saved),paused=false,held=false,move={x:0,y:0},keys=new Set(),last=0,toastTime=0,audio=null,sound=false,stickId=null,W=innerWidth,H=innerHeight;

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setSize(W,H,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,W<900?1.35:1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xd77855);scene.fog=new THREE.Fog(0x8f6b64,28,72);
const camera=new THREE.PerspectiveCamera(50,W/H,.1,140);camera.position.set(8,5.6,10);
scene.add(new THREE.HemisphereLight(0xffd2ac,0x24364b,2.05));
const sun=new THREE.DirectionalLight(0xffc58f,3.7);sun.position.set(-10,18,8);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-22;scene.add(sun);
const fill=new THREE.DirectionalLight(0x7bb7ff,1.2);fill.position.set(12,7,-10);scene.add(fill);
const neon=new THREE.PointLight(0x43baff,16,18,2);neon.position.set(-8,4,-8);scene.add(neon);
const amber=new THREE.PointLight(0xff7b34,18,20,2);amber.position.set(9,4,7);scene.add(amber);

const world=new THREE.Group(),actors=new THREE.Group(),fx=new THREE.Group();scene.add(world,actors,fx);
const mat=(c,r=.72,m=.08)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const asphalt=mat(0x363b40,.95,.03),concrete=mat(0x8a8277,.92,.03),brick=mat(0x6d443b,.88,.02),metal=mat(0x5c6871,.42,.66),dark=mat(0x252b31,.74,.18),glass=mat(0x355c70,.18,.35),rust=mat(0x764936,.66,.3);
function box(x,y,z,sx,sy,sz,m=concrete,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;world.add(o);return o;}
function cyl(x,y,z,r,h,m=metal){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;world.add(o);return o;}

// Ground and road markings.
box(0,-.26,0,34,.5,28,asphalt,false);
for(let x=-14;x<=14;x+=4){const line=box(x,-.002,10.4,2.3,.012,.12,mat(0xe6d69c,.72,0),false);line.material.emissive=new THREE.Color(0x3c3321);line.material.emissiveIntensity=.15;}
box(0,.01,-9.2,25,.03,.14,mat(0xdccfbb,.9,0),false);
box(0,.01,8.9,25,.03,.14,mat(0xdccfbb,.9,0),false);

// Gym block and urban perimeter.
box(0,4.2,-12.3,30,8.5,1.2,brick);box(-15.3,3.2,0,1.0,6.5,27,dark);box(15.3,3.0,0,1.0,6.1,27,dark);
for(let x=-12;x<=12;x+=4){const w=box(x,4.9,-11.66,2.2,1.7,.08,glass,false);w.material.emissive=new THREE.Color(0x163448);w.material.emissiveIntensity=.32;}
for(let x=-10;x<=10;x+=5){box(x,1.4,-11.62,3.2,2.8,.1,dark,false);}

// Fire escapes / pipework.
for(const x of [-11,-6,7,12]){box(x,5.2,-11.2,.12,5.0,.12,metal);box(x+1.3,5.2,-11.2,.12,5.0,.12,metal);for(let y=3.1;y<7.3;y+=.75)box(x+.65,y,-11.2,1.4,.07,.07,metal);}
for(const x of [-13,13])for(let z=-8;z<=7;z+=2)box(x,2.4,z,.09,4.8,.09,metal);

// Chain-link fence visual approximation.
for(const z of [-8.6,8.3]){for(let x=-11;x<=11;x+=1.1){box(x,1.35,z,.035,2.7,.035,metal,false);const d=box(x+.45,1.35,z+.01,.035,3.2,.035,metal,false);d.rotation.z=Math.PI/5;}}

// Parked cars / props to make the yard feel like a real city block.
function car(x,z,rot,color){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(3.2,.55,1.45),mat(color,.35,.5));body.position.y=.58;body.castShadow=true;g.add(body);const cab=new THREE.Mesh(new THREE.BoxGeometry(1.75,.5,1.25),glass);cab.position.set(-.25,1.0,0);cab.castShadow=true;g.add(cab);for(const dx of [-1.05,1.05])for(const dz of [-.63,.63]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.18,12),dark);w.rotation.x=Math.PI/2;w.position.set(dx,.35,dz);w.castShadow=true;g.add(w);}g.position.set(x,0,z);g.rotation.y=rot;world.add(g);return g;}
car(-10,6.1,.1,0x5f1f23);car(10,-6.4,Math.PI-.15,0x284d6b);
box(-8,.65,5.0,2.1,1.3,1.7,rust);box(7,.5,5.5,2.5,1.0,1.7,metal);for(const x of [-5,5]){cyl(x,.8,7.2,.35,1.6,rust);}

// Streetlights and neon signage.
function lamp(x,z,color=0xffd0a3){cyl(x,2.8,z,.09,5.6,metal);const arm=box(x+(x<0?.45:-.45),5.4,z,.9,.07,.07,metal);const l=new THREE.PointLight(color,15,13,2);l.position.set(x,5.15,z);scene.add(l);const b=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color}));b.position.copy(l.position);scene.add(b);return arm;}
lamp(-11,7,0xffc078);lamp(11,-6,0x7fc1ff);lamp(4,7,0xffd29b);
function sign(text,x,y,z,w,h,color){const c=document.createElement('canvas');c.width=1024;c.height=256;const ct=c.getContext('2d');ct.fillStyle='#101318';ct.fillRect(0,0,1024,256);ct.font='900 118px Arial';ct.textAlign='center';ct.textBaseline='middle';ct.fillStyle=color;ct.shadowColor=color;ct.shadowBlur=35;ct.fillText(text,512,132);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true}));p.position.set(x,y,z);world.add(p);return p;}
sign('MIRACLE ARENA',2.4,6.3,-11.62,11,2.2,'#ffcf83');sign('THE YARD',-14.76,4.2,-2.5,4.2,1.2,'#6fd4ff').rotation.y=Math.PI/2;

// A touch of sky depth.
for(let i=0;i<18;i++){const h=3+Math.random()*7,w=2+Math.random()*3;const b=box(-26+i*3.1,h/2,-22-Math.random()*6,w,h,4,mat(0x3c4653,.78,.08),false);b.material.emissive=new THREE.Color(0x111820);b.material.emissiveIntensity=.22;}

let template=null,clips=[],playerV=null;const enemyV=new Map(),mixers=[];const loader=new GLTFLoader();
function fallbackHuman(color=0x915232,boss=false){const g=new THREE.Group(),skin=mat(0xb58a70,.62,.02),cloth=mat(color,.48,.12),pants=mat(0x20262c,.62,.15);const add=(geo,ma,x,y,z)=>{const o=new THREE.Mesh(geo,ma);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};add(new THREE.BoxGeometry(boss?.8:.66,boss?1.15:.98,boss?.45:.4),cloth,0,boss?1.38:1.23,0);add(new THREE.SphereGeometry(boss?.31:.27,20,16),skin,0,boss?2.17:1.98,0);add(new THREE.CapsuleGeometry(.115,.62,5,10),pants,-.19,.5,0);add(new THREE.CapsuleGeometry(.115,.62,5,10),pants,.19,.5,0);add(new THREE.CapsuleGeometry(.1,.52,5,10),skin,-.45,1.28,0);add(new THREE.CapsuleGeometry(.1,.52,5,10),skin,.45,1.28,0);return {group:g,mixer:null,actions:{},gloves:[]};}
function visual(kind='player',boss=false){if(!template)return fallbackHuman(kind==='player'?(style==='Boxer'?0x9a552f:0x3a6873):(boss?0x501917:0x6d2b27),boss);const root=SkeletonUtils.clone(template);root.scale.setScalar(boss?1.16:.93);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material){o.material=o.material.clone();if(kind==='player')o.material.color.multiply(new THREE.Color(style==='Boxer'?0xd9a05a:0x69a5ad));else o.material.color.multiply(new THREE.Color(boss?0x963a36:0xb56255));}}});const g=new THREE.Group();g.add(root);const gloveMat=mat(kind==='player'?0xc98f43:0xb33432,.3,.25),gloves=[];for(const x of [-.26,.26]){const q=new THREE.Mesh(new THREE.SphereGeometry(.13,14,12),gloveMat.clone());q.position.set(x,1.35,-.2);q.castShadow=true;g.add(q);gloves.push(q);}const mixer=new THREE.AnimationMixer(root),actions={};for(const clip of clips)actions[clip.name]=mixer.clipAction(clip);const idle=actions.Idle||Object.values(actions)[0];idle?.play();mixers.push(mixer);return {group:g,mixer,actions,gloves,current:idle};}
function setAnim(v,n){if(!v?.mixer)return;const next=v.actions[n]||v.actions.Idle||Object.values(v.actions)[0];if(next===v.current)return;v.current?.fadeOut(.14);next.reset().fadeIn(.14).play();v.current=next;}
function rebuildPlayer(){if(playerV)actors.remove(playerV.group);playerV=visual('player');actors.add(playerV.group);}
rebuildPlayer();
loader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r180/examples/models/gltf/Soldier.glb',g=>{template=g.scene;clips=g.animations;rebuildPlayer();$('#loadStatus').textContent='Personaggio animato caricato · qualità alta attiva.';},undefined,()=>{$('#loadStatus').textContent='Modalità compatibilità attiva.';});

function clearEnemies(){for(const v of enemyV.values())actors.remove(v.group);enemyV.clear();}
function syncActors(dt){if(!playerV)return;const p=game.p;playerV.group.position.set(p.x,0,p.y);playerV.group.rotation.y=-p.face+Math.PI;setAnim(playerV,Math.hypot(move.x,move.y)>.08?'Run':'Idle');if(p.attack>0){playerV.group.position.x+=Math.cos(p.face)*.16;playerV.group.position.z+=Math.sin(p.face)*.16;}playerV.group.scale.setScalar(p.flash>0?1.035:1);const alive=new Set();for(const e of game.units){if(e.dead)continue;alive.add(e);let v=enemyV.get(e);if(!v){v=visual('enemy',e.boss);enemyV.set(e,v);actors.add(v.group);}v.group.position.set(e.x,0,e.y);v.group.rotation.y=-Math.atan2(p.y-e.y,p.x-e.x)+Math.PI;setAnim(v,e.wind>0?'Idle':'Walk');v.group.scale.setScalar(e.boss?1.15:1);}for(const [e,v] of enemyV)if(!alive.has(e)){actors.remove(v.group);enemyV.delete(e);}for(const m of mixers)m.update(dt);}
const effects=[];function spawnFx(){for(const e of game.effects){if(e._v)continue;e._v=true;const r=e.radius||.5,m=new THREE.Mesh(new THREE.RingGeometry(r*.72,r,34),new THREE.MeshBasicMaterial({color:e.skill?0xffc469:0xffffff,transparent:true,opacity:e.skill?.7:.32,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(e.x,.04,e.y);m.userData={life:.25,max:.25};fx.add(m);effects.push(m);}}
function tickFx(dt){for(let i=effects.length-1;i>=0;i--){const m=effects[i];m.userData.life-=dt;const q=Math.max(0,m.userData.life/m.userData.max);m.material.opacity=q*.6;m.scale.setScalar(1+(1-q)*.65);if(m.userData.life<=0){fx.remove(m);effects.splice(i,1);}}}
function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,W<900?1.35:1.7));camera.aspect=W/H;camera.updateProjectionMatrix();if(H>W&&game.state==='fight')setPause(true);}addEventListener('resize',resize);resize();
function render3D(dt){syncActors(dt);spawnFx();tickFx(dt);const p=game.p,target=new THREE.Vector3(p.x,1.35,p.y),desired=new THREE.Vector3(p.x+6.2,4.7,p.y+7.2);camera.position.lerp(desired,1-Math.pow(.0015,dt));const near=game.units.filter(e=>!e.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];const look=near?target.clone().lerp(new THREE.Vector3(near.x,1.3,near.y),.18):target;camera.lookAt(look);renderer.render(scene,camera);}

function save(){try{localStorage.setItem('miracle-v1',JSON.stringify(game.record()));}catch{}}
function beep(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='triangle';o.frequency.setValueAtTime(type==='hurt'?85:type==='skill'?230:145,audio.currentTime);o.frequency.exponentialRampToValueAtTime(48,audio.currentTime+.12);g.gain.setValueAtTime(.06,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.14);o.start();o.stop(audio.currentTime+.15);}catch{}}
function toast(t){$('#toast').textContent=t;toastTime=3;}
function hud(){const p=game.p;$('#fighter').textContent=style.toUpperCase();$('#level').textContent='LV '+String(game.level).padStart(2,'0');$('#hp').style.width=p.hp/p.max*100+'%';$('#energy').style.width=p.energy+'%';$('#stats').textContent=Math.ceil(p.hp)+' / '+p.max+' · MOMENTUM '+Math.floor(p.energy);$('#reputation').textContent='REPUTAZIONE '+game.rep;$('#objective').textContent=game.wave?(game.wave===4?'Sconfiggi The Gatekeeper':'ONDATA '+game.wave+' · '+game.units.filter(e=>!e.dead).length+' OSTILI'):'Conquista il cortile';$('#skill').firstChild.textContent=p.skill>0?p.skill.toFixed(1)+'s':style==='Boxer'?'RAFFICA':'PROIEZIONE';$('#dodge').firstChild.textContent=p.dodge>0?p.dodge.toFixed(1)+'s':'SCHIVA';const boss=game.units.find(e=>e.boss&&!e.dead);$('#boss').style.display=boss?'block':'none';if(boss)$('#bosshp').style.width=Math.max(0,boss.hp/boss.max)*100+'%';}
function intermission(){save();$('#intermission').classList.remove('hidden');const won=game.state==='won',lost=game.state==='lost';$('#resultTitle').textContent=won?'IL CORTILE È TUO.':lost?'RIALZATI.':'UN PASSO AVANTI.';$('#resultText').textContent=won?'Hai sconfitto The Gatekeeper.':lost?'Il Coach ti aspetta. Livello e reputazione restano con te.':'Reputazione: '+game.rep+'. Allenati e continua.';$('#next').textContent=won||lost?'TORNA AL CORTILE':game.wave===3?'AFFRONTA THE GATEKEEPER':'PROSSIMA SFIDA';$('#train').disabled=game.rep<40||game.level>=20;}
function resetInput(){held=false;keys.clear();move={x:0,y:0};stickId=null;$('#knob').style.transform='none';$('#attack').classList.remove('active');}
function setPause(v){if(game.state!=='fight')return;paused=v;resetInput();$('#paused').classList.toggle('hidden',!v);}$('#pause').onclick=()=>setPause(true);$('#resume').onclick=()=>{if(W>H)setPause(false)};document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true)});addEventListener('blur',()=>{resetInput();setPause(true)});

document.querySelectorAll('[data-style]').forEach(b=>{b.classList.toggle('selected',b.dataset.style===style);b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('[data-style]').forEach(x=>x.classList.toggle('selected',x===b));game=new Arena(style,saved);rebuildPlayer();hud();};});
$('#start').disabled=false;$('#start').textContent='ENTRA A THE YARD';$('#loadStatus').textContent='Arena pronta · caricamento dettagli personaggio in background.';
$('#start').onclick=()=>{game=new Arena(style,saved);game.start();clearEnemies();$('#menu').classList.add('hidden');$('#controls').style.display='block';save();};
$('#next').onclick=()=>{resetInput();if(['won','lost'].includes(game.state)){saved=game.record();game=new Arena(style,saved);}game.start();$('#intermission').classList.add('hidden');};
$('#train').onclick=()=>{if(game.train()){save();hud();$('#resultText').textContent='Livello '+game.level+' raggiunto. Reputazione: '+game.rep;$('#train').disabled=game.rep<40||game.level>=20;}};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent='AUDIO '+(sound?'ON':'OFF');if(sound)beep('skill');};
const stick=$('#stick');function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=clamp((e.clientX-r.left-r.width/2)/35,-1,1),dy=clamp((e.clientY-r.top-r.height/2)/35,-1,1),n=Math.max(1,Math.hypot(dx,dy));move={x:(dx+dy)/n*.707,y:(dy-dx)/n*.707};$('#knob').style.transform=`translate(${dx/n*28}px,${dy/n*28}px)`;}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e)};stick.onpointermove=stickMove;stick.onpointerup=stick.onpointercancel=()=>{stickId=null;move={x:0,y:0};$('#knob').style.transform='none';};
$('#attack').onpointerdown=e=>{e.preventDefault();held=true;e.currentTarget.setPointerCapture(e.pointerId);$('#attack').classList.add('active')};$('#attack').onpointerup=$('#attack').onpointercancel=()=>{held=false;$('#attack').classList.remove('active')};$('#skill').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('skill')};$('#dodge').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('dodge')};
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.key==='Escape')setPause(!paused);if(!paused){if(e.key.toLowerCase()==='e')game.act('skill');if(e.key===' ')game.act('dodge')}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function frame(t){const dt=Math.min((t-last)/1000,.05)||0;last=t;const before=game.state;if(!paused&&W>H){let m=move;if(keys.size){const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||y)m={x:(x+y)*.707,y:(y-x)*.707};}if(held||keys.has('j'))game.act('attack');game.tick(dt,m);if(before==='fight'&&game.state!=='fight'){resetInput();intermission();}}while(game.events.length){const ev=game.events.shift();if(['punch','skill','hurt'].includes(ev))beep(ev);else toast(ev);}if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('#toast').textContent='';}hud();render3D(dt);requestAnimationFrame(frame);}hud();requestAnimationFrame(frame);
