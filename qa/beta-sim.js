// β のボット（v14 の後継・v0.21）。夜・キャラ・解放の状態を指定してクリア率を出す。ゲームのフォルダで：
//   node qa/beta-sim.js [回数=200] [smart|random]
// 環境変数：
//   NIGHT=1〜11（既定 1）            CHAR=YUKI
//   POOL=all｜start｜a1｜a2｜clear   解放の状態（all＝40種・35個ぜんぶ／start＝初めから18種・15個／a1・a2・clear＝そこまで突破したぶん）
//   PROG='{"areas":["a1"],"nightMax":2,"sCount":1,"cards":["drift"]}'  解放の状態を細かく（POOL より優先）
//   PREF=v14｜beta｜noepic           報酬のカードの好み（v14＝v14 のまま・新しいカードは取らない／beta＝新しいカードも／noepic＝エピックを後回し）
//   POOL=prog（★v0.22.130）           夜ごとの解放の形（balance 10-3）。HIDDEN は N2 から自動で 1（HIDDEN=0／1 で上書き）
//   HIDDEN=1                          裏道を出す（NIGHT 1 クリア後の状態）。MODE=MT｜AT（既定は両方）
//   ★v0.22.204 育った形（design：N9 などを人の強さに近い形で測る）：
//   GROW=1                           TREE・OG・MC をまとめて入れる（下の既定）
//   TREE=3,2,0                       ツリーの段（枝ごと 0〜4・4＝型の決めは1本だけ）。なければ PTS からいちばん低い枝を順に上げる
//   PTS=n                            ツリーのポイント（GROW=1 で TREE なしのとき。既定＝(NIGHT−1)×2）。段の値段は TREE_COST（1・2・3・4）
//   OG=1｜deck                       その子の奥義3枚を解放（報酬に出る）／deck＝さらに1枚をはじめからデッキに
//   MC=auto｜'{"rank":"A","cards":[{"id":"…","up":1},{"id":"…","up":1}],"part":"…"}'  持ちこみ1台。auto＝同じ設定の育ってない形で20回走って、
//                                    いちばん進んだランの強化ずみのカード2枚（レア度の高い順）と最初のパーツ・ランク MCRANK（既定 B）
// 出力：{MT:{all,a1,a2,err,hidden,log}, AT:{…}}（%・裏道に入った平均回数・ログの平均）。v14 と同じ数え方（a1＝エリア1 突破）。
const fs=require("fs"),path=require("path"),vm=require("vm");
const root=path.join(__dirname,"..");
const files=["data/rules.js","data/chars.js","data/cards.js","data/enemies.js","data/parts.js","data/nights.js","data/unlock.js","js/engine.js","qa/policy.js","qa/beta-policy.js"].concat(process.env.ALLYPREF==="1"||process.env.PREF==="rp"?["qa/ally-pref.js"]:[]);/* ★LD 11-11：ALLYPREF=1 で仲間の好みを RP の順に */
const src=files.map(f=>fs.readFileSync(path.join(root,f),"utf8").replace(/^"use strict";/,"")).join("\n;\n")+";globalThis.__B=BETA;";
const ctx=vm.createContext({console,structuredClone,Math,JSON,Object,Array,Set,String,Number,Infinity});
vm.runInContext(src+";globalThis.__G=()=>({B});",ctx);const BETA=ctx.__B;Object.defineProperty(ctx,"B",{get:()=>ctx.__G().B});
/* ★v0.22.98 ドライブモード（AT）：DRIVE=eco|sport|alt|smart（なし＝エコのまま）。smart＝エリート・ボス・裏道か、敵の体力が4割以下ならスポーツ */
if(process.env.DRIVE){const D=process.env.DRIVE;let k=0;vm.runInContext(`globalThis.DRIVE_PICK=()=>{const D=${JSON.stringify(D)};if(D==="alt")return (globalThis.__dk=(globalThis.__dk||0)+1)%2?"eco":"sport";if(D==="smart")return (B.e.rank==="elite"||B.e.rank==="boss"||B.hidden||B.e.hp<=B.e.maxhp*0.4)?"sport":"eco";return D}`,ctx)}
/* ★v0.22.126 LD 11-84：WEAK=0|1|2（弱点ギアを狙う）。出力にボスごとの勝ちと、ボス戦のアタックのうち弱点のギアで当てた割合 */
BETA.weak=+(process.env.WEAK||0);BETA.route=process.env.ROUTE||null;/* ★v0.22.133 ROUTE=fight|garage */if(process.env.WEAK_HIT)BETA.WEAK_HIT=+process.env.WEAK_HIT;if(process.env.WEAK_STEP)BETA.WEAK_STEP=+process.env.WEAK_STEP;
/* ★v0.22.126 WX=dry|rain|snow：天候のあるマス（戦闘・エリート・裏道）を全部その天候にする（天候の得意・不得意の測り）。なし＝ふつうの抽選 */
BETA.wx=process.env.WX||null;if(process.env.WH==="0")vm.runInContext("RULES.heat.winHeal=0",ctx);/* ★v0.22.153 勝つと回復を切る（WH=0） */if(process.env.FUSE==="0")BETA.fuse=false;if(process.env.PAIRUP==="0")BETA.pairFirst=false;/* ★v0.22.159 組の2枚から先に強化しない前の形（PAIRUP=0） *//* ★v0.22.151 E14：合成しない前の形（FUSE=0） */if(process.env.GG==="0")vm.runInContext("for(const k in GHOST_GUARD)delete GHOST_GUARD[k]",ctx);/* ★v0.22.150 ゴーストの守りを切って前と比べる（GG=0） */if(process.env.WXOLD==="1")vm.runInContext("WX_ON.splice(3)",ctx);/* ★v0.22.147 霧・夜明けを切って前と比べる（WXOLD=1） */if(process.env.FORK==="0")vm.runInContext(`{const o=nightRules;nightRules=n=>Object.assign(o(n),{fork:0})}`,ctx);/* ★v0.22.144 分かれ道 +1 を切って前と比べる（FORK=0） */
const N=+process.argv[2]||200,kind=process.argv[3]||"smart",night=+(process.env.NIGHT||1),pool=process.env.POOL||"all";
const POOLS={all:"all",start:"start",a1:{areas:["a1"]},a2:{areas:["a1","a2"]},clear:{areas:["a1","a2","clear"],nightMax:1}};
/* ★v0.22.130 LD（窓口 11-25 14:02）：POOL=prog＝夜ごとの解放の形（balance 10-3）。N1 はじめ・N2〜5 表の解放・N6〜 全部。仲間はその子の a1・a2・clear も足す。
   HIDDEN は POOL=prog のとき N2 から 1（HIDDEN=0／1 で上書き）。PROG='{…}' の直接指定がいちばん先 */
