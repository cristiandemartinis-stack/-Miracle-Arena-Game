import {Arena,clamp} from './engine.mjs';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const $=s=>document.querySelector(s);
const canvas=$('#arena');
let saved={};try{saved=JSON.parse(localStorage.getItem('miracle-v1')||'{}')||{};}catch{}
let style=['Boxer','Wrestler'].includes(saved.style)?saved.style:'Boxer';
let game=new Arena(style,saved),paused=false,held=false,move={x:0,y:0},keys=new Set(),last=0,toastTime=0,audio=null,sound=false,stickId=null,W=innerWidth,H=innerHeight;

// ---------- THREE.JS / VISUAL LAYER ----------
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x090e11);
scene.fog=new THREE.FogExp2(0x0b1114,0.026);
const camera=new THREE.PerspectiveCamera(42,W/H,.1,120);
camera.position.set(15,17,15);camera.lookAt(0,0,0);

const hemi=new THREE.HemisphereLight(0x9ebbc8,0x1c1714,1.4);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe2b0,3.1);sun.position.set(-8,15,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-16;sun.shadow.camera.right=16;sun.shadow.camera.top=16;sun.shadow.camera.bottom=-16;scene.add(sun);
const rim=new THREE.PointLight(0x4ca8ff,24,28,2);rim.position.set(7,6,-8);scene.add(rim);
const fire=new THREE.PointLight(0xff6a2d,22,18,2);fire.position.set(-8,3,5);scene.add(fire);

const world=new THREE.Group();scene.add(world);
const mat=(color,rough=.75,metal=.1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
const floorMat=mat(0x2f3431,.95,.05),wallMat=mat(0x24282a,.9,.15),metalMat=mat(0x3e474b,.48,.72),rustMat=mat(0x5a3629,.78,.35);

const floor=new THREE.Mesh(new THREE.BoxGeometry(18,.35,16),floorMat);floor.position.y=-.24;floor.receiveShadow=true;world.add(floor);
const grid=new THREE.GridHelper(18,18,0x727a6f,0x343b38);grid.position.y=-.055;grid.material.opacity=.2;grid.material.transparent=true;world.add(grid);

function box(x,y,z,sx,sy,sz,m=wallMat,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.castShadow=cast;o.receiveShadow=true;world.add(o);return o;}
box(0,1.2,-7.8,18,2.6,.45);box(-8.8,1.2,0,.45,2.6,16);
for(let i=-7;i<=7;i+=2){box(i,2.8,-7.55,.12,3.3,.12,metalMat);}
box(5.7,1,-6.8,3.6,2,.7,rustMat);box(-6.8,.6,4.6,2.1,1.2,2.2,rustMat);box(6.7,.55,4.8,1.5,1.1,1.5,rustMat);

// Arena boundary and center markings.
const ring=new THREE.Mesh(new THREE.RingGeometry(4.35,4.42,64),new THREE.MeshBasicMaterial({color:0xb49b6f,transparent:true,opacity:.24,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.045;world.add(ring);
const ring2=new THREE.Mesh(new THREE.RingGeometry(6.55,6.59,64),new THREE.MeshBasicMaterial({color:0x8a7a5e,transparent:true,opacity:.12,side:THREE.DoubleSide}));ring2.rotation.x=-Math.PI/2;ring2.position.y=-.044;world.add(ring2);

function lamp(x,z,color=0xff8b45){const pole=box(x,1.5,z,.15,3,.15,metalMat);const bulb=new THREE.PointLight(color,8,8,2);bulb.position.set(x,3,z);scene.add(bulb);const b=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshBasicMaterial({color}));b.position.copy(bulb.position);scene.add(b);return pole;}
lamp(-7,5);lamp(7,-5,0x6ebdff);

// Simple atmospheric particles; fixed count, GPU friendly.
const dustGeo=new THREE.BufferGeometry();const dust=[];for(let i=0;i<140;i++)dust.push((Math.random()-.5)*18,Math.random()*7,(Math.random()-.5)*16);dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(dust,3));
const dustPts=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:0xcbbd99,size:.035,transparent:true,opacity:.33,depthWrite:false}));scene.add(dustPts);

