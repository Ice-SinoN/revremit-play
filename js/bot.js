/* ★v0.22.11 オート戦闘のための写し（qa/policy.js の AUTOBOT の戦闘の部分。qa/policy.js を直したらここも）*/
"use strict";
/* ===== ボットの考え方（α2：design のシムのボットにそろえた）=====
   smart：打てる手を1つずつ「ためしに打って」点をつけ、いちばんよい手を選ぶ（1手先読み）。
   random：でたらめ。
   画面なし（qa/sim.js）でも、ページの中（Playwright）でも同じものを使う。engine.js のグローバル（G・B など）を見る。 */
const AUTOBOT={
  snap(){return{g:structuredClone(G),b:structuredClone(B),u:uidN}},
  load(s){G=s.g;B=s.b;uidN=s.u},
  score(r,hp0,ehp0,gear0,hand0){
    if(r==="dead")return -1e6;
    if(r==="win")return 1e5+G.hp*20;
    let s=(ehp0-B.e.hp)*10-(hp0-G.hp)*15+(B.gear-gear0)*8+(B.hand.length-hand0)*2;
    const it=curAct(B.e);
    if(it[0]==="atk"||it[0]==="multi")s+=Math.min(B.block,(it[1]+B.e.atkUp)*(it[2]||1))*3;
    if(B.rpm>=redLo()&&G.mode==="MT"&&isTopGear())s-=20;// ブローの手前は危ない
    return s;
  },
  /* 戦闘の1手：{t:"play",i,shift}｜{t:"end"}｜{t:"down"}｜{t:"park"} */
  battle(kind){
    const acts=[];
    B.hand.forEach((c,i)=>{const p=preview(c);if(!p.ok)return;
      if(G.mode==="MT"&&p.canShift){acts.push({t:"play",i,shift:true});if(!CD(c).shiftCard)acts.push({t:"play",i,shift:false})}
      else acts.push({t:"play",i,shift:false})});
    if(canDraw()){if(G.mode==="MT"&&B.gear>0&&B.gas>=downCost())acts.push({t:"down"});if(G.mode==="AT"&&B.gas>=parkCost())acts.push({t:"park"})}
    acts.push({t:"end"});
    if(kind==="random"){
      const safe=acts.filter(a=>!(a.t==="play"&&preview(B.hand[a.i]).danger==="blow"&&!a.shift));
      return Math.random()<0.12?{t:"end"}:pick(safe.length?safe:acts);
    }
    let best=null,bs=-Infinity;
    for(const a of acts){
      const s0=AUTOBOT.snap(),hp0=G.hp,ehp0=B.e.hp,gear0=B.gear,hand0=B.hand.length;
      const r=AUTOBOT.run(a);let s=AUTOBOT.score(r,hp0,ehp0,gear0,hand0);
      if(a.t==="end")s-=5;if(a.t==="down")s-=12;if(a.t==="park")s-=10;
      AUTOBOT.load(s0);
      if(s>bs){bs=s;best=a}
    }
    return best;
  },
  run(a){return a.t==="play"?playCard(a.i,a.shift):a.t==="down"?downShift():a.t==="park"?parking():endTurn()},
  /* マップ：どのマスに入るか */
  node(kind){const r=G.map[G.row];if(kind==="random")return Math.floor(Math.random()*r.length);
    const pref=G.hp<G.maxhp*0.5?["garage","shop","lucky","battle","sim","elite","boss"]:["shop","lucky","elite","battle","sim","garage","boss"];
    let bi=0,bv=99;r.forEach((n,j)=>{let v=pref.indexOf(n.k);if(n.k==="shop"&&G.money<40)v+=3;if(v<bv){bv=v;bi=j}});return bi},
  CARD_PREF:["nadare","eikyu","rinkai","whiteout","rikka","rikkamai","tsurara","hakunetsu","hakusen","muhyou","fubuki","kazahana","shimo","slip","counter","clutchk","hyoujin","heeltoe","backfire","sasame","pitin","cooldown","ebrake","oilchange","pitboard","qshift","blip","braking","hyouga"],
  reward(kind,opts){if(kind==="random")return Math.random()<0.2?null:pick(opts);
    let b=null,bv=99;opts.forEach(id=>{const v=AUTOBOT.CARD_PREF.indexOf(id);if(v>=0&&v<bv){bv=v;b=id}});return b},
  UP_PREF:["whiteout","nadare","hakusen","rikka","hyouga","shironeko","counter","muhyou","slip","tsurara","shimo","kazahana"],
  upgrade(kind){const t=upgradeTargets();if(!t.length)return -1;if(kind==="random")return pick(t);
    for(const id of AUTOBOT.UP_PREF){const i=t.find(k=>G.deck[k].id===id);if(i!=null)return i}return t[0]},
  TUNE_PREF:["ecu","engine","light","tire","shift"],
};
/* 画面なしで1ラン走る（qa/sim.js 用）。戻り値：{clear,hp,row,steps,err} */
