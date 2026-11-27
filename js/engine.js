"use strict";
/* ===== 計算（α2・v0.10）：ランと戦闘。画面（DOM）にはさわらない =====
   結果は戻り値で返す："ok"（続く）/ "turn"（相手の番が終わって自分の番）/ "win"（敵をたおした）/ "dead"（ランが終わった）
   ボットはこのファイルとデータだけで、画面なしに何千回も回せる（qa/sim.js）
   v0.9：起きたことを B.ev に順に積む（画面がモーションを決めるため）。
     {k:"card",id,mo,shift} {k:"shift",g} {k:"ehit",v,blk} {k:"pblk",v} {k:"frz",v} {k:"burn",v} {k:"noise",v} {k:"heal",v} {k:"draw",n}
     {k:"revdown"} {k:"over"} {k:"blow"} {k:"eact",p} {k:"phit",v,blk} {k:"eblk",v} {k:"eburn",v} {k:"turn"} {k:"win"} {k:"dead"} */
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};

let G=null,B=null,uidN=1;
const inst=(id,up=false)=>({id,up,uid:uidN++});
const has=p=>!!G&&G.parts.includes(p);
const car=()=>G.car;
/* ★v0.21 夜・解放（design 9-4・9-5）。G.night：0＝夜なし（チュートリアル・α の道）。G.ul：このランで使えるカード・パーツ（null＝全部） */
/* data/nights.js を読まない道具（v14 のボットなど）でも動くように：ないときは「夜なし」 */
const NIGHT_NONE={noBlow:false,eliteW:null,hpMul:1,areaHeal:null,eliteMul:1,atkMul:1,money0:null,goldMul:1,bossMul:1,startJam:[],maxHp:0};
const nightOf=n=>typeof nightRules==="function"?nightRules(n||0):NIGHT_NONE;
const NR=()=>nightOf(G&&G.night||0);
const cardOK=id=>!G||!G.ul||G.ul.cards.includes(id);
const partOK=id=>!G||!G.ul||G.ul.parts.includes(id);
function noBlow(){return NR().noBlow||has("forged")||!!(G&&G.practice)}
/* ★v0.22 キャラの決まり（design 9-10-1）：CHARS[c].rule */
function RULE(){const r=G&&CHARS[G.char]&&CHARS[G.char].rule||{};const t=G&&treeTop();
  if(t==="h_pit")return Object.assign({},r,{halfDmg:3});if(t==="m_chain")return Object.assign({},r,{rescueN:2,rescue2At:5});/* ★v0.22.53 design 11-3-5：2回目はチェイン5以上 */if(t==="n_perf")return Object.assign({},r,{perfBlk:5});return r}
/* ★v0.22.48 スキルツリー（design 11-3・text 27-6）。キャラごとに枝3本 × 4段（1・2・3・4 ポイント）。4段目（型の決め）はプリセットで1本だけ。
   セーブ profile.tree[char]={pts, presets:[{name,lv:[0,0,0]}×3], cur}。ランのはじめに G.tree={lv:[..]} に写す */
const TREE={
 YUKI:[{id:"y_frz",n:"吹雪の陣",d:"凍らせて止める型",entry:["shimo","hyouheki"]/* ★v0.22.76 窓口 13:06 A：霜纏い・氷壁（v0.22.74 の細雪2枚から） */,cards:["sasame","fubuki","eikyu","muhyou","hyouheki","saihyou","whiteout"],parts:["emblem","studless","spike","dashcam"],top:"白猫の護り：2回目のシフトアップから凍結 1",tip:"白猫の護り：1ターンの2回目からのシフトアップのたびに凍結 1。"/* ★v0.22.57 文は仮 */},
   {id:"y_cnt",n:"白猫の構え",d:"守ってから返す型",entry:["counter","hyoujin"],cards:["counter","hyoujin","braking","shimo","shironeko"],parts:["grip","cage","jack","widebody","hook"],top:"白猫の護り：防御の半分を次のアタックに"},
   {id:"y_red",n:"紅雪の走り",d:"レッドで押し切る型",entry:["tsurara","hakunetsu"],cards:["tsurara","hakunetsu","rinkai","kyokkou","hyouen","backfire","cooldown"],parts:["hicam","pipe","limiter","oilcool","drysump","forged"],top:"白猫の護り：レッドではガソリン −1"}],
 HINA:[{id:"h_rush",n:"全開",d:"最初の番で押し切る型",entry:["h_asayake","h_hibana"],cards:["h_asayake","h_hibana","h_youda","h_gouda"],parts:["launch","boost","nitro","h_12inch"],top:"サンライズ・ダッシュ：最初の番はガソリン 0"},
   {id:"h_combo",n:"火花",d:"数で当てる型",entry:["h_kagerou","h_nukiuchi"],cards:["h_kagerou","h_nukiuchi","h_hibana","h_shippu","h_nichirin"],parts:["turbo","clutch","slick","h_bigbore"],top:"このターン3枚目からのアタック +2"},
   {id:"h_pit",n:"整備メモ",d:"守って立て直す型",entry:["h_memo","cooldown"]/* ★v0.22.60 LD RP +1.27 → ピットインをクーリング（C）に。★v0.22.59 design：整備メモ・ピットイン（どちらも初期デッキにない。フルブレーキは外したまま） */,cards:["h_hidamari","h_fullbrake","h_kneegrip","h_memo"],parts:["grip","jack","cage","oilcool","h_wheelie"],top:"受けるダメージ半分が、最初の3ターンに"}],
 MOMO:[{id:"m_chain",n:"満開",d:"チェインをつなぐ型",entry:["m_hanawa","m_haruichiban"],cards:["m_hanawa","m_haruichiban","m_touka","m_mankai","m_musubime","m_hanafubuki"],parts:["slick","carbon","pacenote","subcon","qrelease","m_jinba"],top:"花の便り：チェイン5以上で2回目（MT）",tip:"花の便り：1回目はチェイン3から。2回目はチェイン5以上のときだけ（MT だけ）。",mtOnly:1/* ★v0.22.53 文は仮（シナリオ班の文が来たら差しかえ） */},
   {id:"m_guard",n:"花癒",d:"チェインで守る型",entry:["m_hanaakari","m_harukaze"],cards:["m_hanaakari","m_harukaze","m_softtop","m_cruise"],parts:["grip","carbon","lsd","m_horo"],top:"桃花の抱擁：ターン終わりにチェインの数の防御",tip:"桃花の抱擁を打ったターンだけ。防御は15まで。"},
   {id:"m_rev",n:"返り咲き",d:"追いこまれて返す型",entry:["m_kaerizaki","m_openair"],cards:["m_kaerizaki","m_openair","m_hanami","m_rinjin"],parts:["cage","jack","widebody","m_light"],top:"耐久が半分以下で、桃花の抱擁のガソリン −1"}],
 NANA:[{id:"n_shift",n:"鳳翼",d:"シフトを重ねる型",entry:["n_paddle","n_houyoku"],cards:["n_paddle","n_houyoku","n_tenshou","n_gaisen","n_hachiren"],parts:["closs","clutch","flywheel","seq","n_paddleshifter"],top:"4回目のシフトアップで、もどるガソリン +1",tip:"4回目のシフトアップで、もどるガソリン +1（グッド +2・パーフェクト +3）。"/* ★v0.22.51 text 27-6-2 */},
   {id:"n_perf",n:"王宮",d:"パーフェクトで守る型",entry:["n_hiiro","n_hokori"],cards:["n_hiiro","n_hokori","n_downforce","n_teppeki"],parts:["lsd","launch","dogmt","n_activediff"],top:"パーフェクトの防御 +3 → +5"},
   {id:"n_crown",n:"戴冠",d:"最大ギアで決める型",entry:["n_hachiren","n_taikan"],cards:["n_hachiren","n_taikan","n_totsugeki","n_koutotsu","n_shukumei"],parts:["turbo","limiter","nitro","n_seat"],top:"最大ギアで、アタック +3"}]};
const TREE_COST=[1,2,3,4],TREE_PARTW=1.25,TREE_BANDADD=0.25;
function treeOfProfile(ch){try{if(typeof PRF!=="function")return[0,0,0];const t=PRF().tree&&PRF().tree[ch];if(!t)return[0,0,0];const p=t.presets&&t.presets[t.cur||0];return p&&p.lv&&treeSpent(p.lv)<=(t.pts||0)?p.lv.slice():[0,0,0]}catch(e){return[0,0,0]}}
function treeSpent(lv){return lv.reduce((a,l)=>a+l*(l+1)/2,0)}
function treeLv(){return G&&G.tree&&G.tree.lv||[0,0,0]}
function treeBr(){return TREE[G&&G.char]||[]}
function treeTop(){const lv=treeLv(),i=lv.indexOf(4);return i>=0&&treeBr()[i]?treeBr()[i].id:null}
function treeHas(k,lvMin){const lv=treeLv();return treeBr().some((b,i)=>lv[i]>=lvMin&&(k==null||b.cards.includes(k)||b.parts.includes(k)))}
function treeCardBand(id){const lv=treeLv();return treeBr().some((b,i)=>lv[i]>=3&&b.cards.includes(id))?TREE_BANDADD:0}
function treePartW(p){const lv=treeLv();return treeBr().some((b,i)=>lv[i]>=2&&b.parts.includes(p))?TREE_PARTW:1}
/* ランのはじめ：1段目＝入口のカード2枚がデッキに入る（かわりに共通の C を同じ枚数抜く。20枚のまま） */
const TREE_BASE={YUKI:"hyouga",HINA:"h_youda",MOMO:"m_touka",NANA:"n_hosaki"};/* ★v0.22.55 LD 11-35：その子の基本アタック */
const treeOut=ch=>["blip","braking",TREE_BASE[ch],"slip"].filter(Boolean);/* ★v0.22.55：ブリッピング → ブレーキング → 基本アタック → スリップ（最後）。クイックシフトは抜かない */
const TREE_OUT=treeOut("YUKI");
function treeDeckList(list,ch,lv){/* list＝[{id,mc}]（手を加えて返す）。入口のカードがもうデッキにあれば、その分は足さず抜かない */(TREE[ch]||[]).forEach((b,i)=>{if((lv[i]||0)<1)return;b.entry.forEach(id=>{if(!CARDS[id]||list.some(c=>c.id===id&&!c.mc))return;
  const k=treeOut(ch).map(o=>list.findIndex(c=>c.id===o&&!c.mc)).find(x=>x>=0);if(k!=null&&k>=0)list.splice(k,1);list.push(inst(id))})});return list}
function treeApplyDeck(){treeDeckList(G.deck,G.char,treeLv())}
/* ★v0.22.49 確認の小窓のデッキ欄：ツリーの1段目で入れかわったあと（{id:枚数}） */
function treeDeckMap(dk,ch){const L=[];Object.entries(dk).forEach(([id,n])=>{for(let i=0;i<n;i++)L.push(inst(id))});const o={};treeDeckList(L,ch,treeOfProfile(ch)).forEach(c=>{o[c.id]=(o[c.id]||0)+1});return o}
/* ★v0.22.1 design 5-1b「止めは1つまで」：NANA（4回）と強化シンクロ（+1）は重ねない（高いほう） */
function shiftCapNow(){return Math.max(RULE().shiftCap||RULES.shiftCap,RULES.shiftCap+(has("synchro")?1:0))}

/* ---- カードの読みかた ---- */
function CD(c){const id=c.id||c;let d=CARDS[id];const pv=typeof MOD_PREVIEW!=="undefined"&&MOD_PREVIEW&&MOD_PREVIEW[id],m=pv||(G&&G.mods&&G.mods[id]);if(m&&m.lv&&!(c&&c.nm))d=modDef(id,m);if(id==="shironeko"&&G&&G.tree){const t=treeTop();if(t==="y_frz")d=Object.assign({},d,{fx:d.fx.concat([["onUp","frz2",1]])});/* ★v0.22.57 LD 11-35：凍結 1 は1ターン2回目のシフトアップから */else if(t==="y_cnt")d=Object.assign({},d,{fx:d.fx.concat([["counterAdd"]])})}if(G&&G.mode==="AT"&&d.at)return Object.assign({},d,d.at);return d}
/* ★v0.22.47 カード改造（design 11-2・text 27-5）。1枚に2段：1段目＝数値、2段目＝分かれ道 A／B。スロットごと（profile.mods={id:{lv,br,spent}}）。
   ランのはじめに G.mods に写す。デッキの改造カード（＋合成カード）は8枚まで：こえた分は c.nm（そのランは改造なし） */
var MOD_PREVIEW=null;/* ラン外（ラボ・デッキ）で改造の形を見せるとき {id:{lv,br}} */
const MOD_PRICE={C:[60,100],R:[90,150],E:[120,200]},MOD_SWITCH=20,MOD_CAP=8;
function modKind(id){const d=CARDS[id];if(!d||d.gen||d.r==="SK"||d.r==="OG"||d.t==="jam")return null;if(id==="m_kinen")return"kinen";if(d.redOnly)return"cond";
  const fv=f=>d.fx.some(x=>x[0]===f[0]&&x[1]==="v"&&(!f[1]||true));
  if(d.t==="atk"&&typeof d.v==="number")return"atk";
  if(d.t==="grd"&&d.fx.some(x=>(x[0]==="blk"||x[0]==="blkGear")&&x[1]==="v"))return"grd";
  if(d.t==="dbf"&&d.fx.some(x=>x[0]==="frz"&&x[1]==="v"))return"frz";
  if(d.t==="dbf"&&typeof d.v==="number")return"num";
  if(d.t==="drw"&&d.fx.some(x=>x[0]==="draw"&&x[1]==="v"))return"drw";
  return null}
function modPrice(id,lv){const d=CARDS[id];const r=d.fused?"E":(MOD_PRICE[d.r]?d.r:"C");return MOD_PRICE[r][lv-1]}
/* 段ごとの名前と一行（text 27-5-2）。ok:false はそのカードでは選べない分かれ道 */
function modInfo(id){const k=modKind(id),d=CARDS[id];if(!k)return null;const RC=(d.c>0||d.costGear)?"回転 −500":"ガソリン −1";const small=k==="atk"&&d.v<8,frac=typeof d.v==="number"&&d.v<1,bnd=!!d.band;
  const T={
   atk:{l1:small?RC:"ダメージ +1",A:small?["重く",frac?"倍率 +0.1":"ダメージ +1"]:["軽量化",RC+"。早く打てる"],B:["ワイドレンジ","帯で打つと ×"+((d.bm||1.5)+0.25)],Bok:bnd},
   num:{l1:"数 +1",A:["軽量化",RC+"。早く打てる"],B:["ワイドレンジ","帯で打つと ×"+((d.bm||1.5)+0.25)],Bok:bnd},
   grd:{l1:"防御 +1",/* ★v0.22.58 design 11-2-2 */A:["余熱","防御の半分が、次の番に残る"],B:["切り返し","次の番の最初のアタック +2"]},
   frz:{l1:"凍結 +1",A:["根雪","1回ぶん、凍結の上限に数えない"],B:["雪囲い","凍結を与えたら、防御 +2"]},
   drw:{l1:(d.c>0||d.costGear)?"回転 −500":"防御 +2",/* ★v0.22.58 引く数とガソリンは変えない */A:["オールレンジ","帯の外でも ×1.5"],Aok:bnd,B:["下取り","引いた中の1枚を、山札の下へ"]},
   cond:{l1:RC,A:["半クラッチ","レッドの外でも、半分で打てる"],B:["フルチャージ","大技にする（ガソリン 10・条件で −1）"]},
   kinen:{l1:"防御 +2",/* ★v0.22.58 */A:["花びら","引いた枚数だけ、チェイン +1"],B:["アルバム","攻撃が来なければ、もう1枚"]}}[k];
  return{kind:k,l1:T.l1,A:{name:T.A[0],txt:T.A[1],ok:T.Aok!==false},B:{name:T.B[0],txt:T.B[1],ok:T.Bok!==false}}}
