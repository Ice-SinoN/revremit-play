"use strict";
/* ===== プログラム班② v0.5.25 夜のカード（design 26-4 ②・text 43章）β の4人の8枚 =====
   データの形（③の6人の12枚も同じ形なら、開き方・図鑑・リザルトの字はこのファイルがそのまま受けもつ）：
     CARDS[id] に nightOpen:<夜>（R＝6・E＝9。KURO は 10・11）。own のキャラで、その夜「以上」を初めて全クリアしたとき unlock.cards に入る。
     開いたあとは CHARS[own].pool のカード＝報酬・ショップにふつうに出る（解放ずみのときだけ）。
   図鑑の手に入れ方：TEXT.ui.dex_how_night「{キャラ}で NIGHT {n} を、初めて全クリア」。リザルト：TEXT.ui.unlock_night_card「夜のカードが開いた：{card}」。
   数は design の仮（LD が測る）。①のファイルはさわらない。 */
(function(){
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__nt=1;g.__orig=f;window[name]=g};
const NT={
 y_nt1:{yomi:"せつや",r:"R",own:"YUKI",n:"雪夜",t:"atk",c:1500,gas:1,v:8,vu:12,nightOpen:6,fx:[["atk","v"],["ntFrzWx",1,"snow",2]],d:"{v} ダメージ・凍結 1。雪のマスなら凍結 2。",flav:"音のない雪の夜。<br>足あとも、凍らせて。"},
 y_nt2:{yomi:"ひょうげつがえし",r:"E",own:"YUKI",n:"氷月返し",t:"grd",mo:"guard",c:0,gas:2,v:10,vu:15,nightOpen:9,fx:[["blk","v"],["ntReflect"]],d:"防御 {v}。次の攻撃を全部止めたら、止めた量をダメージで返す。",lp:"防御で全部止めたときだけ。少しでも通ったら、返さない。",flav:"凍った月は、<br>受けた光を、そのまま返す。"},
 h_nt1:{yomi:"みょうじょううち",r:"R",own:"HINA",n:"明星打",t:"atk",c:1000,gas:1,v:6,vu:9,nightOpen:6,fx:[["ntAtkWx","v","dawn",2]],d:"{v} ダメージ。夜明けのマスなら2回。",flav:"夜明けの空に、<br>いちばん先に光る星。"},
 h_nt2:{yomi:"いちばんぼしひばな",r:"E",own:"HINA",n:"一番星火花",t:"atk",c:2500,gas:2,v:24,vu:36,nightOpen:9,fx:[["atk","v"],["ntFirstBlk",12]],d:"{v} ダメージ。戦闘の最初の番なら、防御 12 も。",flav:"夜のはじまりに、<br>だれより早く、火をつける。"},
 m_nt1:{yomi:"よざくら",r:"R",own:"MOMO",n:"夜桜",t:"atk",c:1000,gas:1,v:4,vu:6,nightOpen:6,fx:[["atk","v"],["chainAdd",2]],d:"{v} ダメージ・チェイン +2。",flav:"暗い夜ほど、<br>花は白く、ひらく。"},
 m_nt2:{yomi:"よさめのはな",r:"E",own:"MOMO",n:"夜雨の花",t:"grd",mo:"guard",c:0,gas:1,v:3,vu:4,k:30,ku:40,nightOpen:9,fx:[["ntBlkChain","v","k"],["ntHealWx","rain",3]],d:"防御＝チェインの数 ×{v}（最大 {k}）。雨のマスなら耐久 +3 も。",flav:"雨の夜も、<br>花は、みんなを守ってひらく。"},
 n_nt1:{r:"R",own:"NANA",n:"ナイトシフト",t:"rev",mo:"rev",c:0,gas:1,sup:1,v:4,vu:6,nightOpen:6,fx:[["ntShiftGood"],["blk","v"]],d:"シフトアップを1回（グッド・帯はいらない）・防御 {v}。",lp:"グッドと同じに数える。帯の外でもよい。",flav:"夜の道でも、<br>わたくしのシフトは乱れませんわ。"},
 n_nt2:{yomi:"げっかれんとつ",r:"E",own:"NANA",n:"月華連突",t:"atk",c:3000,gas:2,v:10,vu:15,nightOpen:9,fx:[["ntAtkPerf","v",4]],d:"この番のパーフェクトの数 ×{v}（倍率なし・最大4回ぶん）。",flav:"月の下で、<br>完璧な突きを、何度でも。"},
};
Object.entries(NT).forEach(([id,d])=>{if(CARDS[id])return;CARDS[id]=Object.assign({},d);const ch=CHARS[d.own];if(ch&&Array.isArray(ch.pool)&&!ch.pool.includes(id))ch.pool.push(id)});
Object.assign(TEXT.ui=TEXT.ui||{},{dex_how_night:TEXT.ui.dex_how_night||"{キャラ}で NIGHT {n} を、初めて全クリア",unlock_night_card:TEXT.ui.unlock_night_card||"夜のカードが開いた：{card}"});

/* ---- 効き目 ---- */
const wxIs=w=>{try{return wxNow()===w}catch(e){return false}};
const OPS_NT={
 ntFrzWx:(x,a,w,b)=>x.freeze(wxIs(w)?b:a),
 ntAtkWx:(x,v,w,n)=>{const k=wxIs(w)?n:1;for(let i=0;i<k;i++)x.attack(v);if(k>1)addLog(`${wxName0()}：${k}回`)},
 ntFirstBlk:(x,b)=>{if(B.pTurns===0){x.blockRaw(b);addLog("最初の番：防御も")}},
 ntBlkChain:(x,v,k)=>{const n=Math.min(B.chain||0,RULES.chainMax||99),b=Math.min(k||30,n*v);if(b>0)x.blockRaw(b);else addLog("チェインがない")},
 ntHealWx:(x,w,a)=>{if(!wxIs(w))return;const h=Math.min(a,G.maxhp-G.hp);G.hp+=h;addLog(`${wxName0()}：エンジン耐久 +${h}`);ev({k:"heal",v:h})},
 ntReflect:()=>{B.ntRef=1;addLog("氷月返し：次の攻撃を全部止めたら返す")},
 ntShiftGood:()=>{if(typeof isTopGear==="function"&&isTopGear()||typeof shiftLeft==="function"&&!shiftLeft()){addLog("もうギアを上げられない");return}
   B.gear++;B.shifts++;G.st.shiftTry++;G.st.good=(G.st.good||0)+1;B.lastGrade="good";ev({k:"shift",g:"good",gear:B.gear});addLog(`ナイトシフト → ${B.gear+1}速（グッド）`);onShiftUp("good")},
 ntAtkPerf:(x,v,cap)=>{const n=Math.min(cap||4,B.ntPerfT||0);if(n>0)x.attack(n*v,true);else addLog("この番のパーフェクトがまだない")},
};
Object.keys(OPS_NT).forEach(k=>{if(!OPS[k])OPS[k]=OPS_NT[k]});
/* この番のパーフェクトの数 */
W("onShiftUp",f=>function(g){if(B&&g==="perfect")B.ntPerfT=(B.ntPerfT||0)+1;return f.apply(this,arguments)});
W("startPlayerTurn",f=>function(){if(B)B.ntPerfT=0;return f.apply(this,arguments)});
/* 氷月返し：次の攻撃1回。防御で全部止めた（耐久が減らない・貫通でない）ら、止めた量を返す */
W("enemyHit",f=>function(v,pierce){const arm=B&&B.ntRef;if(!arm)return f.apply(this,arguments);const b0=B.block,h0=G.hp;const r=f.apply(this,arguments);B.ntRef=0;
  const stop=b0-B.block;if(!pierce&&G.hp>=h0&&stop>0){addLog(`氷月返し：${stop} を返した`);hitEnemy(stop)}else addLog("氷月返し：止めきれなかった");return r});
/* 敵の番の中で敵の体力が 0 になったら、そこで勝ち（返したダメージなど） */
W("enemyStep",f=>function(){const r=f.apply(this,arguments);if(!r&&B&&B.e&&B.e.hp<=0)return"win";return r});

/* ---- 開き方：own のキャラで nightOpen 以上を初めて全クリア ---- */
const openOf=id=>{const c=CARDS[id];return c&&(c.nightOpen||(window.NIGHT_CARDS&&NIGHT_CARDS[id]&&NIGHT_CARDS[id].night))||0};
window.nightCardOpen=openOf;
function nightCardsFor(ch){return Object.keys(CARDS).filter(id=>openOf(id)&&CARDS[id].own===ch)}
W("clearMark",f=>function(ch,mode,n){const r=f.apply(this,arguments);try{const u=PRF().unlock;u.cards=u.cards||[];nightCardsFor(ch).forEach(id=>{if((n|0)>=openOf(id)&&!u.cards.includes(id)){u.cards.push(id);(window.__ntNew=window.__ntNew||[]).push(id)}})}catch(e){}return r});
/* リザルトの解放の行：夜のカードは「夜のカードが開いた：○○」 */
W("runEnd",f=>function(clear,rank){window.__ntNew=[];const r=f.apply(this,arguments);try{const L=S.runGot;if(Array.isArray(L))(window.__ntNew||[]).forEach(id=>{const k=L.indexOf("カード："+CARDS[id].n),t=TEXT.ui.unlock_night_card.replace("{card}",CARDS[id].n);if(k>=0)L[k]=t;else if(!L.includes(t))L.push(t)})}catch(e){}return r});

/* ---- 図鑑：手に入れ方 ---- */
W("cdxCardHint",f=>function(id){const n=openOf(id);if(n){const c=CARDS[id],nm=(typeof rr2Name==="function"?rr2Name(c.own):(TEXT.names&&TEXT.names[c.own]))||c.own;return TEXT.ui.dex_how_night.replace("{キャラ}",nm).replace("{n}",n)}return f.apply(this,arguments)});
/* 改造・合成の材料：今の決まりのまま（夜のカードは止めない） */
window.NTCARDS={VERSION:"0.5.25",ids:Object.keys(NT),openOf,nightCardsFor};
})();
