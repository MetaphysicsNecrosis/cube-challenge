const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new vm.Script(script); // Validate the complete standalone script as well.
const context = vm.createContext({assert, console});
const helpers = script.slice(script.indexOf('function hashSeed('), script.indexOf('const randomSeed'));
const geometryAndScoring = script.slice(script.indexOf('const CUBE_V ='), script.indexOf('const gradeOf ='));
const clipping = script.slice(script.indexOf('function clippedLine('), script.indexOf('function drawVanishingAid('));
const cylinderDrawing = script.slice(script.indexOf('function drawCylinderAid('), script.indexOf('function drawCameraPoint('));
vm.runInContext(`
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), DEG=Math.PI/180, TIME_LIMIT=30;
const tr=(ja,en)=>en;
let roundIdx=0, gameSeed='test', gameTwist=null, endlessRun=false, cylinderVPCount=3;
${helpers}
${geometryAndScoring}
${clipping}
${cylinderDrawing}
`, context);
vm.runInContext(`
const screen=(seed,w,h)=>{rng=mulberry32(seed);return genRound('cylinder',false,w,h);};
const perfect=r=>r.targets.map(t=>({pts:(t.pts||[t.pa,t.pb]).map(p=>({...p}))}));
let minPerfect=100, maxScaleError=0;
for(const vpCount of [2,3]) for(let seed=1;seed<=150;seed++){
  cylinderVPCount=vpCount;
  const r=screen(seed,1280,900),c=r.cubes[0];
  assert.equal(r.targets.length,3);
  assert.equal(r.practice,false);
  assert.ok(c.frameOk, 'Cylinder must fit camera stage');
  assert.ok(c.P.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  assert.equal(c.exactVps.filter(Boolean).length,vpCount);
  const R=rotMat(c.rot.yaw,c.rot.pitch), m=r.scoreLayout;
  const project=v=>{const q=mv(R,v);return {
    x:m.cx+(q[0]+c.tx)/(q[2]+c.D)*CAMERA_FOCAL*m.k,
    y:m.cy-(q[1]+c.ty)/(q[2]+c.D)*CAMERA_FOCAL*m.k};};
  for(const e of c.edges){
    const a=c.P[e.a],b=c.P[e.b],vp=c.exactVps[1];
    const dx=b.x-a.x,dy=b.y-a.y;
    if(vp) assert.ok(Math.abs(dx*(vp.y-a.y)-dy*(vp.x-a.x))/(Math.hypot(dx,dy)*Math.hypot(vp.x-a.x,vp.y-a.y))<1e-10);
    else assert.ok(Math.abs(dx)<1e-10,'2 VP cylinder sides must be vertical and parallel');
    // Tangent line supports the entire projected cylinder on one side.
    const signed=c.P.slice(0,192).map(p=>dx*(p.y-a.y)-dy*(p.x-a.x));
    assert.ok(Math.min(...signed)>-1e-7 || Math.max(...signed)<1e-7,'Side must be a silhouette tangent');
  }
  const logical=logicalScoreInputs(r,[]).round;
  const portrait=logicalScoreInputs(screen(seed,390,844),[]).round;
  logical.cubes[0].P.forEach((p,i)=>assert.ok(Math.hypot(p.x-portrait.cubes[0].P[i].x,p.y-portrait.cubes[0].P[i].y)<1e-8));
  if(seed<=10){
    const score=scoreRound(r,perfect(r)).score;
    minPerfect=Math.min(minPerfect,score);
    assert.ok(score>=98,'Perfect cylinder score: '+score);
    assert.equal(scoreRound(r,[]).score,0);
    const partial=scoreRound(r,perfect(r).slice(1)).score;
    assert.ok(partial<85,'Missing ellipse must lower score: '+partial);
    const shifted=perfect(r).map(s=>({pts:s.pts.map(p=>({x:p.x+24*m.k,y:p.y}))}));
    const a=scoreRound(r,shifted).score;
    const rp=screen(seed,390,844),pm=rp.scoreLayout;
    const shiftedP=perfect(rp).map(s=>({pts:s.pts.map(p=>({x:p.x+24*pm.k,y:p.y}))}));
    const b=scoreRound(rp,shiftedP).score;
    maxScaleError=Math.max(maxScaleError,Math.abs(a-b));
    assert.ok(Math.abs(a-b)<0.02,'Score must be screen-size independent');
  }
}
// Existing cube generation and scoring remain usable.
rng=mulberry32(42);
const cube=genRound('study',false,1280,900);
assert.ok(cube.targets.length>0);
assert.ok(scoreRound(cube,perfect(cube)).score>=98);
console.log(JSON.stringify({seeds:300,minPerfect,maxScaleError,cubeRegression:'passed'}));
// Exercise actual drawing functions at zoom extremes and both answer states.
let round,viewS=1,state='draw';
const viewWorldBox=()=>({l:-100/viewS,r:1180/viewS,t:-50/viewS,b:850/viewS});
const noop=()=>{}, coordinates=(...v)=>assert.ok(v.every(Number.isFinite));
const ctx={save:noop,restore:noop,beginPath:noop,stroke:noop,fill:noop,
  moveTo:coordinates,lineTo:coordinates,arc:coordinates,setLineDash:a=>coordinates(...a),
  fillText:(text,x,y)=>coordinates(x,y)};
for(const count of [2,3]) for(const zoom of [0.1,1,8]) for(const stage of ['draw','roundResult']){
  cylinderVPCount=count;round=screen(71,1280,900);viewS=zoom;state=stage;
  drawCylinderAid();drawCylinderDirection();
}
console.log('Drawing: 2/3 VP, zoom 0.1/1/8, draw/answer passed');
`,context,{timeout:60000});