const unitGroup=new THREE.Group();scene.add(unitGroup);
let playerVisual=null;const enemyVisuals=new Map();

function capsulePart(radius,height,material){const g=new THREE.CapsuleGeometry(radius,height,5,9);const m=new THREE.Mesh(g,material);m.castShadow=true;m.receiveShadow=true;return m;}
function makeFighter(isPlayer=false,boss=false){
 const g=new THREE.Group();
 const skin=mat(isPlayer?0xc8a083:0x9a765e,.72,.05),cloth=mat(isPlayer?(style==='Boxer'?0xc99b50:0x496d72):(boss?0x4a1817:0x602b26),.65,.1),dark=mat(0x171a1b,.7,.15),glove=mat(isPlayer?0xe1b266:0x9f4038,.45,.25);
 const torso=capsulePart(boss?.43:.34,boss?.82:.66,cloth);torso.position.y=boss?1.3:1.15;g.add(torso);
 const head=new THREE.Mesh(new THREE.SphereGeometry(boss?.31:.25,16,12),skin);head.position.y=boss?2.15:1.88;head.castShadow=true;g.add(head);
 const hair=new THREE.Mesh(new THREE.SphereGeometry(boss?.32:.26,16,8,0,Math.PI*2,0,Math.PI*.45),dark);hair.position.y=boss?2.25:1.98;hair.castShadow=true;g.add(hair);
 const legL=capsulePart(.11,.55,dark),legR=capsulePart(.11,.55,dark);legL.position.set(-.17,.46,0);legR.position.set(.17,.46,0);g.add(legL,legR);
 const armL=capsulePart(.095,.43,skin),armR=capsulePart(.095,.43,skin);armL.position.set(-.42,1.28,0);armR.position.set(.42,1.28,0);armL.rotation.z=-.28;armR.rotation.z=.28;g.add(armL,armR);
 const gloveL=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),glove),gloveR=gloveL.clone();gloveL.position.set(-.5,1.02,.02);gloveR.position.set(.5,1.02,.02);gloveL.castShadow=gloveR.castShadow=true;g.add(gloveL,gloveR);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(boss?.62:.48,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;g.add(shadow);
 if(isPlayer){const aura=new THREE.Mesh(new THREE.RingGeometry(.58,.68,32),new THREE.MeshBasicMaterial({color:0xe7b662,transparent:true,opacity:.66,side:THREE.DoubleSide,depthWrite:false}));aura.rotation.x=-Math.PI/2;aura.position.y=.04;g.add(aura);g.userData.aura=aura;}
 g.userData={...g.userData,torso,head,armL,armR,gloveL,gloveR,legL,legR,baseY:0,isPlayer,boss};return g;
}
function rebuildPlayer(){if(playerVisual)unitGroup.remove(playerVisual);playerVisual=makeFighter(true,false);unitGroup.add(playerVisual);}
rebuildPlayer();

function syncVisuals(){
 const p=game.p;if(!playerVisual)rebuildPlayer();
 playerVisual.position.set(p.x,0,p.y);playerVisual.rotation.y=-p.face+Math.PI/2;
 const walk=Math.sin(game.time*12)*.06;playerVisual.userData.legL.rotation.x=walk;playerVisual.userData.legR.rotation.x=-walk;
 const attacking=p.attack>.05;playerVisual.userData.armR.rotation.x=attacking?-1.2:0;playerVisual.userData.armR.rotation.z=.25;playerVisual.userData.gloveR.position.z=attacking?-.48:.02;
 playerVisual.userData.aura.material.opacity=p.inv>0?1:.55;
 playerVisual.scale.setScalar(p.flash>0?1.06:1);
 const alive=new Set();
 for(const e of game.units){if(e.dead)continue;alive.add(e);let v=enemyVisuals.get(e);if(!v){v=makeFighter(false,e.boss);enemyVisuals.set(e,v);unitGroup.add(v);}v.visible=true;v.position.set(e.x,0,e.y);v.rotation.y=-Math.atan2(p.y-e.y,p.x-e.x)+Math.PI/2;v.scale.setScalar(e.flash>0?1.07:1);const wind=Math.max(0,e.wind);v.userData.armL.rotation.x=wind>0?-1.0:0;v.userData.armR.rotation.x=wind>0?-1.0:0;}
 for(const [e,v] of enemyVisuals){if(!alive.has(e)){unitGroup.remove(v);enemyVisuals.delete(e);}}
}

