/* js/night2.js（プログラム班② v0.5.20・v0.5.21）
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
if(typeof WX_W!=="undefined")Object.assign(WX_W,{highway:{dry:45,rain:15,snow:5,fog:10,dawn:25},harbor:{dry:35,rain:20,snow:5,fog:30,dawn:10}});
window.NIGHT_AREAS=NIGHT_AREAS;window.AREA_STEPS=AREA_STEPS;window.AREA_X=AREA_X;

/* ===== その夜の並びに AREAS を入れかえる ===== */
const BASE=AREAS.map(a=>Object.assign({},a)),BYKEY={};BASE.forEach(a=>BYKEY[a.key]=a);Object.assign(BYKEY,AREA_X);window.AREA_BYKEY=BYKEY;
function applyAreas(night){const ks=NIGHT_AREAS[night|0]||NIGHT_AREAS[1],st=AREA_STEPS[ks.length]||ks.map(k=>BYKEY[k].rows);
  const list=ks.map((k,i)=>{const a=Object.assign({},BYKEY[k]);a.rows=st[i];a.mid=Math.min(a.mid,a.rows-3);return a});
  AREAS.length=0;list.forEach(a=>AREAS.push(a));return AREAS}/* v0.5.21 design 26-3 ①：ボスのあとの回復は夜の決まりのまま（N1〜4 30%・N5〜11 10%・エリアの数によらない） */
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

/* ===== 文（text 38章 港・40章 高速） ===== */
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
if(TEXT.wx){TEXT.wx.boss2=Object.assign({},TEXT.wx.boss2,{hb_boss:{n:"汽笛の霧",l:"霧笛が鳴るたび、港が白くかすむ"},hw_boss:{n:"トンネルの雨",l:"トンネルの出口で、音が雨にまじる"}/* text 40-3 */})}
window.RL_EXTRA=(window.RL_EXTRA||[]).concat([{k:"roadlog_highway",g:"pz",n:"高速"},{k:"roadlog_harbor",g:"pz",n:"港"}]);
/* ===== v0.5.22 text 40章 高速 ===== */
const WA=[[null,"海ぞいの高架が、夜の向こうまでのびる。<br>オレンジの灯りが、等間隔に流れていく。"],["MIO","高速です。どこかへ急いだ夜の記録が、<br>たくさん走ってます。","normal"],["MIO","敵が速いです……<br>ギアは高いまま、置いていかれないで！","serious"]];
const WA_C={YUKI:["YUKI","……直線。ZC だと、ちょっと長い。","normal"],HINA:["HINA","モンキーで高速は、ちょっとこわいっス……！<br>でも、ここなら走れる！","normal"],MOMO:["MOMO","夜の高速って、なんだか遠くまで<br>行けそうな気がするね。","smile"],
 NANA:["NANA","長い直線は、わたくしの得意ですわ。<br>8段、きれいに積みますわよ。","normal"],SORA:["SORA","風の音がずーっと鳴ってる〜。<br>いいループだね。"],KAEDE:["KAEDE","ええ直線や。<br>Z の出番やな。"],RIN:["RIN","合流が多いわね。<br>流れを読んで、入りましょう。"],
 LUNA:["LUNA","……灯りが流れ星みたい。<br>止まらない夜。"],KURO:["KURO","自転車で高速！<br>くひひっ♪ 現実じゃ、ぜったいムリ。"],MIO:["YUKI","……みお、速い。ついていって。","normal"]};
const WB=[[null,"ジャンクションの真ん中。<br>何台ぶんもの排気音が、重なって鳴っている。"],[null,"音だけが残って、車の形はない。"],["MIO","名前は……「残響」。<br>急いだ夜の、音だけの記録です。","serious"],["MIO","走り去ったあとの音が、<br>トンネルの中で鳴りつづけてる……。","normal"],["MIO","速いです……！<br>回転を下げられても、すぐ上げて！","serious"]];
const WB_C={YUKI:["YUKI","……音だけ、置いていかれたんだ。<br>送る。","serious"],HINA:["HINA","音だけでも、ちゃんと帰れますよ！<br>ひなが送ります！","normal"],MOMO:["MOMO","だれかに、聞いてほしかったのかな。<br>ももが、聞くね。","normal"],
 NANA:["NANA","置き去りの音……。<br>わたくしが、終わらせて差しあげます。","serious"],SORA:["SORA","いい音なのに、ずっと同じとこ回ってる〜。<br>出口、教えてあげよ。"],KAEDE:["KAEDE","音だけで走っとるんか。<br>ほな、ウチが追い越したる。"],
 RIN:["RIN","音の出どころを探せば、<br>送り先も見つかるはずよ。"],LUNA:["LUNA","……音が、流れ星みたいに残ってる。<br>落としてあげる。"],KURO:["KURO","くひひっ♪ エコーのかくれんぼ？<br>み〜つけた。"],MIO:["MIO","トンネルの中だけ、ずっと夜……。<br>出口まで、行きます。","normal"]};
