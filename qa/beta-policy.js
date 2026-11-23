"use strict";
/* ===== β のボット（v14 の後継・v0.21）：qa/policy.js（v14）のあとに読む =====
   v14 の考え方（1手先読み・カードの好み）はそのまま。足したもの：
   ・夜・キャラ・解放の状態を指定してランを始める（BETA.run(mode,{night,char,ul,hidden,pref})）
   ・裏道のマス（hidden）：エリートと同じ扱いで選ぶ。逃げられた（escape）ら報酬なしで次へ
   ・新しいカード10種の好み（pref:"beta"）。pref:"v14"＝v14 の好みのまま（新しいカードは取らない）、pref:"noepic"＝エピックをいちばん後ろに
   ゲームの engine.js・data/*.js をそのまま使う（数字はゲームと同じ）。 */
const BETA={
  PREF:{v14:null,
    beta:["nadare","eikyu","rinkai","senbon","kyokkou","whiteout","rikka","renpou","rikkamai","setsuka","tsurara","hakunetsu","hyouen","saihyou","hakusen","muhyou","fubuki","kazahana","shimo","hyouheki","slip","drift","counter","clutchk","dblclutch","hyoujin","heeltoe","backfire","sasame","pitin","cooldown","ebrake","oilchange","fuelcut","pitboard","qshift","braking","blip","hyouga"]},
  NODE_PREF:{hi:["shop","lucky","hidden","elite","battle","sim","garage","boss"],lo:["garage","shop","lucky","battle","sim","hidden","elite","boss"]},
  /* ★v0.22 仲間：その子の専用カードを E → R → C（アタック先）の順で前に足す（仮の好み） */
  allyPref(ch){const rk={R:0,C:1,E:2};return Object.keys(CARDS).filter(id=>CARDS[id].own===ch&&CARDS[id].r!=="SK").sort((a,b)=>rk[CARDS[a].r]-rk[CARDS[b].r]||(CARDS[a].t==="atk"?0:1)-(CARDS[b].t==="atk"?0:1))},
  pref(name,ch){if(ch&&ch!=="YUKI")return BETA.allyPref(ch).concat(BOT.CARD_PREF.filter(id=>CARDS[id]&&CARDS[id].own==="N"));const base=BOT.CARD_PREF.slice();if(!name||name==="v14")return base;
    if(name==="noepic"){const e=base.filter(id=>CARDS[id]&&CARDS[id].r==="E");return base.filter(id=>!e.includes(id)).concat(e)}
    return BETA.PREF[name]||base},
  node(){const r=G.map[G.row],pref=G.hp<G.maxhp*0.5?BETA.NODE_PREF.lo:BETA.NODE_PREF.hi;
    let bi=0,bv=99;r.forEach((n,j)=>{let v=pref.indexOf(n.k);if(v<0)v=50;if(n.k==="shop"&&G.money<40)v+=3;if(v<bv){bv=v;bi=j}});return bi},
  /* ul：{cards:[...],parts:[...]}（null＝全部）。戻り値：{clear,area,row,hp,night,hidden,elites,log,steps,err} */
  run(mode,o){o=o||{};const kind=o.kind||"smart",save=BOT.CARD_PREF;BOT.CARD_PREF=BETA.pref(o.pref,o.char);
    try{newRunState(mode,o.char||"YUKI",[],null,{night:o.night||1,ul:o.ul?{cards:o.ul.cards.slice(),parts:o.ul.parts.slice()}:null,hidden:!!o.hidden});
      let steps=0;const max=o.maxSteps||20000;
      while(G.row<G.map.length){const j=kind==="random"?Math.floor(Math.random()*G.map[G.row].length):BETA.node(),n=G.map[G.row][j];G.path[G.row]=j;
        if(n.k==="battle"||n.k==="elite"||n.k==="boss"||n.k==="hidden"){/* ★v0.22.3 その子のボス（零号の前に連戦）。o.noAllyBoss で外す */
          const ab=!o.noAllyBoss&&n.k==="boss"&&typeof ALLY_BOSS!=="undefined"&&ALLY_BOSS[G.char]&&AREAS[n.a].boss==="boss3"?ALLY_BOSS[G.char]:null;
          for(const ek of ab?[ab,nodeEnemy(n)]:[nodeEnemy(n)]){startBattleState(ek);let r=B.over?B.result:"ok";
          while(r!=="win"&&r!=="dead"&&r!=="escape"){if(++steps>max)return BETA.out(false,n,steps,"止まった（手数が多すぎる）");r=BOT.run(BOT.battle(kind))}
          if(r==="dead")return BETA.out(false,n,steps);
          if(r==="win"){const w=winRewards();if(w.rank!=="hidden"){const id=BOT.reward(kind,rewardOptions(w.rank));if(id)G.deck.push(inst(id))}
            if(w.rank==="elite"||w.rank==="boss"){const op=partOptions(3);if(op.length)addPart(op[0],0)}}}}
        else if(n.k==="shop"){for(const k of BOT.TUNE_PREF){const pr=tunePrice(k,n,false);if(pr!=null&&G.money>=pr+10)buyTune(k,pr,false)}
          if(n.feat){const pool=partPool();n.featPart=pool.length?pick(pool):null;if(n.featPart)buyFeat(n,shopPrice(RULES.featPrice,n,false),false,G.parts.length>=RULES.partsMax?0:-1)}}
        else if(n.k==="sim"){const i=BOT.upgrade(kind);if(i>=0)G.deck[i].up=true}
        else if(n.k==="lucky"){const op=partOptions(3);if(op.length)addPart(op[0],0)}
        else if(n.k==="garage"){G.hp=Math.min(G.maxhp,G.hp+restAmount())}
        advanceRow()}
      return BETA.out(true,{a:3},steps)}finally{BOT.CARD_PREF=save}},
  out(clear,n,steps,err){const lg=runLog(clear,null);return{clear,area:clear?3:n.a,row:G.row,hp:G.hp,night:G.night,hidden:G.st.hidden,hiddenCards:(G.hiddenWon||[]).slice(),elites:G.st.elites,log:lg.total,steps,err}},
  /* 解放の状態から ul を作る（ゲームの unlockedCards・unlockedParts と同じ）。prog：{areas,nightMax,sCount,cards,parts} または "start"｜"all" */
  ul(prog){if(prog==="all")return null;const u=Object.assign({chars:["YUKI"],sCountC:{},cards:[],parts:[],story:[],stages:[],nightMax:0,sCount:0,areas:[]},prog==="start"?{}:prog||{});
    const p={unlock:u};return{cards:unlockedCards(p),parts:unlockedParts(p)}},
};
