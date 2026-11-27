"use strict";
/* ===== プログラム班② v0.5.24 最後の夜（NIGHT 11）と ZERO の連戦（design 25-4 ③・25-5 ③の4・text 39章・audio v0.31）=====
   開く：10人そろって（KURO が加わって）NIGHT 10 をクリア → NIGHT 11「最後の夜」（nightMaxAvail を包む）。
   流れ：5エリア → サーキットのボスの連戦（その子のボス → 零号）→ 零号の報酬（カード・パーツ）→ つなぎ zero_link（回復 15%）→ ZERO（連戦 3／3。YUKI は 2／2）
         → 勝つと ZERO の報酬 → 1回目は zero_ed（夜明けのエンディング）、2回目からは zero_ed_short → リザルト。負けても零号までの報酬はもらえている。
   ZERO：零号 ×1.3 の体力（①の夜・エリアの倍率はそのままかかる）。体力 100〜67%／67〜33%／33〜0% で形が変わる。
         弱点ギアは形ごとに 高い → 中 → 低い。天候は ドライ → このランでいちばん多かった天候 → 夜明け（ROAD に初めて朝）。
         形が変わるたびに、10人のうち3人の記録を借りる（走る子と、持ちこんだミニカーの子はのぞく・同じ子は2回借りない）。借りた記録の中身は仮（ZREC・design／LD が決める）。
   絵：零号の色変えの仮（ART_FALLBACK zero→boss3・PALS f_zero／f_zero2／f_zero3）。音：boss_zero（bgmPhase 2・3）・zero_borrow を 0.8秒ずつ・3つ目で weather("dawn",{boss:"zero"})（cue）。
       zero_link・zero_ed・形の変わり目では talk の曲に切りかえない。 */