const MOD_CACHE={};
function modDef(id,m){const key=id+"|"+m.lv+"|"+(m.br||"");if(MOD_CACHE[key])return MOD_CACHE[key];const b=CARDS[id],k=modKind(id);if(!k)return b;
  const d=Object.assign({},b,{fx:b.fx.map(f=>f.slice()),mod:m});const cm=()=>{if(!(b.c>0)&&!b.costGear){d.gas=Math.max(0,(d.gas||0)-1);if(d.gasu!=null)d.gasu=Math.max(0,d.gasu-1);if(d.gasMT!=null)d.gasMT=Math.max(0,d.gasMT-1);return}d.c=Math.max(0,(d.c||0)-500);if(d.cu!=null)d.cu=Math.max(0,d.cu-500);if(d.costGear)d.costGear=[Math.max(0,d.costGear[0]-500),d.costGear[1],d.costGear[2]]};
  const vp=x=>{d.v=Math.round((d.v+x)*100)/100;if(d.vu!=null)d.vu=Math.round((d.vu+(x<1?x*1.5:Math.round(x*1.5)))*100)/100};
  const small=k==="atk"&&b.v<8,frac=b.v<1;
  if(k==="atk"){if(small)cm();else vp(1)}else if(k==="num")vp(1);else if(k==="grd")vp(1);else if(k==="frz")vp(1);else if(k==="cond")cm();else if(k==="drw"){if(b.c>0||b.costGear)cm();else d.fx.push(["blkFlat",2])}else if(k==="kinen")d.fx.push(["blkFlat",2]);/* ★v0.22.58 design 11-2-2：ガード +1・記念写真と回転0の引くカードは防御 +2（引く数・ガソリンは変えない） */
  if(m.lv>=2){const br=m.br;
    if(k==="atk"){if(br==="A"){if(small)vp(frac?0.1:1);else cm()}else if(b.band)d.bm=(b.bm||RULES.bandMul)+0.25}
    else if(k==="num"){if(br==="A")cm();else if(b.band)d.bm=(b.bm||RULES.bandMul)+0.25}
    else if(k==="grd"){if(br==="A")d.keepHalf=1;else d.fx.push(["nextTurnAtk",2])}
    else if(k==="frz"){if(br==="A")d.frzNoCap=1;else d.fx.push(["blkRaw",2])}
    else if(k==="drw"){if(br==="A")d.bandAny=1;else d.tradeIn=1}
    else if(k==="cond"){d.redOnly=0;if(br==="A")d.fx=d.fx.map(f=>f[0]==="atk"?["kousetsu",f[1],0]:f);else{d.charge=1;d.gas=10}}
    else if(k==="kinen"){if(br==="A")d.fx.push(["chainAdd","v"]);else d.album=1}}
  d.dMod="改造："+[modInfo(id).l1].concat(m.lv>=2?[modInfo(id)[m.br].name]:[]).join("・");
  return MOD_CACHE[key]=d}
/* デッキの中の改造カード（合成カードも数える） */
function isModCard(id,mods){return !!(CARDS[id]&&(CARDS[id].fused||(mods&&mods[id]&&mods[id].lv)))}
function modCount(list,mods){return list.filter(c=>!c.nm&&isModCard(c.id,mods)).length}
function applyModCap(){let n=0;G.deck.forEach(c=>{if(isModCard(c.id,G.mods)){if(n>=MOD_CAP)c.nm=true;else n++}})}
function rnum(x,ref){return Number.isInteger(ref)?Math.round(x):Math.round(x*100)/100}
function cardVal(c,up){const d=CD(c);up=up===undefined?!!c.up:up;if(!up)return d.v;if(d.vu!=null)return d.vu;const x=d.v*RULES.upMult;return Number.isInteger(d.v)?Math.round(x):Math.round(x*100)/100}// 整数は四捨五入（ブレーキング 5→8）
function baseCost(c,up,gear){const d=CD(c);up=up===undefined?!!c.up:up;
  if(d.costGear){const[s,st,mn]=d.costGear;return Math.max(mn,s-st*(gear||0))}
  return up&&d.cu!=null?d.cu:d.c}
function costOf(c){const d=CD(c);let x=baseCost(c,undefined,B?B.gear:0);if(d.t==="atk"&&B&&B.atkDown)x=Math.max(0,x-B.atkDown);return x}
function descOf(c,up,gear){const d=CD(c);up=up===undefined?!!c.up:up;const v=cardVal(c,up);
  return (up&&d.du?d.du:d.d).replace(/\{v\}/g,v)/* ★v0.22.7 du＝強化したときの説明 */.replace(/\{gv\}/g,Math.round(v*((gear||0)+1))).replace(/\{k\}/g,kOf(c,up)).replace(/\{j\}/g,jOf(c,up))}
function argOf(a,v,k,j){return a==="v"?v:a==="k"&&k!=null?k:a==="j"&&j!=null?j:a}
function jOf(c,up){const d=CD(c);up=up===undefined?!!c.up:up;return up&&d.ju!=null?d.ju:d.j}/* ★v0.22.167 3つ目の数 {j}（design 10-21 v0.11.137：陽だまりグリップ） */
function kOf(c,up){const d=CD(c);up=up===undefined?!!c.up:up;return up&&d.ku!=null?d.ku:d.k}/* ★v0.22.24 2つ目の数 {k}（text 28-0） */
/* 回転を下げる量（見込み用） */
function revDownOf(c){const v=cardVal(c);return CD(c).fx.filter(f=>f[0]==="revDown").reduce((s,f)=>s+argOf(f[1],v),0)}
/* 強化で何か変わるか（変わらないカードはシムトレーニングに出さない） */
function canUpgrade(c){const d=CD(c);if(c.up||d.gen)return false;return descOf(c,false,0)!==descOf(c,true,0)||baseCost(c,false,0)!==baseCost(c,true,0)||(d.gasu!=null&&d.gasu!==d.gas)}

function motionOf(c){const d=CD(c);return d.mo||TYPE_MOTION[d.t]||"rev"}
function rarityOf(c){return CARDS[c.id||c].r||"C"}
/* ---- デッキ（ラン前に組む：上限 C4・R2・E1・SK1、20枚） ---- */
function deckPool(charId){const ok=typeof deckUL==="function"?deckUL():null;return Object.keys(CARDS).filter(id=>!CARDS[id].gen&&(CARDS[id].own==="N"||CARDS[id].own===(charId||"YUKI"))&&(!ok||ok.includes(id)))}
function defaultDeck(charId){const out={};CHARS[charId||"YUKI"].deck.forEach(([id,n])=>{out[id]=(out[id]||0)+n});return out}
function deckCount(dk){return Object.values(dk).reduce((a,b)=>a+b,0)}
function deckLimitOf(id){return RULES.deckLimit[rarityOf(id)]||1}
/* 組んだデッキの確認。問題がなければ []（文で返す） */
function deckErrors(dk,charId){const e=[],pool=deckPool(charId);
  Object.entries(dk).forEach(([id,n])=>{if(!n)return;if(!pool.includes(id))e.push(`${id} は使えない`);else if(n>deckLimitOf(id))e.push(`${CARDS[id].n} は${deckLimitOf(id)}枚まで`)});
  if(deckOgCount(dk)>(RULES.ogDeckMax||1))e.push(`奥義は${RULES.ogDeckMax||1}枚まで`);/* ★v0.22.102 */
  const t=deckCount(dk);if(t!==RULES.deckSize)e.push(`デッキは${RULES.deckSize}枚（今 ${t}枚）`);return e}
/* ★v0.22.102 デバッグ（QA）：?dbg=ogall か DBG.ogAll=true。DBG.og＝入れる奥義の id（なければその子の1枚目） */
var DBG=(typeof window!=="undefined"&&window.DBG)||{};try{if(typeof location!=="undefined"&&/[?&]dbg=ogall/.test(location.search)&&!/github\.io$/.test(location.hostname))DBG.ogAll=true/* ★v0.22.122 公開β（revremit-play）では効かない（design 10-15-4） */}catch(e){}
function dbgOgApply(ch){const ids=Object.keys(CARDS).filter(id=>CARDS[id].r==="OG"&&CARDS[id].own===ch);if(!ids.length)return;if(G.ul)ids.forEach(id=>{if(!G.ul.cards.includes(id))G.ul.cards.push(id)});
  const want=DBG.og&&ids.includes(DBG.og)?DBG.og:ids[0];G.deck=G.deck.filter(c=>rarityOf(c)!=="OG");const i=G.deck.findIndex(c=>rarityOf(c)==="C"&&CD(c).own==="N");if(i>=0)G.deck.splice(i,1);G.deck.push(inst(want))}
function deckOgCount(dk){return Object.entries(dk).reduce((a,[id,n])=>a+(CARDS[id]&&CARDS[id].r==="OG"?n:0),0)}

/* ---- ラン（3エリア。マップは design 付録の作り方）---- */
function genMap(){
  const map=[];AREAS.forEach((a,ai)=>{
    for(let r=0;r<a.rows;r++){let row;
      if(r===0)row=[{k:"battle"},{k:"battle"}];
      else if(r===a.rows-1)row=[{k:"garage"}];
      else{const n=rnd(2,4);row=[];let prevElite=false;
        const NM=(typeof nightFace==="function"&&G&&(nightFace(G.night)||{}).nodeMul)||null;/* ★v0.22.195 閉店の夜 */
        for(let i=0;i<n;i++){const ew=NR().eliteW,w=NODE_W.filter(x=>r>=x[2]).map(x=>x[0]==="elite"&&ew?[x[0],ew,x[2]]:x).map(x=>NM&&NM[x[0]]!=null?[x[0],x[1]*NM[x[0]],x[2]]:x);const t=w.reduce((s,x)=>s+x[1],0);let q=Math.random()*t,k="battle";
          for(const x of w){q-=x[1];if(q<0){k=x[0];break}}row.push({k})}
        if(r===a.mid&&!row.some(n=>n.k==="shop"||n.k==="sim"))row[0]={k:Math.random()<0.5?"shop":"sim"};}
      row.forEach(n=>{n.a=ai;n.r=r;if(n.k==="shop"){n.feat=Math.random()<RULES.featRate;n.sale=Math.random()<RULES.saleRate}});
      map.push(row)}
    // ★v0.22.144 分かれ道 +1（design 24-1）：NIGHT 2 から。真ん中の段（全体の 1/3〜2/3・はじめとガレージの段は除く）のうち、マスのいちばん少ない段に1つ足す（4つまで）。種類はほかのマスと同じ重み
    if(G&&G.night&&NR().fork){const base=map.length-a.rows,lo=Math.max(1,Math.ceil(a.rows/3)),hi=Math.min(a.rows-2,Math.floor(a.rows*2/3)),cand=[];for(let r=lo;r<=hi;r++)if(map[base+r].length<4)cand.push(r);
      if(cand.length){const mn=Math.min(...cand.map(r=>map[base+r].length)),c2=cand.filter(r=>map[base+r].length===mn),r=c2[rnd(0,c2.length-1)],ew=NR().eliteW,w=NODE_W.filter(x=>r>=x[2]).map(x=>x[0]==="elite"&&ew?[x[0],ew,x[2]]:x),t=w.reduce((s,x)=>s+x[1],0);let q=Math.random()*t,k="battle";for(const x of w){q-=x[1];if(q<0){k=x[0];break}}
        const n={k,a:ai,r,fork:1};if(k==="shop"){n.feat=Math.random()<RULES.featRate;n.sale=Math.random()<RULES.saleRate}map[base+r].push(n)}}
    // ★裏道（design 9-6）：NIGHT 1 を初めてクリアしたあと。エリアに入ったとき 35% で、4〜9段目のどこかに1つ
    if(G&&G.hiddenOn&&Math.random()<UNLOCK.hiddenRate){const base=map.length-a.rows,r=rnd(UNLOCK.hiddenRows[0],Math.min(UNLOCK.hiddenRows[1],a.rows-2)),row=map[base+r];
      const n={k:"hidden",a:ai,r};if(row.length<4)row.push(n);else{const js=row.map((x,j)=>j).filter(j=>!(r===a.mid&&(row[j].k==="shop"||row[j].k==="sim"))&&!row[j].fork);row[js.length?js[rnd(0,js.length-1)]:rnd(0,row.length-1)]=n}}/* ★v0.22.148 BUG-61：1段は4つまで（4つの段では、真ん中の段のショップ・シムと分かれ道のマス以外と入れかえる。前は5つめに足すことがあった） */
    {const base=map.length-a.rows;for(let r=0;r<a.rows;r++)wxRow(map[base+r],a.key,ai===0&&r<3&&G&&G.wxFirst)}/* ★v0.22.126 天候 */
    map.push([{k:"boss",a:ai,r:a.rows,wx:"dry"}]);
  });return map}
/* ★v0.22.126 天候（design 10-16-1）：戦闘・エリート・裏道のマスごとに1つ。同じ段はなるべくちがう天候。初めのランのエリア1 最初の3段はドライ */
function wxPick(ak){return wxPick0(ak)}
function wxPick0(ak){const W=(typeof WX_W!=="undefined"&&WX_W[ak])||{dry:1};let t=0;const ls=(typeof WX_ON!=="undefined"?WX_ON:["dry"]).map(k=>{const w=k==="dry"?Object.keys(W).filter(x=>!WX_ON.includes(x)).reduce((s,x)=>s+W[x],W.dry||0):(W[k]||0);t+=w;return[k,w]});let q=Math.random()*t;for(const[k,w]of ls){q-=w;if(q<0)return k}return"dry"}
function wxRow(row,ak,dry){const used={},F=typeof nightFace==="function"&&G&&nightFace(G.night);row.forEach(n=>{if(!/^(battle|elite|hidden)$/.test(n.k))return;if(dry){n.wx="dry";return}if(F&&F.wxAll){const L=(typeof WX_ON!=="undefined"?WX_ON:["dry"]);let w=L[Math.floor(Math.random()*L.length)];if(used[w]&&w!=="dry")w=L[Math.floor(Math.random()*L.length)];n.wx=w;used[w]=(used[w]||0)+1;return}/* ★v0.22.195 最後の夜：5つの天候を同じ割合 */if(F&&F.wx){const fk=Object.keys(F.wx).find(k=>Math.random()<F.wx[k]);if(fk){n.wx=fk;used[fk]=(used[fk]||0)+1;return}}/* ★v0.22.139 夜の顔はそのまま（同じ段のちがいより先） */let w=wxPick0(ak);for(let i=0;i<3&&used[w]&&w!=="dry";i++)w=wxPick0(ak);if(used[w]>=1&&w!=="dry"){const alt=wxPick0(ak);if(!used[alt])w=alt}if(used[w]>=2&&w!=="dry")w="dry";/* ★v0.22.144 分かれ道で4つの段がふえたので、同じ天候は1つの段に2つまで（夜の顔の天候は別） */used[w]=(used[w]||0)+1;n.wx=w})}
function wxNow(){return(B&&!B.over&&B.wx)||"dry"}
function wxDef(){return(typeof WEATHER!=="undefined"&&WEATHER[wxNow()])||{}}
function wxMinus(){const w=wxNow();return w!=="dry"&&(CHARS[G.char]||{}).wxFav!==w}
function newRunState(mode,charId,bring,dk,opt){
  charId=charId||"YUKI";const ch=CHARS[charId];opt=opt||{};G=null;
  if(!dk||deckErrors(dk,charId).length)dk=defaultDeck(charId);
  const deck=[];Object.entries(dk).forEach(([id,n])=>{for(let i=0;i<n;i++)deck.push(inst(id))});
  bring=(Array.isArray(bring)?bring:[]).slice(0,BRING_MAX);
  const night=Math.max(0,+opt.night||0),nr=nightOf(night);
  nr.startJam.forEach(id=>deck.push(inst(id)));
  G={char:charId,car:JSON.parse(JSON.stringify(ch.car)),mode,hp:ch.car.hp+nr.maxHp,maxhp:ch.car.hp+nr.maxHp,money:nr.money0!=null?nr.money0:RULES.money0,tickets:0,heat:0,heatMax:0,
     tune:{tire:0,shift:0,engine:0,light:0,ecu:0},parts:[],deck,map:null,row:0,path:[],cageUsed:false,seen:{},
     night,ul:opt.ul||null,hiddenOn:!!opt.hidden,hiddenWon:[],newUnlocks:[],
     st:{shiftTry:0,perfect:0,good:0,otk:0,battles:0,clear:false,rowsDone:0,maxTurnDmg:0,maxChain:0,area:0,elites:0,bosses:0,hidden:0},bring,atkBonus:0,mcParts:[],soldParts:[]};/* ★v0.22.37 持ちこみのパーツ・売ったパーツ（10-14・10-19） */
  G.mods=JSON.parse(JSON.stringify(opt.mods||(typeof PRF==="function"&&SAVE&&SAVE.cur&&PRF().mods)||{}));/* ★v0.22.47 改造 */
  G.wxFirst=!!opt.wxFirst;G.ghostRec=opt.ghost||null;G.ghostDone=0;G.ghostMet=0;G.ghostWon=0;G.map=genMap();
  bring.forEach(m=>{const b=mcBonus(m);G.maxhp+=b.hp;G.hp+=b.hp;G.atkBonus+=b.atk/100;
    m.cards.forEach(c=>{const x=inst(c.id,c.up);x.mc=1;deck.push(x)});
    if(m.part&&!G.parts.includes(m.part)&&G.parts.length<RULES.partsMax){addPart(m.part);G.mcParts.push(m.part)}});
  G.tree={lv:((opt.tree&&opt.tree.lv)||treeOfProfile(charId)).slice(0,3)};treeApplyDeck();/* ★v0.22.48 */if(typeof DBG!=="undefined"&&DBG.ogAll)dbgOgApply(charId);/* ★v0.22.102 design 10-15-4 デバッグ「奥義を全部解放・デッキに1枚」 */
  applyModCap();
  return G;
}
function mcBonus(m){const i=Math.max(0,RANKS.indexOf(m.rank));return{hp:MC_BONUS.hp[i],atk:MC_BONUS.atk[i]}}
function areaIdx(){const r=G.map[Math.min(G.row,G.map.length-1)];return r[0].a}
function curArea(){return AREAS[areaIdx()]}
/* マスの敵：最初の3段はやさしい雑魚だけ */
function nodeEnemy(n){const a=AREAS[n.a];if(n.ghost&&ghostReady())return"__ghost";if(n.k==="elite"&&typeof nightFace==="function"&&G&&(nightFace(G.night)||{}).splash)return splashKey(n.a);/* ★v0.22.139 雨の夜 *//* ★v0.22.137 */if(n.k==="elite"||n.k==="hidden")return a.elite;if(n.k==="boss")return a.boss;return n.r<3?pick(a.easy):pick(a.pool)}
/* 次の段へ。ボスのあとは耐久を 30% 回復（design 付録）。戻り値 "map"｜"area"（次のエリアに入った）｜"clear" */
function advanceRow(){{const nd=G.map[G.row]&&G.map[G.row][G.path[G.row]];if(nd){const H=RULES.heat;if(nd.k==="garage")heatSet(H.garage,"ガレージで冷めた");else if(/^(shop|sim|lucky)$/.test(nd.k))heatSet((G.heat||0)+H.shop)}}/* ★v0.22.131 ヒートが冷める */const prev=G.map[G.row][0];G.row++;G.st.rowsDone=G.row;
  if(G.row>=G.map.length){G.st.clear=true;return"clear"}
  if(prev.k==="boss"){G.st.bosses++;const ah=NR().areaHeal,h=Math.round(G.maxhp*(ah!=null?ah:RULES.areaHeal));G.hp=Math.min(G.maxhp,G.hp+h);G.st.area=areaIdx();ghostRoll(areaIdx());return"area"}
  return"map"}