const WBP=[[null,"重なっていた音が、ひとつずつほどける。"],[null,"最後のひとつが、トンネルの出口へ走っていって、<br>夜の向こうで、聞こえなくなった。"],["MIO","届きました……。<br>急いでいた先に、ちゃんと着いたんだと思います。","smile"],["MIO","この先は、サーキットです。","normal"]];
Object.entries(WA_C).forEach(([c,l])=>{const k=c==="YUKI"?"highway_area":"highway_area_"+c.toLowerCase();TEXT.scenes[k]={title:"高速",lines:WA.concat([l])}});
Object.entries(WB_C).forEach(([c,l])=>{const k=c==="YUKI"?"hw_boss_pre":"hw_boss_pre_"+c.toLowerCase();TEXT.scenes[k]={bg:"fx:boss_intro",lines:WB.concat([l])}});
TEXT.scenes.hw_boss_post={bg:"hw_boss_after|fx:win",lines:WBP};
TEXT.scenes.highway_boss_pre=TEXT.scenes.hw_boss_pre;TEXT.scenes.highway_boss_post=TEXT.scenes.hw_boss_post;
TEXT.scenes.roadlog_highway={title:"PROJECT ZERO - ROAD LOG ― 高速",file:1,lines:[["FILE","走行の記録。湾岸の高速、<br>同じジャンクションを何度も。"],["FILE","速度の欄だけが、<br>ずっと上限のまま。"],["FILE","メモの欄：「間に合え」"],["FILE","記録を集めた人の欄：PROJECT ZERO"],["MIO_IN","……何に間に合いたかったのかは、<br>書いてありません。","normal"]]};
if(TEXT.wk){Object.assign(TEXT.wk.hint,{hw_boss:"速いです……高いギアのまま、追いついてください！"});Object.assign(TEXT.wk.found,{hw_boss:"弱点です！　高いギアで、追いついてます！"})}
/* 図鑑の1行（text 40-2・38-2） */
TEXT.edesc=Object.assign({},TEXT.edesc,{hw_trailer:"夜どおし荷を運んだ記録。重くて固い。",hw_booster:"急ぎすぎた記録。すばやく何度も撃つ。",hw_shadow:"追い越し車線の記録。いつも先に動く。",hw_lane:"車線を変えつづけた記録。だんだん速くなる。",hw_long:"終わらない直線の記録。怒ると強い。",
 hb_crane:"夜どおし荷を吊った記録。腕が長い。",hb_forklift:"倉庫の中を行き来した記録。泥をはね上げる。",hb_container:"箱の中は、からっぽ。守りだけが残った記録。",hb_fog:"霧の中で鳴りつづける記録。音で混線させる。",hb_quay:"最後の荷を降ろせなかった記録。怒ると強い。"});

/* エリアの入り口：①は "area"+(番号+1) で引くので、エリアの key で引く形に（ストリート・峠・サーキット＝area1〜3、ほか＝{key}_area）。見出しは「エリア n　名前」 */
W("areaIntro",f=>function(ai,done){const a=AREAS[ai];if(!a)return f.apply(this,arguments);const k={street:"area1",touge:"area2",circuit:"area3"}[a.key]||(a.key+"_area"),tt=`エリア${ai+1}　${a.n}`;
  const sc=TEXT.scenes[k];if(!sc){TEXT.scenes.__t.title=tt;showScene("__t",done);return}
  const k2=sceneKey(k);[k,k2].forEach(x=>{if(x&&TEXT.scenes[x])TEXT.scenes[x].title=tt});
  if(!k2||seenGet()[k2]){TEXT.scenes.__t.title=tt;showScene("__t",done);return}showScene(k,done)});
/* 残響・埠頭の初撃破：後の会話のあとに ROAD LOG（キャラ共通・text 40-4・38-4） */
const POST_LOG={hb_boss_post:"roadlog_harbor",hw_boss_post:"roadlog_highway"};
W("showScene",f=>function(key,done){const rl=POST_LOG[key];if(rl&&!(seenGet()||{})[rl]){const d=done;done=()=>{try{const p=PRF();p.rlog=p.rlog||{got:[]};if(!(p.rlog.got||[]).includes(rl)){(p.rlog.got=p.rlog.got||[]).push(rl)}}catch(e){}
   window.showScene(rl,d)};return f.call(this,key,done)}return f.apply(this,arguments)});

