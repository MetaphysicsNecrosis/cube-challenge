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
let minTargets=99,minPerfect=100,maxScaleError=0,xrayCount=0,rotatedCount=0,extremeSizeCount=0;
for(let seed=1;seed<=300;seed++){
  const r=make(seed,1280,900),a=r.cubes[0],b=r.cubes[1],rel=r.stackRelation;
  assert.equal(r.mode,'stack');assert.equal(r.practice,false);assert.equal(r.noCube,true);
  assert.ok(a.frameOk&&b.frameOk,'Both cubes must fit the fixed camera stage');
  assert.ok(Math.abs(Math.abs(a.rot.yaw)/DEG-39)<=9.01);
  assert.ok(Math.abs(Math.abs(a.rot.pitch)/DEG-34.5)<=7.51);
  assert.ok([.5,.65,1,1.5,2].includes(r.stackScale));
  assert.ok([0,15,30,45].includes(Math.abs(r.stackTurnDeg)));
  assert.ok(Math.abs(Math.abs(rel[1])-(1+r.stackScale))<1e-12);
  const lateral=Math.min(1,r.stackScale);
  assert.ok(Math.abs(rel[0])===0||Math.abs(rel[0])===.5*lateral||Math.abs(rel[0])===lateral);
  assert.ok(Math.abs(rel[2])===0||Math.abs(rel[2])===.5*lateral||Math.abs(rel[2])===lateral);
  assert.ok(r.targets.every(t=>t.cube===1));
  minTargets=Math.min(minTargets,r.targets.length);
  if(r.stackXray){xrayCount++;assert.equal(r.targets.length,12);}
  else assert.ok(r.targets.length>=6,'seed '+seed+': '+r.targets.length+' visible runs');
  assert.ok(Math.hypot(a.exactVps[1].x-b.exactVps[1].x,a.exactVps[1].y-b.exactVps[1].y)<1e-9);
  if(r.stackTurnDeg===0) for(let i=0;i<3;i++)
    assert.ok(Math.hypot(a.exactVps[i].x-b.exactVps[i].x,a.exactVps[i].y-b.exactVps[i].y)<1e-9);
  else {rotatedCount++;assert.ok(Math.hypot(a.exactVps[0].x-b.exactVps[0].x,a.exactVps[0].y-b.exactVps[0].y)>1);}
  if(r.stackScale<=.5||r.stackScale>=2)extremeSizeCount++;
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
    assert.ok(Math.abs(s1-s2)<=.05,'seed '+seed+': scale '+s1+'/'+s2);
  }
}
let round=make(5,1280,900),viewS=1,W=1280,H=900,dpr=1;
const finite=(...v)=>assert.ok(v.every(Number.isFinite)),noop=()=>{};
const ctx={save:noop,restore:noop,beginPath:noop,closePath:noop,fill:noop,stroke:noop,
 moveTo:finite,lineTo:finite,fillRect:finite,strokeRect:finite,roundRect:finite,setTransform:finite,
 setLineDash:a=>finite(...a),fillText:(s,x,y)=>finite(x,y)};
const pg={...ctx,clearRect:finite,rect:finite,clip:noop,arc:finite};
const classList={add:noop,remove:noop,toggle:noop};
const elements={
 '#stackProjectionDock':{classList,clientWidth:480},
 '#stackProjectionTitle':{classList,textContent:''},
 '#stackProjectionCanvas':{clientWidth:460,clientHeight:142,getContext:()=>pg}
};
const $=id=>elements[id];
drawStackAnchor(round.cubes[0]);drawStackProjections();
assert.ok(xrayCount>0&&xrayCount<300,'Need both visible and XRAY tasks');
assert.ok(rotatedCount>150,'Most tasks should rotate B');
assert.ok(extremeSizeCount>50,'Large size differences should occur');
console.log(JSON.stringify({seeds:300,minTargets,minPerfect,maxScaleError,xrayCount,rotatedCount,extremeSizeCount,drawing:'passed'}));
`,context,{timeout:60000});