const CH=process.env.CHAR||"YUKI";
function progOf(n){if(n<=1)return"start";if(n>=6)return"all";const A=["a1","a2","clear"].concat(CH!=="YUKI"?["a1","a2","clear"].map(a=>CH+":"+a):[]);
  const T={2:{areas:A,nightMax:1},3:{areas:A,nightMax:2,sCount:1,cards:["hyouen","drift"]},4:{areas:A,nightMax:3,sCount:2,cards:["hyouen","kyokkou","drift","hyouheki"]},5:{areas:A,nightMax:4,sCount:3,cards:["hyouen","kyokkou","renpou","drift","hyouheki","oilchange"]}};return T[n]}
POOLS.prog=progOf(night);
const prog=process.env.PROG?JSON.parse(process.env.PROG):POOLS[pool];if(prog===undefined)throw new Error("POOL がちがう："+pool);
const HID=process.env.HIDDEN!=null&&process.env.HIDDEN!==""?process.env.HIDDEN!=="0":(pool==="prog"&&night>=2);
const ul=BETA.ul(prog),modes=process.env.MODE?[process.env.MODE]:["MT","AT"],out={route:process.env.ROUTE||null,hidden:HID,weak:process.env.WEAK!=null?+process.env.WEAK:null,char:process.env.CHAR||"YUKI",night,allyPref:process.env.ALLYPREF==="1"||process.env.PREF==="rp"?"rp":"now",pool:process.env.PROG?"PROG":pool,pref:process.env.PREF||"v14",drive:process.env.DRIVE||"eco",cards:ul?ul.cards.length:40,parts:ul?ul.parts.length:35};
/* ★v0.22.204 育った形 */
const GROW=process.env.GROW==="1",growOut={};
let TREE=null;{const TC=vm.runInContext("TREE_COST",ctx);if(process.env.TREE)TREE=process.env.TREE.split(",").map(x=>Math.max(0,Math.min(4,+x||0)));
 else if(GROW||process.env.PTS){let pts=process.env.PTS!=null?+process.env.PTS:Math.max(0,(night-1)*2);const lv=[0,0,0];
  for(;;){let i=-1;for(let k=0;k<3;k++){if(lv[k]>=3&&!(lv[k]===3&&!lv.includes(4)&&k===lv.indexOf(Math.max(...lv))))continue;if(i<0||lv[k]<lv[i])i=k}if(i<0||lv[i]>=4)break;const c=TC[lv[i]];if(pts<c)break;pts-=c;lv[i]++}TREE=lv}}
