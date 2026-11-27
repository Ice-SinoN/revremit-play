/* js/night2.js（プログラム班② v0.5.20）
   夜の周回 案1「夜で道がのびる」（design 25-4 ①・progression 1-38）と、高速・港のエリア（design 13-2・25-4 ②）。
   ①のファイルは書きかえない（関数を包むだけ）。①の本体に入れるときは、下の「データ」をそのまま data/ に、「つなぎ」を engine.js・screens.js に移せばよい。
   - NIGHT 1〜4＝3エリア（β のまま・何も変わらない）／5〜8＝4エリア（高速）／9〜11＝5エリア（高速・港）。最後はいつもサーキットの零号。
   - AREAS（const の配列）は、ランを始めるとき・続きから入るときに、その夜の並びに中身を入れかえる（n.a の番号はその並びの番号）。
   - 絵はまだない：敵は今の絵の色変え（ART_FALLBACK＋PALS の f_＋id）、背景・マップはストリートの絵（絵が来たら AREA_BG の getter が自動で切りかえる）。
   - 音：audio.js v0.30 の battle_／map_highway・harbor、boss_zankyou・boss_futou（bossBgm）、港の環境音（weather の {area:"harbor"}）。 */
"use strict";
(function(){
if(typeof AREAS==="undefined"||typeof ENEMIES==="undefined")return;
const W=(name,fn)=>{const f=window[name];if(typeof f!=="function")return;const g=fn(f);g.__n2=1;g.__orig=f;window[name]=g};

/* ===== データ ===== */
/* 13-2 高速（数は design の仮・LD が測る） */
Object.assign(ENEMIES,{
 hw_trailer:{art:"hw_trailer",n:"ナイトトレーラー",hp:90,spd:8,pat:[["blk",16],["atk",20]]},
 hw_booster:{art:"hw_booster",n:"ブースター",hp:60,spd:15,pat:[["multi",5,3],["atk",12]]},
 hw_shadow:{art:"hw_shadow",n:"ハイウェイシャドウ",hp:75,spd:11,pat:[["atk",14],["apd",1],["atk",14]],first:1,gimTxt:"先に動く"},
 hw_lane:{art:"hw_lane",n:"レーンチェンジャー",hp:70,spd:13,pat:[["atk",10],["multi",4,2],["blk",10]],accel:1,gimTxt:"動くたびに速くなる"},
 hw_long:{art:"hw_long",n:"ロングストレート",rank:"elite",hp:200,spd:12,pat:[["multi",6,3],["atk",22],["blk",18]],rage:1,gimTxt:"動くたびに攻撃 +1"},
 hw_boss:{wx2:"rain",weakGear:"high",art:"hw_boss",n:"残響",rank:"boss",hp:300,spd:11,pat:[["atk",18],["multi",5,4],["rev",2000],["atk",24]],blkKeep:0.3,gimTxt:"防御の3割が次の番まで残る",
   phase:{art:"hw_boss_p2",at:0.5,spd:13,pat:[["multi",6,4],["atk",28]]}},
/* 25-4 ② 港（名前は text 38-2） */
 hb_crane:{art:"hb_crane",n:"クレーンシャドウ",hp:95,spd:7,pat:[["blk",18],["atk",22]]},
 hb_forklift:{art:"hb_forklift",n:"フォークリフター",hp:80,spd:9,pat:[["blk",12],["jam","mud",1],["atk",16]]},
 hb_container:{art:"hb_container",n:"コンテナゴースト",hp:110,spd:6,pat:[["blk",24],["atk",26]],blkKeep:0.3,gimTxt:"防御の3割が次の番まで残る"},
 hb_fog:{art:"hb_fog",n:"汽笛",hp:70,spd:10,pat:[["atk",12],["jam","crosstalk",1],["multi",4,3]]},
 hb_quay:{art:"hb_quay",n:"ナイトドック",rank:"elite",hp:230,spd:8,pat:[["blk",20],["atk",28],["jam","mud",1]],rage:1,gimTxt:"動くたびに攻撃 +1"},
 hb_boss:{wx2:"fog",weakGear:"low",art:"hb_boss",n:"埠頭",rank:"boss",hp:320,spd:8,pat:[["blk",22],["atk",26],["jam","crosstalk",1],["multi",6,3]],blkKeep:0.4,gimTxt:"防御の4割が次の番まで残る",
   phase:{art:"hb_boss_p2",at:0.5,spd:10,pat:[["atk",32],["blk",26],["multi",7,3]]}},
});
/* 仮の絵：今の絵の色変え（design の「色変え」の指定どおりのもとの絵。新しく描く子は近い形の絵） */
if(typeof ART_FALLBACK!=="undefined")Object.assign(ART_FALLBACK,{hw_trailer:"kei",hw_booster:"formula",hw_shadow:"safety",hw_lane:"offbike",hw_long:"formula",hw_boss:"boss2",
  hb_crane:"kei",hb_forklift:"rally",hb_container:"kei",hb_fog:"safety",hb_quay:"kei",hb_boss:"boss1"});
if(typeof PALS!=="undefined")Object.assign(PALS,{f_hw_trailer:{hue:-60,sat:0.8},f_hw_booster:{hue:-80,sat:1.3},f_hw_shadow:{hue:200,sat:0.6},f_hw_lane:{hue:120,sat:1.2},f_hw_long:{hue:160,sat:1.4},f_hw_boss:{hue:-100,sat:1.2,lit:1.1},
  f_hb_crane:{hue:180,sat:0.7,lit:0.9},f_hb_forklift:{hue:-30,sat:1.2},f_hb_container:{hue:140,sat:0.5},f_hb_fog:{sat:0.2,lit:1.2},f_hb_quay:{hue:200,sat:1.1},f_hb_boss:{hue:170,sat:0.5,lit:0.95}});
const AREA_X={
 highway:{key:"highway",n:"高速",rows:12,pool:["hw_trailer","hw_booster","hw_shadow","hw_lane"],easy:["hw_trailer","hw_lane"],elite:"hw_long",boss:"hw_boss",mid:6,hpMul:1.72,bossMul:1.0,atkMul:1.25},
 harbor:{key:"harbor",n:"港",rows:11,pool:["hb_crane","hb_forklift","hb_container","hb_fog"],easy:["hb_crane","hb_forklift"],elite:"hb_quay",boss:"hb_boss",mid:5,hpMul:1.78,bossMul:1.0,atkMul:1.2}};
const NIGHT_AREAS={};for(let n=1;n<=11;n++)NIGHT_AREAS[n]=n<=4?["street","touge","circuit"]:n<=8?["street","touge","highway","circuit"]:["street","touge","highway","harbor","circuit"];
const AREA_STEPS={3:[13,14,15],4:[12,12,12,13],5:[10,11,11,11,12]};
const AREA_HEAL={3:0.30,4:0.25,5:0.25};
if(typeof WX_W!=="undefined")Object.assign(WX_W,{highway:{dry:45,rain:15,snow:5,fog:10,dawn:25},harbor:{dry:35,rain:20,snow:5,fog:30,dawn:10}});
window.NIGHT_AREAS=NIGHT_AREAS;window.AREA_STEPS=AREA_STEPS;window.AREA_HEAL=AREA_HEAL;window.AREA_X=AREA_X;

/* ===== その夜の並びに AREAS を入れかえる ===== */
const BASE=AREAS.map(a=>Object.assign({},a)),BYKEY={};BASE.forEach(a=>BYKEY[a.key]=a);Object.assign(BYKEY,AREA_X);
const HEAL0=RULES.areaHeal;
function applyAreas(night){const ks=NIGHT_AREAS[night|0]||NIGHT_AREAS[1],st=AREA_STEPS[ks.length]||ks.map(k=>BYKEY[k].rows);
  const list=ks.map((k,i)=>{const a=Object.assign({},BYKEY[k]);a.rows=st[i];a.mid=Math.min(a.mid,a.rows-3);return a});
  AREAS.length=0;list.forEach(a=>AREAS.push(a));RULES.areaHeal=AREA_HEAL[ks.length]!=null?AREA_HEAL[ks.length]:HEAL0;return AREAS}
window.applyAreas=applyAreas;
W("newRunState",f=>function(mode,charId,bring,dk,opt){applyAreas(opt&&opt.night);return f.apply(this,arguments)});
W("continueRun",f=>function(){try{const r=loadRun();if(r&&r.G)applyAreas(r.G.night)}catch(e){}return f.apply(this,arguments)});

/* ===== 絵（仮）：背景とマップは、絵が来るまでストリート ===== */
if(typeof AREA_BG!=="undefined")["highway","harbor"].forEach(k=>{if(Object.getOwnPropertyDescriptor(AREA_BG,k))return;
  Object.defineProperty(AREA_BG,k,{enumerable:true,get(){const st=window.STAGE_C2&&STAGE_C2[k],mp=typeof artHave==="function"&&artHave(`assets/c2/map/c2/revremit_map_bg_${k}.png`);return st||mp?k:"street"}})});

/* ===== 音：高速・港の曲（audio v0.30）。①の sound.js は street／touge／circuit の表なので、その2つだけ持ちかえる ===== */
if(typeof SND!=="undefined"&&typeof SND.bgm==="function"){const b0=SND.bgm;SND.bgm=function(id){try{if(typeof id==="string"&&/^(map|battle)_street$/.test(id)&&G&&G.map&&window.AUDIO){const k=curArea().key,nid=id.replace("street",k);
  if(k!=="street"&&(AUDIO.BGM_IDS||[]).includes(nid))id=nid}}catch(e){}return b0.apply(this,[id].concat([].slice.call(arguments,1)))}}
function wrapWeather(){if(!window.AUDIO||!AUDIO.weather||AUDIO.weather.__n2)return;const w0=AUDIO.weather;AUDIO.weather=function(wx,opt){try{if(!opt&&G&&G.map&&curArea().key==="harbor")opt={area:"harbor"}}catch(e){}return w0.call(this,wx,opt)};AUDIO.weather.__n2=1}
wrapWeather();

/* ===== 文（text 38章 港。高速の文はまだない＝エリアの札だけ） ===== */
TEXT.scenes=TEXT.scenes||{};
const HA=[[null,"霧の向こうで、クレーンが首をふる。<br>波の音と、遠い汽笛。"],["MIO","港です。船を待った夜や、<br>荷を運んだ夜の記録が集まってます。","normal"],["MIO","守りの固い記録が多いです……<br>ギアを落として、立ち上がってください。","serious"]];
const HA_C={YUKI:["YUKI","……港。うちの前と、少し似てる。","normal"],HINA:["HINA","うわ、コンテナでっか！<br>迷子にならないようにしないと！","normal"],MOMO:["MOMO","夜の港って、写真に撮りたくなるね。","smile"],
 NANA:["NANA","霧ですのね。視界の悪さは、<br>技術で補えばよろしいのですわ。","normal"],SORA:["SORA","汽笛の音、低くていいね〜。<br>ベースに使いたい。"],KAEDE:["KAEDE","見通し悪いなあ。<br>ほな、耳で走ったろか。"],
 RIN:["RIN","荷の記録……順番どおりに、<br>片づけていきましょう。"],LUNA:["LUNA","……霧で、星が見えない。<br>でも、灯台の光は見える。"],KURO:["KURO","くひひっ♪ かくれんぼには、<br>ちょうどいい場所だね。"],MIO:["YUKI","……みお、足もと。ぬれてる。","normal"]};
const HB=[[null,"岸壁のいちばん先。<br>止まったままの車が、海を向いている。"],[null,"ヘッドライトが、霧の中で<br>だれもいない海を照らしている。"],["MIO","名前は……「埠頭」。<br>最後の船を、待っていた夜の記録です。","serious"],
 ["MIO","毎晩ここまで迎えに来て……<br>船が来なくなっても、来つづけた。","normal"],["MIO","待つ形のまま、固まってます。<br>守りが、とても固いです……！","serious"]];
const HB_C={YUKI:["YUKI","……待つのは、もう終わり。送る。","serious"],HINA:["HINA","待ってるだけじゃ、さびしいっスよ。<br>ひなが、連れてきます！","normal"],MOMO:["MOMO","ずっと待ってたんだね……。<br>だいじょうぶ、ちゃんと届けるから。","normal"],
 NANA:["NANA","待つ方の気持ちは、わかりますわ。<br>……だからこそ、終わらせます。","serious"],SORA:["SORA","汽笛、鳴らしてあげたいな〜。<br>船が来たよって。"],KAEDE:["KAEDE","待ちくたびれたやろ。<br>ウチが、終わらせたる。"],
 RIN:["RIN","届かなかった荷も、<br>送り先があるなら、届けられる。"],LUNA:["LUNA","……ここの夜は、止まってる。<br>動かしてあげる。"],KURO:["KURO","待ちぼうけ、おしまいにしよっか♪"],MIO:["MIO","迎えに行く夜は……みおにも、ありました。<br>行きます。","normal"]};
const HBP=[[null,"霧の奥で、汽笛がひとつ鳴った。"],[null,"止まっていた車のライトが消えて、<br>光は海のほうへ、ゆっくり帰っていく。"],["MIO","届きました……。<br>迎えに来た人の、待っていた人のところへ。","smile"],["MIO","港の記録が、静かになりました。<br>この先は、サーキットです。","normal"]];
Object.entries(HA_C).forEach(([c,l])=>{const k=c==="YUKI"?"harbor_area":"harbor_area_"+c.toLowerCase();TEXT.scenes[k]={title:"港",lines:HA.concat([l])}});
Object.entries(HB_C).forEach(([c,l])=>{const k=c==="YUKI"?"hb_boss_pre":"hb_boss_pre_"+c.toLowerCase();TEXT.scenes[k]={bg:"fx:boss_intro",lines:HB.concat([l])}});
TEXT.scenes.hb_boss_post={bg:"hb_boss_after|fx:win",lines:HBP};
TEXT.scenes.harbor_boss_pre=TEXT.scenes.hb_boss_pre;TEXT.scenes.harbor_boss_post=TEXT.scenes.hb_boss_post;/* text の key でも引ける */
TEXT.scenes.roadlog_harbor={title:"PROJECT ZERO - ROAD LOG ― 港",file:1,lines:[["FILE","走行の記録。毎晩、同じ道を<br>港の岸壁まで。"],["FILE","着く時刻は、いつも最終便の5分前。"],["FILE","最後の日付のあとに、一行。<br>「便は、今月で終わり」"],["FILE","記録を集めた人の欄：PROJECT ZERO"],["MIO_IN","……この記録も、ずっと前のもの。<br>港にも、集められていたんですね。","normal"]]};
if(TEXT.wk){Object.assign(TEXT.wk.hint,{hb_boss:"固くて、重たい……低いギアで、押し上げてください！"});Object.assign(TEXT.wk.found,{hb_boss:"弱点です！　低いギアで、守りがくずれてます！"})}
if(TEXT.wx){TEXT.wx.boss2=Object.assign({},TEXT.wx.boss2,{hb_boss:{n:"汽笛の霧",l:"霧笛が鳴るたび、港が白くかすむ"},hw_boss:{n:"スコール",l:"雨が強くなる（仮）"}})}
window.RL_EXTRA=(window.RL_EXTRA||[]).concat([{k:"roadlog_harbor",g:"pz",n:"港"}]);

/* エリアの入り口：①は "area"+(番号+1) で引くので、エリアの key で引く形に（ストリート・峠・サーキット＝area1〜3、ほか＝{key}_area）。見出しは「エリア n　名前」 */
W("areaIntro",f=>function(ai,done){const a=AREAS[ai];if(!a)return f.apply(this,arguments);const k={street:"area1",touge:"area2",circuit:"area3"}[a.key]||(a.key+"_area"),tt=`エリア${ai+1}　${a.n}`;
  const sc=TEXT.scenes[k];if(!sc){TEXT.scenes.__t.title=tt;showScene("__t",done);return}
  const k2=sceneKey(k);[k,k2].forEach(x=>{if(x&&TEXT.scenes[x])TEXT.scenes[x].title=tt});
  if(!k2||seenGet()[k2]){TEXT.scenes.__t.title=tt;showScene("__t",done);return}showScene(k,done)});
/* 埠頭の初撃破：後の会話のあとに ROAD LOG（キャラ共通） */
W("showScene",f=>function(key,done){if(key==="hb_boss_post"&&!(seenGet()||{}).roadlog_harbor){const d=done;done=()=>{try{const p=PRF();p.rlog=p.rlog||{got:[]};if(!(p.rlog.got||[]).includes("roadlog_harbor")){(p.rlog.got=p.rlog.got||[]).push("roadlog_harbor")}}catch(e){}
   window.showScene("roadlog_harbor",d)};return f.call(this,key,done)}return f.apply(this,arguments)});
window.NIGHT2={VERSION:"0.5.20",applyAreas};
})();