/* 候補に出るパーツ：共通＋自分の専用だけ（★v0.22.37 虎雪 15:23・design 10-14：持ちこんだキャラの専用は出さない）。持っているもの・このランで売ったものは除く */
function partPool(){const sold=G.soldParts||[];
  return Object.keys(PARTS).filter(p=>!G.parts.includes(p)&&!sold.includes(p)&&(PARTS[p].own==="N"||PARTS[p].own===G.char)&&partOK(p))}
/* ★v0.22.37 design 10-19 パーツの売却：目玉商品の値段の 40%（5きざみに切り捨て）＋専用 +10。持ちこみのミニカーのパーツは売れない（0＝外すだけ） */
function isMcPart(p){return(G.mcParts||[]).includes(p)}
function sellPrice(p){if(!PARTS[p]||isMcPart(p))return 0;return Math.floor(RULES.featPrice*RULES.sellRate/5)*5+(PARTS[p].own!=="N"?RULES.sellOwnAdd:0)}
function removePartAt(idx){const p=G.parts[idx];if(p==null)return null;G.parts.splice(idx,1);if(p==="forged")G.maxhp+=10;if(isMcPart(p))G.mcParts=G.mcParts.filter(x=>x!==p);return p}
function sellPart(p,idx){/* idx あり＝持っているパーツ、なし＝手に入れたばかりのものをその場で売る */const v=sellPrice(p);if(idx!=null&&idx>=0){if(G.parts[idx]!==p)return 0;removePartAt(idx)}
  if(v>0){G.money+=v;(G.soldParts=G.soldParts||[]).push(p)}return v}
/* ★v0.22.48 ツリーの2段目：その型のパーツが出やすい（重み ×1.25） */
function wPickN(L,n,w){L=L.slice();const out=[];while(out.length<n&&L.length){const t=L.reduce((a,x)=>a+w(x),0);let r=Math.random()*t,i=0;for(;i<L.length-1;i++){r-=w(L[i]);if(r<0)break}out.push(L.splice(i,1)[0])}return out}
function partOptions(n){return wPickN(partPool(),n||3,treePartW)}
/* パーツを取る。5つあるときは idx の枠と入れ替える（idx なしで5つなら false） */
function addPart(p,idx){let old=null;if(G.parts.length<RULES.partsMax)G.parts.push(p);
  else{if(idx==null||idx<0||idx>=G.parts.length)return false;old=G.parts[idx];G.parts[idx]=p}
  if(old==="forged"){G.maxhp+=10}if(p==="forged"){G.maxhp-=10;G.hp=Math.min(G.hp,G.maxhp)}// 鍛造ピストン：最大 −10（外したらもどす）
  return true}
/* 戦闘のあとの3択。先にレア度を C60・R30・E10 で引く。エリートは R 以上を1枚、ボスは E を1枚約束 */
function rewardOptions(rank,nn){nn=nn||3;
  const pool=[...new Set(CHARS[G.char].pool)].filter(id=>CARDS[id]&&!CARDS[id].gen&&rarityOf(id)!=="SK"&&rarityOf(id)!=="OG"&&cardOK(id));
  const out=[];
  const hh=G.heat||0,RW={C:RULES.rarityW.C+RULES.heat.rar[0]*hh,R:RULES.rarityW.R+RULES.heat.rar[1]*hh,E:RULES.rarityW.E+RULES.heat.rar[2]*hh};/* ★v0.22.131 ヒートでレア度アップ */
  const draw=list=>{const rs=[...new Set(list.map(rarityOf))],t=rs.reduce((a,r)=>a+(RW[r]||10),0);let x=Math.random()*t,r=rs[rs.length-1];
    for(const q of rs){x-=RW[q]||10;if(x<0){r=q;break}}const L=list.filter(id=>rarityOf(id)===r),fm=typeof nightFace==='function'&&(nightFace(G.night)||{}).frzReward;if(!fm)return pick(L);/* ★v0.22.139 雪の夜：凍結のカードが出やすい */const ww=L.map(id=>JSON.stringify(CARDS[id].fx||[]).includes('"frz')||JSON.stringify(CARDS[id].fx||[]).includes('freeze')?fm:1),tt=ww.reduce((a,b)=>a+b,0);let y=Math.random()*tt;for(let i=0;i<L.length;i++){y-=ww[i];if(y<0)return L[i]}return L[L.length-1]};
  if(rank==="elite"){const hi=pool.filter(id=>rarityOf(id)!=="C");if(hi.length)out.push(draw(hi))}
  if(rank==="boss"){const hi=pool.filter(id=>rarityOf(id)==="E");if(hi.length)out.push(pick(hi))}
  while(out.length<nn){const rest=pool.filter(id=>!out.includes(id));if(!rest.length)break;out.push(draw(rest))}
  /* ★v0.22.37 design 10-14：持ちこんだミニカー（ほかのキャラのもの）のカード2種だけが、3枚のうち1枚まで出る。1台 15%（2台で 30%）。強化前の形・2種（2台なら4種）から等しく1つ */
  const other=(G.bring||[]).filter(m=>m.char!==G.char),carry=[...new Set(other.flatMap(m=>m.cards.map(c=>c.id)))].filter(id=>CARDS[id]&&!CARDS[id].gen&&!CARDS[id].fused&&!out.includes(id));/* ★v0.22.51 BUG-51：合成カードは持ちこみの候補に出さない */
  if(carry.length&&out.length&&Math.random()<RULES.carryCardP*other.length){const k=(rank==="elite"||rank==="boss")&&out.length>1?out.length-1:Math.floor(Math.random()*out.length);out[k]=pick(carry)}
  /* ★v0.22.102 奥義（design 10-15-1）：ボス 3%・エリート 1%。3枚のうち1枚。解放ずみの自分の奥義から（デッキにある奥義は出さない） */
  {const P=RULES.ogRewardP||{},pr=P[rank];if(pr&&out.length&&Math.random()<pr){const have=new Set(G.deck.map(c=>c.id)),og=Object.keys(CARDS).filter(id=>CARDS[id].r==="OG"&&CARDS[id].own===G.char&&cardOK(id)&&G.ul&&G.ul.cards.includes(id)&&!have.has(id));if(og.length)out[Math.floor(Math.random()*out.length)]=pick(og)}}
  return shuffle(out);
}
/* ★v0.22.45 合成（design 10-21）：今のデッキにある組み合わせ。強化ずみの材料を先に使う（両方強化ずみ→合成カードも強化ずみ） */
function fuseOptions(){const out=[];FUSE.forEach(f=>{if(!CARDS[f.id])return;const pickI=id=>{const L=G.deck.map((c,i)=>[c,i]).filter(([c])=>c.id===id);if(!L.length)return -1;const u=L.find(([c])=>c.up);return(u||L[0])[1]};
  const ia=pickI(f.a),ib=pickI(f.b);if(ia<0||ib<0)return;out.push({id:f.id,a:f.a,b:f.b,ia,ib,up:!!(G.deck[ia].up&&G.deck[ib].up)})});return out}
function fuseCards(o){const a=G.deck[o.ia],b=G.deck[o.ib];if(!a||!b||a.id!==o.a||b.id!==o.b||o.ia===o.ib)return null;
  [o.ia,o.ib].sort((x,y)=>y-x).forEach(i=>G.deck.splice(i,1));const c=inst(o.id);if(o.up)c.up=true;G.deck.push(c);(G.st.fused=G.st.fused||[]).push(o.id);
  try{const p=SAVE.cur.profile;p.codex=p.codex||{};p.codex.fuse=p.codex.fuse||{};p.codex.fuse[o.id]=1}catch(e){}return c}
function upgradeTargets(){return G.deck.map((c,i)=>[c,i]).filter(([c])=>canUpgrade(c)).map(([,i])=>i)}
function tunePrice(k,shop,useTicket){const lv=G.tune[k];if(lv>=5)return null;return shopPrice(TUNE_PRICE[lv],shop,useTicket)}
function shopPrice(x,shop,useTicket){let v=x;if(shop&&shop.sale)v=Math.round(v*RULES.sale);if(has("etc"))v=Math.round(v*0.8);if(useTicket)v=Math.round(v*RULES.ticket);const T=G&&G.ticket;if(T&&T.k==="discount"&&shop&&T.shop===shop)v=Math.max(Math.round(x*0.5),Math.round(v*0.8));/* ★② v0.5.20 design v0.11.153：整備チケットの割引は 20%（ほかと重ねて最大 50%） *//* ★v0.22.65 整備チケット：最初のショップ 30% 引き（ほかと重ねて最大 50% 引き） */return v}
function buyTune(k,price,useTicket){if(G.tune[k]>=5||G.money<price)return false;G.money-=price;if(useTicket&&G.tickets>0)G.tickets--;G.tune[k]++;
  if(k==="engine"){G.maxhp+=10;G.hp+=10}return true}
/* 目玉商品：お金はパーツが本当に入ったときだけ払う（BUG-01） */
function buyFeat(shop,price,useTicket,idx){if(shop.featBought||G.money<price)return false;
  if(!addPart(shop.featPart,idx))return false;G.money-=price;if(useTicket&&G.tickets>0)G.tickets--;shop.featBought=true;return true}
function restAmount(){return Math.round(G.maxhp*RULES.restRate)}

/* ---- 戦闘 ---- */
function startBattleState(key){
  const E=ENEMIES[key];const C=car();const AR=curArea(),nr=NR(),node=G.map&&G.map[G.row]&&G.map[G.row][G.path[G.row]]||null,hid=!!(node&&node.k==="hidden");
  const el=E.rank==="elite"?nr.eliteMul:1,hm=hid?UNLOCK.hiddenMul:1;
  const abm=RULE().areaBossHp&&(G.night||0)>=2&&AREAS.some(a=>a.boss===key)?RULE().areaBossHp:1;/* ★v0.22.90 LD 11-47 A：HINA・NANA は NIGHT 2 からエリアのボス（残光・白夜・零号）×0.75 */
  const hp=Math.round(E.hp*(AR.hpMul||1)*(E.rank==="boss"?(AR.bossMul||1)*nr.bossMul:1)*nr.hpMul*el*hm*abm*heatMul());/* ★v0.22.131 ヒート +3%／段 */
  const wx=(node&&node.wx)||"dry";if(E.ghost)G.ghostMet=1;/* ★v0.22.137 */
  B={key,wx,am:(AR.atkMul||1)*nr.atkMul*el*hm*heatMul(),hidden:hid,pTurns:0,perf0:G.st.perfect,/* ★v0.22.45 この戦闘のパーフェクトの数（誇りの紅突） */e:{...E,hp,maxhp:hp,block:0,burn:0,noise:0,atkUp:0,pi:0,mi:0,spdUp:0,mAdd:0,next:100/E.spd,phased:false,mirrorArm:false},
     rpm:C.idle+(has("boost")?2500:0),gear:0,hand:[],draw:shuffle(G.deck.slice()),disc:[],block:0,
     pNext:0,shifts:0,shiftsT:0,nextBonus:0,forcePerfect:false,nitroUsed:false,nextTurnAdd:0,nextTurnDouble:false,
     curAdd:0,curDouble:false,wideAdd:0,cards:0,atks:0,atkDown:0,atShiftDraw:0,gas:0,charge:0,chain5:false,chain:0,chainBefore:0,turnDmg:0,
     onUp:[],perfTwice:false,atkTwice:false,htTurn:false,htBonus:0,clutchT:false,launchUsed:false,frozeTotal:0,apPen:0,
     redT:0,limitGuard:false,turnAtkAdd:0,ftStep:0,ftAcc:0,openAir:0,chainNext2:false,jinbaT:false,nextGas:0,paddleT:false,lastGrade:null,perfStreak:0,onPerf:[],phoenix:0,phoenixUsed:false,retry:false,lastHitRaw:0,lastHitThru:0,atkAdd:0,dryT:0,spikeUsed:false,chainCarry:0,qrN:0,qrT:0,studUid:null,playRed:false,
     enemyActed:false,log:[],ev:[],over:false,result:null};
  G.st.battles++;
  if(hid){B.e.n="ロストライン";/* ★v0.22.5 text 12-5・17-2 #7 */addLog(`裏道：${UNLOCK.hiddenTurns}ターン以内に倒す（こえたら逃げられる）`)}
  addLog(`${B.e.n} があらわれた。${E.gimTxt?"（"+E.gimTxt+"）":""}`);
  nightFaceBattle(E);/* ★v0.22.195 夜の顔（嵐の夜・最後の夜） */
  if(E.first){addLog(`${E.n} が先に動いた`);const r=enemyStep();if(r)return finish(r),B}
  startPlayerTurn(true);
  return B;
}
/* ★v0.22.195 夜の顔の戦闘の決まり。嵐の夜：はじめに「3ターン目に○○に変わる」を決めて知らせる（第2形態の天候があるボスはなし）。最後の夜：エリアのボスは第2形態から（体力はそのまま・形と行動と第2形態の天候） */
function wxNameK(w){return(typeof TEXT!=="undefined"&&TEXT.wx&&TEXT.wx[w]&&TEXT.wx[w].n)||(typeof WEATHER!=="undefined"&&WEATHER[w]&&WEATHER[w].n)||w}
function nightFaceBattle(E){const F=typeof nightFace==="function"&&nightFace(G.night);if(!F||B.sim)return;const e=B.e;
  if(F.bossP2&&E.rank==="boss"&&!E.ally&&(e.phase||e.wx2)){if(e.phase&&!e.phased){e.phased=true;e.spd=e.phase.spd||e.spd;e.next=100/e.spd;if(e.phase.morph){e.morph=e.phase.morph;e.mi=0;e.pi=0}if(e.phase.pat){e.pat=e.phase.pat;e.pi=0}}if(e.wx2){B.wx2On=true;B.wx=e.wx2}B.p2Start=1;addLog(`最後の夜：${e.n} ははじめから第2形態`)}/* 第2形態＝形（phase）と第2形態の天候（wx2）。残光・白夜は天候だけ */
  if(F.storm&&!B.hidden&&!e.wx2){const L=(typeof WX_ON!=="undefined"?WX_ON:[]).filter(w=>w!=="dry"&&w!==B.wx);if(L.length){B.stormWx=L[Math.floor(Math.random()*L.length)];B.stormAt=F.storm;addLog(`嵐の夜：3ターン目に天候が「${wxNameK(B.stormWx)}」に変わる`)}}}