const OG=process.env.OG||(GROW?"1":null);
function mcAuto(mode){const runs=[];for(let i=0;i<20;i++){try{const r=BETA.run(mode,{kind,night,char:CH,ul,hidden:HID,stats:{},pref:process.env.PREF});if(r.rec)runs.push(r.rec)}catch(e){}}
 if(!runs.length)return null;const best=runs.reduce((b,x)=>((x.result==="clear"?1e6:0)+x.reach.area*1000+x.reach.row)>((b.result==="clear"?1e6:0)+b.reach.area*1000+b.reach.row)?x:b);
 const CARDS=vm.runInContext("CARDS",ctx),rk={C:0,R:1,E:2,OG:3};const cs=(best.deck||[]).filter(c=>CARDS[c.id]&&CARDS[c.id].r!=="SK"&&CARDS[c.id].r!=="OG"&&CARDS[c.id].own!=="N").sort((a,b)=>(b.up-a.up)||(rk[CARDS[b.id].r]||0)-(rk[CARDS[a.id].r]||0)).slice(0,2);
 return{rank:process.env.MCRANK||"B",cards:cs.map(c=>({id:c.id,up:c.up})),part:(best.parts||[])[0]||null}}
const MCENV=process.env.MC||(GROW?"auto":null);
for(const mode of modes){const BRING=MCENV==="auto"?[mcAuto(mode)].filter(Boolean):MCENV?[JSON.parse(MCENV)]:[];growOut[mode]={tree:TREE,og:OG,mc:BRING[0]||null};let clear=0,errs=0,areas=[0,0,0,0],hid=0,log=0,hm=0;const t0=Date.now(),stats={};BETA.cnt.fuse=0;BETA.cnt.rot=0;BETA.cnt.pair=0;BETA.cnt.sim=0;BETA.cnt.both=0;
  const recs=[];let gm=0,gw=0;/* ★v0.22.137 GHOST=1：前のランの記録（直近5件でいちばん進んだもの）からゴーストを出す */
  for(let i=0;i<N;i++){try{const gr=process.env.GHOST==='1'&&recs.length?recs.slice(-5).reduce((b,x)=>((x.result==='clear'?1e6:0)+x.reach.area*1000+x.reach.row)>=((b.result==='clear'?1e6:0)+b.reach.area*1000+b.reach.row)?x:b):null;const r=BETA.run(mode,{tree:TREE,og:OG,bring:BRING.map(m=>JSON.parse(JSON.stringify(m))),ghost:gr,kind,night,char:process.env.CHAR||"YUKI",ul,hidden:HID,stats,noAllyBoss:process.env.ALLYBOSS==="0",pref:process.env.PREF});
      if(r.err){errs++;if(process.env.DBG)console.error("ERR",r.err,"area",r.area,"row",r.row,"enemy",ctx.B&&ctx.B.key,"ehp",ctx.B&&ctx.B.e.hp,"eblk",ctx.B&&ctx.B.e.block,"hp",r.hp,"turns",ctx.B&&ctx.B.pTurns)}if(r.clear)clear++;areas[r.area==null?0:r.area]++;hid+=r.hidden;log+=r.log;hm+=r.heatMax||0;if(r.rec)recs.push(r.rec);gm+=r.ghostMet?1:0;gw+=r.ghostWon?1:0}
    catch(e){errs++;if(errs<2)console.error(String(e.stack).split("\n").slice(0,3).join(" | "))}}
  out[mode]={all:Math.round(clear/N*1000)/10,a1:Math.round((N-areas[0])/N*1000)/10,a2:Math.round((N-areas[0]-areas[1])/N*1000)/10,err:errs,hidden:Math.round(hid/N*100)/100,log:Math.round(log/N),heatMax:Math.round(hm/N*100)/100,ghostMet:gm,ghostWon:gw,fused:Math.round(BETA.cnt.fuse/N*100)/100,rot:Math.round(BETA.cnt.rot/N*100)/100,sims:Math.round(BETA.cnt.sim/N*100)/100,pairSims:Math.round(BETA.cnt.both/N*100)/100,pairUp:Math.round(BETA.cnt.pair/N*100)/100/* ★v0.22.151 E14：1ランあたりの合成・ローテーションの数 */,ms:Date.now()-t0};if(process.env.WEAK!=null)out[mode].boss=Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,{n:v.n,win:Math.round(v.win/v.n*1000)/10,weakAtk:v.atk?Math.round(v.weak/v.atk*1000)/10:0,atk:v.atk}]))}
if(TREE||OG||MCENV)out.grow=growOut;console.log(JSON.stringify(out));
