// β のボット（v14 の後継・v0.21）。夜・キャラ・解放の状態を指定してクリア率を出す。ゲームのフォルダで：
//   node qa/beta-sim.js [回数=200] [smart|random]
// 環境変数：
//   NIGHT=1〜11（既定 1）            CHAR=YUKI
//   POOL=all｜start｜a1｜a2｜clear   解放の状態（all＝40種・35個ぜんぶ／start＝初めから18種・15個／a1・a2・clear＝そこまで突破したぶん）
//   PROG='{"areas":["a1"],"nightMax":2,"sCount":1,"cards":["drift"]}'  解放の状態を細かく（POOL より優先）
//   PREF=v14｜beta｜noepic           報酬のカードの好み（v14＝v14 のまま・新しいカードは取らない／beta＝新しいカードも／noepic＝エピックを後回し）
//   HIDDEN=1                          裏道を出す（NIGHT 1 クリア後の状態）。MODE=MT｜AT（既定は両方）
// 出力：{MT:{all,a1,a2,err,hidden,log}, AT:{…}}（%・裏道に入った平均回数・ログの平均）。v14 と同じ数え方（a1＝エリア1 突破）。
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const files=["data/rules.js","data/chars.js","data/cards.js","data/enemies.js","data/parts.js","data/nights.js","data/unlock.js","js/engine.js","qa/policy.js","qa/beta-policy.js"].concat(process.env.ALLYPREF==="1"||process.env.PREF==="rp"?["qa/ally-pref.js"]:[]);/* ★LD 11-11：ALLYPREF=1 で仲間の好みを RP の順に */
const src=files.map(f=>fs.readFileSync(path.join(root,f),"utf8").replace(/^"use strict";/,"")).join("\n;\n")+";globalThis.__B=BETA;";
const ctx=vm.createContext({console,structuredClone,Math,JSON,Object,Array,Set,String,Number,Infinity});
vm.runInContext(src+";globalThis.__G=()=>({B});",ctx);const BETA=ctx.__B;Object.defineProperty(ctx,"B",{get:()=>ctx.__G().B});
/* ★v0.22.98 ドライブモード（AT）：DRIVE=eco|sport|alt|smart（なし＝エコのまま）。smart＝エリート・ボス・裏道か、敵の体力が4割以下ならスポーツ */
if(process.env.DRIVE){const D=process.env.DRIVE;let k=0;vm.runInContext(`globalThis.DRIVE_PICK=()=>{const D=${JSON.stringify(D)};if(D==="alt")return (globalThis.__dk=(globalThis.__dk||0)+1)%2?"eco":"sport";if(D==="smart")return (B.e.rank==="elite"||B.e.rank==="boss"||B.hidden||B.e.hp<=B.e.maxhp*0.4)?"sport":"eco";return D}`,ctx)}
const N=+process.argv[2]||200,kind=process.argv[3]||"smart",night=+(process.env.NIGHT||1),pool=process.env.POOL||"all";
const POOLS={all:"all",start:"start",a1:{areas:["a1"]},a2:{areas:["a1","a2"]},clear:{areas:["a1","a2","clear"],nightMax:1}};
const prog=process.env.PROG?JSON.parse(process.env.PROG):POOLS[pool];if(prog===undefined)throw new Error("POOL がちがう："+pool);
const ul=BETA.ul(prog),modes=process.env.MODE?[process.env.MODE]:["MT","AT"],out={char:process.env.CHAR||"YUKI",night,allyPref:process.env.ALLYPREF==="1"||process.env.PREF==="rp"?"rp":"now",pool:process.env.PROG?"PROG":pool,pref:process.env.PREF||"v14",drive:process.env.DRIVE||"eco",cards:ul?ul.cards.length:40,parts:ul?ul.parts.length:35};
for(const mode of modes){let clear=0,errs=0,areas=[0,0,0,0],hid=0,log=0;const t0=Date.now();
  for(let i=0;i<N;i++){try{const r=BETA.run(mode,{kind,night,char:process.env.CHAR||"YUKI",ul,hidden:!!process.env.HIDDEN,noAllyBoss:process.env.ALLYBOSS==="0",pref:process.env.PREF});
      if(r.err){errs++;if(process.env.DBG)console.error("ERR",r.err,"area",r.area,"row",r.row,"enemy",ctx.B&&ctx.B.key,"ehp",ctx.B&&ctx.B.e.hp,"eblk",ctx.B&&ctx.B.e.block,"hp",r.hp,"turns",ctx.B&&ctx.B.pTurns)}if(r.clear)clear++;areas[r.area==null?0:r.area]++;hid+=r.hidden;log+=r.log}
    catch(e){errs++;if(errs<2)console.error(String(e.stack).split("\n").slice(0,3).join(" | "))}}
  out[mode]={all:Math.round(clear/N*1000)/10,a1:Math.round((N-areas[0])/N*1000)/10,a2:Math.round((N-areas[0]-areas[1])/N*1000)/10,err:errs,hidden:Math.round(hid/N*100)/100,log:Math.round(log/N),ms:Date.now()-t0}}
console.log(JSON.stringify(out));