const fxGroup=new THREE.Group();scene.add(fxGroup);let fxPool=[];
function spawnFx(){for(const e of game.effects){if(e._seen)continue;e._seen=true;const radius=e.radius||.5;const mesh=new THREE.Mesh(new THREE.RingGeometry(radius*.75,radius,32),new THREE.MeshBasicMaterial({color:e.skill?0xffd58b:0xffffff,transparent:true,opacity:e.skill?.8:.42,side:THREE.DoubleSide,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(e.x,.06,e.y);mesh.userData.life=Math.max(.12,e.life||.22);mesh.userData.max=mesh.userData.life;fxGroup.add(mesh);fxPool.push(mesh);}}
function tickFx(dt){for(let i=fxPool.length-1;i>=0;i--){const m=fxPool[i];m.userData.life-=dt;const q=Math.max(0,m.userData.life/m.userData.max);m.material.opacity=q*.75;m.scale.setScalar(1+(1-q)*.45);if(m.userData.life<=0){fxGroup.remove(m);m.geometry.dispose();m.material.dispose();fxPool.splice(i,1);}}}

function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);renderer.setPixelRatio(Math.min(devicePixelRatio||1,W<900?1.35:1.6));camera.aspect=W/H;camera.updateProjectionMatrix();if(H>W&&game.state==='fight')setPause(true);}addEventListener('resize',resize);resize();

function render3D(dt){syncVisuals();spawnFx();tickFx(dt);dustPts.rotation.y=game.time*.01;const target=new THREE.Vector3(game.p.x*.10,.85,game.p.y*.10);camera.lookAt(target);fire.intensity=20+Math.sin(game.time*6)*3;renderer.render(scene,camera);}

// ---------- GAME / UI ----------
function save(){try{localStorage.setItem('miracle-v1',JSON.stringify(game.record()));}catch{$('#saveStatus').textContent='Salvataggio non disponibile in questo browser.';}}
function beep(type){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.connect(g);g.connect(audio.destination);o.type='triangle';o.frequency.setValueAtTime(type==='hurt'?85:type==='skill'?240:145,audio.currentTime);o.frequency.exponentialRampToValueAtTime(45,audio.currentTime+.12);g.gain.setValueAtTime(.08,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);o.start();o.stop(audio.currentTime+.16);}catch{}}
function toast(text){$('#toast').textContent=text;toastTime=3.5;}
function hud(){const p=game.p;$('#fighter').textContent=style.toUpperCase();$('#level').textContent='LV '+String(game.level).padStart(2,'0');$('#hp').style.width=p.hp/p.max*100+'%';$('#energy').style.width=p.energy+'%';$('#stats').textContent=Math.ceil(p.hp)+' / '+p.max+' · MOMENTUM '+Math.floor(p.energy);$('#reputation').textContent='REPUTAZIONE '+game.rep;$('#objective').textContent=game.wave?game.wave===4?'Sconfiggi The Gatekeeper':'Sfida '+game.wave+' / 3 · '+game.units.filter(e=>!e.dead).length+' avversari':'Conquista il cortile';$('#skill').firstChild.textContent=p.skill>0?p.skill.toFixed(1)+'s':style==='Boxer'?'RAFFICA':'PROIEZIONE';$('#dodge').firstChild.textContent=p.dodge>0?p.dodge.toFixed(1)+'s':'SCHIVA';const boss=game.units.find(e=>e.boss&&!e.dead);$('#boss').style.display=boss?'block':'none';if(boss)$('#bosshp').style.width=Math.max(0,boss.hp/boss.max)*100+'%';}
function intermission(){save();$('#intermission').classList.remove('hidden');const won=game.state==='won',lost=game.state==='lost';$('#resultTitle').textContent=won?'IL CORTILE È TUO.':lost?'RIALZATI.':'UN PASSO AVANTI.';$('#resultText').textContent=won?'Hai sconfitto The Gatekeeper. Allenati o ricomincia con il tuo livello attuale.':lost?'Il Coach ti aspetta. Livello e reputazione restano con te.':'Reputazione: '+game.rep+'. Allenati per aumentare salute e potenza. La prossima sfida ripristina salute e Momentum.';$('#next').textContent=won||lost?'TORNA AL CORTILE':game.wave===3?'AFFRONTA THE GATEKEEPER':'PROSSIMA SFIDA';$('#train').disabled=game.rep<40||game.level>=20;}
function resetInput(){held=false;keys.clear();move={x:0,y:0};stickId=null;$('#knob').style.transform='none';$('#attack').classList.remove('active');}
function setPause(value){if(game.state!=='fight')return;paused=value;resetInput();$('#paused').classList.toggle('hidden',!value);}
$('#pause').onclick=()=>setPause(true);$('#resume').onclick=()=>{if(W>H)setPause(false);};document.addEventListener('visibilitychange',()=>{if(document.hidden)setPause(true);});addEventListener('blur',()=>{resetInput();setPause(true);});
document.querySelectorAll('[data-style]').forEach(b=>{b.classList.toggle('selected',b.dataset.style===style);b.onclick=()=>{style=b.dataset.style;document.querySelectorAll('[data-style]').forEach(x=>x.classList.toggle('selected',x===b));game=new Arena(style,saved);rebuildPlayer();hud();};});
$('#start').onclick=()=>{game=new Arena(style,saved);game.start();enemyVisuals.clear();while(unitGroup.children.length>1)unitGroup.remove(unitGroup.children[unitGroup.children.length-1]);rebuildPlayer();$('#menu').classList.add('hidden');$('#controls').style.display='block';save();};
$('#next').onclick=()=>{resetInput();if(['won','lost'].includes(game.state)){saved=game.record();game=new Arena(style,saved);}game.start();$('#intermission').classList.add('hidden');};
$('#train').onclick=()=>{if(game.train()){save();hud();$('#resultText').textContent='Livello '+game.level+' raggiunto. Salute e potenza aumentate. Reputazione: '+game.rep;$('#train').disabled=game.rep<40||game.level>=20;}};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent='Audio '+(sound?'ON':'OFF');if(sound)beep('skill');};
const stick=$('#stick');function stickMove(e){if(e.pointerId!==stickId)return;const r=stick.getBoundingClientRect(),dx=clamp((e.clientX-r.left-r.width/2)/35,-1,1),dy=clamp((e.clientY-r.top-r.height/2)/35,-1,1),n=Math.max(1,Math.hypot(dx,dy));move={x:(dx+dy)/n*.707,y:(dy-dx)/n*.707};$('#knob').style.transform=`translate(${dx/n*28}px,${dy/n*28}px)`;}
stick.onpointerdown=e=>{e.preventDefault();stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);};stick.onpointermove=stickMove;stick.onpointerup=stick.onpointercancel=()=>{stickId=null;move={x:0,y:0};$('#knob').style.transform='none';};
$('#attack').onpointerdown=e=>{e.preventDefault();held=true;e.currentTarget.setPointerCapture(e.pointerId);$('#attack').classList.add('active');};$('#attack').onpointerup=$('#attack').onpointercancel=()=>{held=false;$('#attack').classList.remove('active');};$('#skill').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('skill');};$('#dodge').onpointerdown=e=>{e.preventDefault();if(!paused)game.act('dodge');};
addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.repeat)return;if(e.key==='Escape')setPause(!paused);if(!paused){if(e.key.toLowerCase()==='e')game.act('skill');if(e.key===' ')game.act('dodge');}});addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

function frame(t){const dt=Math.min((t-last)/1000,.05)||0;last=t;const state=game.state;if(!paused&&W>H){let m=move;if(keys.size){const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||y)m={x:(x+y)*.707,y:(y-x)*.707};}if(held||keys.has('j'))game.act('attack');game.tick(dt,m);if(state==='fight'&&game.state!=='fight'){resetInput();intermission();}}
 while(game.events.length){const ev=game.events.shift();if(['punch','skill','hurt'].includes(ev))beep(ev);else toast(ev);}if(toastTime>0){toastTime-=dt;if(toastTime<=0)$('#toast').textContent='';}hud();render3D(dt);requestAnimationFrame(frame);}
hud();requestAnimationFrame(frame);