function addLog(s){B.log.push(s);if(B.log.length>60)B.log.shift()}
function ev(o){B.ev.push(o);if(B.ev.length>200)B.ev.shift()}
/* 画面が読む：たまったイベントを取り出して空にする */
function takeEvents(){const a=B?B.ev:[];if(B)B.ev=[];return a}
/* 引く。本当に引けた枚数を返す（BUG-03） */
function drawN(n){let k=0;for(let i=0;i<n;i++){if(B.hand.length>=RULES.handMax)break;if(!B.draw.length){if(!B.disc.length)break;B.draw=shuffle(B.disc);B.disc=[]}B.hand.push(B.draw.pop());k++}return k}
function canDraw(){return B.hand.length<RULES.handMax&&(B.draw.length+B.disc.length)>0}
function limit(){return car().limit+(has("limiter")?500:0)}
function bandExt(){return 150*G.tune.shift+(has("closs")?200:0)}
function bandRange(){const C=car(),x=bandExt();let r={lo:C.band[0]-x,hi:C.band[1]+x,clo:C.core[0]-x/2,chi:C.core[1]+x/2};
  if(wxMinus()){const D=wxDef();/* ★v0.22.126 雪＝帯（芯も）×0.7・雨＝芯が半分（得意なキャラは効かない） */
    if(D.bandMul){const k=D.bandMul,bc=(r.lo+r.hi)/2,bh=(r.hi-r.lo)/2*k,cc=(r.clo+r.chi)/2,ch=(r.chi-r.clo)/2*k;r={lo:Math.round(bc-bh),hi:Math.round(bc+bh),clo:Math.round(cc-ch),chi:Math.round(cc+ch)}}
    if(D.coreMul){const cc=(r.clo+r.chi)/2,ch=(r.chi-r.clo)/2*D.coreMul;r.clo=Math.round(cc-ch);r.chi=Math.round(cc+ch)}}
  return r}
/* ★v0.22.96 design 14-3② パーフェクト連続：今の連続の数（B.perfChain）での上乗せ。+0.1 ずつ・最大 +0.2（パーフェクトの +0.3 と合わせて +0.5） */
function perfBreak(){const n=B.perfChain||0;B.perfChain=0;if(n>=2&&G.mode==="MT")ev({k:"pbreak",n})}/* ★v0.22.100 連続が切れた（2以上のときだけ・番の終わりの0は数えない）→ anim で perfect_break */
function perfChainAdd(n){n=n==null?B.perfChain||0:n;const R=RULES.perfChain||{step:0.1,max:0.5};return G&&G.mode==="MT"&&n>1?Math.round(Math.min(R.max-0.3,R.step*(n-1))*100)/100:0}
function grade(rpm){const b=bandRange();if(B.forcePerfect||has("dogmt"))return"perfect";if(has("launch")&&!B.launchUsed)return"perfect";if(rpm>=b.clo&&rpm<=b.chi)return"perfect";if(rpm>=b.lo&&rpm<=b.hi)return"good";return rpm<b.lo?"early":"late"}
const GRADE_JP={perfect:"パーフェクト",good:"グッド",early:"早すぎ",late:"遅い"};
/* ★ガソリン（design 0-1） */
function maxGas(){const g=RULES.gasMax+(G.tune.light>=3?1:0)+(G.tune.light>=5?1:0),D=driveDef(),dg=D?driveGas(B.drive||"eco"):0;return dg?Math.max(g,Math.min(RULES.driveGasCap||7,g+dg)):g}
/* ★v0.22.98 design 14-3③ ドライブモード（AT だけ）：B.drive＝"eco"|"sport"（番のはじめに1回だけ切りかえ・初めはエコ・次の番もそのまま） */
function driveOn(){return !!(G&&G.mode==="AT"&&RULES.drive&&G.char!=="MIO"&&!RULE().noDrive)}/* ★design 14章の追記：MIO（CVT）にはドライブモードを出さない（③のキャラは rule.noDrive でも外せる） */
function driveDef(){return driveOn()&&B?RULES.drive[B.drive||"eco"]:null}
function driveGas(k){const D=RULES.drive[k];if(!D)return 0;const r=RULE()[k+"Gas"];return r!=null?r:(D.gas||0)}/* ★v0.22.110 ★虎雪 11-24 17:15・LD 11-65①：MOMO はエコのガソリン +1 なし（ecoGas:0） */
function driveMult(k){const D=RULES.drive[k];if(!D)return RULES.atMult;const r=RULE()[k+"Mult"];return r!=null?r:D.mult}/* ★v0.22.110 LD balance 11-65：キャラごとの倍率（HINA sportMult 0.9） */
function atMultNow(){if(G.mode!=="AT")return 1;const D=driveDef();return D?driveMult(B.drive||"eco"):RULES.atMult}
function canDrive(){return driveOn()&&B&&!B.over&&B.cards===0&&!B.driveT}
function setDrive(k){if(!canDrive()||!RULES.drive[k]||(B.drive||"eco")===k)return false;const g0=maxGas();B.drive=k;B.driveT=true;const d=maxGas()-g0;B.gas=Math.max(0,B.gas+d);addLog(`ドライブモード：${k==="eco"?"エコ":"スポーツ"}`);return true}
/* ★v0.22.41 走りかたで変わるガソリン（gasMT＝MT のときの値。強化の gasu があればそちら） */
function gasMode(){return (typeof G!=="undefined"&&G&&G.mode)||(typeof PRF==="function"&&PRF()&&PRF().lastMode)||"MT"}
function gasRaw(d,up,mode){if(up&&d.gasu!=null)return d.gasu;if((mode||gasMode())==="MT"&&d.gasMT!=null)return d.gasMT;return d.gas||0}
function gasLabel(d,up){const g=gasRaw(d,up,"AT"),m=gasRaw(d,up,"MT");return m===g?String(g):`${gasRaw(d,up)}（MT ${m}・AT ${g}）`}
function gasBase(c){return gasRaw(CD(c),c.up)}
function gasOf(c){const d=CD(c);let a=gasBase(c);if(d.charge)a=Math.max(0,a-B.charge);if(B.gasDiscT&&B.gasDiscT!==(c.uid||null)&&a>0)a--;/* ★v0.22.102 花霞 */
  {const t=treeTop(),id=c.id||c;if(a>0&&((t==="y_red"&&id==="shironeko"&&inRed())||(t==="m_rev"&&id==="m_hougou"&&G.hp<=G.maxhp/2)))a--;if(t==="h_rush"&&id==="h_sunrise"&&B.pTurns===0)a=0}if(has("aero")&&B.gear===car().gears-1&&a>=2)a--;
  if(has("drysump")&&d.band==="R"&&a>0&&B.dryT<2&&inBand(c))a--;return a}
function addGas(n){B.gas=Math.min(maxGas(),B.gas+n)}
function addCharge(why){B.charge++;ev({k:"charge",n:B.charge,why});if(B.hand.concat(B.draw,B.disc).some(c=>CD(c).charge))addLog(`大技の条件（${why}）：ガソリン −1`)}
/* ★回転数の帯（design 0-3）：打つ前の回転で判定 */
function redLo(){return RULES.red[G.mode]-(has("hicam")?1000:0)-(B&&!B.over&&wxDef().redDown||0)/* ★v0.22.128 夜明け：レッドが 500 下から */}
function bandRangeOf(c){const d=CD(c);if(!d.band)return null;if(d.band==="R")return[redLo(),limit()];return car().bands[d.band]}
function inBand(c){const r=bandRangeOf(c);if(!r)return false;if(CD(c).bandAny)return true;return B.rpm>=r[0]&&(CD(c).band==="R"?B.rpm<=r[1]:B.rpm<r[1])}
function inRed(){return B.rpm>=redLo()&&B.rpm<=limit()}
/* ★チェイン（design 0-2） */
function chainStep(){return(RULE().chainStep||RULES.chainStep)+(has("slick")?0.05:0)+(wxDef().chainAdd||0)/* ★v0.22.126 雨 */}
function chainMul(n){return 1+chainStep()*Math.min(n==null?B.chain:n,RULES.chainMax)}
function isTopGear(){return B.gear>=car().gears-1}
function shiftLeft(){return B.shiftsT<shiftCapNow()}
/* 今のギアの倍率（表示用。AT の ×0.9 も入れる：BUG-06） */
function gearMult(){return Math.round(car().mult[B.gear]*atMultNow()*100)/100}
function startPlayerTurn(first){
  B.block=B.blkCarry||0;if(B.blkCarry)addLog(`余熱：防御 ${B.blkCarry} が残った`);B.blkCarry=0;B.cards=0;B.atks=0;B.shifts=0;B.shiftsT=0;B.perfChain=0;B.gasDiscT=null;/* ★v0.22.96 design 14-3② */B.driveT=false;if(driveOn()){if(!B.drive)B.drive="eco";if(typeof DRIVE_PICK==="function"){const k=DRIVE_PICK();if(RULES.drive[k])B.drive=k}}/* ★v0.22.98 ドライブモード：ボット・測りは DRIVE_PICK で選ぶ */B.gas=Math.max(0,maxGas()-B.apPen);
  if(B.apPen)addLog(`ガソリン −${B.apPen}（イエローフラッグ）`);B.apPen=0;B.nShiftT=false;B.rescueT=0;B.rotT=false;B.chain5=false;B.chain=B.chainCarry||0;B.chainCarry=0;B.turnDmg=0;B.redT=0;B.limitGuard=false;B.dryT=0;B.turnAtkAdd=0;B.ftStep=0;B.ftAcc=0;B.openAir=0;B.jinbaT=false;B.paddleT=false;B.qrN=0;B.qrT=0;B.htTurn=false;B.htBonus=0;B.clutchT=false;
  B.curAdd=B.nextTurnAdd;B.nextTurnAdd=0;B.curDouble=B.nextTurnDouble;B.nextTurnDouble=false;
  if(B.nextGas){B.gas+=B.nextGas;addLog(`人馬一体：ガソリン +${B.nextGas}`);B.nextGas=0}
  if(first&&RULE().firstGas){B.gas+=RULE().firstGas;addLog(`最初のターン：ガソリン +${RULE().firstGas}`)}
  if(first&&wxDef().gas1){B.gas+=wxDef().gas1;addLog(`${wxName0()}：最初のターン ガソリン +${wxDef().gas1}`)}/* ★v0.22.128 夜明け（design 10-16-1） */
  if(has("h_wheelie")&&B.gear===0){B.gas*=2;addLog("ウィリー：ガソリン2倍")}
  if(first)drawN(RULES.hand0+(has("hook")?1:0)+(has("h_12inch")?2:0)+(has("boost")?1:0));
  else if(B.hand.length===0&&drawN(1))addLog("手札がないので1枚引いた（救済）");
  // AT：番のはじめに回転が低ければ自動で1段シフトダウン（design 0-7）
  if(!first&&G.mode==="AT"&&RULES.atAutoDown&&B.gear>0&&B.rpm<RULES.atAutoDown){B.gear--;B.rpm=Math.round(B.rpm/car().downDiv/100)*100;addLog(`自動シフトダウン → ${B.gear+1}速`);ev({k:"down",auto:1})}
  // ★v0.22.1 MT の詰みの救済（design 0-8・5-1b mtLockDraw）：MT・1速・手札に打てるカードが1枚もない番だけ1枚引く
  if(!first&&RULES.mtLockDraw&&G.mode==="MT"&&B.gear===0&&B.hand.length&&!B.hand.some(c=>preview(c).ok)&&drawN(1))addLog("打てるカードがないので1枚引いた（救済）");
  addLog(`— あなたの番（${B.gear+1}速・${B.rpm}回転・ガソリン ${B.gas}）`);
}
/* 自動シフト（AT）／シフトできるか（MT） */
function atShiftTh(){const b=bandRange(),eco=RULE().atShiftAt||b.lo;return B.drive==="sport"&&driveOn()?Math.max(eco,Math.min(eco+Math.round((b.hi-b.lo)/2/100)*100,(car().red||redLo())-500)):eco}/* ★v0.22.100 design 14-3 v0.11.69：スポーツ＝エコの回転＋帯の幅の半分（レッドの 500 手前まで） */
function wouldAutoShift(c,nr){const th=atShiftTh();return G.mode==="AT"&&!isTopGear()&&shiftLeft()&&nr>=th&&costOf(c)>0}/* ★v0.22.98 スポーツは帯の上のはしまで待つ *//* ★v0.22.25 design v0.11.13 10-12-4c：MOMO の AT は 5000 から */
/* カードを打つ前の見込み（打てるか・シフト・危ない）。数字は simulateCard */
/* ★design 11-1 ローテーション（pitsign）：打てないカード＝ガソリン・回転・条件で打てないカードとジャマ。nr＝打ったあとの回転で見る。ほかのローテーションは同じターンに打てないので打てない扱い */
function rotTargets(self,nr){const r0=B.rpm,c0=B.cards;B.rpm=nr;B.cards++;try{return B.hand.filter(x=>x!==self&&(CD(x).t==="jam"||CD(x).fx.some(f=>f[0]==="rotate")||!preview(x).ok))}finally{B.rpm=r0;B.cards=c0}}
/* ★LD balance 11-15（チーフ承認）：自動で選ぶとき（オート・ボット）は、ガソリンだけ足りなくて次の番に打てるカードは捨てない */
function rotKeepForNext(x,nr){if(CD(x).t==="jam")return false;const r0=B.rpm,g0=B.gas,c0=B.cards;B.rpm=nr;B.gas=99;B.cards++;try{return preview(x).ok&&gasOf(x)<=maxGas()}finally{B.rpm=r0;B.gas=g0;B.cards=c0}}
/* ★design v0.11.9 11-1：オート・ボットの捨てる順。1 ジャマ → 2 この戦闘でもう打てない（最大ギア・シフトの回数をこえたシフトのカード）→ 3 打つとオーバーレブ・ブローの予告 → 4 ガソリン満タンでも足りない。
   捨てない：今の番だけガソリンが足りない・固有スキル・手札に1枚しかない攻撃。同じ順の中はレア度の低い方 → 回転の高い方 */
function rotCat(x,nr,onlyAtk){const d=CD(x);if(d.t==="jam")return 1;if(d.r==="SK"||d.t==="sk"||x===onlyAtk)return 0;if(d.fx.some(f=>f[0]==="rotate"))return 0;
  if((d.shiftCard||d.atShift)&&(isTopGear()||!shiftLeft()))return 2;
  const r0=B.rpm,g0=B.gas,c0=B.cards;B.rpm=nr;B.gas=99;B.cards++;let p;try{p=preview(x)}finally{B.rpm=r0;B.gas=g0;B.cards=c0}
  if(p.ok&&(p.danger==="over"||p.danger==="blow"))return 3;if(gasOf(x)>maxGas())return 4;return 0}
function rotAutoPick(self,nr,v){const h=B.hand.filter(x=>x!==self),atks=h.filter(x=>CD(x).t==="atk"),only=atks.length===1?atks[0]:null,rk={C:0,R:1,E:2,SK:3};
  return h.map(x=>({x,k:rotCat(x,nr,only)})).filter(o=>o.k>0).sort((a,b)=>a.k-b.k||(rk[CD(a.x).r]||0)-(rk[CD(b.x).r]||0)||costOf(b.x)-costOf(a.x)).slice(0,v).map(o=>o.x)}
