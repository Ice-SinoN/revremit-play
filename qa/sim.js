// 画面なしの高速シム（α2：3エリア）。使い方：node qa/sim.js [回数=200] [smart|random]
// データ・engine・policy をそのまま読みこんで、MT と AT のクリア率を出す。
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const files=["data/rules.js","data/chars.js","data/cards.js","data/enemies.js","data/parts.js","js/engine.js","qa/policy.js"];
const src=files.map(f=>fs.readFileSync(path.join(root,f),"utf8").replace(/^"use strict";/,"")).join("\n;\n")+
  "\n;globalThis.__run=botRunHeadless;";
const ctx=vm.createContext({console,structuredClone,Math,JSON,Object,Array,Set,String,Number,Infinity});
vm.runInContext(src,ctx);
const N=+process.argv[2]||200,kind=process.argv[3]||"smart";
const out={};
for(const mode of["MT","AT"]){
  let clear=0,errs=[],areas=[0,0,0,0],hpSum=0;const t0=Date.now();
  for(let i=0;i<N;i++){
    try{const r=ctx.__run(mode,kind);if(r.err)errs.push(r.err);if(r.clear){clear++;hpSum+=r.hp}areas[r.area==null?0:r.area]++}
    catch(e){errs.push(String(e&&e.stack||e).split("\n").slice(0,3).join(" | "))}
  }
  out[mode]={clear,N,rate:Math.round(clear/N*1000)/10,avgHpOnClear:clear?Math.round(hpSum/clear):0,area1:Math.round((N-areas[0])/N*1000)/10,area2:Math.round((N-areas[0]-areas[1])/N*1000)/10,diedInArea:areas.slice(0,3),errs:errs.slice(0,5),errCount:errs.length,ms:Date.now()-t0};
}
console.log(JSON.stringify({kind,...out}));