(function(){
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__z=1;g.__orig=f;window[name]=g};
const TEN=["YUKI","HINA","MOMO","NANA","SORA","KAEDE","RIN","LUNA","KURO","MIO"];
const auto=()=>!!((G&&G.fullAuto)||(window.FARM&&FARM.on));
const isFinal=()=>!!(G&&G.night===11);
if(TEXT.names)Object.keys({KAEDE:"かえで",RIN:"りん",LUNA:"るな",KURO:"クロ",SORA:"そら",MIO:"みお"}).forEach(k=>{if(!TEXT.names[k])TEXT.names[k]={KAEDE:"かえで",RIN:"りん",LUNA:"るな",KURO:"クロ",SORA:"そら",MIO:"みお"}[k]});

/* ---- 敵 ZERO（数は仮・LD が測る） ---- */
const B3=ENEMIES.boss3||{hp:560,spd:11};
const ZF=[{spd:12,pat:[["atk",24],["multi",9,3],["atk",28]]},          // 剣（弱点 高い）
          {spd:13,pat:[["prc",28],["jam","crosstalk",2],["atk",26]]},     // 槍（弱点 中）
          {spd:14,pat:[["blk",30],["atk",34],["multi",10,3]]}];           // 盾（弱点 低い）
ENEMIES.zero={art:"zero",n:"ZERO",rank:"boss",hp:Math.round(B3.hp*1.3),spd:ZF[0].spd,pat:ZF[0].pat,weakGear:["high","mid","low"],final:1,
  gimTxt:"3つの形（67%・33%で変わる）・形が変わるたびに仲間の記録を借りる"};
if(typeof ART_FALLBACK!=="undefined")ART_FALLBACK.zero="boss3";
if(typeof PALS!=="undefined")Object.assign(PALS,{f_zero:{hue:40,sat:0.5,lit:1.05},f_zero2:{hue:-140,sat:1.1},f_zero3:{hue:20,sat:0.7,lit:1.25}});

/* ---- 借りる記録（text 39-3 の名前・中身は仮） ---- */
const ZREC={
 YUKI:{d:"ZERO がもう1回動く（番を1回おくらせる）",fx:e=>{e.next=Math.max(0,e.next-100/(e.spd+(e.spdUp||0)))}},
 HINA:{d:"ZERO の攻撃 +4",fx:e=>{e.atkUp+=4}},
 MOMO:{d:"ZERO の体力が 6% もどる（今の形の上まで）",fx:e=>{const top=e.maxhp*[1,0.67,0.33][e.zf||0];e.hp=Math.min(Math.floor(top),e.hp+Math.round(e.maxhp*0.06))}},
 NANA:{d:"ZERO の防御 +20",fx:e=>{e.block+=20}},
 SORA:{d:"ZERO の速さ +2",fx:e=>{e.spdUp=(e.spdUp||0)+2}},
 KAEDE:{d:"ZERO の攻撃 ×1.15",fx:e=>{B.am*=1.15}},
 RIN:{d:"ZERO の次の攻撃が貫通 22",fx:e=>{e.pat=e.pat.slice();e.pat.splice(e.pi%e.pat.length,0,["prc",22])}},
 LUNA:{d:"次の番のガソリン −1",fx:e=>{B.apPen=(B.apPen||0)+1}},
 KURO:{d:"山札に「混線」2枚",fx:e=>{if(CARDS.crosstalk)ENEMY_OPS.jam(e,"crosstalk",2)}},
 MIO:{d:"ZERO の防御の4割が次の番まで残る",fx:e=>{e.blkKeep=Math.max(e.blkKeep||0,0.4)}},
};
const RECN={YUKI:"こゆきの凍結",HINA:"ひなの全開",MOMO:"ももの花の便り",NANA:"ななみのパーフェクト",SORA:"そらの音符",KAEDE:"かえでのレッドゾーン",RIN:"りんの間合い",LUNA:"るなの月",KURO:"クロのグリッチ",MIO:"みおの CVT"};
const RECL={YUKI:"……あたしの止め方。<br>止まらないで、そのまま行って。",HINA:"ひなの走り、まねしないでくださいっ！<br>……でも、くせは知ってます！",MOMO:"ももの花、返してもらうね。<br>ちゃんと、ゆっくり見て。",
 NANA:"わたくしの守りを真似るなど、<br>百年早いですわ。",SORA:"それ、ボクのリズム〜。<br>ズレてるとこ、あるよ。",KAEDE:"ウチの真似か。<br>赤に入ったら、すぐ落ちるで。",RIN:"私の矢ね。<br>近づけば、当たらないわ。",
 LUNA:"……その月、わたしの。<br>次の番は、欠けるよ。",KURO:"くひひっ♪ それ、クロの！<br>たまりすぎると、ほら、こわれる。",MIO:"みおの帯です……！<br>帯の外で、くずれます！"};
Object.assign(TEXT.ui=TEXT.ui||{},{zero_borrow:"ZERO が、{name}の記録を借りた"});
TEXT.ui.zero_rec={};TEN.forEach(c=>{TEXT.ui.zero_rec[c]=RECN[c];TEXT.ui["zero_rec_"+c.toLowerCase()]=RECN[c];TEXT.ui["zero_borrow_"+c.toLowerCase()]=RECL[c]});
if(TEXT.wk){TEXT.wk.hint.zero="形ごとに、効くギアがちがいます……高い、中、低いの順かも！";TEXT.wk.found.zero="弱点です！　この形には、このギア……！"}

/* ---- 場面（text 39章） ---- */
const N11=[[null,"ガレージに、10人がそろっていた。<br>筐体の枠が、いつもより強く光る。"],["MIO","今夜の ROAD は、いちばん長いです。<br>港の先、いちばん奥まで。","normal"],["KURO","送り先のない記録が、<br>最後に集まる場所……だね♪"]];
const N11C={YUKI:"……行ってくる。みんな、見てて。",HINA:"ひなが行きます！<br>みんなの走り、全部持っていくっス！",MOMO:"ももが行くね。<br>帰ってきたら、朝ごはんにしよう？",NANA:"わたくしが参りますわ。<br>最後の夜にふさわしい走りを。",
 SORA:"ボクが行くよ〜。<br>最後の曲、鳴らしてくる。",KAEDE:"ウチが行く。<br>いちばん奥まで、ぶち抜いたる。",RIN:"私が行くわ。<br>最後まで、順番どおりに。",LUNA:"……わたしが行く。<br>今夜は、夜の終わりが見える気がする。",
 KURO:"クロが行くよ♪<br>ルールの続きは、クロが確かめる。",MIO:"みおが行きます。<br>開いたのはみおだから……閉じ方も、見てきます。"};
const ZL=[[null,"零号がほどける。<br>でも、光はどこへも帰っていかない。"],[null,"サーキットの奥へ、街から、峠から、港から、<br>帰り道のない光が集まってくる。"],["MIO","送り先のない記録が……全部、<br>ひとつに、なっていきます……！","serious"],
 [null,"光の真ん中に、形が立ち上がる。<br>剣とも、槍とも、盾ともつかない。"],["MIO","名前は……「ZERO」。<br>零号の、本当の姿です。","serious"]];
const ZLC={YUKI:"……これが、最後。<br>全部まとめて、送る。",HINA:"でっかい……！<br>でも、ひな、もう逃げません！",MOMO:"こんなにたくさん、ひとりで……。<br>もう、ひとりにしないからね。",NANA:"相手にとって、不足はありませんわ。",
 SORA:"音が、いっぱい重なってる……。<br>ちゃんと、聞き分けるよ。",KAEDE:"ええやん。<br>最後に、いちばんでかいのが来たな。",RIN:"集まったのなら、まとめて返すだけ。",LUNA:"……この光、星みたい。<br>帰る場所を、さがしてる。",
 KURO:"3行目は、まだ黒いままだけど……<br>ここは、クロも知ってる場所だよ。",MIO:"みおが開いた道の、いちばん奥……。<br>最後まで、見届けます。"};
const ZP2=[[null,"ZERO の形が、ぐにゃりとゆがむ。"],["MIO","形が変わります！<br>……仲間の走りの記録を、借りてます！"]];
const ZP2M=["YUKI","……形、変わった。みおの仲間の走り、借りてる"];
const ZP3=[[null,"サーキットの空のふちが、<br>うすく、白くなりはじめる。"],["MIO","空が……明るく……？<br>ROAD に、夜明けが来てます……！"],[null,"ZERO の形が、最後の形になる。"]];
const ZP3M=["YUKI","……空、明るい。ROAD の夜が、終わる"];
const ZE=[[null,"ZERO がほどけていく。<br>集まっていた光が、ひとつずつ離れる。"],[null,"光は、街へ、峠へ、港へ。<br>帰り道のなかった記録が、帰っていく。"],["MIO","送り先……見えました。<br>全部、ちゃんと届いてます……！","smile"],
 [null,"最後に、いちばん古い光がひとつ残る。<br>こゆきの手甲に、ずっと預けていた光。"],["MIO","零号の記録の送り先は……<br>「.50 CAL の倉庫」。","serious"],["MIO","みおたちのガレージです。<br>PROJECT ZERO は……あそこで、始まった。","normal"],
 [null,"光がほどけて、サーキットの空へのぼる。"],[null,"空のふちから、白い光がさしてくる。<br>ROAD に、初めての朝が来た。"],null,
 [null,"目を開けると、ガレージだった。<br>シャッターのすきまから、朝の光。"],["MIO","筐体の熱……下がってます。<br>暴走は、もうありません。","normal"],["YUKI","……返せた。","normal"],[null,"手甲の重さが、指先から消えていた。"],
 ["MOMO","みんな、朝ごはんにしよう？<br>10人ぶん、作るね。","smile"],["MIO","でも……「だれが」「なんのために」<br>集めたのかは、まだ……わかりません。","normal"],["YUKI","……ん。それは、また今度。","normal"],
 [null,"筐体の画面のすみで、ROAD の枠が光っている。<br>消えずに、朝の色で。"],["YUKI","……次の夜も、走る。<br>今度は、朝まで。","smile"]];
const ZEC={YUKI:"……朝。ROAD にも、来るんだ。",HINA:"朝です……！<br>こゆき先輩、見てます！？　朝です！",MOMO:"きれい……。<br>この朝、写真に撮りたかったな。",NANA:"……夜明けを見るのは、悪くありませんわね。",
 SORA:"朝の音がする〜。<br>鳥の声、録っとけばよかった。",KAEDE:"……ええ朝や。<br>走りきったな、みんな。",RIN:"長い夜だったわね。<br>……おつかれさま、みんな。",LUNA:"……星が消えていく。<br>わたし、朝の空もすき。",
 KURO:"くひひっ……♪<br>ルールの最後の行、ちょっとだけ見えた気がする。",MIO:"ROAD の朝……<br>みお、初めて見ました。"};
const ch=()=>(G&&G.char)||"YUKI";
function buildScenes(){const c=ch(),mio=c==="MIO";
 TEXT.scenes.night11_first={under:"street",lines:N11.concat([[c,N11C[c]||N11C.YUKI,"normal"]])};
 TEXT.scenes.zero_link={bg:"fx:boss_intro",lines:ZL.concat([[c,ZLC[c]||ZLC.YUKI,"serious"]])};
 TEXT.scenes.zero_phase2={lines:mio?[ZP2[0],ZP2M]:ZP2};TEXT.scenes.zero_phase3={lines:mio?[ZP3[0],ZP3M,ZP3[2]]:ZP3};
 TEXT.scenes.zero_ed={bg:"zero_cg|boss3_after|fx:win",lines:ZE.map((l,i)=>i===8?[c,ZEC[c]||ZEC.YUKI,"smile"]:(mio&&i===10)?["YUKI","……熱、下がった。暴走、止まってる","normal"]:l)};
 TEXT.scenes.zero_ed_short={bg:"zero_cg|boss3_after|fx:win",lines:[["MIO","ZERO、送りました。<br>……ROAD の朝、また来ましたね。","smile"]]}}
buildScenes();
/* YUKI_ONLY（①）にかからない key なので、キャラの版は作らず、そのつど走る子の行を入れる */
const NO_TALK=/^(zero_link|zero_ed|zero_ed_short|zero_phase[23])$/;
let noTalk=0;
W("showScene",f=>function(key,done){if(/^(night11_first|zero_)/.test(key))buildScenes();if(NO_TALK.test(key)){noTalk++;const d=done;done=function(){noTalk=Math.max(0,noTalk-1);return d&&d.apply(this,arguments)}}return f.call(this,key,done)});
if(typeof SND!=="undefined"&&typeof SND.bgm==="function"){const b0=SND.bgm;SND.bgm=function(id){if(noTalk&&id==="talk")return;return b0.apply(this,arguments)}}

/* ---- 開き方：10人そろって NIGHT 10 をクリア ---- */
const allTen=()=>{try{const u=PRF().unlock.chars||[];return TEN.every(c=>u.includes(c))}catch(e){return false}};
W("nightMaxAvail",f=>function(){const r=f.apply(this,arguments);return r>=11&&!allTen()?10:r});
window.zeroOpen=()=>allTen()&&((PRF().unlock.nightMax||0)>=10);

/* ---- 最後の夜に初めて入る（night11_first） ---- */
W("blowIntro",f=>function(done){const d=done;return f.call(this,function(){if(isFinal()&&!auto()&&!(seenGet()||{}).night11_first)showScene("night11_first",d);else d&&d()})});

/* ---- 零号のあと → ZERO ---- */
const HEAL=0.15;
function zeroLink(){G.zeroPend=1;saveRun({s:"zlink"});const go=()=>{const h=Math.max(1,Math.round(G.maxhp*HEAL)),to=Math.min(G.maxhp,G.hp+h);G.hp=to;if(!auto())toast2(`記録がエンジンを軽くした（耐久 +${h}）`,300,2200);zeroStart()};
  if(auto())go();else showScene("zero_link",go)}
function zeroStart(){const j=G.path[G.row]||0;saveRun({s:"battle",key:"zero",j});startBattleState("zero");enterBattle()}
window.zeroLink=zeroLink;
W("afterWin",f=>function(){try{const w=S.win;if(w&&!w.ghost&&isFinal()){
  if(w.key==="boss3"&&!G.zeroDone&&!G.zeroPend){bossParts(zeroLink);return}
  if(w.key==="zero"){bossParts(zeroFinish);return}}}catch(e){}return f.apply(this,arguments)});
function zeroFinish(){G.zeroDone=1;G.zeroPend=0;advanceRow();let first=!(seenGet()||{}).zero_ed;try{const p=PRF();p.zeroClear=(+p.zeroClear||0)+1;if(p.zeroClear>1)first=false}catch(e){}
  if(auto()){showResult(true);return}
  showScene(first?"zero_ed":"zero_ed_short",()=>showResult(true))}
window.zeroFinish=zeroFinish;
/* 続きから：零号の報酬の途中・つなぎの会話の途中・ZERO の報酬の途中で閉じた */
let ZRES=null;
W("continueRun",f=>function(){ZRES=null;try{const r=loadRun(),st=r&&r.stage||{};if(r&&r.G&&r.G.night===11){if(st.s==="zlink")ZRES="link";else if(st.s==="win"&&st.key==="boss3"&&!r.G.zeroDone)ZRES="parts_link";else if(st.s==="win"&&st.key==="zero")ZRES="parts_finish"}}catch(e){}
  const k=ZRES;const out=f.apply(this,arguments);if(k==="link"){ZRES=null;zeroLink()}return out});
W("bossParts",f=>function(done){if(ZRES==="parts_link"){ZRES=null;done=zeroLink}else if(ZRES==="parts_finish"){ZRES=null;done=zeroFinish}return f.call(this,done)});
/* ---- 戦闘：ZERO の形 ---- */
function mostWx(){const k={};try{(G.map||[]).forEach((row,i)=>{if(i>G.row)return;const n=row[G.path[i]];if(n&&n.wx&&n.wx!=="dry"&&n.wx!=="dawn")k[n.wx]=(k[n.wx]||0)+1})}catch(e){}
  const L=Object.entries(k).sort((a,b)=>b[1]-a[1]);return L.length?L[0][0]:"rain"}
function pickBorrow(n){const out=[],ex=new Set([G.char].concat((G.bring||[]).map(m=>m&&m.char)).concat(B.zBor||[]));const L=shuffle(TEN.filter(c=>!ex.has(c)));for(const c of L){if(out.length>=n)break;out.push(c)}return out}
W("startBattleState",f=>function(key){const r=f.apply(this,arguments);try{if(key==="zero"&&B&&B.e){const e=B.e;e.zf=0;e.mi=0;e.pat=ZF[0].pat;e.spd=ZF[0].spd;B.wx="dry";B.zBor=[];B.zRec=[];
  if(TEXT.wx)TEXT.wx.boss2=Object.assign({},TEXT.wx.boss2,{zero:{n:"ドライ",l:""}})}}catch(x){}return r});
function zForm(f){const e=B.e;e.zf=f;e.mi=f;e.pat=ZF[f].pat;e.pi=0;e.spd=ZF[f].spd;
  const wx=f===2?"dawn":mostWx();B.wx=wx;B.wx2On=true;
  if(TEXT.wx)TEXT.wx.boss2=Object.assign({},TEXT.wx.boss2,{zero:f===2?{n:"夜明け",l:"ROAD に、初めて朝が来る"}:{n:(TEXT.wx[wx]&&TEXT.wx[wx].n)||wx,l:(TEXT.wx[wx]&&TEXT.wx[wx].l)||""}});
  const bor=pickBorrow(3);B.zBor=(B.zBor||[]).concat(bor);B.zRec=bor;bor.forEach(c=>{try{ZREC[c].fx(e)}catch(x){}});
  addLog(`ZERO の形が変わった（${["剣","槍","盾"][f]}）`);bor.forEach(c=>addLog((TEXT.ui.zero_borrow||"").replace("{name}",RECN[c])+`：${ZREC[c].d}`));
  ev({k:"phase",pal:"f_zero"+(f+1),glitch:true});ev({k:"wx2",wx,boss:"zero"});ev({k:"zform",f,bor})}
W("checkPhase",f=>function(){const r=f.apply(this,arguments);try{const e=B&&B.e;if(B&&B.key==="zero"&&e&&e.hp>0){const want=e.hp<=e.maxhp*0.33?2:e.hp<=e.maxhp*0.67?1:0;while((e.zf||0)<want)zForm((e.zf||0)+1)}}catch(x){}return r});
W("afterAct",f=>function(r,rpm0){let zf=null;try{if(B&&B.key==="zero"){const z=B.ev.filter(x=>x.k==="zform");if(z.length)zf=z}}catch(e){}
  let L=null,key=null,bor=null;
  try{if(zf&&!auto()&&r!=="win"&&r!=="dead"){const last=zf[zf.length-1];key="zero_phase"+(last.f+1);buildScenes();bor=zf.flatMap(z=>z.bor);L=(TEXT.scenes[key]||{lines:[]}).lines.slice().concat(bor.map(c=>[c,RECL[c]]));S.toastQ=L;S.toastT=Date.now()}}catch(e){}/* ①の wxPhase が天候の札を toastQ のあとに回すよう、先に積む */
  const out=f.apply(this,arguments);
  try{if(L){const sc=TEXT.scenes[key]||{lines:[]};S.toastQ=L;
    sc.lines.forEach((l,i)=>setTimeout(()=>{try{window.AUDIO&&AUDIO.cue(key,i)}catch(e){}},i*2500));
    bor.forEach((c,i)=>setTimeout(()=>{try{SND.se("zero_borrow",{who:c.toLowerCase()})}catch(e){}},400+i*800));
    L.forEach((l,i)=>setTimeout(()=>{if(window.SCREEN==="battle"&&B&&!B.over&&!busy())renderBattle()},i*2500+2530))}}catch(e){}
  return out});
/* 戦闘の画面：連戦の札（N11）と、借りた記録の札（資源の帯の上） */
W("renderBattle",f=>function(){const r=f.apply(this,arguments);try{if(!isFinal()||!B||window.SCREEN!=="battle")return r;const u=ui();if(!u)return r;
  const E=ENEMIES[B.key]||{},ally=typeof ALLY_BOSS!=="undefined"&&ALLY_BOSS[G.char]&&ENEMIES[ALLY_BOSS[G.char]],tot=ally?3:2,n=B.key==="zero"?tot:B.key==="boss3"?tot-1:E.ally?1:0;
  if(n){const t=u.querySelector(".chaintag");const txt=`連戦 ${n}／${tot}`;if(t)t.textContent=txt;else u.insertAdjacentHTML("beforeend",`<div class="chaintag" ${at(4,92,70,14)}>${txt}</div>`)}
  if(B.key==="zero"&&(B.zBor||[]).length&&!u.querySelector(".zrec")){const rec=B.zBor.map(c=>RECN[c]);
    u.insertAdjacentHTML("beforeend",`<button class="zrec" ${at(78,92,236,14)} onclick="toast2(${JSON.stringify(B.zBor.map(c=>RECN[c]+"："+ZREC[c].d).join("／")).replace(/"/g,"&quot;")},76,4200)">借りた記録 ${B.zBor.length}：${esc(rec.slice(-3).map(x=>x.replace(/^.+?の\s*/,"")).join("・"))}</button>`)}}catch(e){}return r});
try{const st=document.createElement("style");st.textContent=`.zrec{position:absolute;background:#140d22;color:#ffd9a8;border:1px solid #c08a3a;font-size:10px;line-height:12px;padding:0 2px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}`;document.head.appendChild(st)}catch(e){}

/* ---- 図鑑：ボスに ZERO ---- */
W("cdxEnemies",f=>function(boss){const L=f.apply(this,arguments);if(boss&&!L.some(x=>x.key==="zero")){const a=Math.max(0,L.findIndex(x=>x.key==="boss3"));const it={key:"zero",a:(L[a]||{}).a||0,final:1};it.id=typeof cdxEKey==="function"?cdxEKey("zero"):"zero";L.push(it)}return L});
W("cdxEnemyHint",f=>function(x){if(x&&x.final)return"最後の夜（NIGHT 11）で、零号のあと";return f.apply(this,arguments)});

window.ZERO={VERSION:"0.5.24",ZF,ZREC,RECN,zForm,allTen,zeroStart,mostWx,cap:r=>r>=11&&!allTen()?10:r};
})();