function rotOrder(t){const k=x=>CD(x).t==="jam"?0:1;return t.slice().sort((a,b)=>k(a)-k(b)||gasOf(b)-gasOf(a)||costOf(b)-costOf(a))}
function rotNeedPick(c){if(!c||!CD(c).fx.some(f=>f[0]==="rotate"))return 0;const t=rotTargets(c,B.rpm+costOf(c)),v=cardVal(c);return t.length>v?v:0}
function preview(c){
  const d=CD(c),C=car(),cost=costOf(c),rs=inRed()?d.fx.find(f=>f[0]==="redStay"):null,nr=B.rpm+cost-(rs?rs[1]:0),L=limit();
  if(d.redOnly&&!inRed())return{ok:false,txt:"レッドゾーンでないと打てない"};
  if(d.topOnly&&!isTopGear())return{ok:false,txt:"最大ギアでないと打てない"};
  if(d.atShift&&G.mode==="AT"&&(isTopGear()||!shiftLeft()))return{ok:false,txt:isTopGear()?"もう最大ギア（シフトできない）":`シフトアップは1ターン${shiftCapNow()}回まで`};
  if(B.cards>=RULES.cardCap)return{ok:false,txt:`このターンはもう打てない（${RULES.cardCap}枚まで）`};
  const g=gasOf(c);if(g>B.gas)return{ok:false,txt:d.charge&&g>maxGas()?`大技：あと ${g-B.gas} 目盛り（条件で減る）`:`ガソリンが足りない（${g}目盛り）`};
  if(d.t==="atk"&&B.e.cap&&B.atks>=B.e.cap)return{ok:false,txt:`このターンはもうアタックできない（${B.e.cap}枚まで）`};
  let rotN=0;if(d.fx.some(f=>f[0]==="rotate")){if(B.rotT)return{ok:false,txt:"このターンは使った"};rotN=Math.min(rotTargets(c,nr).length,cardVal(c));if(!rotN)return{ok:false,txt:"入れかえるカードがない"}}
  if(d.shiftCard&&G.mode==="MT"&&isTopGear())return{ok:false,txt:"もう最大ギア（シフトできない）"};// BUG-04
  if(d.shiftCard&&G.mode==="MT"&&!shiftLeft())return{ok:false,txt:`シフトアップは1ターン${shiftCapNow()}回まで`};
  const canShift=G.mode==="MT"&&!isTopGear()&&shiftLeft()&&((nr>=C.minShift&&cost>0)||!!d.shiftCard);
  const auto=wouldAutoShift(c,nr)||(G.mode==="AT"&&!!d.atShift);
  const paddle=G.mode==="AT"&&!auto&&has("n_paddleshifter")&&!B.paddleT&&!isTopGear()&&shiftLeft()&&cost>0&&nr>=car().minShift;
  const after=Math.max(0,nr-revDownOf(c));// BUG-05・BUG-16
  let txt=`→ ${after}回転`;let danger=null;
  if(G.mode==="MT"){
    if(canShift)txt+=`　シフト可（${GRADE_JP[grade(nr)]}）`;
    if(nr>L&&B.limitGuard)txt+="　リミットで止まる";
    else if(nr>L){if(isTopGear()&&!noBlow()){danger="blow";txt+="　⚠ブロー"}else{danger="over";txt+=canShift&&!isTopGear()?"　（シフトしないとオーバーレブ）":"　⚠オーバーレブ"}}
  }else{if(auto)txt+="　自動シフト";else if(paddle)txt+="　パドルでシフトできる";else if(nr>L)txt+="　リミッター（火力 半分）"}
  txt+=`　ガソリン\u00a0−${g}`;// BUG-22：「−2」だけ折り返さない
  if(rotN)txt+=`　→${rotN}\u00a0枚入れかえ`;
  if(d.fx.some(f=>f[0]==="kousetsu")&&!inRed())txt+="　×0.5（レッドの外）";/* ★BUG-43・text 27-4 */
  if(d.fx.some(f=>f[0]==="taikan")&&!isTopGear())txt+="　×0.5（最大ギアの外）";
  return{ok:true,txt,canShift,auto,paddle,nr,after,danger,gas:g,band:inBand(c),grade:canShift?grade(nr):null};
}
/* 効果の手助け */
function mkCtx(m){return{m,
  attack(v,raw){const tt=treeTop(),ta=(tt==="h_combo"&&B.atks>=3?2:0)+(tt==="n_crown"&&isTopGear()?3:0);let d=raw?v:(v+(B.atkAll||0)+ta)*m*/* ★v0.22.24 誇り：倍率の前に足す（多段は1発ずつ） */(1+0.1*G.tune.ecu+(G.atkBonus||0));
    if(!raw){if(B.curDouble){d*=2;B.curDouble=false}d+=B.curAdd;B.curAdd=0;d+=B.wideAdd;B.wideAdd=0;d+=B.atkAdd;B.atkAdd=0;d+=B.turnAtkAdd}
    if(B.e.five){const k=Math.floor((B.cards-1)/5);if(k>0)d*=Math.pow(0.7,k)}d=Math.max(0,Math.round(d));hitEnemy(d)},
  block(v){const x=Math.round(v*m)+(has("grip")?3:0);B.block+=x;addLog(`防御 +${x}`);ev({k:"pblk",v:x})},
  blockRaw(v){B.block+=v;addLog(`防御 +${v}`);ev({k:"pblk",v})},
  freeze(v){const x=Math.round(v*m*(wxDef().frzMul||1))*(has("emblem")?2:1);/* ★v0.22.126 雪＝凍結 ×1.5 */B.frozeTotal+=x;B.frzAll=(B.frzAll||0)+x;{/* ★v0.22.1 凍結の上限（design 0-8・5-1b）：敵が動いてから足した遅れは 敵の1回ぶん×frzDelayCap まで */const e=B.e,add=x*1.5*(e.halfFrz?0.5:1),cap=B.frzNoCapNow?0:RULES.frzDelayCap,room=cap?Math.max(0,cap*100/(e.spd+(e.spdUp||0))-(e.frzD||0)):add,a=Math.min(add,room);e.next+=a;if(!B.frzNoCapNow)e.frzD=(e.frzD||0)+a;B.frzNoCapNow=false}addLog(`凍結 ${x}：敵の番が遅れる`);ev({k:"frz",v:x});
    if(x>0&&has("studless")&&B.studUid!==B.playUid){B.studUid=B.playUid;B.block+=4;addLog("スタッドレスタイヤ：防御 +4");ev({k:"pblk",v:4})}
    if(has("spike")&&!B.spikeUsed&&B.frzAll>=20){B.spikeUsed=true;addLog("スパイクタイヤ：30ダメージ");hitEnemy(30)}},
  burn(v){const x=Math.round(v*m);B.e.burn+=x;addLog(`炎上 +${x}`);ev({k:"burn",v:x})},
  noise(v){const x=Math.round(v*m);B.e.noise+=x;addLog(`ノイズ +${x}`);ev({k:"noise",v:x})},
  heal(v){const x=Math.round(v*m);G.hp=Math.min(G.maxhp,G.hp+x);addLog(`エンジン耐久 +${x}`);ev({k:"heal",v:x})},
  draw(n){const k=drawN(n+(has("pacenote")?1:0));addLog(k?`${k}枚引いた`:"手札がいっぱい（引けなかった）");ev({k:"draw",n:k})},
  revDown(n){B.rpm=Math.max(0,B.rpm-n);addLog(`回転 −${n}`);ev({k:"revdown",v:n})},
  gen(id,n){for(let k=0;k<n;k++){const x=inst(id);x.temp=1;B.draw.splice(Math.floor(Math.random()*(B.draw.length+1)),0,x)}addLog(`山札に「${CARDS[id].n}」を${n}枚まぜた`)},
  genHand(id,n){let k=0;for(;k<n;k++){if(B.hand.length>=RULES.handMax)break;const x=inst(id);x.temp=1;B.hand.push(x)}if(k)addLog(`手札に「${CARDS[id].n}」${k}枚`)},
}}
const OPS={
 atk:(x,a)=>x.attack(a),atkGear:(x,a)=>x.attack(a*(B.gear+1)),
 blk:(x,a)=>x.block(a),blkGear:(x,a)=>x.block(a*(B.gear+1)),blkRaw:(x,a)=>x.blockRaw(a),
 frz:(x,a)=>x.freeze(a),noise:(x,a)=>x.noise(a),burn:(x,a)=>x.burn(a),heal:(x,a)=>x.heal(a),healUp:(x,a,b)=>x.heal(B.playUp?b:a),/* 強化で数が変わる回復（春風 design 10-12-2） */
 draw:(x,a)=>x.draw(a),revDown:(x,a)=>x.revDown(a),
 gen:(x,id,n)=>x.gen(id,n),genHand:(x,id,n)=>x.genHand(id,n),nextBonus:(x,a)=>{B.nextBonus=Math.round((B.nextBonus+a)*100)/100},
 forcePerfect:()=>{B.forcePerfect=true},atShiftDraw:(x,a)=>{B.atShiftDraw+=a;addLog("次の自動シフトで1枚引く")},
 atkDown:(x,a)=>{B.atkDown+=a;addLog(`次のアタックの回転 −${a}`)},
 counterAdd:()=>{B.nextTurnAdd+=Math.floor(B.block/2)},nextDouble:()=>{B.nextTurnDouble=true},
 // α2（design 1章・5章）
 atkHits:(x,v,n,ns)=>{const k=B.shifts>0?ns:n;for(let i=0;i<k;i++)x.attack(v)},
 atkBlk:(x,r)=>x.attack(B.block*r),
 atkFrz:(x,k)=>x.attack(Math.min(B.frozeTotal*k,RULES.frzCap),true),
 atkChain:(x,k)=>x.attack(k*Math.min(B.chainBefore,RULES.chainMax)),
 frz2:(x,n)=>{if((B.shiftsT||0)>=2&&OPS.frz)OPS.frz(x,n)},
 onUp:(x,op,...a)=>{B.onUp.push([op,...a]);addLog("この戦闘の間、シフトアップのたびに効く");ev({k:"onset"})},
 perfTwice:()=>{B.perfTwice=true},
 heelToe:(x,v)=>{B.htTurn=true;B.htBonus=Math.round((B.htBonus+v)*100)/100;addLog(`このターン、シフトダウン 0目盛り・次の倍率 +${v}`)},
 kickDown:()=>{if(B.gear>0){B.gear--;B.rpm=Math.min(limit(),Math.round(B.rpm/car().downDiv/100)*100);addLog(`キックダウン → ${B.gear+1}速`);ev({k:"down"})}},
 // ★v0.21 β の10種（design 9-2・9-8）
 redStay:(x,a)=>{if(B.redStayDone){addLog(`回転 −${B.redStayDone}（レッドに居つづける）`);ev({k:"revdown",v:B.redStayDone});B.redStayDone=0}},
 atkRedCount:(x,a)=>x.attack(a*B.redT),
 limitGuard:()=>{B.limitGuard=true;addLog("このターン、回転はリミットで止まる")},
 atkShifts:(x,v)=>{const k=Math.min(B.shifts,shiftCapNow())+1;for(let i=0;i<k;i++)x.attack(v)},
 down1:()=>{if(B.gear>0){B.gear--;B.rpm=Math.min(limit(),Math.round(B.rpm/car().downDiv/100)*100);addLog(`シフトダウン → ${B.gear+1}速`);ev({k:"down"})}},
 atkAllAdd:(x,a,cap)=>{B.atkAllCap=Math.max(B.atkAllCap||0,cap||0);const b=B.atkAll||0;B.atkAll=Math.min(B.atkAllCap,b+a);if(B.atkAll>b){addLog(`誇り：アタックが全部 +${B.atkAll}`);ev({k:"onup"})}},/* ★v0.22.24 10-12-4d：この戦闘のあいだ・凍結と防御には足さない */
 nextAtkAdd:(x,a)=>{B.atkAdd=Math.min(15,B.atkAdd+a);addLog(`次のアタック +${a}（合計 +${B.atkAdd}）`)},
 blkFrz:(x,r)=>{const k=Math.min(15,Math.floor(B.frozeTotal*r));if(k>0)x.blockRaw(k)},
 atkShatter:(x,v)=>{const k=Math.min(60,B.frozeTotal*v);x.attack(k,true);B.frozeTotal=0;addLog("凍結の合計が 0 にもどった")},
 chainAdd:(x,a)=>{B.chain+=a;G.st.maxChain=Math.max(G.st.maxChain,B.chain);addLog(`チェイン +${a}`);if(B.chain>=5&&!B.chain5){B.chain5=true;addCharge("チェイン5")}},
 atkHitsChain:(x,v)=>{const k=Math.min(6,B.chain);for(let i=0;i<k;i++)x.attack(v)},
 // ★v0.22 仲間3人（design 9-10）
 nextTurnAtk:(x,a)=>{B.nextTurnAdd+=a;addLog(`次の番の最初のアタック +${a}`)},
 retryIfBlocked:()=>{if(B.lastHitRaw>0&&B.lastHitThru===0&&B.e.hp>0){B.retry=true;addLog("全部受けられた：手札にもどる")}},
 gearUp2:()=>{let k=0;while(k<2&&!isTopGear()&&shiftLeft()){B.gear++;B.shifts++;G.st.shiftTry++;G.st.perfect++;B.lastGrade="perfect";k++;ev({k:"shift",g:"perfect",gear:B.gear});onShiftUp("perfect")}
   addLog(k?`ギア +${k} → ${B.gear+1}速`:"もうギアを上げられない")},
 turnAtkAdd:(x,a)=>{B.turnAtkAdd+=a;addLog(`この番のアタック +${a}`)},
 atkFirstTurn:(x,a)=>x.attack(B.pTurns===0?a*2:a),
 revUp:(x,a)=>{B.rpm=Math.min(limit(),B.rpm+a);addLog(`回転 +${a}（今 ${B.rpm}）`)},
 atkAtks:(x,k)=>{const n=Math.max(0,B.atks-1);if(n)x.attack(k*n)},
 tutorAtk:()=>{let bi=-1,bv=-1;B.draw.forEach((c,i)=>{const d=CD(c);if(d.t==="atk"){const v=cardVal(c);if(v>bv){bv=v;bi=i}}});
   if(bi>=0&&B.hand.length<RULES.handMax){const c=B.draw.splice(bi,1)[0];B.hand.push(c);addLog(`整備メモ：「${CD(c).n}」を手札に`);ev({k:"draw",n:1})}else addLog("整備メモ：山札にアタックがない")},
 fullThrottle:(x,a)=>{B.ftStep=Math.round((B.ftStep+a)*100)/100;addLog(`このターン、アタックのたびに倍率 +${a}`)},
 atkIfChain:(x,v,n,add)=>x.attack(v+(B.chain>=n?add:0)),
 atkChainNow:(x,k)=>x.attack(k*Math.min(B.chain,RULES.chainMax)),
 atkHitsChain3:(x,v)=>{const k=2+Math.floor(Math.min(B.chain,RULES.chainMax)/3);for(let i=0;i<k;i++)x.attack(v)},
 chainDouble:(x,n)=>{B.chainNext2=n||2;addLog(`次のカードはチェインを${n||2}つ数える`)},
 blkFlat:(x,v)=>{if(v>0){B.block+=v;addLog(`防御 +${v}`);ev({k:"pblk",v})}},/* パドルシフト＋（倍率なし） */
 drawIfLow:(x,n,k)=>{if(B.hand.length<=k)drawN(n)},/* キックダウン（design 10-1） */
 kousetsu:(x,v,k)=>{const h=B.playRed?1:0.5;x.attack(Math.round((v+k*B.redT)*h*10)/10)},/* 紅雪（design 10-1） */
 blkChain:(x)=>{if(B.chain>0)x.blockRaw(Math.min(B.chain,RULES.chainMax))},
 atkLowHp:(x,a)=>x.attack(G.hp<=G.maxhp/2?a*2:a),
 openAir:(x,a)=>{B.openAir+=a;addLog(`このターン、補助のカードを打つたびに ${a}ダメージ`)},
 hanami:(x,n)=>{let k=0;for(let i=B.disc.length-1;i>=0&&k<n;i--){const c=B.disc[i];if(baseCost(c,undefined,B.gear)===0&&!CD(c).fx.some(f=>f[0]==="hanami")&&B.hand.length<RULES.handMax&&c.uid!==B.playUid)/* ★v0.22.1 花見は花見をもどさない（花見どうしで回りつづけて、手札が空にならず引けなくなる＝レベルデザイン班の「止まった」） */{B.hand.push(B.disc.splice(i,1)[0]);k++}}addLog(k?`捨て札から${k}枚手札に`:"捨て札に回転0のカードがない");if(k)ev({k:"draw",n:k})},
 blkIfGear:(x,g,a)=>{if(B.gear>=g)x.block(a)},
 atkIfPerf:(x,a)=>x.attack(B.lastGrade==="perfect"?a*2:a),
 phoenix:(x,a)=>{if(!B.phoenixUsed){B.phoenix=a;addLog(`この戦闘で1回、耐久 ${a} で耐える`)}},
 atkShiftsN:(x,k)=>{const n=Math.min(B.shifts,shiftCapNow());if(n)x.attack(k*n)},
 onPerf:(x,op,...a)=>{B.onPerf.push([op,...a]);addLog("この戦闘の間、パーフェクトのたびに効く");ev({k:"onset"})},
 clearBlock:()=>{if(B.e.block){addLog(`相手の防御 ${B.e.block} を0に`);B.e.block=0}},
 rotate:(x,v)=>{B.rotT=true;let t=rotTargets(null,B.rpm);const pk=B.rotPick;B.rotPick=null;if(pk)t=B.hand.filter(c=>pk.includes(c.uid));else t=rotAutoPick(null,B.rpm,v);t=rotOrder(t).slice(0,v);
   t.forEach(c=>B.hand.splice(B.hand.indexOf(c),1));const n=drawN(t.length);t.forEach(c=>{if(!CD(c).gen)B.disc.push(c)});/* 引いてから捨て札へ（捨てたカードをすぐ引き直さない） */addLog(`ローテーション：${t.length} 枚入れかえた`);ev({k:"rotate",n:t.length,drawn:n})},/* ★design 11-1 */
 taikan:(x,v)=>{if(isTopGear()){OPS.clearBlock(x);x.attack(v)}else x.attack(Math.round(v*0.5*10)/10)},/* ★戴冠（design 10-11）：いつでも打てる・最大ギアでなければ ×0.5（防御は0にしない） */
 /* ★v0.22.45 合成カード（design 10-21-2）の fx */
 atkHitsChainN:(x,v,base,max)=>{const k=Math.min(max,base+Math.floor(Math.min(B.chain,RULES.chainMax)/3));for(let i=0;i<k;i++)x.attack(v)},
 atkGear6:(x,a)=>x.attack(a*Math.min(B.gear+1,6)),
 perfBoth:(x,a,b,k)=>{const m=B.lastGrade==="perfect"?(k||2):1;x.attack(Math.round(a*m));x.block(Math.round(b*m))},/* ★v0.22.166 4つ目＝パーフェクトの倍率（なければ ×2）・四捨五入 */
 atkPerfCnt:(x,v,k,max)=>x.attack(v+Math.min(max,k*Math.max(0,G.st.perfect-(B.perf0||0)))),
 vsBigBoth:(x,a)=>{const r=ENEMIES[B.key]&&ENEMIES[B.key].rank,m=r==="elite"||r==="boss"||B.hidden?1.5:1;x.block(a*m);x.attack(a*m)},
 atkVsBig:(x,a)=>{const r=ENEMIES[B.key]&&ENEMIES[B.key].rank;x.attack(r==="elite"||r==="boss"||B.hidden?a*1.5:a)},
 drawIfShift:(x,a)=>{if(B.shifts>0)x.draw(a)},
 /* ★v0.22.102 奥義（design 10-15-2）。「最大 k」のものは倍率をかけない値で止める */
 atkFrozeTotal:(x,v,k)=>{const d=Math.min(k,Math.round(B.frozeTotal*v));x.attack(d,true)},
 delay1:()=>{const e=B.e;if(e&&e.hp>0){e.next+=100/(e.spd+(e.spdUp||0));addLog("敵の次の番が1回おくれた")}},
 atkBlkMul:(x,v,k,b)=>{if(b)x.blockRaw(b);x.attack(Math.min(k,Math.round(B.block*v)),true)},
 setRpmRed:()=>{const r=Math.max(redLo(),Math.min(limit(),car().red||redLo()));B.rpm=r;addLog(`回転 ${r}（レッドに残る）`)},
 lateHalf:(x,v,t)=>x.attack(B.pTurns>=t?Math.round(v*0.5*10)/10:v),
 atkHitsAtk:(x,v,add,max)=>{const k=Math.min(max,Math.max(0,B.atks-1)+add);for(let i=0;i<k;i++)x.attack(v)},
 ogPit:(x,v,b)=>{const h=Math.min(G.maxhp-G.hp,v);G.hp+=h;addLog(`エンジン耐久 +${h}`);ev({k:"heal",v:h});x.blockRaw(b);B.ogHalfT=B.pTurns+1;addLog("次の番の終わりまで、受けるダメージ半分")},
 blkChainV:(x,v,k)=>{const n=Math.min(k,Math.round(Math.min(B.chain,RULES.chainMax)*v));if(n>0)x.blockRaw(n)},
 gasDiscRest:()=>{B.gasDiscT=B.playUid;addLog("このターン、このあと打つカードのガソリン −1")},
 atkLostHp:(x,v,k)=>{let d=Math.min(k,Math.round((G.maxhp-G.hp)*v));if(G.hp<=G.maxhp/2)d=Math.round(d*1.5);if(d>0)x.attack(d,true)},
 atkPerfCount:(x,v,k)=>{const n=Math.max(0,G.st.perfect-(B.perf0||0)),d=Math.min(k,Math.round(n*v));if(d<=0)return;const b=B.e.block;B.e.block=0;x.attack(d,true);B.e.block=b;addLog("防御を無視")},
};
function hitEnemy(d){const e=B.e;if(e.gg&&e.gg.k==="half"&&B.pTurns<e.gg.n&&d>0){d=Math.ceil(d/2);addLog("ゴーストの守り：ダメージ半分")}/* ★v0.22.150 A1 */const blk=Math.min(e.block,d);e.block-=blk;e.hp-=d-blk;B.turnDmg+=d;B.lastHitRaw=d;B.lastHitThru=d-blk;
  addLog(`${d}ダメージ${blk?`（防御で −${blk}）`:""}`);ev({k:"ehit",v:d-blk,blk});checkPhase()}
