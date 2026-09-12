const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(script);
const context = vm.createContext({assert,console});
const helpers=script.slice(script.indexOf('function hashSeed('),script.indexOf('const randomSeed'));
const core=script.slice(script.indexOf('const CUBE_V ='),script.indexOf('const gradeOf ='));
const drawing=script.slice(script.indexOf('function drawStackAnchor('),script.indexOf('function drawCameraPoint('));
vm.runInContext(`
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),DEG=Math.PI/180,TIME_LIMIT=30,tr=(a,b)=>b;
let roundIdx=0,gameSeed='test',gameTwist=null,endlessRun=false,cylinderVPCount=3;
${helpers}
${core}
${drawing}
const make=(seed,w,h)=>{rng=mulberry32(seed);return genRound('stack',false,w,h);};
const perfect=r=>r.targets.map(t=>({pts:[t.pa,t.pb].map(p=>({...p}))}));
let minTargets=99,minPerfect=100,maxScaleError=0;
for(let seed=1;seed<=300;seed++){
  const r=make(seed,1280,900),a=r.cubes[0],b=r.cubes[1],rel=r.stackRelation;
  assert.equal(r.mode,'stack');assert.equal(r.practice,false);assert.equal(r.noCube,true);
  assert.ok(a.frameOk&&b.frameOk,'Both cubes must fit the fixed camera stage');
  assert.ok(Math.abs(Math.abs(a.rot.yaw)/DEG-39)<=9.01);
  assert.ok(Math.abs(Math.abs(a.rot.pitch)/DEG-34.5)<=7.51);
  assert.ok(Math.abs(Math.abs(rel[1])-2)<1e-12);
  assert.ok(Math.abs(rel[0])===.5||Math.abs(rel[0])===1);
  assert.ok(Math.abs(rel[2])===.5||Math.abs(rel[2])===1);
  assert.ok(r.targets.every(t=>t.cube===1));
  minTargets=Math.min(minTargets,r.targets.length);assert.ok(r.targets.length>=6,'seed '+seed+': '+r.targets.length+' visible runs');
  for(let i=0;i<3;i++) assert.ok(Math.hypot(a.exactVps[i].x-b.exactVps[i].x,a.exactVps[i].y-b.exactVps[i].y)<1e-9);
  const R=rotMat(a.rot.yaw,a.rot.pitch),q=mv(R,rel);
  assert.ok(Math.hypot((b.tx-a.tx)-q[0],(b.ty-a.ty)-q[1],(b.D-a.D)-q[2])<1e-10);
  const logical=logicalScoreInputs(r,[]).round,portrait=logicalScoreInputs(make(seed,390,844),[]).round;
  for(let ci=0;ci<2;ci++) logical.cubes[ci].P.forEach((p,i)=>
    assert.ok(Math.hypot(p.x-portrait.cubes[ci].P[i].x,p.y-portrait.cubes[ci].P[i].y)<1e-8));
  if(seed<=20){
    const score=scoreRound(r,perfect(r)).score;minPerfect=Math.min(minPerfect,score);assert.ok(score>=98,'seed '+seed+': perfect '+score);
    assert.equal(scoreRound(r,[]).score,0);
    const m=r.scoreLayout,shift=perfect(r).map(s=>({pts:s.pts.map(p=>({x:p.x+18*m.k,y:p.y}))}));
    const s1=scoreRound(r,shift).score,rp=make(seed,390,844),mp=rp.scoreLayout;
    const shiftP=perfect(rp).map(s=>({pts:s.pts.map(p=>({x:p.x+18*mp.k,y:p.y}))}));
    const s2=scoreRound(rp,shiftP).score;maxScaleError=Math.max(maxScaleError,Math.abs(s1-s2));
    assert.ok(Math.abs(s1-s2)<.02,'seed '+seed+': scale '+s1+'/'+s2);
  }
}
let round=make(5,1280,900),viewS=1,W=1280,H=900,dpr=1;
const finite=(...v)=>assert.ok(v.every(Number.isFinite)),noop=()=>{};
const ctx={save:noop,restore:noop,beginPath:noop,closePath:noop,fill:noop,stroke:noop,
 moveTo:finite,lineTo:finite,fillRect:finite,strokeRect:finite,roundRect:finite,setTransform:finite,
 setLineDash:a=>finite(...a),fillText:(s,x,y)=>finite(x,y)};
drawStackAnchor(round.cubes[0]);drawStackProjections();
console.log(JSON.stringify({seeds:300,minTargets,minPerfect,maxScaleError,drawing:'passed'}));
`,context,{timeout:60000});
