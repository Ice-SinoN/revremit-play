"use strict";
/* ★③ 数の直し（design 13-5・LD balance 11-56〜11-59・窓口 11-24 07:16）。1つの版に1つ＝下の STEPS を上から順に入れた形。
   ①のファイルにはさわらない（CHARS・CARDS・NIGHT_HP の中身を書きかえる）。
   LD の測り方：読みこむ前に globalThis.ALLY3_LD_STEP=n（0〜58）を置くと、その版までの直しで止まる（qa は env LDSTEP=n）。置かなければいちばん新しい版。
   0.7 の「5人とも areaBossHp・RIN 耐久 −10・SORA の AT 6000」は取りやめ（LD 11-56：RIN の耐久 −10 は入れない／13-5-1：SORA の AT は保留）。 */
(function(){const A3=globalThis.ALLY3;if(!A3||A3.ldDone)return;
const has=c=>!!CHARS[c]&&A3.chars.includes(c),card=(id,o)=>{if(CARDS[id])Object.assign(CARDS[id],o)},rule=(c,o)=>{CHARS[c].rule=Object.assign({},CHARS[c].rule,o)};
const H0=(k,f)=>A3.hook[k].push(f);
/* ★v1.0 SORA〜MIO の奥義18枚（design 25-3・text 30-3 v0.22.62）。共通：gas 2・1戦に1回（exile）・帯なし・最終倍率 ×3 まで（①の ogMultCap）・「最大 n」は倍率なし（raw）。数は仮（LD が測る） */
/* ★v1.5 夜のカード（design 26-4 ②・③の6人の12枚・数は仮・名前と文はシナリオ班を待つ＝仮の名前）。
   開き方：そのキャラで初めて NIGHT 6 を全クリア＝R（1枚目）／NIGHT 9＝E（2枚目）（KURO は 10・11）。開いたあとは報酬・ショップにふつうに出る（p.unlock.cards に足す） */
A3.night12=()=>{
 /* night カードは仮の名前。ld 63 */
 const C6=["SORA","KAEDE","RIN","LUNA","KURO","MIO"];if(!C6.some(has))return;
 const pierce=f=>{const e=B.e,b=e.block;e.block=0;try{f()}finally{e.block+=b}};
 Object.assign(OPS,{
  ntWhite:(x,n)=>{if(A3.notes)for(let i=0;i<n;i++)A3.notes.push("w")},
  ntAllRed:(x,v,k)=>{const n=(B.staff||[]).length;if(!n){addLog("音符がない");return}B.staff=[];A3.notes&&A3.notes.ui&&A3.notes.ui();addLog(`音符 ${n} つを赤として使った`);x.attack(Math.min(k,n*v),true);B.finCol="r";B.finColTurn=B.pTurns;B.lastFin=1},
  ntRedEnd:(x,v)=>x.attack(v+4*(B.kRedEnd||0)),
  ntBow2:(x,v)=>{x.attack(v);x.attack(v);if(A3.rin)A3.rin.range(1)},
  ntPromote:x=>{const PI=["rook","bishop","knight","queen"],R=A3.rin;if(!R)return;const k=PI.indexOf(B.piece),nx=PI[Math.min(3,k+1)];B.piece=nx;B.pieceT=R.turns(nx);B.promoN=(B.promoN||0)+(k<3?1:0);addLog(`駒：${({rook:"ルーク",bishop:"ビショップ",knight:"ナイト",queen:"クイーン"})[nx]}（残る番 ${B.pieceT}）`);A3.se("rin_promote",{lv:PI.indexOf(nx)+1})},
  ntStars:(x,n)=>{if(A3.luna)for(let i=0;i<n;i++)A3.luna.star("any")},
  ntShapes:(x,v)=>{const sh=Object.values(B.skyLines||{}).filter(Boolean).length+Object.values(B.skyTris||{}).filter(Boolean).length,lit=A3.luna?A3.luna.lit():0;x.attack(sh*10+lit*v)},
  ntCenter:x=>{const r=RULE().cvt;if(!r)return;B.rpm=Math.min(limit(),Math.round((r.clo+r.chi)/200)*100);addLog(`回転を ${B.rpm} に（帯の芯）`);ev({k:"revdown",v:0})},
  ntBandTurn:(x,v)=>x.attack(A3.turnVal("mioBandT")*v+12),
  ntCap:x=>{A3.turnVal("kCap220",1);addLog("この番、心拍の上限 220")},
 });
 const O=(id,own,r,t,c,gas,v,vu,fx,d,o)=>Object.assign({r,mo:t==="atk"?"atk_heavy":t==="grd"?"guard":"skill",own,n:"（仮）夜のカード "+id,t,c,gas,v,vu,fx,d,night:1},o||{});
 const N={
  s_nt1:O("s_nt1","SORA","R","rev",0,1,3,5,[["ntWhite",1],["blk","v"]],"白の音符を2つ・防御 {v}",{col:"w",sup:1}),
  s_nt2:O("s_nt2","SORA","E","atk",2500,2,5,7,[["ntAllRed","v","k"]],"音符を全部、赤として使う：数 ×{v} ダメージ（倍率なし・最大 {k}）",{col:"r",fin:1,k:40,ku:56}),
  k_nt1:O("k_nt1","KAEDE","R","rev",0,1,5,8,[["revUpCap",1500],["blk","v"]],"回転 +1500・防御 {v}",{sup:1}),
  k_nt2:O("k_nt2","KAEDE","E","atk",2500,2,20,30,[["ntRedEnd","v"]],"{v}＋この戦闘でレッドゾーンで番を終えた数 ×4 ダメージ"),
  r_nt1:O("r_nt1","RIN","R","atk",1000,1,5,7,[["ntBow2","v"]],"弓・{v} ダメージを2回・間合い +1",{bow:1}),
  r_nt2:O("r_nt2","RIN","E","rev",0,1,0,0,[["ntPromote"]],"場の駒を1段上げる（クイーンまで）・残る番を満タンに",{sup:1}),
  l_nt1:O("l_nt1","LUNA","R","rev",0,1,3,5,[["ntStars",2],["blk","v"]],"好きなマスに星を2つ・防御 {v}",{sup:1,stars2:2}),
  l_nt2:O("l_nt2","LUNA","E","atk",2500,2,4,6,[["ntShapes","v"]],"そろっている形（直線・三角）の数 ×10＋灯っている星の数 ×{v} ダメージ"),
  mi_nt1:O("mi_nt1","MIO","R","rev",0,1,5,8,[["ntCenter"],["blk","v"]],"回転を帯の芯にそろえる・防御 {v}",{sup:1}),
  mi_nt2:O("mi_nt2","MIO","E","atk",2000,2,6,9,[["ntBandTurn","v"]],"この番に帯の中で打った枚数 ×{v}＋12 ダメージ"),
  ku_nt1:O("ku_nt1","KURO","R","rev",0,0,2,3,[["kGl","v"]],"心拍 −30・グリッチ +{v}",{hr:-30,sup:1}),
  ku_nt2:O("ku_nt2","KURO","E","rev",0,0,3,4,[["ntCap"],["kGl","v"]],"この番、心拍の上限 200 → 220・グリッチ +{v}",{hr:20,sup:1}),
 };
 // ★v1.7 文（text-add v0.22.67 43章）：名前・読み・説明・フレーバー・長押し
 Object.entries({"s_nt1": {"n": "夜想曲", "d": "白の音符を2つ・防御 {v}。", "flav": "夜の音は、やさしく、白く鳴る。", "yomi": "ノクターン"}, "s_nt2": {"n": "終夜楽章", "d": "音符を全部、赤として使う：数 ×{v}（倍率なし・最大 {k}）。", "flav": "夜どおし鳴らした音を、最後の一小節に、ぜんぶ。", "yomi": "しゅうやがくしょう"}, "k_nt1": {"n": "ミッドナイトブースト", "d": "回転 +1500・防御 {v}。", "flav": "真夜中の直線。針を、赤の手前まで。"}, "k_nt2": {"n": "夜紅葉", "d": "{v} ダメージ＋この戦闘で、レッドのまま番を終えた数 ×4。", "flav": "夜の山で、いちばん赤く燃える葉。", "yomi": "よもみじ"}, "r_nt1": {"n": "夜鷹の矢", "d": "弓・{v} ダメージを2回・間合い +1（「2枚まで」に数えない）。", "flav": "夜を飛ぶ鳥は、遠くの獲物を、見のがさない。", "yomi": "よたかのや", "lp": "間合いを広げるカードの『2枚まで』には数えない。"}, "r_nt2": {"n": "月下の成り", "d": "場の駒を1段上げる（クイーンまで）・残る番を満タンに。", "flav": "月の光の下で、駒は、ひとつ上へ。", "yomi": "げっかのなり"}, "l_nt1": {"n": "星蒔き", "d": "好きなマスに星を2つ・防御 {v}。", "flav": "夜空に、星をまく。……ここと、ここ。", "yomi": "ほしまき"}, "l_nt2": {"n": "満天", "d": "そろった形（直線・三角）の数 ×10＋灯った星の数 ×{v}。", "flav": "雲ひとつない夜。空は、星でいっぱい。", "yomi": "まんてん"}, "mi_nt1": {"n": "ナイトクルーズ", "d": "回転を帯の芯にそろえる・防御 {v}。", "flav": "夜の道を、いちばん静かな回転で。"}, "mi_nt2": {"n": "夜光翠", "d": "（この番に帯の中で打った枚数 ×{v}＋12）ダメージ。", "flav": "夜の海に光る、みどり色の波。", "yomi": "やこうすい"}, "ku_nt1": {"n": "おやすみモード", "d": "心拍 −30・グリッチ +{v}。", "flav": "くひひっ♪ ちょっとだけ、寝たふり。"}, "ku_nt2": {"n": "夜ふかし", "d": "この番、心拍の上限が 220 に（220 まで転倒しない）・グリッチ +{v}。", "flav": "まだまだ、寝ないよ♪ 夜は、これから。", "yomi": "よふかし", "lp": "次の番には、上限 200 にもどる。"}}).forEach(([id,o])=>{if(N[id])Object.assign(N[id],o)});
 Object.keys(N).forEach(id=>{if(!has(N[id].own))delete N[id]});Object.assign(CARDS,N);
 // 図鑑の手に入れ方の字（TEXT.ui の dex_how_night は①／②が決めるまで③の仮）
 A3.NIGHT_CARDS={SORA:[["s_nt1",6],["s_nt2",9]],KAEDE:[["k_nt1",6],["k_nt2",9]],RIN:[["r_nt1",6],["r_nt2",9]],LUNA:[["l_nt1",6],["l_nt2",9]],MIO:[["mi_nt1",6],["mi_nt2",9]],KURO:[["ku_nt1",10],["ku_nt2",11]]};
 Object.entries(A3.NIGHT_CARDS).forEach(([ch,L])=>L.forEach(([id,n])=>{if(CARDS[id]){CARDS[id].nightOpen=n;}if(CARDS[id])Object.defineProperty(CARDS[id],"how",{configurable:true,enumerable:true,get:()=>{const T=typeof TEXT!=="undefined"?TEXT:{},f=(T.ui&&T.ui.dex_how_night)||"{キャラ}で NIGHT {n} を、初めて全クリア";return f.replace("{キャラ}",(T.names&&T.names[ch])||ch).replace("{n}",n)}})}/* 文が読まれる前でもよいように getter */));
 try{const U=TEXT.ui=TEXT.ui||{};if(!U.dex_how_night)U.dex_how_night="{キャラ}で NIGHT {n} を、初めて全クリア";if(!U.unlock_night_card)U.unlock_night_card="夜のカードが開いた：{card}"}catch(e){}/* ★v1.7 43章のキー（①②が出す所を作ったら使う） */
 if(A3._ntHooked)return;A3._ntHooked=1;
 if(typeof clearMark==="function"){const cm=clearMark;clearMark=function(ch,mode,n){const r=cm.apply(this,arguments);try{const L=A3.NIGHT_CARDS[ch];if(L&&G&&!G.practice&&!window.NTCARDS&&typeof window.nightCardOpen!=="function"&&typeof NIGHT_CARDS==="undefined")/* ★v1.9 BUG-67：②の名前は window.NTCARDS・nightCardOpen */{const u=PRF().unlock;u.cards=u.cards||[];L.forEach(([id,k])=>{if(CARDS[id]&&(n||0)>=k&&!u.cards.includes(id))u.cards.push(id)})}}catch(e){}return r}}/* runEnd の中・beforeC のあと＝「カード：〜」に出る */
 // KAEDE：レッドゾーンで番を終えた数／MIO：この番に帯の中で打った枚数／KURO：この番の上限 220
 {const te=turnEnd;turnEnd=function(){try{if(B&&!B.over&&G&&G.char==="KAEDE"&&typeof redLo==="function"&&B.rpm>=redLo())B.kRedEnd=(B.kRedEnd||0)+1}catch(e){}return te.apply(this,arguments)}}
 H0("after",x=>{if(!A3.isChar("MIO"))return;const r=RULE().cvt;if(r&&B.cvtRpm>=r.lo&&B.cvtRpm<=r.hi)A3.turnVal("mioBandT",A3.turnVal("mioBandT")+1)});
 if(A3.kuro){const R0=A3.kuro.R;A3.kuro.R=function(){const r=R0.apply(this,arguments);try{if(B&&A3.turnVal("kCap220")&&r&&r.cap<220)return Object.assign({},r,{cap:220})}catch(e){}return r}}
 if(A3.luna){const an=A3.luna.anyN;A3.luna.anyN=function(c){return an.apply(this,arguments)+((CD(c)&&CD(c).stars2)||0)}}
};
/* ★v1.8 合成36組（design 26-6・ld 64）。決まり 10-21：材料の片方はその子の専用・r は材料にエピックがあれば E・強化は数だけ ×1.5・材料の役（帯・色・弓・星）を引きつぐ。
   名前は「（仮）＋design の仮の名前」・絵なし（シナリオ班・グラフィック班を待つ）。数は design の表の仮（LD が「はじめに1枚足したラン」で強いほうの材料とくらべる） */
A3.fuse36=()=>{
 const C6=["SORA","KAEDE","RIN","LUNA","KURO","MIO"];if(!C6.some(has)||typeof FUSE==="undefined")return;
 const pierce=f=>{const e=B.e,b=e.block;e.block=0;try{f()}finally{e.block+=b}};
 const N=()=>A3.notes,cvt=()=>RULE().cvt,inBand=()=>{const r=cvt();return!!(r&&B.cvtRpm>=r.lo&&B.cvtRpm<=r.hi)};
 const eAtkNext=()=>{try{const e=B.e,p=curPat(e),a=p[e.pi%p.length];return["atk","multi","prc"].includes(a[0])}catch(e){return false}};
 const tier=()=>({rook:1,bishop:2,knight:3,queen:4})[B.piece]||0;
 Object.assign(OPS,{
  fzNotesCap:(x,v,c,k,mx)=>x.attack(v+Math.min(mx,k*N().cnt(c))),
  fzBeatDown:(x,v)=>{const st=B.staff||[],keep=st.length>=3&&st.slice(-3).every(c=>c==="r");OPS.finAll(x,v,"r");if(keep){N().push("r");addLog("右の3つが赤：赤を1つ残した")}},
  fzTriad:(x,v)=>{const n0=N(),all3=["r","b","g"].every(c=>n0.cnt(c)>=1),f=n0.fin("g"),n=n0.take("g",99);if(!n){addLog("締め：使う音符がない");return}const d=Math.round(n*(v+f.add)*f.mul*(all3?1.5:1));if(all3)addLog("3色がそろっている：×1.5");pierce(()=>x.attack(d))},
  fzOnkaiPlus:(x,v)=>{const n0=N(),f=n0.fin("b"),n=n0.take("b",2);for(let i=0;i<n;i++)x.attack(Math.round((v+f.add)*f.mul));const c=B.fzColor||["r","b","g"].sort((a,b)=>n0.cnt(b)-n0.cnt(a))[0];B.fzColor=null;n0.push(c)},
  fzStayRed:(x,a)=>{if(B.playRed){B.rpm=Math.max(0,B.rpm-a);addLog(`レッドにとどまる（回転 −${a}）`)}},
  fzHitsRed:(x,v,n,nr)=>{const k=B.playRed?nr:n;for(let i=0;i<k;i++)x.attack(v)},
  fzLowHpStep:(x,v)=>{const m=G.hp<=G.maxhp/4?2:G.hp<=G.maxhp/2?1.5:1;x.attack(v*m)},
  fzBlkLow:(x,b)=>x.block(G.hp<=G.maxhp/2?b*2:b),
  fzFastAtk:(x,v,k)=>pierce(()=>x.attack(B.eAhead?v*k:v)),
  fzIntentAtk:(x,v,k)=>x.attack(eAtkNext()?v*k:v),
  fzRenya:(x,v)=>{const k=B.range>=2?3:2;for(let i=0;i<k;i++)x.attack(v)},
  fzRookIfNone:()=>{const R=A3.rin;if(!B.piece&&R){B.piece="rook";B.pieceT=R.turns("rook");B.wallUsed=0;addLog("駒がない：ルークを置いた");A3.se("rin_promote",{lv:1})}},
  fzTsume:(x,v)=>{const t=tier();if(!t){addLog("駒がない");return}if(["knight","queen"].includes(B.piece))B.curPierce=99;x.attack(v*t);B.curPierce=0},
  fzHoui:(x,v,k)=>{if(["bishop","queen"].includes(B.piece))B.curPierce=99;x.attack(v+k*(B.promoN||0));B.curPierce=0},
  fzMoonAge:(x,v)=>{const L=A3.luna,m=L.moon();x.attack(m===3?v+3*L.lit():m===1?v*2:v)},
  fzNewBlk:(x,b)=>{if(A3.luna&&A3.luna.moon()===0)x.block(b)},
  fzMoonPick:()=>{const L=A3.luna;if(!L)return;let n=B.moonPickV;B.moonPickV=null;if(n==null){const m=L.moon();n=(m===0||m===3)?-1:1}/* 自動：満月に近いほう */L.move(n)},
  fzBandHits:(x,v,n,nb)=>{const k=inBand()?nb:n;for(let i=0;i<k;i++)x.attack(v)},
  fzPurge1:()=>{const i=B.hand.findIndex(c=>CD(c).t==="jam");if(i>=0){B.hand.splice(i,1);addLog("ジャマを1枚消した")}},
  fzIntentBlk:(x,b)=>{if(eAtkNext())x.block(b)},
  fzBandTurns:(x,v,mx)=>x.attack(v*Math.min(mx,B.fzBandT||0)),
  fzBandBlk:(x,b)=>{if(inBand())x.block(b)},
  fzSwapCopy:x=>{const top=B.draw[B.draw.length-1];OPS.kSwap(x);if(top&&B.hand.includes(top)&&B.hand.length<RULES.handMax){const c=inst(top.id);c.up=top.up;c.tmp=1;B.hand.push(c);addLog(`「${CD(top).n}」の写しを手札に（打つと消える）`)}},
  fzGlAtk:(x,k)=>x.attack((B.gl||0)*k),
 });
 const F=(id,a,b,own,r,t,o)=>({id,a,b,card:Object.assign({fused:1,r,own,t,mo:t==="atk"?(r==="E"?"atk_finisher":"atk_heavy"):t==="grd"?"guard":t==="drw"?"draw":"rev"},o,{n:"（仮）"+o.n})});
 const L=[
  // SORA
  F("f_s_rendahaku","s_kizami","s_hyoushi","SORA","R","atk",{n:"連打拍",col:"r",band:"M",c:1500,gas:1,v:5,vu:8,fx:[["fzNotesCap","v","r",2,8]],d:"{v} ダメージ。並んでいる赤1つにつき +2（最大 +8）。"}),
  F("f_s_beatdown","s_dropbeat","s_tanbou","SORA","E","atk",{n:"ビートダウン",col:"r",fin:1,c:3000,gas:2,v:8,vu:12,fx:[["fzBeatDown","v"]],d:"赤の締め：赤の数 ×{v}。右の3つが赤なら、赤を1つ残す。"}),
  F("f_s_sanwaon","s_waon","s_sansetsu","SORA","E","atk",{n:"三和音",col:"g",fin:1,c:2000,gas:2,v:5,vu:8,fx:[["fzTriad","v"]],d:"緑の締め：緑の数 ×{v}・貫通。3色が1つずつ以上あれば ×1.5。"}),
  F("f_s_sokkyouonkai","s_onkai","s_sokkyou","SORA","R","atk",{n:"即興音階",col:"b",fin:1,c:1500,gas:1,v:6,vu:9,fx:[["fzOnkaiPlus","v"]],d:"青を2つ使う：{v} ダメージを2回。そのあと好きな色の音符を1つ。"}),
  F("f_s_longtone","s_yoin","s_headphone","SORA","R","grd",{n:"ロングトーン",col:"g",c:1500,gas:1,v:6,vu:9,fx:[["blkNotes","v","g",1]],d:"防御 {v}＋緑の音符の数。音符は消さない。",num:"blk"}),
  F("f_s_echochamber","s_hankyou","s_metronome","SORA","R","grd",{n:"エコーチェンバー",col:"w",c:1500,gas:1,v:5,vu:8,fx:[["blk","v"],["fzFinBlk",3]],d:"防御 {v}。この戦闘、締めのたびに防御 3。",num:"blk"}),
  // KAEDE
  F("f_k_souhatsu","k_benigiri","k_twinturbo","KAEDE","R","atk",{n:"双発斬り",band:"M",c:1000,gas:2,v:10,vu:15,fx:[["atk","v"],["fzStayRed",1000]],d:"{v} ダメージ。レッドゾーンなら回転は上がらない（レッドにとどまる）。"}),
  F("f_k_kurenzenkai","k_momijiarashi","k_fullboost","KAEDE","E","atk",{n:"紅嵐全開",c:1000,gas:2,v:6,vu:9,fx:[["fzHitsRed","v",4,5]],d:"{v} ダメージを4回。レッドゾーンなら5回。"}),
  F("f_k_haisuinohi","k_shoubu","k_hinoko","KAEDE","E","atk",{n:"背水の火",c:2500,gas:2,v:18,vu:27,fx:[["fzLowHpStep","v"]],d:"{v} ダメージ。耐久が半分以下なら ×1.5、4分の1以下なら ×2。"}),
  F("f_k_fumitodomari","k_ichigeki","k_fullbucket","KAEDE","R","atk",{n:"踏みとどまり",band:"L",c:3000,gas:2,v:14,vu:21,fx:[["atk","v"],["fzBlkLow",6]],d:"{v} ダメージ・防御 6。耐久が半分以下なら防御 ×2。"}),
  F("f_k_sotokaraissen","k_sotosen","k_overtake","KAEDE","R","atk",{n:"外から一閃",band:"M",c:2000,gas:1,v:12,vu:18,fx:[["fzFastAtk","v",1.5],["draw",1]],d:"{v} ダメージ・貫通。敵のほうが速い番なら ×1.5。1枚引く。"}),
  F("f_k_ookami","k_rouga","k_oofuri","KAEDE","R","atk",{n:"狼の大振り",band:"R",c:2000,gas:2,v:16,vu:24,fx:[["fzIntentAtk","v",1.3]],d:"{v} ダメージ。敵の予告が攻撃なら ×1.3。"}),
  // RIN
  F("f_r_tooya","r_kinya","r_nuidome","RIN","R","atk",{n:"遠矢",bow:1,band:"M",c:1500,gas:1,v:7,vu:11,fx:[["atk","v"],["range",1]],d:"弓・{v} ダメージ。間合い +1。"}),
  F("f_r_kuronekorenya","r_kuroneko","r_renya","RIN","R","atk",{n:"黒猫の連矢",bow:1,c:1500,gas:1,v:4,vu:6,fx:[["fzRenya","v"]],d:"弓・{v} ダメージを2回。間合い 2 以上なら3回。"}),
  F("f_r_shironotsuru","r_castling","r_itomaki","RIN","R","grd",{n:"城の弦",band:"L",c:1000,gas:1,v:6,vu:9,fx:[["blk","v"],["fzRookIfNone"],["nextBow",5]],d:"防御 {v}。駒がなければルークを置く。次の弓 +5。",num:"blk"}),
  F("f_r_itteseki","r_sutegoma","r_yomisuji","RIN","R","rev",{n:"一手先",sup:1,c:0,gas:0,v:1,vu:1,fx:[["sutegoma"],["yomisuji",0]],d:"手札を1枚捨てる（打った枚数に数える）。敵の次の2手が見える。"}),
  F("f_r_tsumenoissi","r_checkmate","r_check","RIN","E","atk",{n:"詰めの一矢",bow:1,c:3000,gas:2,v:8,vu:12,fx:[["fzTsume","v"]],d:"弓・{v} × 駒の段 ダメージ。ナイトかクイーンなら防御をこえる。"}),
  F("f_r_houimou","r_houi","r_fukuhei","RIN","E","atk",{n:"包囲網",bow:1,c:2500,gas:2,v:6,vu:9,fx:[["fzHoui","v",4]],d:"弓・{v}＋昇格の回数 ×4 ダメージ。ビショップかクイーンなら防御を全部こえる。"}),
  // LUNA
  F("f_l_reiuchi","l_mangetsu","l_mikazuki","LUNA","E","atk",{n:"月齢打ち",star:6,c:2500,gas:2,v:8,vu:12,fx:[["fzMoonAge","v"]],d:"{v} ダメージ。満月なら灯っている星 ×3 を足す。三日月なら ×2。"}),
  F("f_l_sakunokasa","l_shingetsu","l_tsukigasa","LUNA","R","grd",{n:"朔の暈",star:8,band:"L",c:1000,gas:1,v:7,vu:11,fx:[["blk","v"],["newMoonStars",2],["fzNewBlk",3]],d:"防御 {v}。新月なら好きなマスに星を2つ・防御 +3。",num:"blk"}),
  F("f_l_hoshinochizu","l_seizu","l_hoshikuzu","LUNA","R","atk",{n:"星の地図",star:"any",band:"M",c:1500,gas:1,v:5,vu:8,fx:[["atk","v"],["draw",1]],d:"好きなマスに星を1つ。{v} ダメージ・1枚引く。"}),
  F("f_l_suiseinosen","l_suisei","l_suiheisen","LUNA","R","atk",{n:"彗星の線",star:"diag",band:"M",c:2000,gas:1,v:5,vu:8,fx:[["atkRow","v",8]],d:"{v} ダメージ。ななめに星を2つ。横のまん中の線がそろっていれば +8。"}),
  F("f_l_ryuuseinoyoru","l_ryuuseigun","l_myoujou","LUNA","E","atk",{n:"流星の夜",star:3,c:3000,gas:2,v:4,vu:6,fx:[["ryuuseigun","v"],["nextTurnDraw",1]],d:"灯っている星の数 ×{v} ダメージ（星は消えない）。満月なら2倍。次の番のはじめに1枚引く。"}),
  F("f_l_tennofuriko","l_tenkyuu","l_yurimodoshi","LUNA","R","rev",{n:"天の振り子",sup:1,c:0,gas:1,v:5,vu:8,fx:[["fzMoonPick"],["blk","v"]],d:"月を1つ進めるか、1つもどす（えらぶ・1ターン1回）。防御 {v}。"}),
  // MIO
  F("f_mi_saitekiobi","mi_saitekikai","mi_obiuchi","MIO","R","atk",{n:"最適帯打ち",c:1500,gas:1,v:10,vu:15,fx:[["atkCenter","v"]],d:"{v} ダメージ。回転が帯の芯なら ×1.5。"}),
  F("f_mi_zenkaienzan","mi_enzan","mi_rironjou","MIO","E","atk",{n:"全開演算",c:1000,gas:2,v:5,vu:8,fx:[["fzBandHits","v",4,5],["draw",1]],d:"{v} ダメージを4回。帯の中なら5回。1枚引く。"}),
  F("f_mi_kaisekidebug","mi_kaiseki","mi_debug","MIO","R","drw",{n:"解析デバッグ",c:500,gas:0,v:1,vu:2,fx:[["draw","v"],["fzPurge1"]],d:"{v} 枚引く。ジャマを1枚消す。"}),
  F("f_mi_souteinai","mi_souteigai","mi_rokkaku","MIO","R","grd",{n:"想定内",c:1000,gas:1,v:8,vu:12,fx:[["blk","v"],["fzIntentBlk",4]],d:"防御 {v}。敵の予告が攻撃なら防御 +4。",num:"blk"}),
  F("f_mi_naminokaigan","mi_kaigansen","mi_namiuchi","MIO","R","atk",{n:"波の海岸線",c:1000,gas:1,v:6,vu:9,fx:[["fzBandTurns","v",5]],d:"{v} × この戦闘で帯の中で打った番の数（最大 5番分）ダメージ。"}),
  F("f_mi_sangoshiokaze","mi_shiokaze","mi_sango","MIO","R","grd",{n:"珊瑚の潮風",c:500,gas:0,v:6,vu:9,fx:[["blk","v"],["fzBandBlk",3]],d:"防御 {v}。帯の中なら防御 +3。",num:"blk"}),
  // KURO
  F("f_ku_odorukodou","ku_kodou","ku_dancing","KURO","R","atk",{n:"踊る鼓動",c:0,gas:1,hr:30,v:10,vu:8,fx:[["kBeat","v"],["kGl",2]],d:"心拍 ÷{v} のダメージ・グリッチ +2。"}),
  F("f_ku_kokyuushi","ku_shoukei","ku_ikitsugi","KURO","R","atk",{n:"小休止",c:0,gas:0,hr:-30,hru:-40,v:6,vu:9,fx:[["atk","v"]],d:"{v} ダメージ・心拍 −30（強化 −40）。"}),
  F("f_ku_nimaijita","ku_doukefuda","ku_kakushifuda","KURO","R","drw",{n:"二枚舌",c:0,gas:1,hr:15,v:1,vu:1,fx:[["fzSwapCopy"]],d:"手札1枚と山札の上1枚をすりかえる。すりかえたカードの写しも1枚（打つと消える）。"}),
  F("f_ku_uranokarafuri","ku_uragaeshi","ku_karaburi","KURO","R","rev",{n:"裏の空振り",sup:1,c:0,gas:1,hr:0,v:1,vu:1,fx:[["kFeint"],["kFlip"]],d:"敵の次の攻撃を、もう1つの攻撃とすりかえる。次の1枚の心拍は下がる。"}),
  F("f_ku_akaikusariwana","ku_akaikusari","ku_kusariwana","KURO","R","atk",{n:"赤い鎖罠",c:0,gas:1,hr:15,glNeed:3,v:3,vu:4,fx:[["fzGlAtk","v"],["kChain",2]],d:"グリッチ 3 以上で打てる。グリッチ ×{v} ダメージ・次のアタック +グリッチ ×2。"}),
  F("f_ku_nukemichikoumori","ku_nukemichi","ku_koumori","KURO","R","atk",{n:"抜け道の蝙蝠",c:0,gas:1,hr:15,v:4,vu:6,fx:[["atk","v"],["kGl",1],["kExile",3]],d:"{v} ダメージ・グリッチ +1。山札の上3枚を消す（アタックは山札の下へ）。"}),
 ];
 L.forEach(({id,a,b,card})=>{if(!has(card.own)||!CARDS[a]||!CARDS[b])return;CARDS[id]=card;if(!FUSE.some(f=>f.id===id))FUSE.push({a,b,id})});
 // ★v1.9 文（text-add v0.22.70 46章）：名前・読み・説明・長押し
 Object.entries({"f_s_rendahaku": {"n": "連打拍", "d": "赤・{v} ダメージ。並んだ赤1つにつき +2（8 まで）。", "yomi": "れんだはく"}, "f_s_beatdown": {"n": "ビートダウン", "d": "赤の締め：赤の数 ×{v}。右の3つが赤なら、使った赤を1つ残す。"}, "f_s_sanwaon": {"n": "三和音", "d": "緑の締め：緑の数 ×{v}・貫通。3色が1つずつ以上あれば ×1.5。", "yomi": "さんわおん"}, "f_s_sokkyouonkai": {"n": "即興音階", "d": "青・青を2つ使う：{v} ダメージ ×2。そのあと好きな色の音符を1つ。", "yomi": "そっきょうおんかい"}, "f_s_longtone": {"n": "ロングトーン", "d": "緑・防御 {v}＋緑の数。音符は消さない。"}, "f_s_echochamber": {"n": "エコーチェンバー", "d": "白・防御 {v}。この戦闘、締めのたびに防御 3。"}, "f_k_souhatsu": {"n": "双発斬り", "d": "{v} ダメージ。レッドなら回転は上がらない（レッドにとどまる）。", "yomi": "そうはつぎり"}, "f_k_kurenzenkai": {"n": "紅嵐全開", "d": "{v} ダメージを4回。レッドなら5回。", "yomi": "こうらんぜんかい"}, "f_k_haisuinohi": {"n": "背水の火", "d": "{v} ダメージ。耐久が半分以下なら ×1.5、4分の1以下なら ×2。", "yomi": "はいすいのひ"}, "f_k_fumitodomari": {"n": "踏みとどまり", "d": "{v} ダメージ・防御 6。耐久が半分以下なら、防御 ×2。", "yomi": "ふみとどまり"}, "f_k_sotokaraissen": {"n": "外から一閃", "d": "{v} ダメージ・貫通。敵のほうが速い番なら ×1.5。1枚引く。", "yomi": "そとからいっせん", "lp": "敵のほうが速い番＝番と番のあいだに敵が2回以上動いた、または最初の番に敵が先に動いた。"}, "f_k_ookami": {"n": "狼の大振り", "d": "{v} ダメージ。敵の予告が攻撃なら ×1.3。", "yomi": "おおかみのおおぶり"}, "f_r_tooya": {"n": "遠矢", "d": "弓・{v} ダメージ・間合い +1（「2枚まで」に数える）。", "yomi": "とおや"}, "f_r_kuronekorenya": {"n": "黒猫の連矢", "d": "弓・{v} ダメージを2回。間合い 2 以上なら3回。", "yomi": "くろねこのれんや"}, "f_r_shironotsuru": {"n": "城の弦", "d": "防御 {v}。駒がなければルークを置く。次の弓 +5。", "yomi": "しろのげん"}, "f_r_itteseki": {"n": "一手先", "d": "手札を1枚捨てる（枚数に数える）。敵の次の2手が見える。", "yomi": "いってさき"}, "f_r_tsumenoissi": {"n": "詰めの一矢", "d": "弓・{v} ×駒の段。ナイトかクイーンなら防御をこえる。", "yomi": "つめのいっし"}, "f_r_houimou": {"n": "包囲網", "d": "弓・{v}＋昇格の回数 ×4。ビショップかクイーンなら防御を全部こえる。", "yomi": "ほういもう"}, "f_l_reiuchi": {"n": "月齢打ち", "d": "{v} ダメージ。満月なら灯った星 ×3、三日月なら ×2 を足す。", "yomi": "げつれいうち"}, "f_l_sakunokasa": {"n": "朔の暈", "d": "防御 {v}。新月なら、好きなマスに星を2つ・防御 +3。", "yomi": "さくのかさ"}, "f_l_hoshinochizu": {"n": "星の地図", "d": "好きなマスに星を1つ・{v} ダメージ・1枚引く。", "yomi": "ほしのちず"}, "f_l_suiseinosen": {"n": "彗星の線", "d": "{v} ダメージ。ななめに星を2つ灯す。横の線がそろえば +8。", "yomi": "すいせいのせん"}, "f_l_ryuuseinoyoru": {"n": "流星の夜", "d": "灯った星 ×{v}（星は消えない）。満月なら ×2。次の番の初めに1枚引く。", "yomi": "りゅうせいのよる"}, "f_l_tennofuriko": {"n": "天の振り子", "d": "月を1つ進めるか、もどす（1ターン1回）・防御 {v}。", "yomi": "てんのふりこ"}, "f_mi_saitekiobi": {"n": "最適帯打ち", "d": "{v} ダメージ。回転が帯の芯なら ×1.5。", "yomi": "さいてきおびうち"}, "f_mi_zenkaienzan": {"n": "全開演算", "d": "{v} ダメージを4回。帯の中なら5回。1枚引く。", "yomi": "ぜんかいえんざん"}, "f_mi_kaisekidebug": {"n": "解析デバッグ", "d": "1枚引く・ジャマを1枚消す。", "yomi": "かいせきデバッグ"}, "f_mi_souteinai": {"n": "想定内", "d": "防御 {v}。敵の予告が攻撃なら、防御 +4。", "yomi": "そうていない"}, "f_mi_naminokaigan": {"n": "波の海岸線", "d": "{v} ダメージ ×この戦闘で帯の中で打った番の数（5番まで）。", "yomi": "なみのかいがんせん"}, "f_mi_sangoshiokaze": {"n": "珊瑚の潮風", "d": "防御 {v}。帯の中なら、防御 +3。", "yomi": "さんごのしおかぜ"}, "f_ku_odorukodou": {"n": "踊る鼓動", "d": "（心拍 ÷{v}）ダメージ・グリッチ +2。", "yomi": "おどるこどう"}, "f_ku_kokyuushi": {"n": "小休止", "d": "{v} ダメージ・心拍 −30（強化 −40）。", "yomi": "しょうきゅうし"}, "f_ku_nimaijita": {"n": "二枚舌", "d": "山札の上1枚を見て、手札1枚とすりかえ。その写しを1枚（打つと消える）。", "yomi": "にまいじた"}, "f_ku_uranokarafuri": {"n": "裏の空振り", "d": "敵の次の行動を、もう1つの攻撃にすりかえ。次の1枚は心拍が下がる。", "yomi": "うらのからぶり", "lp": "防御には、すりかえない。"}, "f_ku_akaikusariwana": {"n": "赤い鎖罠", "d": "グリッチ 3 以上で打てる。グリッチ ×{v} ダメージ・次のアタック +グリッチ ×2。", "yomi": "あかいくさりわな"}, "f_ku_nukemichikoumori": {"n": "抜け道の蝙蝠", "d": "{v} ダメージ・グリッチ +1。山札の上3枚のアタックでない札を抹消。", "yomi": "ぬけみちのこうもり", "lp": "アタックは抹消しない。山札のいちばん下へもどす。"}}).forEach(([id,o])=>{if(CARDS[id])Object.assign(CARDS[id],o)});
 A3.FUSE36=L.map(x=>x.id).filter(id=>CARDS[id]);
 if(A3._fzHooked)return;A3._fzHooked=1;
 OPS.fzFinBlk=OPS.fzFinBlk||((x,b)=>{B.fzFinBlk=(B.fzFinBlk||0)+b;addLog(`この戦闘、締めのたびに防御 ${B.fzFinBlk}`)});
 H0("after",x=>{try{if(B.fzFinBlk&&x.d.fin){B.block+=B.fzFinBlk;addLog(`エコーチェンバー：防御 +${B.fzFinBlk}`);ev({k:"pblk",v:B.fzFinBlk})}
}catch(e){}});
 H0("before",x=>{try{if(A3.isChar("MIO")&&inBand()&&B.fzBandMark!==B.pTurns){B.fzBandMark=B.pTurns;B.fzBandT=(B.fzBandT||0)+1}}catch(e){}});/* 打つ前に数える＝この番もふくむ（MIO の before で cvtRpm が入ったあと） */
 // 選ぶ画面：二枚舌＝道化札と同じ・天の振り子＝進める／もどす
 A3.pickAlias=Object.assign(A3.pickAlias||{},{f_ku_nimaijita:"ku_doukefuda",f_ku_uranokarafuri:"ku_karaburi"});
 if(typeof doPlay==="function"&&typeof document!=="undefined"){const dp=doPlay;doPlay=function(i,shift,ok){try{const c=B&&B.hand[i];if(c&&c.id==="f_s_sokkyouonkai"&&A3.human()&&!S.fzPicked&&preview(c).ok&&A3.kuroModal){const nm={r:"赤",b:"青",g:"緑"};
     A3.kuroModal({ttl:"使ったあとに足す音符の色をえらぶ",opts:["r","b","g"].map(k=>({v:k,h:`<div class="kpi"><b>${nm[k]}</b></div>`}))},v=>{B.fzColor=v;S.fzPicked=true;try{doPlay(i,shift,ok)}finally{S.fzPicked=false}});return}
    if(c&&c.id==="f_l_tennofuriko"&&A3.human()&&!S.fzPicked&&preview(c).ok&&A3.kuroModal&&!A3.turnVal("moonMv")){const L=A3.luna;
     A3.kuroModal({ttl:"月を動かす",opts:[{v:1,h:`<div class="kpi">進める<br><b>${esc(L.name((L.moon()+1)%4))}</b></div>`},{v:-1,h:`<div class="kpi">もどす<br><b>${esc(L.name((L.moon()+3)%4))}</b></div>`}]},v=>{B.moonPickV=v;S.fzPicked=true;try{doPlay(i,shift,ok)}finally{S.fzPicked=false}});return}}catch(e){}return dp.apply(this,arguments)}}
};
/* ★v1.8 ディグのカード12枚（design 26-6・ld 65）：フルオートでだけ見つかる（dig:1・出方は②の farm.js）。見つけたあとは自分で走るでも使える。名前は仮・絵なし */
A3.dig12=()=>{
 const C6=["SORA","KAEDE","RIN","LUNA","KURO","MIO"];if(!C6.some(has))return;
 const cvt=()=>RULE().cvt;
 Object.assign(OPS,{
  dgReverse:()=>{if(!B.staff||B.staff.length<2){addLog("逆再生：音符が足りない");return}B.staff.reverse();A3.notes.ui&&A3.notes.ui();addLog("五線の並びを逆にした")},
  dgHum:(x,v)=>{const N=A3.notes,big=["r","b","g"].sort((a,b)=>N.cnt(b)-N.cnt(a))[0],n=N.cnt(big);if(!n){addLog("ハミング：音符がない");return}const f=N.fin(big),k=v;addLog(`ハミング：${({r:"赤",b:"青",g:"緑"})[big]}の締めを半分で`);
    if(big==="r")x.attack(Math.round(n*(8+f.add)*f.mul*k));else if(big==="b"){const h=Math.min(2,n);for(let i=0;i<h;i++)x.attack(Math.round((6+f.add)*f.mul*k))}else{const e=B.e,b=e.block;e.block=0;try{x.attack(Math.round(n*(5+f.add)*f.mul*k))}finally{e.block+=b}}},
  dgNoBlow:()=>{if(B.dgNoBlowUsed){addLog("空ぶかし：この戦闘はもう使った");return}B.dgNoBlowUsed=1;A3.turnVal("dgNoBlow",1);addLog("この番、ブローしない")},
  dgOverrev:(x,v,k)=>x.attack(v+k*(B.dgOrN||0)),
  dgOffBoard:(x,a)=>{if(!B.piece){addLog("盤の外：駒がない");return}B.piece=null;B.pieceT=0;A3.turnVal("dgBow",a);addLog(`駒を外した：この番、弓のアタック +${a}`)},
  dgFar:(x,a)=>{if(B.range>=3){B.dgEDown=(B.dgEDown||0)+a;addLog(`次の敵の攻撃 −${a}`)}},
  dgEclipse:()=>{A3.turnVal("dgEclipse",1);addLog("月食：この番、月の倍率が反対に")},
  dgStarMove:()=>{const s=B.sky;if(!s||!s.some(Boolean)){addLog("星がない");return}let j=-1;for(let i=8;i>=0;i--)if(s[i]){j=i;break}s[j]=0;addLog(`星：マス ${j+1} を動かす`);A3.luna.star("any")},
  dgGears:()=>{A3.turnVal("dgGears",1);addLog("段あり：この番、帯の芯で打つと倍率 +0.3")},
  dgLogger:(x,b)=>{B.dgLog=(B.dgLog||0)+b;addLog(`この戦闘、帯の中で番を終えるたびに防御 ${B.dgLog}`)},
  dgFlat:()=>{A3.turnVal("dgFlat",1);addLog("この番のアタックは心拍の帯 ×1.0")},
  dgBug:()=>{let wi=-1;const pk=B.kPick;B.kPick=null;if(pk!=null)wi=B.hand.findIndex(c=>c.uid===pk);if(wi<0){let ws=1e9;B.hand.forEach((c,i)=>{const d=CD(c);if(d.r==="SK"||c.tmp)return;const s=(d.v||0)+(d.r==="E"?50:d.r==="R"?10:0);if(s<ws){ws=s;wi=i}})}if(wi<0){addLog("バグった札：変えるカードがない");return}
    const o=B.hand[wi],c=inst("ku_dig_bugged");c.tmp=1;B.hand[wi]=c;addLog(`「${CD(o).n}」が「グリッチ +2」のカードに`)},
 });
 const D=(id,own,t,o)=>Object.assign({dig:1,r:"R",own,t,mo:t==="atk"?"atk_light":t==="grd"?"guard":"rev"},o,{n:"（仮）"+o.n});
 const L={
  s_dig1:D("s_dig1","SORA","rev",{n:"逆再生",col:"w",sup:1,c:0,gas:1,v:1,vu:1,fx:[["dgReverse"]],d:"五線の音符の並びを逆にする。"}),
  s_dig2:D("s_dig2","SORA","rev",{n:"ハミング",col:"x",sup:1,c:0,gas:1,v:0.5,vu:0.7,fx:[["revDown",500],["dgHum","v"]],d:"回転 −500。音符を消さずに、いちばん多い色の締めを ×{v} で鳴らす。"}),
  k_dig1:D("k_dig1","KAEDE","rev",{n:"空ぶかし",sup:1,c:0,gas:0,v:2000,vu:2000,fx:[["revUpCap","v"],["dgNoBlow"]],d:"回転 +{v}。この番、ブローしない（1戦1回）。"}),
  k_dig2:D("k_dig2","KAEDE","atk",{n:"赤い落ち葉",c:1000,gas:1,v:6,vu:9,fx:[["dgOverrev","v",4]],d:"{v} ダメージ＋この戦闘でオーバーレブした回数 ×4。"}),
  r_dig1:D("r_dig1","RIN","rev",{n:"盤の外",sup:1,c:0,gas:0,v:6,vu:9,fx:[["dgOffBoard","v"]],d:"駒を外す（駒なし）。この番、弓のアタック +{v}。"}),
  r_dig2:D("r_dig2","RIN","atk",{n:"遠鳴り",bow:1,c:500,gas:1,v:3,vu:5,fx:[["atk","v"],["dgFar",5]],d:"弓・{v} ダメージ。間合い 3 なら、次の敵の攻撃 −5。"}),
  l_dig1:D("l_dig1","LUNA","rev",{n:"月食",sup:1,c:0,gas:0,v:1,vu:1,fx:[["dgEclipse"]],d:"この番だけ、月の倍率を反対に（新月 ×1.5・満月 ×0.8）。"}),
  l_dig2:D("l_dig2","LUNA","rev",{n:"星の入れかえ",sup:1,c:0,gas:0,v:3,vu:5,stars2:1,fx:[["dgStarMove"],["blk","v"]],d:"灯っている星を1つ、好きなマスへ動かす。防御 {v}。"}),
  mi_dig1:D("mi_dig1","MIO","rev",{n:"段あり",sup:1,c:0,gas:0,v:0.3,vu:0.3,fx:[["dgGears"]],d:"この番だけ、シフトの段がある（帯の芯で打つと倍率 +{v}）。"}),
  mi_dig2:D("mi_dig2","MIO","rev",{n:"試作ロガー",sup:1,c:0,gas:1,v:2,vu:3,fx:[["dgLogger","v"]],d:"この戦闘、帯の中で番を終えるたびに防御 {v}。"}),
  ku_dig1:D("ku_dig1","KURO","rev",{n:"逆漕ぎ",sup:1,c:0,gas:0,hr:-50,v:1,vu:1,fx:[["dgFlat"]],d:"心拍 −50。この番のアタックは心拍の帯 ×1.0。"}),
  ku_dig2:D("ku_dig2","KURO","rev",{n:"バグった札",sup:1,c:0,gas:0,hr:10,v:2,vu:2,fx:[["dgBug"]],d:"手札1枚を「グリッチ +2」のカードに変える（打つと消える）。"}),
 };
 L.ku_dig_bugged={r:"C",mo:"rev",own:"KURO",n:"グリッチ +2",t:"rev",gen:1,exile:1,sup:1,c:0,gas:0,hr:0,v:2,vu:2,fx:[["kGl","v"]],d:"グリッチ +{v}（打つと消える）。"};
 // ★v1.9 文（text-add v0.22.70 47章・段ありは design 26-8）
 Object.entries({"s_dig1": {"n": "逆再生", "d": "白・五線の音符の並びを、逆にする。", "flav": "うしろから聞くと、ちがう曲に聞こえる。", "yomi": "ぎゃくさいせい", "lp": "上りをそろえたいときに。"}, "s_dig2": {"n": "ハミング", "d": "白・回転 −500。音符を消さずに、いちばん多い色の締めの得を半分。", "flav": "口ずさむだけでも、曲は、ちゃんと鳴る。", "lp": "音符は残る。締めの得だけ、半分ぶん鳴る。"}, "k_dig1": {"n": "空ぶかし", "d": "回転 +2000・ガソリン 0。この番、ブローしない（1戦1回）。", "flav": "止まったまま、針だけ、赤へ。", "yomi": "からぶかし", "lp": "この番、レッドをこえてもブローしない。1戦に1回。"}, "k_dig2": {"n": "赤い落ち葉", "d": "{v} ダメージ＋この戦闘でオーバーレブした回数 ×4。", "flav": "燃えつきた葉ほど、あかく、重く落ちる。", "yomi": "あかいおちば"}, "r_dig1": {"n": "盤の外", "d": "駒を外す。この番、弓のアタック +{v}。", "flav": "駒を捨てるのも、作戦のうちよ。", "yomi": "ばんのそと", "lp": "駒はなくなる。"}, "r_dig2": {"n": "遠鳴り", "d": "弓・{v} ダメージ。間合い 3 なら、次の敵の攻撃 −5。", "flav": "遠くで鳴った弦の音が、相手の足を止める。", "yomi": "とおなり"}, "l_dig1": {"n": "月食", "d": "この番だけ、月の倍率が反対に（新月 ×1.5・満月 ×0.8）。", "flav": "満ちた月が、いちばん暗くなる夜。", "yomi": "げっしょく"}, "l_dig2": {"n": "星の入れかえ", "d": "灯った星を1つ、好きなマスへ動かす・防御 {v}。", "flav": "……この星は、こっちのほうが、きれい。", "yomi": "ほしのいれかえ"}, "mi_dig1": {"n": "段あり", "d": "この番だけ、帯の芯で打つと倍率 +0.3。", "flav": "段のない帯に、一段だけ、手で刻む。", "yomi": "だんあり"}, "mi_dig2": {"n": "試作ロガー", "d": "この戦闘、帯の中で番を終えるたびに防御 {v}。", "flav": "最初に作った、小さな記録の箱。", "yomi": "しさくロガー"}, "ku_dig1": {"n": "逆漕ぎ", "d": "心拍 −50。この番のアタックは、心拍の帯 ×1.0。", "flav": "くひひっ♪ うしろに漕いでも、進むんだよ。", "yomi": "さかこぎ"}, "ku_dig2": {"n": "バグった札", "d": "手札1枚を「グリッチ +2」の札に変える（打つと消える）。", "flav": "あれれ？このカード、こわれちゃった♪", "yomi": "バグったふだ"}}).forEach(([id,o])=>{if(L[id])Object.assign(L[id],o)});
 Object.keys(L).forEach(id=>{if(!has(L[id].own))delete L[id]});Object.assign(CARDS,L);
 try{if(window.DIG_CARDS)C6.forEach(ch=>{const ids=Object.keys(L).filter(id=>L[id].dig&&L[id].own===ch);if(ids.length)DIG_CARDS[ch]=[...new Set([...(DIG_CARDS[ch]||[]),...ids])]})}catch(e){}
 if(A3._dgHooked)return;A3._dgHooked=1;
 if(typeof noBlow==="function"){const nb=noBlow;noBlow=function(){return nb.apply(this,arguments)||!!(B&&A3.turnVal("dgNoBlow"))}}
 if(typeof overRev==="function"){const ov=overRev;overRev=function(){if(B)B.dgOrN=(B.dgOrN||0)+1;return ov.apply(this,arguments)}}
 if(typeof eAtk==="function"){const ea=eAtk;eAtk=function(e,v){const r=ea.apply(this,arguments);return B&&B.dgEDown?Math.max(0,r-B.dgEDown):r}}
 {const es=enemyStep;enemyStep=function(){const r=es.apply(this,arguments);if(B)B.dgEDown=0;return r}}
 H0("attack",(v,m)=>{try{if(B.curBow&&A3.turnVal("dgBow"))v+=A3.turnVal("dgBow")/(m||1);
   if(A3.turnVal("dgGears")&&A3.isChar("MIO")){const r=cvt(),y=B.cvtRpm;if(r&&y>=r.clo&&y<=r.chi)v*=1+0.3/Math.max(1,m||1)}}catch(e){}return v});
 if(A3.luna){const mu=A3.luna.mul;A3.luna.mul=function(){if(B&&A3.turnVal("dgEclipse")){const p=A3.luna.moon();if(p===0)return 1.5;if(p===3)return 0.8}return mu.apply(this,arguments)}}
 if(A3.kuro){const hm=A3.kuro.hrMul;A3.kuro.hrMul=function(){if(B&&A3.turnVal("dgFlat"))return 1;return hm.apply(this,arguments)}}
 {const te=turnEnd;turnEnd=function(){try{if(B&&!B.over&&B.dgLog&&A3.isChar("MIO")){const r=cvt();if(r&&B.rpm>=r.lo&&B.rpm<=r.hi){B.block+=B.dgLog;addLog(`試作ロガー：防御 +${B.dgLog}`);ev({k:"pblk",v:B.dgLog})}}}catch(e){}return te.apply(this,arguments)}}
 A3.pickAlias=Object.assign(A3.pickAlias||{},{ku_dig2:"ku_kakushifuda"});A3.pickTtl=Object.assign(A3.pickTtl||{},{ku_dig2:"「グリッチ +2」に変える手札をえらぶ"});/* 題の字は写すのまま（文はシナリオ班のあとで） */
};
/* ★v2.0 スキルツリーの枝の決め直し（design 25-2・ld 67・4段目の数は仮＝LD が測る）。
   KURO：積む／引く／撃つ → 電脳（ku_t1）／道化（ku_t2）／鼓動（ku_t3）。枝の id と並びはそのまま（保存の lv は並びで持つので、今までの振り方は 積む＝電脳・引く＝道化・撃つ＝鼓動 に読みかわる・奥義の枝と同じ）。
   SORA：余韻の4段目を「五線が 10 まで」→「白の音符の防御」に（25-2：余韻＝白の音符の防御 +）。 */
A3.tree25=()=>{
 const T=typeof TREE!=="undefined"?TREE:null;if(!T)return;const K=A3.kuro,top=id=>A3.treeTopIs&&A3.treeTopIs(id);
 const W={ku_t1:{n:"電脳",d:"グリッチで守って刺す型",entry:["ku_akaikusari","ku_kusariwana"],cards:["ku_akaikusari","ku_kusariwana","ku_koumori","ku_nukemichi","ku_bagurase"],parts:["pacenote","hook","dashcam","ku_bat"],top:"グリッチの盾 +5・刃 +2（上限）",tip:"番の終わりのグリッチの盾の上限が 5、アタックに足す刃の上限が 2 多い。"},
  ku_t2:{n:"道化",d:"作戦を入れかえる型",entry:["ku_doukefuda","ku_uragaeshi"],cards:["ku_doukefuda","ku_kakushifuda","ku_uragaeshi","ku_karaburi","ku_drafting"],parts:["grip","cage","jack","ku_display"],top:"ドラフティングは3枚から・グリッチ・トリックの書きかえ +1",tip:"ドラフティングで見る山札が3枚になる。グリッチ・トリックで書きかえるルールが2つになる。"},
  ku_t3:{n:"鼓動",d:"心拍を上げて走る型",entry:["ku_kodou","ku_dancing"],cards:["ku_kodou","ku_dancing","ku_freewheel","ku_ikitsugi","ku_shoukei","ku_kurosystem"],parts:["turbo","nitro","limiter","ku_crank"],top:"心拍の帯の倍率 +0.2・すまし顔 +2",tip:"心拍の帯で倍率が上がっているとき、さらに +0.2。番の終わりのすまし顔の防御が 2 多い。"}};
 (T.KURO||[]).forEach(b=>{if(W[b.id])Object.assign(b,W[b.id])});
 (T.SORA||[]).forEach(b=>{if(b.id==="s_yoin")Object.assign(b,{top:"白の音符1つにつき、番の終わりに防御 +2（最大 6）",tip:"番の終わり、並んでいる白の音符1つにつき防御 +2（6 まで）。耐久の回復はそのまま。"})});
 A3.kuTree2=1;A3.soraTree2=1;
 if(A3._trHooked)return;A3._trHooked=1;
 if(K){const ga=K.glAtk,gb=K.glBlk,hm=K.hrMul,rb=K.restBlk;
  K.glAtk=function(g){if(!top("ku_t1"))return ga.apply(this,arguments);const r=RULE().glitchAtk;if(!r)return 0;return Math.min((r.max||5)+2,Math.floor((g||0)/(r.per||2))*(r.add||1))};
  K.glBlk=function(g){if(!top("ku_t1"))return gb.apply(this,arguments);const r=RULE().glitchBlk;if(!r)return 0;return Math.min((r.max||10)+5,Math.floor((g||0)/(r.per||1)))};
  K.hrMul=function(){const m=hm.apply(this,arguments);return top("ku_t3")&&m>1?m+0.2:m};
  K.restBlk=function(){const b=rb.apply(this,arguments);return top("ku_t3")&&b>0?b+2:b}}
 // 道化：ドラフティング3枚・書きかえ2つ
 {const kd=OPS.kDraft;OPS.kDraft=function(x){if(!(top("ku_t2")&&A3.isChar("KURO"))||B.draw.length<3)return kd.apply(this,arguments);const L=B.draw.length,t=[B.draw[L-1],B.draw[L-2],B.draw[L-3]];const sc=c=>{const d=CD(c);return(d.t==="atk"?2:1)*(d.v||0)+(d.r==="E"?20:0)};
   const pk=B.kPick;B.kPick=null;const take=t.find(c=>c.uid===pk)||t.slice().sort((a,b)=>sc(b)-sc(a))[0],oth=t.filter(c=>c!==take);oth.forEach(c=>{B.draw.splice(B.draw.indexOf(c),1);B.draw.unshift(c)});B.draw.splice(B.draw.indexOf(take),1);B.draw.push(take);drawN(1);addLog(`ドラフティング：「${CD(take).n}」を引き、「${oth.map(c=>CD(c).n).join("・")}」を下へ`)}}
 {const kt=OPS.kTrick;OPS.kTrick=function(x,v){const two=top("ku_t2")&&A3.isChar("KURO"),pk=B.kPicks;if(two&&pk&&pk.length)B.kPick=pk[0];const r=kt.apply(this,arguments);
   if(two){B.kRule=B.kRule||{};const rs=[["half","カードの心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチの上限 15"],["pick2","引くときはいつも2枚から選ぶ"]];const k2=(pk&&pk[1]&&!B.kRule[pk[1]]&&pk[1])||(rs.find(q=>!B.kRule[q[0]])||[])[0];
    if(k2){B.kRule[k2]=1;addLog(`道化：もう1つ「${rs.find(q=>q[0]===k2)[1]}」`)}}return r}}
 A3.pickPre=A3.pickPre||[];A3.pickPre.push(i=>{if(!top("ku_t2"))return undefined;const c=B.hand[i];if(!c)return undefined;const card=x=>cardSmall(x,{cost:0,gas:gasOf(x),gasNow:B.gas,attrs:'style="position:relative;display:inline-block"'});
   if(c.id==="ku_drafting"){const L=B.draw.length;if(L<3)return undefined;const t=[B.draw[L-1],B.draw[L-2],B.draw[L-3]];return{ttl:"山札の上3枚：手札にする1枚をえらぶ（ほかは山札の下へ）",opts:t.map(x=>({v:x.uid,h:card(x)}))}}
   if(c.id==="ku_glitch"){const rs=[["half","心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチ 15 まで"],["pick2","引くときは2枚から選ぶ"]],TX=TEXT.ui||{},done=B.kRule||{};const n=Math.min(2,rs.filter(r=>!done[r[0]]).length);if(n<2)return undefined;
     return{multi:2,ttl:"ルールを書きかえる（2つえらぶ・道化）",opts:rs.map(([k,nm],j)=>({v:k,dis:!!done[k],h:`<div class="kpi">${esc(TX["kuro_rule_"+(j+1)]||nm)}</div>`}))}}
   return undefined});
 // SORA 余韻：白の音符の防御
 {const te=turnEnd;turnEnd=function(){try{if(B&&G&&!B.over&&A3.isChar("SORA")&&top("s_yoin")&&B.staff){const w=Math.min(6,2*A3.notes.cnt("w"));if(w){B.block+=w;addLog(`余韻：白の音符で防御 +${w}`);ev({k:"pblk",v:w})}}}catch(e){}return te.apply(this,arguments)}}
};
A3.ougi18=()=>{
 const C6=["SORA","KAEDE","RIN","LUNA","KURO","MIO"];if(!C6.some(has))return;
 const T=(typeof TEXT!=="undefined"&&TEXT)||null,cap=(n,k)=>Math.min(k,Math.round(n));
 const pierce=f=>{const e=B.e,b=e.block;e.block=0;try{f()}finally{e.block+=b}};
 Object.assign(OPS,{
  // SORA
  ogKyouon:(x,v,k)=>{const st=B.staff||[],n=st.length;if(!n){addLog("蒼天連拍：音符がない");return}let run=1,best=1;for(let i=1;i<n;i++){run=(st[i]===st[i-1]||st[i]==="w"||st[i-1]==="w")?run+1:1;best=Math.max(best,run)}
   const d=cap(n*v*(best>=3?2:1),k);B.staff=[];A3.notes&&A3.notes.ui&&A3.notes.ui();addLog(`蒼天連拍：音符 ${n}${best>=3?"・同じ色 ×2":""}`);x.attack(d,true)},
  ogWaon:(x,v)=>{const st=B.staff||[],n=st.length,ty=new Set(st.filter(c=>c!=="w")).size,up=A3.notes&&A3.notes.pats().up;x.attack(ty*v+n*2);if(!up){B.staff=[];A3.notes&&A3.notes.ui&&A3.notes.ui()}else addLog("七色和声：上り＝音符を残した")},
  ogYoin:(x,v,k)=>{const st=B.staff||[],w=st.filter(c=>c==="w").length,b=cap(st.length*v+w*3,k);if(b>0){x.blockRaw(b);B.blkCarry=(B.blkCarry||0)+Math.floor(b/2);addLog(`残響天蓋：次の番に防御 ${Math.floor(b/2)} が残る`)}},
  // KAEDE
  ogGuren:(x,v)=>{const m=(B.rpm||0)>=7500?2:B.playRed?1.5:1;if(m>1)addLog(`焔紅葉：×${m}`);x.attack(v*m)},
  ogHaisui:(x,v)=>{const m=G.hp<=G.maxhp/4?3:G.hp<=G.maxhp/2?2:1;if(m>1)addLog(`背水紅刃：×${m}`);x.attack(v*m)},
  ogSotosen:(x,v)=>{const m=(A3.ogSotoTurn?B.eAhead:B.enemyActed)?2:1;pierce(()=>x.attack(v*m))},
  // RIN
  ogYumi:(x,v)=>{const r=B.range||0;pierce(()=>x.attack((r+1)*v));if(A3.rin)A3.rin.range(3-(B.range||0))},
  ogKoma:(x,v)=>{if(A3.rin){B.piece="queen";B.pieceT=A3.rin.turns("queen");addLog("金冠成駒：駒がクイーンに");A3.se("rin_promote",{lv:4})}x.attack(4*v)},
  ogKime:(x,v,k)=>{const d=cap((B.promoN||0)*v,k);if(!d){addLog("女王の詰み：まだ昇格していない");return}if(B.piece==="queen")pierce(()=>x.attack(d,true));else x.attack(d,true)},
  // LUNA
  ogTsuki:(x,v)=>{const L=A3.luna,p=L?L.moon():1;x.attack(p===3?v*2:v);if(p===0)x.block(v);if(!B.moonHold){B.moonHold=1;addLog("朔夜：月は次の番もこのまま")}},
  ogHoshi:(x,v)=>{const L=A3.luna;if(!B.sky)B.sky=Array(9).fill(0);let n=0,last=0;for(let c=1;c<=9;c++)if(!B.sky[c-1]){B.sky[c-1]=1;n++;last=c;A3.se("luna_star",{cell:c},c*60)}
   if(L){[[1,2,3],[4,5,6],[7,8,9],[1,4,7],[2,5,8],[3,6,9],[1,5,9],[3,5,7]].forEach((l,i)=>{B.skyLines[i]=1});[[2,7,9],[1,3,8]].forEach((t,i)=>{B.skyTris[i]=1})}/* 流れ星・三角は起こさない */
   addLog(`星詠み：星を ${n} つ灯した`);if(n)x.attack(n*v);if(L&&last)L.check(last)},
  ogYozora:(x,v,k)=>{const L=A3.luna,n=L?L.lit():0;x.attack(cap(n*v*(L&&L.moon()===3?2:1),k),true)},
  // KURO
  ogKodou:(x,v)=>{const K=A3.kuro,c=(K&&K.R().cap)||200;B.hr=Math.min(190,c);B.kOgDown=1;try{K&&K.heart(B.hr)}catch(e){}x.attack(v)},
  ogDouke:(x,v)=>{const rs=[["half","カードの心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチの上限 15"],["pick2","引くときはいつも2枚から選ぶ"]];B.kRule=B.kRule||{};let k=0;
   const pk=B.kPicks;const order=pk&&pk.length?rs.filter(r=>pk.includes(r[0])).concat(rs.filter(r=>!pk.includes(r[0]))):rs;/* ★v1.5 自分で選んだ札を先に */for(const r of order){if(k>=v)break;if(B.kRule[r[0]])continue;B.kRule[r[0]]=1;k++;addLog(`夜宴道化：この戦闘「${r[1]}」`)}A3.se("kuro_trick",{rule:Math.min(4,k||1)});ev({k:"onset"})},
  ogDenno:(x,v,k)=>{const g=B.gl||0;x.attack(cap(g*v,k),true);if(g)x.blockRaw(g*2)},
  // MIO
  ogSaiteki:(x,v)=>{const r=RULE().cvt,y=B.cvtRpm;x.attack(r&&y>=r.clo&&y<=r.chi?v*2:v)},
  ogKaiseki:(x,v)=>{let n=0;["hand","draw","disc"].forEach(k=>{const L=B[k];for(let i=L.length-1;i>=0;i--)if(CD(L[i]).t==="jam"){L.splice(i,1);n++}});if(B.e&&B.e.noise)B.e.noise=0;
   addLog(n?`翠眼解読：ジャマ・混線を ${n} 枚消した`:"翠眼解読：ジャマはなかった");x.block(v);if(OPS.yomisuji)OPS.yomisuji(x,2)},
  ogKaigan:(x,v,k)=>{x.attack(cap((B.mioBandN||0)*v,k),true);const r=RULE().cvt;if(r){B.rpm=Math.min(limit(),Math.round((r.clo+r.chi)/200)*100);addLog(`回転を ${B.rpm} に（帯の芯）`);ev({k:"revdown",v:0})}},
 });
 const O=(id,own,og,n,t,c,v,vu,fx,d,o)=>Object.assign({r:"OG",mo:t==="atk"?"atk_finisher":"guard",own,og,n,t,c,gas:2,v,vu,exile:1,fx,d},o||{});
 const N={
  s_og_kyouon:O("s_og_kyouon","SORA","ougi_sora_kyouon","蒼天連拍","atk",2000,4,6,[["ogKyouon","v","k"]],"音符をすべて使い、使った音符の数 ×{v} ダメージ。同じ色が3つ以上つづいていれば ×2（最大 {k}・倍率なし）。",{k:64,ku:96}),
  s_og_waon:O("s_og_waon","SORA","ougi_sora_waon","七色和声","atk",2500,10,15,[["ogWaon","v"]],"音符の色の種類 ×{v}＋音符の数 ×2 ダメージ。「上り」がそろっていれば、音符を使わない。"),
  s_og_yoin:O("s_og_yoin","SORA","ougi_sora_yoin","残響天蓋","grd",0,2,3,[["ogYoin","v","k"]],"防御＝音符の数 ×{v}＋白の音符 ×3（最大 {k}）。音符は使わない。次の番に、防御が半分のこる。",{k:30,ku:40}),
  k_og_guren:O("k_og_guren","KAEDE","ougi_kaede_guren","焔紅葉","atk",3000,40,60,[["ogGuren","v"]],"{v} ダメージ。レッドゾーンなら ×1.5、7500 回転以上なら ×2。"),
  k_og_haisui:O("k_og_haisui","KAEDE","ougi_kaede_haisui","背水紅刃","atk",2500,20,30,[["ogHaisui","v"]],"{v} ダメージ。エンジン耐久が半分以下なら ×2、4分の1以下なら ×3。"),
  k_og_sotosen:O("k_og_sotosen","KAEDE","ougi_kaede_sotosen","颯紅線","atk",1500,30,45,[["ogSotosen","v"]],"{v} ダメージ・防御をこえる。敵が一度でも動いたあとなら ×2。"),
  r_og_yumi:O("r_og_yumi","RIN","ougi_rin_yumi","黒曜の伏矢","atk",2000,12,18,[["ogYumi","v"]],"（間合い＋1）×{v} ダメージ・防御をこえる。そのあと、間合いを 3 にもどす。"),
  r_og_koma:O("r_og_koma","RIN","ougi_rin_koma","金冠成駒","atk",2500,15,22,[["ogKoma","v"]],"場の駒をクイーンにする（残る番 満タン）。4 ×{v} ダメージ。"),
  r_og_kime:O("r_og_kime","RIN","ougi_rin_kime","女王の詰み","atk",3000,10,15,[["ogKime","v","k"]],"この戦闘で昇格した回数 ×{v} ダメージ（最大 {k}・倍率なし）。クイーンがいれば防御をこえる。",{k:80,ku:110}),
  l_og_tsuki:O("l_og_tsuki","LUNA","ougi_luna_tsuki","朔夜","atk",2500,30,45,[["ogTsuki","v"]],"{v} ダメージ。満月なら ×2・新月なら防御 {v} も。月を次の番もこのままにする。"),
  l_og_hoshi:O("l_og_hoshi","LUNA","ougi_luna_hoshi","星詠み","atk",2000,6,9,[["ogHoshi","v"]],"夜空の空いたマスを全部灯す（流れ星・三角は起こさない）。灯した星の数 ×{v} ダメージ。"),
  l_og_yozora:O("l_og_yozora","LUNA","ougi_luna_yozora","天墜星","atk",3000,5,7,[["ogYozora","v","k"]],"灯っている星の数 ×{v} ダメージ、満月なら ×2（最大 {k}・倍率なし）。夜空は空にしない。",{k:90,ku:120}),
  ku_og_kodou:O("ku_og_kodou","KURO","ougi_kuro_kodou","夜想心拍","atk",1500,20,30,[["ogKodou","v"]],"心拍を 190 にする（この1枚では転倒しない）。{v} ダメージ。番の終わりに心拍 −80。",{hr:0}),
  ku_og_douke:O("ku_og_douke","KURO","ougi_kuro_douke","夜宴道化","rev",0,2,3,[["ogDouke","v"]],"グリッチ・トリックの書きかえを {v} つ入れる（グリッチは要らない）。",{mo:"skill",hr:0}),
  ku_og_denno:O("ku_og_denno","KURO","ougi_kuro_denno","蝙蝠の檻","atk",2000,6,8,[["ogDenno","v","k"]],"グリッチ ×{v} ダメージ（グリッチは減らさない・最大 {k}・倍率なし）。防御＝グリッチ ×2。",{k:60,ku:80,hr:0}),
  mi_og_saiteki:O("mi_og_saiteki","MIO","ougi_mio_saiteki","翠玉演算","atk",2000,35,50,[["ogSaiteki","v"]],"{v} ダメージ。回転が帯の芯なら ×2。"),
  mi_og_kaiseki:O("mi_og_kaiseki","MIO","ougi_mio_kaiseki","翠眼解読","rev",0,15,20,[["ogKaiseki","v"]],"ジャマ・混線をすべて消す。防御 {v}。敵の次の2手の予告が見える。",{mo:"skill"}),
  mi_og_kaigan:O("mi_og_kaigan","MIO","ougi_mio_kaigan","美ら海線","atk",1500,6,8,[["ogKaigan","v","k"]],"この戦闘で帯の中で打ったカードの枚数 ×{v} ダメージ（最大 {k}・倍率なし）。回転を帯の芯にそろえる。",{k:60,ku:80}),
 };
 /* ★v1.3 text-add v0.22.64 30-5：説明（d）と長押しの補足（lp） */const D30={"s_og_kyouon": "音符をすべて使う：使った数 ×{v}。同じ色が3つ続けば ×2（倍率なし・最大 {k}）。", "s_og_waon": "音符の色の種類 ×{v}＋音符の数 ×2。「上り」がそろえば、音符は残る。", "s_og_yoin": "防御＝音符の数 ×{v}＋白の音符 ×3（倍率なし・最大 {k}）。次の番まで半分残る。", "k_og_guren": "{v} ダメージ。レッドなら ×1.5、7500 以上で ×2。", "k_og_haisui": "{v} ダメージ。耐久が半分以下なら ×2、4分の1以下なら ×3。", "k_og_sotosen": "{v} ダメージ・貫通。この番、敵が KAEDE より先に動いていたら ×2。", "r_og_yumi": "（間合い＋1）×{v} ダメージ・防御をこえる。そのあと間合いを 3 にもどす。", "r_og_koma": "場の駒をクイーンにする（残る番は満タン）。駒の段 ×{v} ダメージ。", "r_og_kime": "この戦闘で昇格した回数 ×{v}（倍率なし・最大 {k}）。クイーンがいれば防御をこえる。", "l_og_tsuki": "{v} ダメージ。満月なら ×2、新月なら防御 {v} も。月をこの番で止める。", "l_og_hoshi": "夜空の空いたマスを全部灯す。灯した星の数 ×{v} ダメージ。", "l_og_yozora": "灯っている星の数 ×{v}、満月なら ×2（倍率なし・最大 {k}）。", "ku_og_kodou": "心拍を 190 に（この1枚では転倒しない）。{v} ダメージ。番の終わりに心拍 −80。", "ku_og_douke": "グリッチ・トリックの書きかえを {v} つ選ぶ（グリッチ 10 はいらない）。", "ku_og_denno": "グリッチ ×{v} ダメージ・防御＝グリッチ ×2（倍率なし・最大 {k}）。", "mi_og_saiteki": "{v} ダメージ。回転が帯の芯なら ×2。", "mi_og_kaiseki": "ジャマ・ノイズ・混線をすべて消す。防御 {v}。敵の次の2手が見える。", "mi_og_kaigan": "帯の中で打った枚数 ×{v}（倍率なし・最大 {k}）。回転を帯の芯にそろえる。"},LP30={"s_og_yoin": "次の番の終わりまで、防御の半分がのこる。", "ku_og_kodou": "この1枚で心拍 190 になっても、転倒しない。", "l_og_hoshi": "流れ星・三角は起こらない。9つそろえば、星座の完成だけ起きる。", "l_og_tsuki": "月は、次の番に進まない（1回だけ）。", "ku_og_denno": "グリッチは減らない。", "ku_og_douke": "書きかえの札から、タップして選ぶ（前に選んだものは灰色）。", "k_og_sotosen": "行動の順で、その番に敵が先に動いたときだけ ×2。"}/* ★v1.7 text-add v0.22.67 */;Object.keys(N).forEach(id=>{if(D30[id])N[id].d=D30[id];if(LP30[id])N[id].lp=LP30[id]});
 // ★v1.7 文（text-add v0.22.67 43章）：名前・読み・説明・フレーバー・長押し
 Object.entries({"s_nt1": {"n": "夜想曲", "d": "白の音符を2つ・防御 {v}。", "flav": "夜の音は、やさしく、白く鳴る。", "yomi": "ノクターン"}, "s_nt2": {"n": "終夜楽章", "d": "音符を全部、赤として使う：数 ×{v}（倍率なし・最大 {k}）。", "flav": "夜どおし鳴らした音を、最後の一小節に、ぜんぶ。", "yomi": "しゅうやがくしょう"}, "k_nt1": {"n": "ミッドナイトブースト", "d": "回転 +1500・防御 {v}。", "flav": "真夜中の直線。針を、赤の手前まで。"}, "k_nt2": {"n": "夜紅葉", "d": "{v} ダメージ＋この戦闘で、レッドのまま番を終えた数 ×4。", "flav": "夜の山で、いちばん赤く燃える葉。", "yomi": "よもみじ"}, "r_nt1": {"n": "夜鷹の矢", "d": "弓・{v} ダメージを2回・間合い +1（「2枚まで」に数えない）。", "flav": "夜を飛ぶ鳥は、遠くの獲物を、見のがさない。", "yomi": "よたかのや", "lp": "間合いを広げるカードの『2枚まで』には数えない。"}, "r_nt2": {"n": "月下の成り", "d": "場の駒を1段上げる（クイーンまで）・残る番を満タンに。", "flav": "月の光の下で、駒は、ひとつ上へ。", "yomi": "げっかのなり"}, "l_nt1": {"n": "星蒔き", "d": "好きなマスに星を2つ・防御 {v}。", "flav": "夜空に、星をまく。……ここと、ここ。", "yomi": "ほしまき"}, "l_nt2": {"n": "満天", "d": "そろった形（直線・三角）の数 ×10＋灯った星の数 ×{v}。", "flav": "雲ひとつない夜。空は、星でいっぱい。", "yomi": "まんてん"}, "mi_nt1": {"n": "ナイトクルーズ", "d": "回転を帯の芯にそろえる・防御 {v}。", "flav": "夜の道を、いちばん静かな回転で。"}, "mi_nt2": {"n": "夜光翠", "d": "（この番に帯の中で打った枚数 ×{v}＋12）ダメージ。", "flav": "夜の海に光る、みどり色の波。", "yomi": "やこうすい"}, "ku_nt1": {"n": "おやすみモード", "d": "心拍 −30・グリッチ +{v}。", "flav": "くひひっ♪ ちょっとだけ、寝たふり。"}, "ku_nt2": {"n": "夜ふかし", "d": "この番、心拍の上限が 220 に（220 まで転倒しない）・グリッチ +{v}。", "flav": "まだまだ、寝ないよ♪ 夜は、これから。", "yomi": "よふかし", "lp": "次の番には、上限 200 にもどる。"}}).forEach(([id,o])=>{if(N[id])Object.assign(N[id],o)});
 Object.keys(N).forEach(id=>{if(!has(N[id].own))delete N[id]});Object.assign(CARDS,N);
 // 枝 → 奥義（①の OG_OF_BRANCH）。KURO の枝は design 25-2 の 鼓動・道化・電脳（今の枝 id のまま読みかえ：ku_t3 撃つ＝鼓動・ku_t2 引く＝道化・ku_t1 積む＝電脳）
 if(typeof OG_OF_BRANCH!=="undefined")Object.assign(OG_OF_BRANCH,{s_tempo:"s_og_kyouon",s_waon:"s_og_waon",s_yoin:"s_og_yoin",k_guren:"k_og_guren",k_shoubu:"k_og_haisui",k_soto:"k_og_sotosen",
  r_nui:"r_og_yumi",r_qmove:"r_og_koma",r_fuku:"r_og_kime",l_seizu:"l_og_tsuki",l_ryusei:"l_og_hoshi",l_shin:"l_og_yozora",ku_t3:"ku_og_kodou",ku_t2:"ku_og_douke",ku_t1:"ku_og_denno",
  mi_opt:"mi_og_saiteki",mi_ana:"mi_og_kaiseki",mi_coast:"mi_og_kaigan"});
 // 文（text 30-3）：読み・カットインの一言・フレーバー
 if(T){T.og=T.og||{};Object.assign(T.og,{
  ougi_sora_kyouon:{y:"そうてんれんぱく",line:"ノッてこー、最後まで！",flav:"同じ音を重ねるたび、空が鳴る。止めなければ、曲は終わらない。"},
  ougi_sora_waon:{y:"なないろわせい",line:"ぜんぶ重ねると、いい音〜！",flav:"ちがう音がそろうと、ひとつの響きになる。"},
  ougi_sora_yoin:{y:"ざんきょうてんがい",line:"鳴りやむまで、守るよ〜。",flav:"音が消えたあとも、響きは空にのこる。"},
  ougi_kaede_guren:{y:"ほむらもみじ",line:"レッドで燃やしたるで！",flav:"針が赤に入るほど、葉は、あかく燃える。"},
  ougi_kaede_haisui:{y:"はいすいくれは",line:"ここからが、勝負や！",flav:"残りがわずかなときほど、刃は熱くなる。"},
  ougi_kaede_sotosen:{y:"さっこうせん",line:"外から、ぶち抜いたる！",flav:"相手の線の、さらに外。そこに、ウチだけの線がある。"},
  ougi_rin_yumi:{y:"こくようのふしや",line:"その距離なら、外さないわ。",flav:"間合いが遠いほど、黒い矢は、深く届く。"},
  ougi_rin_koma:{y:"きんかんなりごま",line:"さあ、女王になりなさい。",flav:"一歩ずつ進んだ駒は、最後に、金の冠をいただく。"},
  ougi_rin_kime:{y:"じょおうのつみ",line:"これで、詰みね。",flav:"冠をいただいた駒の数だけ、詰みの一手は重くなる。"},
  ougi_luna_tsuki:{y:"さくや",line:"……今夜の月は、ここで止める。",flav:"満ちても、欠けても、月がとまれば、夜もとまる。"},
  ougi_luna_hoshi:{y:"ほしよみ",line:"……見えた。全部、灯すね。",flav:"空いた空に、星をおく。読めば、あしたも灯る。"},
  ougi_luna_yozora:{y:"てんついせい",line:"……落ちてくるよ。",flav:"いちばん明るい夜空から、いちばん重い星が落ちる。"},
  ougi_kuro_kodou:{y:"やそうしんぱく",line:"ドキドキ、止まんないね♪",flav:"心臓がエンジン。上げるほど、夜は速くなる。"},
  ougi_kuro_douke:{y:"やえんどうけ",line:"ぜーんぶ、入れかえちゃえ♪",flav:"表が裏に、裏が表に。ルールを決めるのは、クロ。"},
  ougi_kuro_denno:{y:"こうもりのおり",line:"はい、つかまえた♪",flav:"バグった数だけ、檻は固く、牙はするどくなる。"},
  ougi_mio_saiteki:{y:"すいぎょくえんざん",line:"……計算、ぴったりです！",flav:"帯のまん中、ずれはゼロ。答えは、いつもひとつ。"},
  ougi_mio_kaiseki:{y:"すいがんかいどく",line:"見えました……全部、です！",flav:"ジャマも混線も、読めてしまえば、ただの記号。"},
  ougi_mio_kaigan:{y:"ちゅらうみせん",line:"あきさみよー、止まりません……！",flav:"故郷の海岸のように、どこまでも、なめらかにつづく。"}})}
 Object.values(N).forEach(d=>{const t=T&&T.og&&T.og[d.og];if(t&&!d.yomi)d.yomi=t.y;if(t&&!d.flav)d.flav=t.flav});
 if(A3._ogHooked)return;A3._ogHooked=1;
 // 解放の夜：その子が加わる夜の1つ上（SORA 5・KAEDE 6・RIN 7・LUNA 8・MIO 9・KURO 10）＝①の RULES.ogNight をその子のときだけ読みかえる
 {let on=RULES.ogNight;Object.defineProperty(RULES,"ogNight",{configurable:true,enumerable:true,get(){const c=typeof G!=="undefined"&&G&&G.char;return c&&A3.chars.includes(c)&&CHARS[c].join?CHARS[c].join+1:on},set(v){on=v}})}
 // 朔夜：月を次の番もこのまま／夜想心拍：番の終わりの −80（ふだんの −40 にもう −40）／美ら海線：帯の中で打った枚数
 if(A3.luna){const ad=A3.luna.advance;A3.luna.advance=function(){if(B&&B.moonHold===1&&G.moon!=null){B.moonHold=2;addLog(`月：${A3.luna.name()}のまま（朔夜）`);return}return ad.apply(this,arguments)}}
 H0("turn",first=>{if(first||!B)return;if(B.kOgDown&&A3.isChar("KURO")){B.kOgDown=0;B.hr=Math.max(60,(B.hr||0)-40);try{A3.kuro&&A3.kuro.heart(B.hr)}catch(e){}addLog("夜想心拍：心拍 −40")}});
 // ★v1.5 颯紅線（design 26-4）：その番に、敵が先に動いていたか＝番と番のあいだに敵が2回以上（最初の番は1回以上＝先に動く敵）
 {const es=enemyStep;enemyStep=function(){if(B)B.eStepN=(B.eStepN||0)+1;return es.apply(this,arguments)}}
 H0("turn",first=>{if(!B)return;B.eAhead=(B.eStepN||0)>=(first?1:2);B.eStepN=0});
 H0("after",x=>{if(!A3.isChar("MIO"))return;const r=RULE().cvt;if(r&&B.cvtRpm>=r.lo&&B.cvtRpm<=r.hi)B.mioBandN=(B.mioBandN||0)+1});
 // 奥義ごとの効果音がまだない子（audio-list 20-4）は ougi_hit（その子のテーマの頭）で鳴らす
 if(typeof SND!=="undefined"&&SND.se){const se=SND.se;SND.se=function(id,o){if(/^ougi_(sora|kaede|rin|luna|kuro|mio)_/.test(id)&&window.AUDIO&&AUDIO.SE_IDS&&!AUDIO.SE_IDS.includes(id)){const m=id.split("_");const ty={kyouon:1,waon:2,yoin:3,guren:1,haisui:2,sotosen:3,yumi:1,koma:2,kime:3,tsuki:1,hoshi:2,yozora:3,kodou:1,douke:2,denno:3,saiteki:1,kaiseki:2,kaigan:3}[m[2]]||1;return se.call(this,"ougi_hit",{who:m[1],type:ty})}return se.apply(this,arguments)}}
};
const STEPS=[
 /* v0.8（0）：ふぐあいの直しだけ（ally_mio.js・ally3_ui.js）。数の変えはなし。NIGHT 5〜8 の敵の体力は LD 11-49 のまま（2段目だけ） */
 ["v0.8 ふぐあいの直し",()=>{if(A3.chars.length>1)Object.assign(NIGHT_HP,{5:2.2,6:2.3,7:2.4,8:2.5})}],
 ["v0.9 RIN 糸巻き＝取りやめ：v0.31 で design 19章（弓と駒）に作り直したため、糸巻きは ally_rin.js の形（防御 4・次の弓 +3）",()=>{}],
 ["v0.10 RIN エリアのボス ×0.75（N2〜）",()=>{if(has("RIN"))rule("RIN",{areaBossHp:0.75})}],
 ["v0.11 KAEDE 速さ 10→11",()=>{if(has("KAEDE"))CHARS.KAEDE.car.spd=11}],
 ["v0.12 KAEDE 耐久 95→105",()=>{if(has("KAEDE"))CHARS.KAEDE.car.hp=105}],
 ["v0.13 LUNA 速さ 11→12",()=>{if(has("LUNA"))CHARS.LUNA.car.spd=12}],
 ["v0.14 LUNA 耐久 80→90",()=>{if(has("LUNA"))CHARS.LUNA.car.hp=90}],
 ["v0.15 LUNA の5枚（13-5-2）＝取りやめ：v0.32 で design 20章（月の満ち欠け＋星座）に作り直したため",()=>{}],
 ["v0.16 LUNA エリアのボス ×0.75（N2〜）",()=>{if(has("LUNA"))rule("LUNA",{areaBossHp:0.75})}],
 ["v0.17 KAEDE の8枚（13-5-2）",()=>{if(!has("KAEDE"))return;
   card("k_fullboost",{gas:0});
   card("k_noroshi",{gas:0,v:3,vu:4,d:"この戦闘の間、レッドゾーンでアタックを打つたび、次のアタック +{v}（合計 +12 まで）"});A3.noroshiMax=12;
   card("k_boostcut",{gas:0,v:4,vu:6,fx:[["revDown",2000],["nextAtkAdd","v"]],d:"回転 −2000・次のアタック +{v}"});
   {const d=CARDS.k_twinturbo;if(d)card("k_twinturbo",{fx:d.fx.concat([["nextAtkAdd",3]]),d:d.d+"・次のアタック +3"})}
   card("k_hinoko",{gas:0,v:4,vu:6,fx:[["atkRed2","v"]],d:"{v}ダメージ（ガソリン 0）。レッドゾーンで ×2"});
   card("k_benigiri",{v:12,vu:18});
   /* 炎陣：13-5-2 の形（防御 6・強化 9・レッドで ×2）は③の今の値と同じ＝変えない */
   card("k_fullbucket",{v:8,vu:11})}],
 ["v0.18 MIO：AT の ×0.9 をかけない（design v0.11.66・CVT＝AT 扱い）",()=>{if(has("MIO"))A3.mioAtMul1=true}],
 ["v0.19 KAEDE：redBonusAT +2（AT は帯の上半分〜レッドの手前でも）",()=>{if(has("KAEDE"))rule("KAEDE",{redBonusAT:2})}],
 ["v0.20 SORA：AT の自動シフト 3500",()=>{if(has("SORA")){rule("SORA",{atShiftAt:3500});CHARS.SORA.atRuleTxt="AT：自動シフトは 3500 回転で上がる（安いカードでもギアが上がる）"}}],
 ["v0.21 RIN：AT のときだけ速さ −1（design 13-5-3 案1・spdAT）",()=>{if(has("RIN"))rule("RIN",{spdAT:-1})}],
 ["v0.22 MIO：耐久 85→95（LD 11-62）",()=>{if(has("MIO"))CHARS.MIO.car.hp=95}],
 ["v0.23 MIO：エリアのボス ×0.75（N2〜・LD 11-62）",()=>{if(has("MIO"))rule("MIO",{areaBossHp:0.75})}],
 ["v0.24 SORA の10枚（13-5-3）＝取りやめ：v0.30 で design 17章（音色のスタック）に作り直したため、カードは ally_sora.js の形のまま",()=>{}],
 ["v0.25 SORA：耐久 65→75",()=>{if(has("SORA"))CHARS.SORA.car.hp=75}],
 ["v0.26 SORA：エリアのボス ×0.75（N2〜）",()=>{if(has("SORA"))rule("SORA",{areaBossHp:0.75})}],
 ["v0.27 MIO：番のはじめに手札が2枚以下なら、もう1枚引く（design 13-5・lowDraw:2。YUKI +10 をこえたら 1 に）",()=>{if(has("MIO"))rule("MIO",{lowDraw:2})}],
 ["v0.29 KAEDE：エリアのボス ×0.75（N2〜・LD 11-63）",()=>{if(has("KAEDE"))rule("KAEDE",{areaBossHp:0.75})}],
 ["v0.34 LUNA：流れ星 6→4・1ターン2回→1回（design 20 の答え①）",()=>{if(has("LUNA")){const r=CHARS.LUNA.rule;rule("LUNA",{sky:Object.assign({},r.sky,{line:4,lineMaxTurn:1})})}}],
 ["v0.35 LUNA：満月 ×1.5→×1.3（②）",()=>{if(has("LUNA")){const r=CHARS.LUNA.rule,m=r.moon.mul.slice();m[3]=1.3;rule("LUNA",{moon:Object.assign({},r.moon,{mul:m})})}}],
 ["v0.36 LUNA：星座の完成 30→20（③）",()=>{if(has("LUNA")){const r=CHARS.LUNA.rule;rule("LUNA",{sky:Object.assign({},r.sky,{full:20})})}}],
 ["v0.40 LUNA：耐久 90→100（LD 11-66 の【おすすめ】・耐久か月の倍率の1つ）",()=>{if(has("LUNA"))CHARS.LUNA.car.hp=100}],
 ["v0.41 RIN：間合いのはじめ 3→4（LD 11-66）",()=>{if(has("RIN")){const r=CHARS.RIN.rule;rule("RIN",{range:Object.assign({},r.range,{start:4,max:4}),bowPct:[-25,0,25,50,50]})}}],
 ["v0.42＋v0.44 KURO：心拍の帯で倍率＋すまし顔（design 16 案A・LD 11-67：60〜 ×1.6／100〜 ×2.0／140〜 ×2.4／180〜 ×2.8・最終 ×5 まで）",()=>{if(has("KURO"))rule("KURO",{hrMul:[[0,1.6],[100,2.0],[140,2.4],[180,2.8]],restBlk:[[99,6],[139,3]]})}],/* ★v0.44 同じ版で「ひと息」（design 16 案1）：99 以下 +6／100〜139 +3／140 以上なし */
 ["v0.45 LUNA：満月 ×1.3→×1.4（LD 11-68）",()=>{if(has("LUNA")){const r=CHARS.LUNA.rule,m=r.moon.mul.slice();m[3]=1.4;rule("LUNA",{moon:Object.assign({},r.moon,{mul:m})})}}],
 ["v0.49 MIO：潮風は防御 4（強化 6）だけ・エンジン耐久 +3 を外す（design 17/13章・LD 11-68）",()=>{if(has("MIO"))card("mi_shiokaze",{v:4,vu:6,fx:[["blk","v"]],d:"防御 {v}。"})}],
 /* v0.47 の RIN 10枚（design 19-6）はデザイン班の決め直しで取りやめ（窓口 11-24 19:52）。★の形の処理は ally_rin.js に残してある（A3.rinFix・③で使う） */
 ["v0.50 RIN①：AT のときだけ速さ −1（spdAT・前の妨害型の名残）を外す（design 19章・窓口 11-24 20:12）",()=>{if(has("RIN"))rule("RIN",{spdAT:0})}],
 ["v0.52 RIN②：AT の書き分け（間合いを1段上に数える・糸巻き・読み筋・金簪）＝①を LD が測って、まだ下限の外なら",()=>{if(!has("RIN"))return;rule("RIN",{bowStepAT:1});
   /* text v0.22.33 37-1b：AT で数だけ変わる＝文はそのまま・AT の数を出す／AT で効果が足される＝AT の文（d）を全部。①の CD の at:{}（AT のとき上書き）と「AT」の札（modeMark）をそのまま使う。デッキ構築は dDeck の2行目「AT：…」 */
   const C=CARDS,dk=(id,at)=>{const d=C[id];d.dDeck=d.d.replace(/\{v\}/g,d.v).replace(/\{k\}/g,d.k)+"\nAT："+at};
   card("r_itomaki",{k:3,fx:[["blk","v"],["nextBow","k"]],d:"防御 {v}。次の弓のアタック +{k}。",at:{k:5}});dk("r_itomaki","次の弓 +5");
   card("r_kanzashi",{at:{v:C.r_kanzashi.v+2,vu:C.r_kanzashi.vu+2}});dk("r_kanzashi","防御 +2");
   card("r_yomisuji",{d:"敵の次の2手が見える。{v} 枚引く。",at:{fx:[["yomisuji","v"],["blk",3]],d:"敵の次の2手が見える。{v} 枚引く・防御 3。"}/* text v0.22.35 */});dk("r_yomisuji","防御 3 も")}],
 ["v0.53 KURO：耐久 75→85（LD 11-70・デザイン班のもどす線）",()=>{if(has("KURO"))CHARS.KURO.car.hp=85}],
 ["v0.54 MIO：潮風は防御 4（強化 6）・エンジン耐久 +2（LD 11-70・ただ1枚の回復。文は仮＝シナリオ班が直す）",()=>{if(has("MIO"))card("mi_shiokaze",{fx:[["blk","v"],["heal",2]],d:"防御 {v}・エンジン耐久 +2。"/* text v0.22.35 */})}],
 ["v0.56 KURO：エリアのボス ×0.75（N2〜・ほかの仲間と同じ・LD 11-71）",()=>{if(has("KURO"))rule("KURO",{areaBossHp:0.75})}],
 ["v0.57 KURO：番の終わりの防御 +3（心拍に関係なく・すまし顔はその上に＝合わせて +9／+6／+3・design 16章 案1）＝LD が v0.56 を測って、まだ足りなければ",()=>{if(has("KURO"))rule("KURO",{baseBlk:3})}],
 ["v0.58 KURO：空振り誘いは防御の行動にすりかえない（今の予告が攻撃で、ほかの攻撃がある敵だけ・千日手の止め・design 16章②）",()=>{if(has("KURO"))rule("KURO",{feintAtk:1});card("ku_karaburi",{d:"防御 {v}。敵の次の攻撃の予告を、もう1つの攻撃とすりかえる。",lp:"攻撃が1つしかない敵には、防御だけ。"/* text v0.22.36 37章 */})}],
 ["v0.60 KURO：抜け道はアタックを抹消せず山札の下へ（止まった戦闘はどれもアタックが全部抹消されていた・design 16章①）",()=>{if(has("KURO")){rule("KURO",{exileKeepAtk:1});card("ku_nukemichi",{d:"山札の上3枚を、この戦闘から消す（アタックは山札の下へ）。グリッチ +{v}。",lp:"消したカードは、この戦闘ではもどらない。アタックは消さずに、山札のいちばん下へ回す。"/* text v0.22.38 37章 */})}}],
 ["v0.61 KURO：番の終わりの防御 +3→+5（すまし顔はその上に＝合わせて +11／+8／+5・design 16-11）",()=>{if(has("KURO"))rule("KURO",{baseBlk:5})}],
 ["v0.63 KURO：耐久 85→95（LD 11-75・デザイン班のもどす線の次の1段）",()=>{if(has("KURO"))CHARS.KURO.car.hp=95}],
 ["v0.64 KURO：心拍の帯 +0.3（×1.9／2.3／2.7／3.1・最終 ×5 まではそのまま・design 16-12・LD 11-76）",()=>{if(has("KURO"))rule("KURO",{hrMul:[[0,1.9],[100,2.3],[140,2.7],[180,3.1]]})}],
 ["v0.65 KURO：すまし顔の帯（99以下 +6・100〜139 +3→+6・140〜179 に +3 を新しく・180以上 なし・design 16-12・LD 11-77）",()=>{if(has("KURO"))rule("KURO",{restBlk:[[99,6],[139,6],[179,3]]})}],
 ["v0.66 KURO：速さ +1（12→13・NANA と同じ手・design 16-14・LD 11-78）",()=>{if(has("KURO"))CHARS.KURO.car.spd=13}],
 ["v0.67 KURO：バグらせちゃえはグリッチ 0 でも打てる（0 なら 10 ダメージ・1 以上は今のまま・design 16-14 の2・LD 11-79）",()=>{if(has("KURO")){rule("KURO",{bugZero:10});card("ku_bagurase",{glNeed:0,d:"グリッチを全部使う：グリッチ ×{v} ダメージ（0 なら 10）。",lp:"グリッチが 0 のときは、10 ダメージ。"/* text v0.22.39 37章 */})}}],
 ["v0.69 KURO：初期デッキの小径2枚 → 踏みこみ（仮）1枚＋フリーホイール1枚（16枚のまま・design 16-13／16-14 の3・LD 11-80）",()=>{if(!has("KURO"))return;
   CARDS.ku_fumikomi={r:"C",mo:"atk_heavy",own:"KURO",n:"踏みこみ",t:"atk",c:0,gas:1,hr:30,v:12,vu:16,fx:[["atk","v"]],yomi:"ふみこみ",d:"{v} ダメージ。心拍の帯の倍率がかかる。",flav:"ペダルを、ひと踏み。夜が、少しだけ近くなる。"/* text v0.22.40 37章。強化は 16（③の仮・デザイン班待ち） */};
   const C=CHARS.KURO;if(!C.pool.includes("ku_fumikomi"))C.pool.push("ku_fumikomi");const u=UNLOCK.chars.KURO;if(u&&!u.start.includes("ku_fumikomi"))u.start.push("ku_fumikomi");
   C.deck=C.deck.map(([id,n])=>id==="ku_shoukei"?[id,n-2]:id==="ku_freewheel"?[id,n+1]:[id,n]).filter(([,n])=>n>0);C.deck.splice(2,0,["ku_fumikomi",1])}],
 ["v0.72 KURO：初期デッキを20枚に（決まりの20枚に合わせるふぐあいの直し・踏みこみ +2・蝙蝠 +1・隠し札 +1・design 16-18）",()=>{if(has("KURO"))CHARS.KURO.deck=[["ku_koumori",5],["ku_shoukei",1],["ku_fumikomi",3],["ku_freewheel",4],["ku_drafting",2],["ku_kusariwana",2],["ku_ikitsugi",1],["ku_kakushifuda",1],["ku_glitch",1]];if(CARDS.ku_koumori)CARDS.ku_koumori.deckMax=5/* KURO の特性：蝙蝠は5枚まで（★虎雪） */}],
 ["v0.74 KURO：グリッチの盾（番の終わりに残ったグリッチ1つにつき防御 +1・最大 +10・design 16-16・LD 11-83）",()=>{if(has("KURO"))rule("KURO",{glitchBlk:{per:1,max:10}})}],
 ["v0.75 KURO：グリッチの刃（場のグリッチ2つにつきアタック +1・最大 +5・心拍の帯はそのあと・数は仮・design 16-19・LD 11-85）",()=>{if(has("KURO"))rule("KURO",{glitchAtk:{per:2,max:5}})}],
 ["v0.77 KURO：心拍の帯 +0.3（×2.2／2.6／3.0／3.4・最終 ×5 はそのまま・design 16-20）＝LD の v0.75 の本測りで零号への1番が 55 未満なら入れる（切りかえ：LDSTEP=47）",()=>{if(has("KURO"))rule("KURO",{hrMul:[[0,2.2],[100,2.6],[140,3.0],[180,3.4]]})}],/* ★v0.78 LD 11-88：零号への1番 48.8／47.1 で 55 未満 → ふだんから入れる */
 ["v0.80 KURO：グリッチの刃を「3つで +2」（最大 +5・design）＝LD が①の新しい版で KURO の N1 がまだ YUKI −10 より下なら入れる（切りかえ：LDSTEP=48）",()=>{if(has("KURO"))rule("KURO",{glitchAtk:{per:3,add:2,max:5}})}],/* ★v0.81 LD 11-92：N1 が YUKI −10 の外 → ふだんから */
 ["v0.82 KURO：グリッチの刃「2つで +2・最大 +8」（心拍の帯・ボス ×0.75 はそのまま・design 16-22）",()=>{if(has("KURO"))rule("KURO",{glitchAtk:{per:2,add:2,max:8}})}],
 ["v0.86 KURO：エリアのボス ×0.75 を外す（design の線：N2〜4 で YUKI +5 をこえた・LD 11-96）",()=>{if(has("KURO"))rule("KURO",{areaBossHp:0})}],
 ["v0.87 KURO：バグらせちゃえ＝グリッチ ×6（0 なら 10）を打ってから、グリッチを半分に（切り捨て）・心拍 +30 はそのまま（design 16-24）",()=>{if(has("KURO")){rule("KURO",{bugHalf:1});card("ku_bagurase",{d:"グリッチ ×{v} ダメージ（0 なら 10）。そのあと、グリッチは半分に。",lp:"グリッチが 0 のときは、10 ダメージ。半分は、端数を切り捨て。"/* text v0.22.51 */})}}],
 ["v0.89 KURO：エリアのボス ×0.85（×1.0 で N2〜4 が 10% 前後に落ちたので中間・LD 11-97）",()=>{if(has("KURO"))rule("KURO",{areaBossHp:0.85})}],
 ["v0.90 KURO：バグらせちゃえ ×6→×7（強化 ×7→×8・0 のときは 10 のまま・design 16-25）",()=>{if(has("KURO"))card("ku_bagurase",{v:7,vu:8})}],
 ["v0.91 KURO：KURO SYSTEM 心拍 +25→+15（引く枚数は足さない・design 16-26・LD 11-101）＝①の「ヒートの得を上げる版」のあと（切りかえ：LDSTEP=54）",()=>{if(has("KURO"))card("ku_kurosystem",{hr:15})}],/* ★v0.92 ①の v0.22.145 のあと＝ふだんから */
 ["v0.94 KURO：バグらせちゃえを解放ずみ（はじめから報酬・ショップに出る）に。はじめのデッキには入れない（20枚のまま）・エリア突破の解放からは外す（空いた枠は LD のあと）・design 16-29",()=>{if(!has("KURO"))return;const u=UNLOCK.chars.KURO;for(const k of Object.keys(u))if(k!=="start"&&Array.isArray(u[k]))u[k]=u[k].filter(id=>id!=="ku_bagurase");if(!u.start.includes("ku_bagurase"))u.start.push("ku_bagurase")}],
 ["v0.95 KURO：バグらせちゃえは1番に1回まで（×7・半分はそのまま・LD 11-114）",()=>{if(has("KURO")){rule("KURO",{bugOnce:1});card("ku_bagurase",{d:"グリッチ ×{v} ダメージ（0 なら 10）。グリッチは半分に（1ターン1回）。"/* text v0.22.55 37-3 */})}}],
 ["v0.97 KURO：エリアのボス ×0.85→×1.0（design 16-30・LD 11-115）",()=>{if(has("KURO"))rule("KURO",{areaBossHp:0})}],
 ["v0.98 KURO：バグらせちゃえ ×7→×5（強化 ×8→×6・0 のときの 10・半分・1ターン1回はそのまま・design 16-30 の2・LD 11-117）",()=>{if(has("KURO"))card("ku_bagurase",{v:5,vu:6})}],
 ["v1.0 SORA〜MIO の奥義18枚（design 25-3・text 30-3）。gas 2・1戦に1回・倍率 ×3 まで・「最大」は倍率なし。解放はその枝の4段目で、その子が加わる夜の1つ上を全クリア（数は仮・LD が測る）",()=>A3.ougi18()],
 ["v1.2 SORA：初期デッキのサウンドチェック1枚を音階に（音階は R→C・音階の数はそのまま 6・青2つ・1枚引く。design 25-5 の1・NIGHT 1 全クリア 24 の直し）",()=>{if(has("SORA")){const D=CHARS.SORA.deck,k=D.find(x=>x[0]==="s_soundcheck");if(k&&k[1]>0){k[1]--;const o=D.find(x=>x[0]==="s_onkai");if(o)o[1]++;else D.push(["s_onkai",1])}card("s_onkai",{r:"C"});const U=UNLOCK.chars.SORA;if(U&&U.start&&!U.start.includes("s_onkai"))U.start.push("s_onkai")}}],
 ["v1.3 6人の得意な天候（design 26-3）：雪 LUNA・雨 SORA・MIO・霧 RIN・KURO・夜明け KAEDE（得意な天候では悪い所が効かない＝①の wxFav）",()=>{const F={SORA:"rain",KAEDE:"dawn",RIN:"fog",LUNA:"snow",KURO:"fog",MIO:"rain"};Object.keys(F).forEach(c=>{if(has(c))CHARS[c].wxFav=F[c]})}],
 ["v1.5 奥義の文と動き（design 26-4 ①）：焔紅葉の文から「回転は下がらない」を消す・颯紅線は「その番に敵が先に動いていたら ×2」（番と番のあいだに敵が2回以上・最初の番は先に動く敵）・夜宴道化は自分で選ぶ（画面だけ・数は同じ）",()=>{A3.ogSotoTurn=1;card("k_og_guren",{d:(CARDS.k_og_guren&&CARDS.k_og_guren.d||"").replace(/回転は下がらない。?/,"").trim()})}],
 ["v1.6 夜のカード12枚（design 26-4 ②）：SORA〜MIO・KURO の2枚ずつ。R＝そのキャラで初めて NIGHT 6 を全クリア・E＝NIGHT 9（KURO 10・11）で開く。名前と絵は仮・数は 26-4 の表の仮",()=>A3.night12()],
 ["v1.8 合成36組（design 26-6）：6人 × 枝ごとに2組。名前は仮・数は表の仮（強いほうの材料とくらべる）",()=>A3.fuse36()],
 ["v1.8 ディグのカード12枚（design 26-6）：6人 × 2枚・フルオートでだけ見つかる。名前は仮",()=>A3.dig12()],
 ["v1.9 赤い鎖罠の強化 4→5（design 26-8：グリッチ ×{v} は主の数なので ×1.5。次のアタック +グリッチ ×2 は変えない）",()=>card("f_ku_akaikusariwana",{vu:5})],
 ["v2.0 スキルツリーの枝（design 25-2）：KURO 電脳・道化・鼓動（4段目＝盾 +5・刃 +2／ドラフティング3枚・書きかえ +1／帯の倍率 +0.2・すまし顔 +2）・SORA 余韻の4段目＝白の音符1つにつき防御 +2（最大 6）",()=>A3.tree25()],
];
/* "pending" の版（準備だけ）は、ALLY3_LD_STEP でその番号まで指したときだけ入る */
const lim=Number.isInteger(globalThis.ALLY3_LD_STEP)?globalThis.ALLY3_LD_STEP:STEPS.reduce((a,s0,i)=>s0[2]==="pending"?a:i,0);
A3.LD={steps:STEPS.map(s=>s[0]),step:lim,ver:STEPS[lim][0].split(" ")[0]};
STEPS.slice(0,lim+1).forEach(s=>s[1]());
/* ★text v0.22.26 36-3b：MIO の決まりの2行目（lowDraw が入っている版だけ・{n} は今の数） */
if(has("MIO")){const n=(CHARS.MIO.rule||{}).lowDraw;if(n!=null&&!/もう1枚引く/.test(CHARS.MIO.ruleTxt||""))CHARS.MIO.ruleTxt+=`・ターンのはじめに手札が${n}枚以下なら、もう1枚引く`}
/* ★design 22章（v0.11.103）：◎＝starter。③の6人は、数の直しのあとの初期デッキ（CHARS[ch].deck）から入れる（データにあればそのまま） */
/* ★text v0.22.44 37-3b：KURO のキャラの決まりの並び＝rule_kuro・rule_kuro_blade・rule_kuro_rest・rule_kuro_shield（入っている決まりだけ「・」でつなぐ） */
if(has("KURO")){const C=CHARS.KURO,U=(typeof TEXT!=="undefined"&&TEXT.ui)||{},R=C.rule||{};if(C.ruleTxt0==null)C.ruleTxt0=C.ruleTxt;C.ruleTxt=[C.ruleTxt0,R.glitchAtk&&U.rule_kuro_blade,R.restBlk&&U.rule_kuro_rest,R.glitchBlk&&U.rule_kuro_shield].filter(Boolean).join("・")}
A3.chars.forEach(ch=>(CHARS[ch].deck||[]).forEach(([id])=>{const d=CARDS[id];if(!d)return;/* ★v1.3 BUG-63：①の持ち方＝その子の名前の配列（d.starter.includes(ch)） */if(!Array.isArray(d.starter))d.starter=d.starter&&d.own&&d.own!=="N"?[d.own]:[];if(!d.starter.includes(ch))d.starter.push(ch)}));
A3.ldDone=true})();