/* ===== v0.5.21 夜のパーツ4つ（design 26-3 ⑥・v0.5.22 名前と説明は text 42。その夜を初めて全クリアで開く＝NIGHTS の open.parts） ===== */
if(typeof PARTS!=="undefined"){Object.assign(PARTS,{
 p_night_bay:{own:"N",n:"ナイトビジョン",d:"霧と夜霧の悪い所が半分",night:5},
 p_night_storm:{own:"N",n:"撥水コーティング",d:"天候が変わった番に防御 +8",night:7},
 p_night_harbor:{own:"N",n:"タイダウンベルト",d:"ボスの第2形態に入った番に防御 +10・回転を帯の真ん中に",night:9},
 p_night_dawn:{own:"N",n:"サンバイザー",d:"夜明けの悪い所が効かない・レッドの帯がもっと広がる",night:11}});
 [["p_night_bay",5],["p_night_storm",7],["p_night_harbor",9],["p_night_dawn",11]].forEach(([id,n])=>{const N=NIGHTS[n-1];if(!N)return;N.open=N.open||{};N.open.parts=N.open.parts||[];if(!N.open.parts.includes(id))N.open.parts.push(id)})}
const hasP=id=>typeof has==="function"&&has(id);
/* ナイトビジョン：霧の予告は数字まで（種類だけ → いつもの予告）・夜霧の見える段 +1 */
W("intentFog",f=>function(e){if(hasP("p_night_bay")&&typeof intent==="function")return intent(e);return f.apply(this,arguments)});
W("nightFace",f=>function(n){const r=f.apply(this,arguments);if(r&&r.fogView&&G&&G.parts&&hasP("p_night_bay"))return Object.assign({},r,{fogView:r.fogView+1});return r});
/* ストームバッフル：天候が変わった番（ボスの第2形態の天候・嵐の夜の3ターン目＝①の夜の顔が入ったら ev "wx2" か "wxchange" を出す所）に防御 +8 */
function partBlock(v,nm){B.block+=v;addLog(`${nm}：防御 +${v}`);ev({k:"pblk",v})}
W("checkWx2",f=>function(){const was=B&&B.wx2On;const r=f.apply(this,arguments);if(B&&!was&&B.wx2On&&hasP("p_night_storm"))partBlock(8,PARTS.p_night_storm.n);return r});
/* v0.5.23 audio v0.31：埠頭の第2形態「汽笛の霧」で futou_phase（フルオートでは鳴らさない） */
W("checkWx2",f=>function(){const was=B&&B.wx2On;const r=f.apply(this,arguments);try{if(B&&!was&&B.wx2On&&B.key==="hb_boss"&&!(G&&G.fullAuto)&&!(window.FARM&&FARM.on))SND.se("futou_phase")}catch(e){}return r});
/* v0.5.23 audio v0.31 の cue は text の key（harbor_boss_pre など・キャラの版なし）。②の場面の key（hb_boss_pre_hina など）からも引けるように読みかえる */
{const CHR=/_(yuki|hina|momo|nana|sora|kaede|rin|luna|kuro|mio)$/,AL={hb_boss_pre:"harbor_boss_pre",hb_boss_post:"harbor_boss_post",highway_boss_pre:"hw_boss_pre",highway_boss_post:"hw_boss_post"};
 const wrapCue=()=>{const A=window.AUDIO;if(!A||typeof A.cue!=="function"||A.cue.__n2)return;const c0=A.cue;A.cue=function(k,i){if(c0.call(A,k,i))return true;let b=String(k||"").replace(CHR,"");b=AL[b]||b;return b!==k?c0.call(A,b,i):false};A.cue.__n2=1};
 wrapCue();window.addEventListener("load",wrapCue)}
