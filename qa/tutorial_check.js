// チュートリアルの手順（design 8章）を、本物の engine の上で1手ずつ流して確かめる（デザイン班 claude/qa-harness/revremit-tutorial-check.js の写し）。
// 使い方：ゲームのフォルダで  node qa/tutorial_check.js
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=path.join(__dirname,"..");
const src=["data/rules.js","data/chars.js","data/cards.js","data/enemies.js","data/parts.js","js/engine.js"].map(f=>fs.readFileSync(path.join(root,f),"utf8").replace(/^"use strict";/,"")).join("\n;\n")+`;
globalThis.T=function(S){
  newRunState("MT","YUKI",[]);ENEMIES.tut=S.enemy;
  // hpMul を打ち消す（練習の敵は表のまま）
  startBattleState("tut");B.e.hp=B.e.maxhp=S.enemy.hp;B.am=1;
  B.hand=S.hand.map(id=>inst(id));B.draw=S.draw.slice().reverse().map(id=>inst(id));B.disc=[];B.rpm=S.rpm;B.gear=S.gear;
  const out=[];let turns=0,downs=0;
  const st=()=>"["+(B.gear+1)+"速 "+B.rpm+" G"+B.gas+" CH"+B.chain+" 手:"+B.hand.map(c=>c.id).join(",")+" 敵"+B.e.hp+" 耐"+G.hp+"]";
  for(const step of S.steps){
    out.push("== "+step.id+(step.setup?" (setup)":""));
    if(step.setup)eval(step.setup);
    out.push("  はじめ "+st());
    for(const a of step.acts){
      if(a.touch){const i=B.hand.findIndex(c=>c.id===a.touch);const p=preview(B.hand[i]);out.push("  触る "+a.touch+" → "+p.txt+(p.band?" ★帯":"")+(p.danger?" danger="+p.danger:""));continue}
      if(a.play){const i=B.hand.findIndex(c=>c.id===a.play);if(i<0){out.push("  !! 手札にない "+a.play);continue}
        const p=preview(B.hand[i]);if(!p.ok){out.push("  !! 打てない "+a.play+" "+p.txt);continue}
        const e0=B.e.hp;const r=playCard(i,!!a.shift);const evs=takeEvents().filter(e=>e.k==="shift"||e.k==="over"||e.k==="blow"||e.k==="turn");
        out.push("  打つ "+a.play+(a.shift?"⇧":"")+(p.band?"★":"")+" "+(p.grade||"")+" dmg"+(e0-B.e.hp)+" r="+r+" "+st()+(evs.length?" ev:"+JSON.stringify(evs):""));
        if(r==="turn"){turns++;out.push("  → 相手の番が来てもどった "+st())}continue}
      if(a.down){const r=downShift();downs++;out.push("  ↓シフト r="+r+" "+st());continue}
      if(a.end){const r=endTurn();turns++;out.push("  ターン終了 r="+r+" "+st());continue}
    }
  }
  out.push(B.log.join(" / "));return out.join("\\n");
}`;
const ctx=vm.createContext({console,structuredClone,Math,JSON,Object,Array,Set,String,Number,Infinity,Date});vm.runInContext(src,ctx);
module.exports=ctx;
const SCRIPT={
 enemy:{n:"練習用ゴースト",hp:200,spd:12,pat:[["atk",3],["blk",4],["atk",3]]},
 rpm:1000,gear:0,
 hand:["hakusen","rikka","pitboard","hakusen","hyouga","shimo","counter"],
 draw:["whiteout","braking","hakunetsu","rinkai"],
 steps:[
  {id:"preview",acts:[{touch:"hakusen"}]},
  {id:"rpm",acts:[{play:"hakusen"}]},
  {id:"shift",acts:[{touch:"rikka"},{play:"rikka",shift:true}]},
  {id:"gas",acts:[{play:"pitboard"},{play:"hakusen"}]},
  {id:"chain",acts:[{play:"hyouga"},{play:"shimo",shift:true},{play:"counter",shift:true},{touch:"whiteout"},{play:"whiteout"}]},
  {id:"red",setup:"B.gear=5;B.rpm=7400",acts:[{touch:"hakunetsu"},{touch:"braking"},{end:1}]},
  {id:"down",acts:[{down:1}]},
  {id:"finish",setup:"B.e.hp=Math.min(B.e.hp,30)",acts:[{touch:"rinkai"},{play:"rinkai"}]},
 ]};

if(require.main===module){const S=process.argv[2]?require(require("path").resolve(process.argv[2])):SCRIPT;console.log(ctx.T(S))}