/* ★v2.0 枝の名前と一行（text 25章 v0.22.62）：文だけ（強さは変えない） */
try{if(typeof TREE!=="undefined"){const NM={SORA:{s_tempo:["強音","同じ色を重ねる型"],s_waon:["和音","色をそろえる型"],s_yoin:["余韻","白の音で守る型"]},RIN:{r_nui:["間合い","遠くから射る型"],r_qmove:["成り駒","駒を育てる型"],r_fuku:["女王の一手","最後に詰める型"]},LUNA:{l_seizu:["満ち欠け","月で決める型"],l_ryusei:["流れ星","星を灯す型"],l_shin:["星座","夜空を満たす型"]},KURO:{ku_t1:["電脳","グリッチで守って刺す型"],ku_t2:["道化","作戦を入れかえる型"],ku_t3:["鼓動","心拍を上げて走る型"]}};
 const YM={s_tempo:"フォルテ",s_waon:"わおん",s_yoin:"よいん",r_nui:"まあい",r_qmove:"なりごま",r_fuku:"じょおうのいって",l_seizu:"みちかけ",l_ryusei:"ながれぼし",l_shin:"せいざ",ku_t1:"でんのう",ku_t2:"どうけ",ku_t3:"こどう"};
 Object.entries(NM).forEach(([ch,o])=>(TREE[ch]||[]).forEach(b=>{if(!o[b.id])return;if(ch==="KURO"&&!A3.kuTree2)return;/* KURO は ld 67 から（中身が変わるため） */b.n=o[b.id][0];b.d=o[b.id][1];b.yomi=YM[b.id]}))}}catch(e){}