function wxName0(){const w=wxNow();return(typeof TEXT!=="undefined"&&TEXT.wx&&TEXT.wx[w]&&TEXT.wx[w].n)||(WEATHER[w]&&WEATHER[w].n)||w}
/* ★v0.22.128 ボスの第2形態の天候（design 10-18-1）：体力 50% で天候が変わる（残光 雨・白夜 雪・零号 霧・空転 雨・散花 霧・未決 夜明け）。形のないボス（残光・白夜）も天候だけ変わる */
function checkWx2(){const e=B.e;if(!e.wx2||B.wx2On||e.hp<=0||e.hp>e.maxhp*(e.phase?e.phase.at:0.5))return;B.wx2On=true;B.wx=e.wx2;addLog(`天候が変わった：${wxName0()}`);ev({k:"wx2",wx:e.wx2,boss:B.key})}
function checkPhase(){checkWx2();const e=B.e;if(e.phase&&!e.phased&&e.hp>0&&e.hp<=e.maxhp*e.phase.at){e.phased=true;e.spd=e.phase.spd;
  if(e.phase.morph){e.morph=e.phase.morph;e.mi=0;e.pi=0}if(e.phase.pat){e.pat=e.phase.pat;e.pi=0}addLog(`${e.n} の形がくずれていく……`);ev({k:"phase",pal:e.phase.pal||null,glitch:!!e.phase.glitch,art:e.phase.art||null})}}
function overRev(){const dmg=has("oilcool")?RULES.overDmgCool:RULES.overDmg;G.hp-=dmg;B.rpm=limit();addLog(`オーバーレブ！エンジン耐久 −${dmg}`);ev({k:"over",v:dmg});return dead()}
/* ロールケージ：ランに1回、1で耐える */
function dead(){if(G.hp<=0&&B&&B.phoenix&&!B.phoenixUsed){B.phoenixUsed=true;G.hp=B.phoenix;B.phoenix=0;addLog(`クリムゾン・フェニックス：耐久 ${G.hp} で耐えた`);ev({k:"cage"});return false}
  if(G.hp<=0&&has("cage")&&!G.cageUsed){G.cageUsed=true;G.hp=1;addLog("ロールケージ：耐久1で耐えた");ev({k:"cage"})}return G.hp<=0}
/* ★シフトアップで起きること（1ターン shiftCap 回まで・design 0-1・0-4） */
function onShiftUp(g){
  if(wxDef().shiftBlk){B.block+=wxDef().shiftBlk;addLog(`${wxName0()}：シフトで防御 +${wxDef().shiftBlk}`);ev({k:"pblk",v:wxDef().shiftBlk,wx:1})}/* ★v0.22.157 b：wx＝霧の得の見せ方 *//* ★v0.22.128 霧 */
  const h0=B.hand.length,lfirst=has("launch")&&!B.launchDrawn;
  B.shiftsT++;
  // ★v0.22.1 ローンチコントロール：戦闘で最初のシフトアップで1枚多く引く／AT の詰まりの救済（atLowDraw）：1ターン最初の自動シフトで、手札が2枚以下なら1枚引く
  if(lfirst){B.launchDrawn=true;addGas(1);addLog("ローンチコントロール：ガソリン +1")}/* ★v0.22.7 design 10-1 */
  if(G.mode==="AT"&&RULES.atLowDraw&&B.shiftsT===1&&h0<=RULES.atLowDraw&&drawN(1))addLog("手札が少ないので1枚引いた（自動シフト）");if(B.shiftsT>shiftCapNow())return;
  let k=g==="perfect"||(G.mode==="AT"&&(RULE().atFirstGas!=null?RULE().atFirstGas:RULES.atFirstGas)&&B.shiftsT===1)?RULES.gasPerfect:RULES.gasUp,g0=B.gas;if(g==="perfect"&&has("dogmt"))k=0;/* ★v0.22.7 design 10-1：ドグミッションのパーフェクトはガソリン +0 */if(treeTop()==="n_shift"&&B.shiftsT===4&&!B.nShiftT){B.nShiftT=true;k++;addLog("鳳翼：4回目のシフトでガソリン +1")}/* ★v0.22.50 design 11-3-5 */addGas(k);
  if(B.gas>g0){addLog(`ガソリン +${B.gas-g0}`);ev({k:"gas",v:B.gas-g0})}
  if(g==="perfect"||G.mode==="AT")addCharge(G.mode==="AT"?"自動シフト":"パーフェクト");
  if(B.onUp.length){const m=car().mult[B.gear]*atMultNow(),x=mkCtx(m);ev({k:"onup"});
    B.onUp.forEach(([op,...a])=>{if(OPS[op])OPS[op](x,...a)})}
  if(RULE().perfBlk&&(g==="perfect"||(G.mode==="AT"&&B.shiftsT===1))){B.block+=RULE().perfBlk;addLog(`パーフェクトの守り：防御 +${RULE().perfBlk}`);ev({k:"pblk",v:RULE().perfBlk})}/* ★v0.22.7 NANA（design 10-3） */
  const atP=G.mode==="AT"&&B.shiftsT===1;/* ★v0.22.24 誇り：AT は1ターン最初の自動シフトをパーフェクトに数える */
  if((g==="perfect"||atP)&&B.onPerf.length){const m=car().mult[B.gear]*atMultNow(),x=mkCtx(m);B.onPerf.forEach(([op,...a])=>{if(OPS[op]&&(g==="perfect"||op==="atkAllAdd"))OPS[op](x,...a)})}
  if(has("n_activediff")){if(g==="perfect"){B.perfStreak++;if(B.perfStreak>=3){B.perfStreak=0;B.curDouble=true;addLog("アクティブデフ：次のアタック2倍")}}else B.perfStreak=0}
  if(B.perfTwice&&(g==="perfect"||G.mode==="AT")){B.perfTwice=false;B.atkTwice=true;addLog("次のアタックは2回当たる")}
}
/* ---- カードの面の数字・予告（★虎雪 2026-11-06 14:47）----
   今そのカードを打ったらどうなるかを「写しの上でためしに打つ」で出す（計算は playCard そのもの）。
   だから、カードの面の数字＝予告＝実際の結果が必ずそろう（チェイン・帯・シフト効果・大技も入る）。
   戻り値：{hits:[1発ごとのダメージ（敵の防御で減る前）], block, win, dead, rpm, gear, gas, ehp:打ったあとの敵の体力, eblk, chain} */
/* ★v0.22.123 弱点ギア（design 10-16-2）：ボスの e.weakGear＝"low"|"mid"|"high"（形が変わるボスは形ごとの配列）。ギアの帯はキャラの段の数で決める。
   見つける前は予告（simulateCard）にふくめない。見つけたら G.weakSeen と（画面側で）profile.weakSeen に残る＝次のランからはじめから見える */
const WEAK_TAB={5:[2,4],6:[2,5],8:[3,7]};
function weakRange(k,n){n=n||car().gears;const r=Math.max(1,Math.round(n/3)),t=WEAK_TAB[n]||[r,n-r+1];return k==="low"?[1,t[0]]:k==="high"?[t[1],n]:[t[0]+1,t[1]-1]}
function weakOf(e){e=e||(B&&B.e);if(!e||!e.weakGear)return null;const w=e.weakGear;return Array.isArray(w)?w[(e.mi||0)%w.length]:w}
function weakKey(e){e=e||(B&&B.e);return(B&&B.key||e.n)+(Array.isArray(e.weakGear)?":"+((e.mi||0)%e.weakGear.length):"")}
function weakKnown(e){const k=weakKey(e);if(G.weakSeen&&G.weakSeen[k])return true;try{return typeof PRF==="function"&&!!(PRF().weakSeen||{})[k]}catch(x){return false}}
function weakMul(){const e=B&&B.e,w=weakOf(e);if(!w)return 1;const g=B.gear+1,[a,b]=weakRange(w);if(g<a||g>b)return 1;
  const k=weakKey(e);if(B.sim&&!weakKnown(e))return 1;
  if(!B.sim){const first=!weakKnown(e);G.weakSeen=G.weakSeen||{};G.weakSeen[k]=1;if(first){addLog("弱点！");ev({k:"weakFound",key:k,boss:B.key})}else ev({k:"weakHit"})}
  return RULES.weakMul||1.5}
function simulateCard(i,shift){
  if(!B||B.over||!B.hand[i]||!preview(B.hand[i]).ok)return null;
  const og=G,ob=B,su=uidN;G=structuredClone(og);B=structuredClone(ob);let r=null;
  B.ev=[];B.sim=true;try{r=playCard(i,shift)}catch(e){}
  const hits=[];let block=0;
  for(const e of B.ev){if(e.k==="eact"||e.k==="turn")break;if(e.k==="ehit")hits.push(e.v+(e.blk||0));if(e.k==="pblk")block+=e.v}
  const out={hits,block,win:r==="win",dead:r==="dead",rpm:B.rpm,gear:B.gear,gas:r==="turn"?0:B.gas,ehp:Math.max(0,B.e.hp),eblk:B.e.block,chain:B.chain,turn:r==="turn"};
  G=og;B=ob;uidN=su;return out}
/* カードに書いてある元の数字（倍率・帯なし）：色を変える基準。num の書き方は cards.js */
function baseNumbers(c){const d=CD(c),v=cardVal(c),hits=[];let block=0;
  d.fx.forEach(f=>{const a=argOf(f[1],v);if(f[0]==="atk"||f[0]==="atkGear"||f[0]==="atkGear6"||f[0]==="kousetsu"||f[0]==="taikan"||f[0]==="atkPerfCnt"||f[0]==="perfBoth"||f[0]==="vsBigBoth")hits.push(a);if(f[0]==="atkHitsChainN")for(let k=0;k<f[2];k++)hits.push(a);/* ★BUG-43 紅雪・戴冠にも数字（実際の数＝×0.5 か満額は simulateCard） */if(f[0]==="atkHits")for(let k=0;k<f[2];k++)hits.push(a);
    if(f[0]==="blk"||f[0]==="blkGear"||f[0]==="blkRaw"||f[0]==="vsBigBoth")block+=a;if(f[0]==="perfBoth")block+=argOf(f[2],v,kOf(c))});
  if(d.fx.some(f=>f[0]==="atkBlk"||f[0]==="atkChain"||f[0]==="atkFrz")&&!hits.length)hits.push(0);
  return{hits,block}}
