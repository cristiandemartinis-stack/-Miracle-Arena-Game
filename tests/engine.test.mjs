import test from 'node:test';
import assert from 'node:assert/strict';
import {Arena} from '../dist/engine.mjs';
test('cooldown and skill energy prevent repeated damage',()=>{const a=new Arena();a.start();a.units=[{x:0,y:2,hp:100,max:100,dead:false,cd:2,wind:0}];assert.equal(a.act('skill'),true);const hp=a.units[0].hp;assert.equal(a.act('skill'),false);assert.equal(a.units[0].hp,hp);assert.equal(a.p.energy,62);});
test('dodge protects against an incoming strike',()=>{const a=new Arena();a.start();a.p.face=0;a.act('dodge');a.units=[{x:a.p.x,y:a.p.y,hp:100,max:100,dead:false,cd:0,wind:.01}];a.tick(.02);assert.equal(a.p.hp,a.p.max);});
test('defeat and victory resolve, final wave is a boss',()=>{const a=new Arena();for(let i=1;i<=4;i++){a.start();assert.equal(a.wave,i);if(i===4)assert.equal(a.units[0].boss,true);for(const e of a.units)a.hit(e,999);a.tick(.01);assert.equal(a.state,i===4?'won':'rest');}const b=new Arena();b.start();b.p.hp=0;b.tick(.01);assert.equal(b.state,'lost');});
test('training spends reputation, survives save, and is blocked in combat',()=>{const a=new Arena('Wrestler',{rep:80});assert.equal(a.train(),true);assert.equal(a.rep,40);assert.equal(a.level,2);const b=new Arena(a.style,a.record());assert.equal(b.p.max,112);b.start();assert.equal(b.train(),false);});
test('movement bounded and paused states do not advance combat',()=>{const a=new Arena();a.start();for(let i=0;i<1000;i++)a.tick(.05,{x:1,y:1});assert.ok(a.p.x<=7&&a.p.y<=6);a.state='rest';const x=a.p.x;a.tick(.05,{x:-1,y:0});assert.equal(a.p.x,x);});