window.nightStormHit=function(){if(B&&hasP("p_night_storm"))partBlock(8,PARTS.p_night_storm.n)};/* ①の嵐の夜（天候が変わる番）から呼ぶ口 */
/* 係船ロープ：ボスの第2形態に入った番、防御 +10・回転を帯の真ん中に */
W("checkPhase",f=>function(){const was=B&&B.e&&B.e.phased;const r=f.apply(this,arguments);try{if(B&&B.e&&!was&&B.e.phased&&B.e.rank==="boss"&&hasP("p_night_harbor")){partBlock(10,PARTS.p_night_harbor.n);const br=bandRange();B.rpm=Math.round((br.lo+br.hi)/2);addLog(`${PARTS.p_night_harbor.n}：回転 ${B.rpm}`)}}catch(e){}return r});
/* 夜明けのライト：夜明けの悪い所が効かない・レッドの帯がさらに 250 下から */
W("wxMinus",f=>function(){if(hasP("p_night_dawn")&&typeof wxNow==="function"&&wxNow()==="dawn")return false;return f.apply(this,arguments)});
W("redLo",f=>function(){const r=f.apply(this,arguments);return hasP("p_night_dawn")&&B&&!B.over&&typeof wxNow==="function"&&wxNow()==="dawn"?r-250:r});
/* 仮のアイコン：グラフィック班の絵（items\c2\revremit_item_part_p_night_＊.png）が来るまで、夜の4つは月のしるし（assets/c2/items/c2/revremit_item_part_p_night_＊.png を同梱） */
/* ===== v0.5.26 text 45章：走る子が MIO のとき、通信の MIO の行を YUKI の行に（38〜40章） ===== */
{const Y=t=>["YUKI",t,"normal"],ALT={
  harbor_area:{1:"……港。船を待った夜とか、<br>荷を運んだ夜の記録が多い。",2:"……守りが固い。<br>ギア落として、立ち上がって。"},
  hb_boss_pre:{2:"……名前、「埠頭」。<br>最後の船を、待ってた夜の記録。",3:"……毎晩、迎えに来てた。<br>船が来なくなっても。",4:"……待つ形のまま、固まってる。<br>守り、すごく固い。"},
  hb_boss_post:{2:"……届いた。<br>待ってた人のところに。",3:"……港、静かになった。<br>次は、サーキット。"},
  highway_area:{1:"……高速。急いだ夜の記録が、<br>たくさん走ってる。",2:"……敵が速い。<br>ギアは高いまま、置いていかれないで。"},
  hw_boss_pre:{2:"……名前、「残響」。<br>急いだ夜の、音だけの記録。",3:"……走り去った音だけ、<br>トンネルで鳴りつづけてる。",4:"……速い。<br>回転、下げられても、すぐ上げて。"},
  hw_boss_post:{2:"……届いた。<br>急いでた先に、ちゃんと着いた。",3:"……次は、サーキット。"}};
 Object.entries(ALT).forEach(([k,m])=>{const mk=k+"_mio",base=TEXT.scenes[mk]||TEXT.scenes[k];if(!base)return;
   TEXT.scenes[mk]=Object.assign({},base,{lines:base.lines.map((l,i)=>m[i]&&l&&l[0]==="MIO"?Y(m[i]):l)})});
 /* 弱点のヒント（①は「みお：」＋文で出す）：MIO で走るときは「こゆき：」＋YUKI の文 */
 const WK={"速いです……高いギアのまま、追いついてください！":"……速い。高いギアのまま、追いついて。","弱点です！　高いギアで、追いついてます！":"……弱点。高いギアで、追いついてる。",
  "固くて、重たい……低いギアで、押し上げてください！":"……固くて、重い。<br>低いギアで、押し上げて。","弱点です！　低いギアで、守りがくずれてます！":"……弱点。低いギアで、くずれてる。",
  "形ごとに、効くギアがちがいます……高い、中、低いの順かも！":"……形ごとに、効くギアがちがう。<br>高い、中、低い、の順かも。","弱点です！　この形には、このギア……！":"……弱点。この形には、このギア。"};
 W("toast2",f=>function(t){try{if(G&&G.char==="MIO"&&typeof t==="string"&&t.startsWith("みお：")){const y=WK[t.slice(3)];if(y){const a=[].slice.call(arguments);a[0]="こゆき："+y.replace(/<br>/g,"");return f.apply(this,a)}}}catch(e){}return f.apply(this,arguments)});}
/* v0.5.26 QA：「つづきから」の札のエリアの名前は、その夜の並び（N9〜11 の5つ目など）で */
W("runLabel",f=>function(r){try{const g=r.G,ks=NIGHT_AREAS[g.night|0];if(ks&&g.map){const row=Math.min(g.row,g.map.length-1),a=g.map[row][0].a,start=g.map.findIndex(x=>x[0].a===a),AR=BYKEY[ks[a]];
  if(AR)return`${g.mode}・エリア${a+1} ${AR.n} ${row-start+1}段・耐久${g.hp}/${g.maxhp}`}}catch(e){}return f.apply(this,arguments)});
window.NIGHT2={VERSION:"0.5.30",applyAreas};
})();