/* カードを打つ。shift：MT でシフトアップするか（AT は自動で決まる） */
function playCard(i,shift){
  if(B.over)return B.result;
  const c=B.hand[i];if(!c)return"ok";
  const p=preview(c);if(!p.ok)return"ok";
  const d=CD(c),C=car(),cost=costOf(c);
  if(G.mode==="AT"){const pd=!p.auto&&!!shift&&p.paddle;if(pd){B.paddleT=true;addLog("パドルシフター")}shift=p.auto||pd}else shift=!!shift&&p.canShift;
  const band=p.band,red=inRed();// ★打つ前の回転で判定
  if(has("drysump")&&d.band==="R"&&band&&gasBase(c)>p.gas&&B.dryT<2)B.dryT++;
  B.gas-=p.gas;B.hand.splice(i,1);B.cards++;if(d.t==="atk")B.atks++;B.playUid=c.uid;B.playUp=!!c.up;B.playRed=red;if(red)B.redT++;
  if(d.t==="atk"&&B.atkDown)B.atkDown=0;
  B.chainBefore=B.chain;
  let nr=B.rpm+cost,bonus=0;
  // ★氷炎（redStay）：レッドゾーンで打ったら回転 −1000 を「打った回転と一緒に」かける（+1500−1000＝+500）。あとでかけると、7000 から打っても先にリミットをこえてしまうため（design 9-2 の読み方・デザイン班に確認）
  const rs=red?d.fx.find(f=>f[0]==="redStay"):null;if(rs){nr=Math.max(0,nr-rs[1]);B.redStayDone=rs[1]}else B.redStayDone=0;
  addLog(`▶ ${d.n}${c.up?"+":""}（+${cost}回転・ガソリン ${p.gas}）${band?"　帯！":""}`);
  ev({k:"card",id:c.id,up:!!c.up,t:d.t,mo:motionOf(c),band,chain:B.chain+1,shift:shift?(G.mode==="AT"?"good":grade(nr)):null});
  if(shift){
    const g=G.mode==="AT"?"good":grade(nr);B.forcePerfect=false;B.launchUsed=true;
    const drop=g==="early"?C.earlyDrop:d.halfDrop?0.5:has("flywheel")&&G.mode==="MT"?0.5:C.upDrop;B.lastGrade=g;
    B.gear++;G.st.shiftTry++;B.shifts++;
    if(g==="perfect"){B.perfChain=G.mode==="MT"?(B.perfChain||0)+1:0;bonus=0.3+perfChainAdd();G.st.perfect++}else{perfBreak();if(g==="good"){bonus=0.1;G.st.good++}}/* ★v0.22.96 design 14-3② パーフェクト連続（MT だけ・1ターンの中・2回目 +0.4・3回目から +0.5） */
    const nr0=nr;nr=Math.round(nr*drop/100)*100;B.rpm=nr;
    addLog(`シフトアップ → ${B.gear+1}速（${GRADE_JP[g]}${B.perfChain>1?` ×${B.perfChain}・倍率 +${bonus}`:""}）回転 ${nr}`);ev({k:"shift",g,gear:B.gear,from:nr0,to:nr,pc:B.perfChain||0,bonus});/* ★v0.22.95 design 14-3：メーターがシフトの前の回転まで上がってから落ちる */
    if(g==="perfect"){addLog(drawN(1)?"パーフェクト：1枚引いた":"パーフェクト：手札がいっぱい");if(has("lsd")){B.block+=8;addLog("LSD：防御 +8")}}
    if(g==="good"&&has("clutch")&&!B.clutchT&&!(G.mode==="AT"&&B.clutchAT)){B.clutchT=true;if(G.mode==="AT")B.clutchAT=true;if(drawN(1))addLog("強化クラッチ：1枚引いた")}// BUG-14：1ターン1回／★design 10-8（チーフ決め）：AT は1戦に1回
    if(G.mode==="AT"&&B.atShiftDraw>0){B.atShiftDraw--;if(drawN(1))addLog("クラッチ蹴り：1枚引いた")}
    onShiftUp(g);
  }else{B.rpm=nr;perfBreak()}/* ★v0.22.96：シフトしないで打つと連続は切れる */
  let m=C.mult[B.gear]+bonus;
  m+=B.nextBonus;B.nextBonus=0;
  if(has("turbo")&&B.gear>=2)m+=0.2;
  if(has("h_bigbore")&&B.gear===3)m+=0.4;
  if(d.t==="atk"&&B.ftStep){m+=B.ftAcc;B.ftAcc=Math.min(0.5,Math.round((B.ftAcc+B.ftStep)*100)/100)}
  if(d.t==="atk"&&has("nitro")&&!B.nitroUsed){m+=1;B.nitroUsed=true;addLog("ニトロ！倍率 +1.0")}
  if(G.mode==="AT")m*=atMultNow();/* ★v0.22.98 ドライブモード（エコ ×0.85・スポーツ ×1.0） */
  const L=limit();
  if(B.rpm>L&&B.limitGuard){B.rpm=L;addLog("フューエルカット：リミットで止まった")}
  else if(B.rpm>L){// BUG-15：リミットを「こえたら」
    if(G.mode==="AT"){m*=RULES.atLimiter;B.rpm=L;addLog("リミッター：火力が半分")}
    else if(isTopGear()&&!noBlow()){B.rpm=L;addLog("エンジンブロー！");ev({k:"blow"});G.hp=0;return finish("dead")}
    else if(overRev())return finish("dead");
  }
  m*=chainMul();// ★チェイン
  if(d.t==="atk")m*=weakMul();/* ★v0.22.123 弱点ギア（design 10-16-2） */
  m=Math.min(m,d.r==="OG"&&RULES.ogMultCap?RULES.ogMultCap:RULES.multCap);// ★最終倍率の上限（★v0.22.102 奥義は ×3 まで）
  B.chain++;if(B.chainNext2&&!d.fx.some(f=>f[0]==="chainDouble")){const n=B.chainNext2===true?2:B.chainNext2;B.chainNext2=false;B.chain+=n-1;addLog(`結び目：チェイン +${n}`)}G.st.maxChain=Math.max(G.st.maxChain,B.chain);
  if(B.chain>=5&&!B.chain5){B.chain5=true;addCharge("チェイン5")}
  if(has("m_jinba")&&B.chain>=10&&!B.jinbaT){B.jinbaT=true;B.nextGas+=2;addLog("人馬一体：次の番のガソリン +2")}
  if(red)addCharge("レッドゾーン");
  if(d.sup&&has("carbon")){B.block+=2;ev({k:"pblk",v:2})}
  if(d.t==="atk"&&band&&d.band==="R"&&has("pipe")){B.e.burn+=2;ev({k:"burn",v:2})}
  m=Math.round(m*100)/100;
  let v=cardVal(c);if(band)v=rnum(v*((d.bm||RULES.bandMul)+treeCardBand(c.id)),v);// ★帯（★v0.22.48 ツリーの3段目 +0.25）
  const x=mkCtx(m);
  const kv=kOf(c),jv=jOf(c),runFx=()=>d.fx.forEach(f=>{const op=OPS[f[0]];if(op)op(x,...f.slice(1).map(a=>argOf(a,v,kv,jv)))});
  const blk0=B.block,hu0=new Set(B.hand.map(h=>h.uid));if(d.frzNoCap)B.frzNoCapNow=true;
  B.retry=false;runFx();B.frzNoCapNow=false;if(c.id==="m_hougou")B.hougouT=true;
  /* ★v0.22.47 改造の2段目（余熱・下取り・アルバム） */
  if(d.keepHalf&&B.block>blk0){const k=Math.floor((B.block-blk0)/2);B.blkCarry=(B.blkCarry||0)+k;addLog(`余熱：次の番に防御 ${k} が残る`)}
  if(d.tradeIn||d.album){const nw=B.hand.filter(h=>!hu0.has(h.uid));
    if(d.album&&nw.length&&!nw.some(h=>CD(h).t==="atk")){if(drawN(1))addLog("アルバム：もう1枚")}
    if(d.tradeIn){const bad=nw.filter(h=>!preview(h).ok).sort((a,b)=>baseCost(b,undefined,B.gear)-baseCost(a,undefined,B.gear))[0];if(bad){B.hand.splice(B.hand.indexOf(bad),1);B.draw.unshift(bad);addLog(`下取り：${CD(bad).n} を山札の下へ`)}}}
  if(d.sup&&B.openAir&&!d.fx.some(f=>f[0]==="openAir")){addLog("オープンエア");hitEnemy(B.openAir)}
  if(has("m_light")&&cost===0){B.rpm=Math.max(0,B.rpm-300)}
  if(d.t==="atk"&&B.atkTwice&&!c.temp){B.atkTwice=false;addLog("もう1回！");runFx()}// ★パーフェクトのあと2回
  G.st.maxTurnDmg=Math.max(G.st.maxTurnDmg,B.turnDmg);
  if(B.retry&&B.hand.length<RULES.handMax){B.retry=false;B.hand.push(c)}
  else if(!c.temp&&!(d.exile&&!(d.upKeep&&c.up&&((B.keepN=B.keepN||{})[c.uid]=(B.keepN[c.uid]||0)+1)<d.upKeep)))B.disc.push(c);/* ★v0.22.7 upKeep：強化すると戦闘で upKeep 回まで消えない */
  if(has("qrelease")&&cost===0&&B.qrT<2){B.qrN++;if(B.qrN%3===0){B.qrT++;if(drawN(1))addLog("クイックリリース：1枚引いた")}}
  if(B.e.hp<=0)return finish("win");
  if(G.hp<=0&&dead())return finish("dead");
  /* ★design 10-10 MOMO「花の便り」：チェイン3以上で、打てるアタックが手札にないとき1枚引く（1ターン1回） */
  {const R=RULE();if(R.rescue&&!B.sim&&B.chain>=((B.rescueT||0)>=1&&R.rescue2At||R.rescue)&&(B.rescueT||0)<(R.rescue2At&&G.mode==="AT"?1:(R.rescueN||1))/* ★v0.22.56 LD 11-35：満開の2回目は MT だけ */&&canDraw()&&!B.hand.some(x=>CD(x).t==="atk"&&preview(x).ok)){B.rescueT=(B.rescueT||0)+1;if(drawN(1)){addLog("花の便り：1枚引いた");ev({k:"rescue",first:!G.rescueSaid});G.rescueSaid=true}}}
  return checkAP();
}
function finish(r){if(!B.over)ev({k:r});B.over=true;B.result=r;if(r==="dead")G.hp=Math.max(0,G.hp);return r}
/* ガソリン0で、0目盛りで打てるカードがないなら相手の番 */
function checkAP(){if(B.gas<=0&&!B.hand.some(c=>gasOf(c)===0&&preview(c).ok)){addLog("ガソリンを使い切った → 相手の番へ");ev({k:"gasout"});return turnEnd(true)}return"ok"}
function parkCost(){return B.htTurn?RULES.gasPark-1:RULES.gasPark}
function downCost(){return has("seq")||B.htTurn?0:RULES.gasDown}
function parking(){
  if(B.over||G.mode!=="AT"||!canDraw())return"ok";const k=parkCost();if(B.gas<k)return"ok";
  B.gas-=k;ev({k:"down"});const n=drawN(1);ev({k:"draw",n});addLog(`パーキングレンジ：1枚引く（ガソリン ${k}）`);
  if(B.htBonus)B.nextBonus=Math.round((B.nextBonus+B.htBonus)*100)/100;return checkAP();
}
function downShiftRpm(){return Math.round(B.rpm/car().downDiv/100)*100}
function downShift(){
  if(B.over||B.gear===0||G.mode!=="MT"||!canDraw())return"ok";const k=downCost();if(B.gas<k)return"ok";
  B.gas-=k;B.gear--;B.rpm=downShiftRpm();ev({k:"down"});const n=drawN(1);ev({k:"draw",n});
  addLog(`シフトダウン → ${B.gear+1}速（回転 ${B.rpm}）・1枚引く（ガソリン ${k}）`);
  if(B.htBonus)B.nextBonus=Math.round((B.nextBonus+B.htBonus)*100)/100;
  if(B.rpm>limit()){if(B.limitGuard)B.rpm=limit();else if(overRev())return finish("dead")}
  return checkAP();
}
/* ターン終了（外から呼ぶのは endTurn。中では turnEnd を使う） */
function endTurn(){return turnEnd()}
function turnEnd(gasout){
  if(B.over)return B.result;
  if(has("subcon")&&!gasout&&B.chain>1){B.chainCarry=Math.floor(B.chain/3);addLog(`サブコン：チェイン ${B.chainCarry} が残る`)}
  if(treeTop()==="m_guard"&&B.hougouT&&B.chain>0){const k=Math.min(B.chain,15);B.block+=k;addLog(`花癒：防御 +${k}`);ev({k:"pblk",v:k})}B.hougouT=false;
  if(RULE().chainBlk&&B.chain>0){const k=Math.min(Math.floor(B.chain*(RULE().chainBlkMul||1)),RULE().chainBlk);/* ★v0.22.8 10-6 */B.block+=k;addLog(`チェインの守り：防御 +${k}`);ev({k:"pblk",v:k})}/* ★v0.22.7 MOMO（design 10-3） */
  if(has("m_horo")&&B.chain>=5){B.block+=5;addLog("幌：防御 +5");ev({k:"pblk",v:5})}
  B.pTurns++;
  if(B.hidden&&B.pTurns>=UNLOCK.hiddenTurns&&B.e.hp>0){addLog("ロストラインは逃げていった");ev({k:"escape"});return finish("escape")}
  B.rpm=Math.max(car().idle,B.rpm-car().brake-(has("icool")?(G.mode==="AT"?1000:2000):0));
  B.pNext+=curDelay();
  addLog(`ターン終わり：回転 ${B.rpm}`);
  let guard=0;
  while(B.e.next<B.pNext&&guard++<20){const r=enemyStep();if(r)return finish(r)}
  if(B.stormWx&&!B.stormDone&&B.pTurns>=B.stormAt){B.stormDone=1;B.wx=B.stormWx;addLog(`嵐：天候が変わった（${wxName0()}）`);ev({k:"wxStorm",wx:B.wx})}/* ★v0.22.195 嵐の夜 */
  startPlayerTurn(false);ev({k:"turn"});
  return"turn";
}
function curPat(e){return e.morph?e.morph[e.mi%e.morph.length]:e.pat}
function curAct(e){const p=curPat(e);return p[e.pi%p.length]}
function formOf(e){return e.morph&&e.forms?e.forms[e.mi%e.forms.length]:""}
function eAtk(e,v){return Math.max(0,Math.round(v*B.am*(wxMinus()&&wxDef().eAtk||1))+e.atkUp-e.noise)}/* ★v0.22.128 夜明け：敵の攻撃 +10%（得意は効かない） */
/* ★v0.22.8 design 10-7：大きな攻撃の予告（攻撃・連撃・貫通の合計がエンジン耐久の最大の 1/3 以上、貫通はいつでも） */
function bigIntent(e){const p=curAct(e);if(!p)return false;if(p[0]==="prc")return true;
  const t=p[0]==="atk"?eAtk(e,p[1]):p[0]==="multi"?eAtk(e,p[1])*p[2]:0;return t>0&&t>=G.maxhp*(B&&B.e&&B.e.rank==="boss"?1/3:1/2)}/* ★design 10-7：ボス 1/3・ほか 1/2・貫通はいつでも */
/* ★v0.22.157 design 24-9 a：霧の予告は種類だけ（数字は「？」） */
function intentFog(e){const p=curAct(e)||[],U=(typeof TEXT!=="undefined"&&TEXT.ui)||{},k={atk:"atk",multi:"atk",prc:"atk",blk:"grd",jam:"debuff",apd:"debuff"}[p[0]];if(k)return U["fog_intent_"+k]||({atk:"攻撃？",grd:"守り？",debuff:"ジャマ？"})[k];
  const k2={buf:"buff",rev:"rot"}[p[0]];return(k2&&(U["fog_intent_"+k2]||({buff:"強化？",rot:"回転？"})[k2]))||U.fog_intent_other||"？？？"}/* ★v0.22.159 text 34-2b：fog_intent_buff・fog_intent_rot *//* ★v0.22.158 text 34-2b（強化・回転は fog_intent_buf／fog_intent_rev が届いたらそれ） */
function intent(e){const p=curAct(e);
  switch(p[0]){case"atk":return`攻撃 ${eAtk(e,p[1])}`;case"multi":return`攻撃 ${eAtk(e,p[1])}×${p[2]}`;case"prc":return`貫通 ${eAtk(e,p[1])}`;
   case"blk":return`防御 ${p[1]}`;case"buf":return`攻撃アップ ${p[1]}`;case"rev":return`回転 +${p[1]}`;case"jam":return`ジャマ（${CARDS[p[1]].n}×${p[2]}）`;case"apd":return"ガソリン −1";}return""}
function enemyHit(v,pierce){const e=B.e;let d=eAtk(e,v)+(e.mAdd||0);e.mAdd=0;const tire=Math.floor(B.gear*(0.5+0.25*G.tune.tire));d=Math.max(0,d-tire-(has("n_seat")&&B.gear>=5?2:0));
  const blk=pierce?0:Math.min(B.block,d);B.block-=blk;let hp=d-blk;if(((RULE().halfDmg&&B.pTurns<RULE().halfDmg)||(B.ogHalfT!=null&&B.pTurns<=B.ogHalfT))&&hp>0){hp=Math.ceil(hp/2);addLog(B.ogHalfT!=null&&B.pTurns<=B.ogHalfT?"日向の盾：ダメージ半分":"最初の番：ダメージ半分")}/* ★v0.22.7 HINA（design 10-3） */G.hp-=hp;if(has("widebody")&&hp>0)B.wideAdd+=Math.floor(hp/2);ev({k:"phit",v:hp,blk});
  addLog(`${e.n} の${pierce?"貫通":"攻撃"}：${hp}ダメージ${blk?`（防御 −${blk}）`:""}${tire?`（タイヤ −${tire}）`:""}`)}
const ENEMY_OPS={
 atk:(e,v)=>enemyHit(v),
 multi:(e,v,n)=>{for(let k=0;k<n;k++)enemyHit(v)},
 prc:(e,v)=>enemyHit(v,true),
 blk:(e,v)=>{e.block+=v;if(e.mirror)e.mirrorArm=true;addLog(`${e.n} は防御 ${v}`);ev({k:"eblk",v})},
 buf:(e,v)=>{e.atkUp+=v;addLog(`${e.n} の攻撃 +${v}`)},
 rev:(e,v)=>{B.rpm=Math.min(limit(),B.rpm+v);addLog(`${e.n}：回転 +${v}`)},
 jam:(e,id,n)=>{for(let k=0;k<n;k++){const x=inst(id);x.temp=1;B.draw.splice(Math.floor(Math.random()*(B.draw.length+1)),0,x)}addLog(`${e.n}：山札に「${CARDS[id].n}」${n}枚`)},
 apd:(e,v)=>{B.apPen+=1;addLog(`${e.n}：次の番のガソリン −1`)},
};
/* 敵が1回動く。終わったら "win" / "dead"、続くなら null */
function enemyAct(){return enemyStep()}
function enemyStep(){
  const e=B.e;B.enemyActed=true;e.frzD=0;
  if(e.mirrorArm){e.mAdd=Math.floor(e.block*e.mirror);e.mirrorArm=false}
  e.block=e.blkKeep?Math.floor(e.block*e.blkKeep):0;
  if(e.gg){const g=e.gg;e.gAct=(e.gAct||0)+1;let v=0;if(g.k==="nth"&&e.gAct%g.n===0)v=g.v;else if(g.k==="low"&&!e.gLow&&e.hp<=e.maxhp/2){e.gLow=1;v=g.v}else if(g.k==="chain")v=Math.min(g.v,B.cards||0);if(v>0){e.block+=v;addLog(`ゴーストの守り：防御 +${v}`);ev({k:"eblk",v})}}/* ★v0.22.150 A1 */
  if(e.burn>0){e.hp-=e.burn;addLog(`炎上で ${e.burn}ダメージ`);ev({k:"eburn",v:e.burn});e.burn--;if(e.hp<=0)return"win";checkPhase()}
  const pat=curPat(e),p=pat[e.pi%pat.length];e.pi++;
  if(e.morph&&e.pi>=pat.length){e.pi=0;e.mi++}
  ev({k:"eact",p:p[0]});
  ENEMY_OPS[p[0]](e,...p.slice(1));
  {const F=typeof nightFace==="function"&&nightFace(G.night);if(F&&F.jamP&&(p[0]==="atk"||p[0]==="multi")&&!B.sim&&Math.random()<F.jamP&&CARDS[F.jamId]){ENEMY_OPS.jam(e,F.jamId,1);addLog("混線！");ev({k:"jamx"})}}/* ★v0.22.195 混線の夜 */
  if(e.rage)e.atkUp+=e.rage;
  if(e.accel&&e.spdUp<6)e.spdUp+=e.accel;
  if(e.noise>0)e.noise--;
  e.next+=100/(e.spd+e.spdUp);
  if(G.hp<=0&&dead())return"dead";
  return null;
}
/* ガソリンを残すほど次の番が早い（1目盛り −10%・最大 −50%） */
function curDelay(){return(100/car().spd)*(1-RULES.gasSpeed*Math.min(5,Math.max(0,B.gas)))}
function timeline(){const out=[];let p=B.pNext,e=B.e.next;const pd=100/car().spd,ed=100/(B.e.spd+B.e.spdUp);let first=true;
  for(let i=0;i<7;i++){if(p<=e){out.push("p");p+=first?curDelay():pd;first=false}else{out.push("e");e+=ed}}return out}
/* 勝ったあと：お金など。画面は結果だけ受け取る */
/* ★v0.22.131 ヒート（design 10-17-1） */
function heatSet(v,why){const H=RULES.heat;v=Math.max(0,Math.min(H.max,v|0));const was=G.heat||0;G.heat=v;G.heatMax=Math.max(G.heatMax||0,v);if(v!==was&&why)addLogSafe(why)}
function addLogSafe(t){try{if(B&&!B.over)addLog(t)}catch(e){}}
function heatMul(){return 1+(G&&G.heat||0)*RULES.heat.hpAtk}
function heatGain(n){if(!n||n.k==="boss"||!/^(battle|elite|hidden)$/.test(n.k))return 0;const H=RULES.heat;let d=n.k==="battle"?H.win:H.elite;if(n.k==="elite")d+=((typeof nightFace==="function"&&nightFace(G.night))||{}).eliteHeat||0;/* ★v0.22.195 港の夜 */const w=n.wx||"dry";if(w!=="dry"&&(CHARS[G.char]||{}).wxFav!==w)d+=H.badWx;return d}
function featCost(){return Math.round(RULES.featPrice*(1+(G&&G.heat||0)*RULES.heat.gold))}
/* ★v0.22.137 ライバルのゴースト（design 10-17-2）：エリア2・3 に入ったとき 25% で、そのエリアのエリートのマス1つがゴースト（1ランに1回）。
   もと＝ランの記録（②の runlog.pickGhost・newRunState の opt.ghost）。体力＝そのエリアのエリート ×1.1、行動＝記録のアタック上位2枚（×0.8）とガード1枚、速さ＝そのキャラ、記録が全クリアなら rage */
/* ★v0.22.139 雨の夜のエリート「スプラッシュ」（design 12-3）：そのエリアのエリートの色変え・行動に泥はね（mud）を1つ足す */
function splashKey(ai){const k="splash"+ai;if(!ENEMIES[k]){const E=ENEMIES[AREAS[ai].elite];const pat=(E.pat||[]).slice();pat.splice(1,0,["jam","mud",1]);ENEMIES[k]=Object.assign({},E,{n:"スプラッシュ",pal:"splash",pat,splash:1,gimTxt:(E.gimTxt?E.gimTxt+"・":"")+"泥はねを山札に混ぜる"})}return k}
const GHOST_P=0.25;
function ghostRoll(ai){const GM=(typeof nightFace==="function"&&G&&(nightFace(G.night)||{}).ghostMax)||1;/* ★v0.22.195 影の夜：2回まで */if(!G||(G.ghostDone||0)>=GM||!G.ghostRec||ai<1)return;G.ghostRolled=G.ghostRolled||{};if(G.ghostRolled[ai])return;G.ghostRolled[ai]=1;if(Math.random()>=(G.ghostP!=null?G.ghostP:GHOST_P))return;G.ghostDone=(G.ghostDone||0)+1;
  const ns=G.map.flatMap(r=>r).filter(n=>n.a===ai&&n.k==="elite");if(!ns.length)return;const n=pick(ns);n.ghost=1;G.ghostDef=ghostDef(G.ghostRec,ai);ENEMIES.__ghost=G.ghostDef}
function ghostReady(){if(!ENEMIES.__ghost&&G&&G.ghostDef)ENEMIES.__ghost=G.ghostDef;return!!ENEMIES.__ghost}
/* ★v0.22.150 A1（design 10-17-2・24-4）：ゴーストに「キャラの守りの仕組み」を敵の形で。HINA・NANA は design 10-17-2 の例どおり。YUKI・MOMO は design に形がないので①の仮（デザイン班に確かめ）
   half＝プレイヤーの最初の n ターン、ゴーストが受けるダメージ半分（切り上げ）／nth＝ゴーストの n 回目の行動ごとに防御 +v／low＝体力が半分を切ったあとの最初の行動で1回だけ防御 +v／chain＝ゴーストの行動のはじめに、直前のプレイヤーの番に打たれたカードの枚数だけ防御（最大 v） */
const GHOST_GUARD={HINA:{k:"half",n:2,t:"最初の2ターン ダメージ半分"},NANA:{k:"nth",n:3,v:6,t:"3回ごとに防御 +6"},YUKI:{k:"low",v:12,t:"体力半分で1回 防御 +12"},MOMO:{k:"chain",v:6,t:"打たれた枚数だけ防御（最大 6）"}};
function ghostDef(rec,ai){const el=ENEMIES[AREAS[ai].elite]||{hp:200},ch=rec.char||G.char,C=CHARS[ch]||CHARS.YUKI;
  const val=c=>{const d=CARDS[c.id]||{};return(c.up&&d.vu!=null?d.vu:d.v)||0};
  const atks=rec.deck.filter(c=>CARDS[c.id]&&CARDS[c.id].t==="atk"&&!CARDS[c.id].gen&&CARDS[c.id].r!=="OG").sort((a,b)=>val(b)-val(a));
  const g=rec.deck.filter(c=>CARDS[c.id]&&CARDS[c.id].t==="grd").sort((a,b)=>val(b)-val(a))[0];
  const a1=atks[0],a2=atks.find(c=>c.id!==(a1&&a1.id))||atks[1];
  const pat=[a1?["atk",Math.max(4,Math.round(val(a1)*0.8))]:["atk",12],a2?["multi",Math.max(2,Math.round(val(a2)*0.8/2)),2]:["atk",10],["blk",g?Math.max(6,Math.round(val(g))):10]];
  const TX=typeof TEXT!=="undefined"?TEXT:{};return{n:(TX.ghost&&TX.ghost.name||"{name}のゴースト").replace("{name}",(TX.names&&TX.names[ch])||ch),rank:"elite",ghost:1,gchar:ch,art:"ghost_"+ch,hp:Math.round(el.hp*1.1),spd:C.car.spd||10,pat,rage:rec.result==="clear"?1:0,gg:GHOST_GUARD[ch]||null,gimTxt:(rec.result==="clear"?"全クリアの記録：動くたびに攻撃 +1":"前の記録のデッキで走る")+(GHOST_GUARD[ch]?"／"+GHOST_GUARD[ch].t:"")}}
/* ★v0.22.146 B5 送り届けた記録の数（progression 1-32 H・design 10-20）：勝つたびに 雑魚 1・エリート／裏道／ゴースト 3・ボス 10。負けたランでもそれまでの分は入る（勝った瞬間に profile.deliv へ）。
   チュートリアル・練習・フルオートは数えない。スロットごと（profile）＝引き継ぎコードにも入る。節目（ROAD LOG の小話）と街の灯りの段は、文と絵がそろったら（今は数だけ） */
const DELIV={battle:1,elite:3,ghost:3,boss:10,marks:[50,100,200,500,1000],city:[100,300,750,1500,3000]};
function delivPts(E,hid){return E.rank==="boss"?DELIV.boss:E.ghost?DELIV.ghost:(E.rank==="elite"||hid)?DELIV.elite:DELIV.battle}
function delivAdd(E,hid){if(!G||G.practice||G.fullAuto||(typeof window!=="undefined"&&window.TUTORIAL_ON)||(typeof B!=="undefined"&&B&&B.sim))return 0;const n=delivPts(E,hid);G.deliv=(G.deliv||0)+n;
  try{if(typeof PRF==="function"){const p=PRF();p.deliv=(p.deliv||0)+n}}catch(e){}return n}
function delivCount(){try{return(typeof PRF==="function"&&PRF().deliv)||0}catch(e){return 0}}
function delivCity(n){n=n==null?delivCount():n;return DELIV.city.filter(x=>n>=x).length}/* 街の灯りの段 0〜5 */
function delivNext(n){n=n==null?delivCount():n;return DELIV.marks.find(x=>x>n)||null}/* 次の節目 */
function winRewards(){
  const key=B.key,E=ENEMIES[key],gd=RULES.gold;
  let gold=E.rank==="boss"?gd.boss:E.rank==="elite"?gd.elite:rnd(gd.battle[0],gd.battle[1]);gold=Math.round(gold*NR().goldMul);if(has("cat"))gold+=gd.cat;
  delivAdd(E,B.hidden);/* ★v0.22.146 B5 */
  if(E.rank==="elite"&&!B.hidden)G.st.elites++;if(E.ghost){G.ghostWon=1;gold+=20}/* ★v0.22.137 ゴーストの報酬：お金 +20（ほかは画面で3つから1つ） */
  let hidCard=null;if(B.hidden){G.st.hidden++;const left=hiddenList(G.char).filter(id=>CARDS[id]&&!(G.ul&&G.ul.cards.includes(id))&&!G.hiddenWon.includes(id));
    if(left.length){hidCard=pick(left);G.hiddenWon.push(hidCard);G.deck.push(inst(hidCard));if(G.ul)G.ul.cards.push(hidCard);gold+=UNLOCK.hiddenGold}else{gold+=UNLOCK.hiddenAllGold;G.st.hiddenAll=(G.st.hiddenAll||0)+1}}
  const otk=!B.enemyActed;if(otk){gold+=gd.otk+(has("dashcam")?15:0);G.st.otk++}if(has("jack"))G.hp=Math.min(G.maxhp,G.hp+3);
  G.money+=gold;const ticket=Math.random()<RULES.ticketRate;if(ticket)G.tickets++;
  const h0=G.heat||0;let heal=0;if(E.rank!=="boss"&&RULES.heat.winHeal&&h0>0){heal=Math.max(0,Math.min(G.maxhp-G.hp,Math.round(G.maxhp*h0*RULES.heat.winHeal)));if(heal){G.hp+=heal;addLog(`ヒートで回復 +${heal}`)}}/* ★v0.22.153 勝つと回復（design 24-6） */
  {const H=RULES.heat;let d=E.ally?0/* design 10-4b：連戦のボスの −2 は零号のあとに1回だけ */:E.rank==="boss"?H.boss:(E.rank==="elite"||B.hidden)?H.elite:H.win;if(E.rank==="elite"&&!B.hidden)d+=((typeof nightFace==="function"&&nightFace(G.night))||{}).eliteHeat||0;/* ★v0.22.195 港の夜 */if(E.rank!=="boss"&&wxMinus())d+=H.badWx;heatSet(h0+d)}/* ★v0.22.131 ヒート */
  return{ghost:!!E.ghost,key,rank:B.hidden?"hidden":(E.rank||"battle"),name:B.e.n,gold,otk,ticket,hidCard,heat:[h0,G.heat||0],heal};
}
/* ★v0.21 ログ（ラン後のマネー・design 9-7）。負けても突破したエリアのぶんは入る */
function runLog(clear,rank){const L=UNLOCK.log,st=G.st,parts={};
  if(st.bosses>=1)parts.a1=L.a1;if(st.bosses>=2)parts.a2=L.a2;if(clear)parts.clear=L.clear;
  if(st.elites)parts.elite=L.elite*st.elites;if(st.hidden)parts.hidden=L.hidden*st.hidden+(st.hiddenAll?10*st.hiddenAll:0);
  if(rank)parts.rank=L.rank[rank]||0;
  const sum=Object.values(parts).reduce((a,b)=>a+b,0),mul=Math.min(L.nightBonusMax||99,1+L.nightBonus*Math.max(0,(G.night||1)-1));
  return{parts,total:Math.round(sum*mul),mul}}
/* ★v0.22.37 design 10-14：ミニカーの10枚の抽選は重みつき（自分の専用・ニュートラル 1、ほかのキャラ 0.3） */
function mcTen(){const L=G.deck.filter(c=>rarityOf(c)!=="OG"),out=[];/* ★v0.22.102 奥義はミニカーに継承しない */const w=c=>{const o=CD(c).own;return o==="N"||o===G.char?1:RULES.otherCardW};
  while(out.length<MC_DRAW&&L.length){const t=L.reduce((a,c)=>a+w(c),0);let x=Math.random()*t,i=0;for(;i<L.length-1;i++){x-=w(L[i]);if(x<0)break}out.push(L.splice(i,1)[0])}return out}
/* リザルト（ミニカーの評価） */
function calcResult(clear){
  const st=G.st,rate=st.shiftTry?st.perfect/st.shiftTry:0,tuneSum=Object.values(G.tune).reduce((a,b)=>a+b,0),rows=G.map.length;
  const pts={到達:Math.min(st.rowsDone,rows)*5+(clear?20:0),最終ステータス:tuneSum*2,走りの質:Math.round(rate*20)+st.otk*4,MTボーナス:G.mode==="MT"?12:0};
  const total=Object.values(pts).reduce((a,b)=>a+b,0);
  let ri=0;RANKS.forEach((r,i)=>{if(total>=RANK_TH[r])ri=i});const cap=RANK_CAP[G.night||0];if(cap)ri=Math.min(ri,RANKS.indexOf(cap));
  let lossCap=null;if(!clear){const N=(G.map[G.map.length-1][0].a|0)+1;lossCap=rankLossCap(areaIdx()+1,N);if(RANKS.indexOf(lossCap)<ri)ri=RANKS.indexOf(lossCap);else lossCap=null}/* ★v0.22.73 負けたランの上限（下げたときだけ lossCap） */
  return{pts,total,ri,rank:RANKS[ri],lossCap,ten:mcTen()};
}
