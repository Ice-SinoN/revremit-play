"use strict";
/* ★③ 仲間（SORA〜）の画面・音・加わる話。ally_<子>.js のあとに読む。①の関数は外から包むだけ */
(function(){const A3=globalThis.ALLY3;if(!A3||typeof showScene!=="function")return;
/* 戦闘スタイル・名前・絵（戦闘の絵とその子のボスの絵は起動で読む） */
Object.entries(A3.style).forEach(([c,t])=>{if(typeof CHAR_STYLE!=="undefined")CHAR_STYLE[c]=t});
const NM={SORA:"そら",KAEDE:"かえで",RIN:"りん",LUNA:"るな",MIO:"みお",KURO:"クロ"};
A3.chars.forEach(c=>{TEXT.names[c]=TEXT.names[c]||NM[c]||c;TEXT.names[c+"_IN"]=TEXT.names[c+"_IN"]||TEXT.names[c];
  const k=ALLY_BOSS[c];[c,k,k&&k+"_p2"].forEach(a=>{if(a&&ART_SRC[a])ART_SRC[a].lazy=0})});

/* 加わる話：preJoin（SORA は「次の仲間は……？」→ next_sora）→ join_<子> */
const _playJoins=playJoins;playJoins=function(q,done){
  if(q.includes("SORA"))q=q.filter(c=>c!=="__next");
  const c=q[0];if(c&&A3.chars.includes(c)){q.shift();const next=()=>playJoins(q,done),lc=c.toLowerCase();
    const join=()=>{SND.jingle("ally_join",{who:lc});if(TEXT.scenes["join_"+lc])showScene("join_"+lc,next);else _playJoins([c],next)};
    const pre=(CHARS[c].preJoin||[]).filter(k=>!seenGet()[k]&&TEXT.scenes[k]);
    /* ★v0.6 β の線（BETA_NIGHTS が 4 まで）：SORA が夜の初クリアで加わったときは、そのあと①の「β の締め」（showBetaEnd）へ */
    const full=typeof BUILD!=="undefined"&&BUILD==="full";/* ★v2.0 全員で遊べる版：β の締めは出さない（次の仲間の話→ join_sora → NIGHT 5 へ） */
    const beta=!full&&c==="SORA"&&pre.length&&typeof BETA_NIGHTS==="number"&&BETA_NIGHTS<=4&&typeof showBetaEnd==="function";
    const nx=beta?()=>showBetaEnd(next):next,join2=()=>{SND.jingle("ally_join",{who:lc});if(TEXT.scenes["join_"+lc])showScene("join_"+lc,nx);else _playJoins([c],nx)};
    if(pre.length){SND.jingle("ally_next");const run=i=>i<pre.length?showScene(pre[i],()=>run(i+1)):join2();run(0)}else join();return}
  return _playJoins(q,done)};

/* 音：その子のボスの曲（ENEMIES[key].bgm）・第2形態（bgmPhase2）・エンジン音をこもらせる（muffle） */
const AU=f=>{try{f(window.AUDIO&&SND.on?AUDIO:null)}catch(e){}};
const _areaBgm=SND.areaBgm;SND.areaBgm=function(kind){
  if(kind==="battle"&&B&&ENEMIES[B.key]){const E=ENEMIES[B.key];AU(A=>A&&A.engineMuffle&&A.engineMuffle(!!E.muffle));
    if(E.bgm&&E.rank==="boss"){SND.bgm(E.bgm);if(E.bgmPhase2)AU(A=>A&&A.bgmPhase&&A.bgmPhase(1));return}}
  return _areaBgm.call(SND,kind)};
const _checkPhase=checkPhase;checkPhase=function(){const was=B&&B.e&&B.e.phased;_checkPhase();
  if(B&&!B.sim&&!was&&B.e.phased&&ENEMIES[B.key]&&ENEMIES[B.key].bgmPhase2)AU(A=>A&&A.bgmPhase&&A.bgmPhase(2))};
/* 場面ごとの SE（ally_<子>.js の sceneSE：{場面:{行の番号:fn, end:fn}}） */
const _sceneLine=sceneLine;sceneLine=function(){_sceneLine();try{const s=S.sc,f=s&&A3.sceneSE[s.key]&&A3.sceneSE[s.key][s.i];if(f)AU(f)}catch(e){}};
const _sceneEnd=sceneEnd;sceneEnd=function(){const k=S.sc&&S.sc.key;_sceneEnd();const f=k&&A3.sceneSE[k]&&A3.sceneSE[k].end;if(f)AU(f)};

/* キャラ選び：5人以上なら札をつめる（絵は札の幅に合わせて縮める） */
if(typeof renderChars==="function"){const _rc=renderChars;renderChars=function(){_rc();const n=CHAR_ORDER.length;if(n<=4)return;
  const step=Math.floor(608/n),w=step-6;document.querySelectorAll("#ui .chcard").forEach((b,i)=>{b.style.left=(16+i*step)+"px";b.style.width=w+"px";if(n>4){b.style.top="58px";b.style.height="98px"}/* 右上の「もどる」にかからない */
    const cv=b.querySelector("canvas.chav");if(cv&&w<118){cv.style.width=(w-6)+"px";cv.style.height=Math.round((w-6)*70/112)+"px"}
    if(w<100){b.querySelectorAll(".small").forEach(e=>{e.style.fontSize="8px"});const nm=b.querySelector(".chn");if(nm){nm.style.fontSize="13px";nm.style.whiteSpace="nowrap"}}})}}
/* ガレージの「型」：5人以上なら 3列で段を足し、図鑑を下へ */
if(typeof showHub==="function"){const _sh=showHub;showHub=function(){_sh();const bs=[...document.querySelectorAll("#ui .hubt")];if(bs.length<=4)return;
  const rows=Math.ceil(bs.length/3),h=rows>2?40:52,st=rows>2?44:58;
  bs.forEach((b,i)=>{b.style.left=(16+(i%3)*206)+"px";b.style.top=(170+Math.floor(i/3)*st)+"px";b.style.width="196px";b.style.height=h+"px"});
  document.querySelectorAll("#ui .hubb:not(.hubt)").forEach(b=>{if(parseInt(b.style.top)>=230){b.style.top=(170+rows*st+6)+"px";if(rows>2)b.style.height="40px"}})}}

/* ===== design 13-4-3（v0.4）：MIO の CVT・LUNA の先読みを見せる ===== */
const CSS=document.createElement("style");CSS.textContent=`.cs .cmd.CVT{background:#7CFFB2}.a3staff{position:absolute;display:flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(0,0,0,.6);border:1px solid #6cf;border-radius:4px;font-size:11px;color:#fff;z-index:6;pointer-events:none}.a3staff i{width:10px;height:10px;border-radius:50%;border:1px solid #9ab;display:inline-block}.a3staff b{margin-left:4px;color:#ffd54a}.a3sl{color:#6cf;margin-right:2px}.a3col{position:absolute;right:3px;top:3px;z-index:5;width:9px;height:9px;border-radius:50%;border:1px solid #000;pointer-events:none}.a3col.fin{box-shadow:0 0 0 2px #ffd54a}.a3sky{display:inline-grid;grid-template-columns:repeat(3,7px);gap:1px;margin-left:6px}.a3sky i{width:7px;height:7px;background:#223;border:1px solid #567;display:block;border-radius:0}.a3sky i.on{background:#ffe680;box-shadow:0 0 4px #ffe680}.a3cell{position:absolute;right:3px;top:2px;z-index:5;font-size:9px;line-height:11px;min-width:11px;text-align:center;background:#112;color:#ffe680;border:1px solid #ffe680;border-radius:2px;pointer-events:none}.lspick{padding:6px}.lsg{display:grid;grid-template-columns:repeat(3,54px);gap:6px;justify-content:center;margin:8px 0}.lsg .lsc{height:54px;font-size:16px;background:#112;color:#9ab;border:2px solid #456}.lsg .lsc.open{color:#fff;border-color:#8cf;box-shadow:0 0 6px #8cf}.lsg .lsc.rec{border-color:#ffd54a;box-shadow:0 0 8px #ffd54a}.lsg .lsc.on{background:#ffe680;color:#000}.lsg .lsc.pk{background:#8cf;color:#000}.a3sky i.nx{background:#8cf;box-shadow:0 0 5px #8cf}.a3sky i.ln{outline:1px solid #ffd54a}.a3staff i.use{outline:2px solid #ffd54a;outline-offset:1px}.kpk{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.kpb{background:none;border:2px solid #8cf;padding:2px;border-radius:4px}.kpb.dis{opacity:.35;filter:grayscale(1)}.kpi{min-width:110px;padding:10px 6px;color:#fff;text-align:center}.a3glow{box-shadow:0 0 0 2px #7CFFB2,0 0 8px #7CFFB2 !important}.a3tag{position:absolute;z-index:5;font-size:9px;line-height:12px;padding:1px 4px;background:rgba(10,12,20,.82);border:1px solid #7CFFB2;color:#CFFFE4;white-space:nowrap;pointer-events:none}.a3tag.luna{border-color:#B9A8FF;color:#E6E0FF}.a3tag .nw{color:#fff}`;document.head.appendChild(CSS);
const handEls=()=>[...document.querySelectorAll("#ui .cs")].map(b=>{const m=(b.getAttribute("onclick")||"").match(/clickCard\((\d+)\)/);return m?[+m[1],b]:null}).filter(Boolean);
if(typeof renderBattle==="function"){const _rb=renderBattle;renderBattle=function(){_rb();try{if(!B||!G||window.SCREEN!=="battle")return;A3.cvtLabels();if(G.char==="KURO")setTimeout(()=>{try{A3.kuroPend()}catch(e){}},50);const u=ui();
  if(G.char==="MIO"&&RULE().cvt){const r=RULE().cvt,w=has("mi_logger")?250:0,lo=r.clo-w,hi=r.chi+w,x=B.rpm,now=x>=lo&&x<=hi?r.cm:x>=r.lo&&x<=r.hi?r.bm:1;
    /* ★v0.18 CVT の字は①の走りかたの帯（modeBanner）の中へ */
    handEls().forEach(([i,b])=>{const c=B.hand[i];if(c&&preview(c).ok){const n=B.rpm+costOf(c);if(n>=lo&&n<=hi)b.classList.add("a3glow")}})}
  if(G.char==="KURO"&&ALLY3.kuro){/* ★v0.33 心拍とグリッチ（design 16-2）：心拍・グリッチ・書きかえ・自作ディスプレイ（仮の字。心拍の波のメーターはグラフィック班待ち）。カードの右上に心拍 */
    const K=ALLY3.kuro,R=K.R(),hr=B.hr||0,gm=K.glMax(),RN={half:"心拍半分",noFall:"転倒1回なし",gl15:"上限15",pick2:"2枚から選ぶ"};const hm=RULE().hrMul?(()=>{const sc=S.sel>=0&&B.hand[S.sel],m0=K.hrMul(hr),m1=sc?K.hrMul(Math.max(0,hr+K.hrOf(sc))):m0;return`<b>×${m0}${m1!==m0?` → ×${m1}`:""}</b>`})():"";
    const t=document.createElement("div");t.className="a3staff";Object.assign(t.style,{left:"184px",top:"236px",whiteSpace:"nowrap"});
    t.innerHTML=`<span class="a3sl" style="color:#ff5a6a">♥</span><b style="color:${hr>=160?"#ff5a6a":"#fff"};margin:0">${hr}</b>／${R.cap}　<span style="color:#c38bff">◆ ${B.gl||0}／${gm}</span>${(()=>{const T=TEXT.ui||{},ic=k=>`<img class="px a3gi" src="assets/c2/ui/c2/newfour/revremit_ui_kuro_glitch_${k}.png" alt="" onerror="this.remove()">`,n=K.glAtk?K.glAtk(B.gl):0,g=K.glBlk?K.glBlk(B.gl):0;return(n?`<b style="color:#c38bff">${ic("blade")}${esc((T.kuro_blade_short||T.kuro_blade_line||"刃 +{n}").replace("{n}",n))}</b>`:"")+(g?`<b style="color:#8fd8ff">${ic("shield")}${esc((T.kuro_shield_short||T.kuro_shield_line||"盾 +{n}").replace("{n}",g))}</b>`:"")})()/* ★v0.75 刃・★v0.77 盾（BUG-55）。印の絵（グラフィック班・AD OK）があれば字の前に。なければ字だけ */}${hm}${B.kRule?`<b>${Object.keys(B.kRule).filter(k=>B.kRule[k]).map(k=>RN[k]).join("・")}</b>`:""}${has("ku_display")&&B.draw.length?`　山札の上：${esc(CD(B.draw[B.draw.length-1]).n)}`:""}`;u.appendChild(t);
    handEls().forEach(([i,b2])=>{const c=B.hand[i];if(!c)return;const h=K.hrOf(c),o=document.createElement("span");o.className="a3cell";o.style.color=o.style.borderColor=hr+h>R.cap?"#ff5a6a":h<0?"#7cffb2":"#ffb3c0";o.textContent=(hr+h>R.cap?"⚠":"")+(h>0?"+":"")+h;b2.appendChild(o)})}
  if(G.char==="LUNA"&&ALLY3.luna&&B.sky){/* ★v0.32 月と夜空（design 20-1・20-2）：月の名前・満月まであと何番・3×3 の夜空（仮の字と点。部品はグラフィック班待ち）・カードの左上に灯るマス */
    const L=ALLY3.luna,p=L.moon(),left=(3-p+4)%4,MI=["🌑","🌒","🌓","🌕"];
    const t=document.createElement("div");t.className="a3staff";Object.assign(t.style,{left:"184px",top:"226px",whiteSpace:"nowrap"});
    const sc=S.sel>=0&&B.hand[S.sel]?B.hand[S.sel]:null,sm=sc?L.sim(sc):null,R2=L.rule().sky,fm=(sc&&CD(sc).fx.some(f=>f[0]==="oracle")&&!B.oracleUsed)||p===3?R2.fullMoonMul+(has("l_starnote")?0.5:0):1;
    const lnC=new Set(sm?[].concat(...sm.lines,...sm.tris):[]),nxC=new Set(sm?sm.cells:[]),lineLeft=Math.max(0,R2.lineMaxTurn-ALLY3.turnVal("lineN"));
    const eff=sm?[sm.lines.length?`流れ星 ${Math.round((R2.line+(ALLY3.treeTopIs("l_ryusei")?3:0))*fm)}×${Math.min(sm.lines.length,lineLeft)}`:"",sm.tris.length?`三角 防御 ${Math.round((R2.tri+(ALLY3.treeTopIs("l_ryusei")?4:0))*fm)}`:"",sm.full?`完成 ${Math.round(R2.full*fm*(ALLY3.treeTopIs("l_shin")?1.5:1))}`:""].filter(Boolean).join("・"):"";
    t.innerHTML=`<span class="a3sl" style="font-size:14px">${MI[p]}</span>${L.name()}${p===3?"<b>満月！</b>":`<b style="color:#cde">満月まで あと${left}番</b>`}<span class="a3sky">${B.sky.map((v,k)=>`<i class="${v?"on":nxC.has(k+1)?"nx":""}${lnC.has(k+1)?" ln":""}"></i>`).join("")}</span>${eff?`<b>${eff}</b>`:""}`;u.appendChild(t);
    handEls().forEach(([i,b2])=>{const c=B.hand[i];if(!c)return;const st=CD(c).star;if(st==null)return;const o=document.createElement("span");o.className="a3cell";o.textContent=st==="any"?"★":st==="diag"?"╲":st;b2.appendChild(o)})}
  if(G.char==="RIN"&&ALLY3.rin&&B.rinInit){/* ★v0.31 弓と駒（design 19-2）：駒・残る番・間合い・次の段まで（仮の字。盤と駒の部品はグラフィック班待ち） */
    const PS={rook:"♜",bishop:"♝",knight:"♞",queen:"♛"},PN={rook:"ルーク",bishop:"ビショップ",knight:"ナイト",queen:"クイーン"},R=ALLY3.rin,th=R.rule().piece.th,n=B.cards+ALLY3.turnVal("extraN"),PI=["rook","bishop","knight","queen"],ci=PI.indexOf(B.piece),keep=ci>=0&&n<th[ci]?th[ci]-n:0,nx=th.find((v,i)=>v>n&&i>ci);
    const t=document.createElement("div");t.className="a3staff";Object.assign(t.style,{left:"184px",top:"236px",whiteSpace:"nowrap"});
    t.innerHTML=`<span class="a3sl">${B.piece?PS[B.piece]:"□"}</span>${B.piece?`${PN[B.piece]} ${"●".repeat(B.pieceT)}`:"駒なし"}　🏹 間合い ${B.range}（${["近","近め","中","遠","遠"][B.range]}）${keep?`<b>あと${keep}枚で${PN[B.piece]}を保つ</b>`:nx?`<b>あと${nx-n}枚で${PN[PI[th.indexOf(nx)]]}</b>`:"<b>クイーン！</b>"}`;u.appendChild(t)}
  if(G.char==="SORA"&&B.staff&&ALLY3.notes){/* ★v0.30 五線と音符（design 17-2）：手札の上に8つの丸・並び（上り・強音）の字・カードの右上に音色の丸 */
    const N=ALLY3.notes,L=N.cap(),st=B.staff,p=N.pats(),C={r:"#ff5a6a",b:"#4aa8ff",g:"#5be37a",w:"#f4f4f4"};
    const t=document.createElement("div");t.className="a3staff";Object.assign(t.style,{left:"184px",top:"236px"});
    /* ★v0.37 締めを触ると、使う音符が光る・並びの札と使う数（design 17 の答え⑥） */
    const sc=S.sel>=0&&B.hand[S.sel]?B.hand[S.sel]:null,sd=sc?CD(sc):null,use=new Set();let un=0,ucol=null;
    if(sd&&sd.fin){const f=sd.fx[0]||[];ucol=f[0]==="finAll"||f[0]==="finHits"?f[2]:f[0]==="finOnkai"?"b":f[0]==="symphony"?"all":null;const mx=f[0]==="finOnkai"?2:99;
      if(ucol==="all")st.forEach((_,k)=>use.add(k));else if(ucol){for(let k=st.length-1;k>=0&&un<mx;k--)if(st[k]===ucol){use.add(k);un++}for(let k=st.length-1;k>=0&&un<mx;k--)if(st[k]==="w"&&!use.has(k)){use.add(k);un++}}if(ucol==="all")un=st.length}
    const pf=sd&&sd.fin&&ucol&&ucol!=="all"?N.fin?(()=>{const q=p;return[q.up?`上り ×${ALLY3.treeTopIs("s_waon")?2:(RULE().notes||{}).up||1.5}`:"",q.strong&&(q.strong===ucol||q.strong==="w")?`強音 +${ALLY3.treeTopIs("s_tempo")?3:(RULE().notes||{}).strong||2}`:""].filter(Boolean).join("・")})():"":"";
    t.innerHTML=`<span class="a3sl">♪</span>`+Array.from({length:L},(_,i)=>{const c=st[i];return`<i class="${use.has(i)?"use":""}" style="${c?`background:${C[c]}`:""}"></i>`}).join("")+(sd&&sd.fin?`<b>使う ${un}${pf?"・"+pf:""}</b>`:p.n?`<b>${[p.up?"上り":"",p.strong?"強音":""].filter(Boolean).join("・")}</b>`:"");u.appendChild(t);
    handEls().forEach(([i,b2])=>{const c=B.hand[i];if(!c)return;const d=CD(c),col=d.col||(d.t==="atk"?"r":d.t==="grd"?"g":d.t==="drw"?"b":"w");if(col==="x")return;const o=document.createElement("i");o.className="a3col"+(d.fin?" fin":"");o.style.background=C[col];b2.appendChild(o)})}
  if(G.char==="KURO"&&ALLY3.kuro&&(RULE().restBlk||RULE().baseBlk)&&!B.over){/* ★v0.44 番の終わりのボタンの横に「すまし顔 +6」（シナリオ班へ） */const eb=[...u.querySelectorAll("button")].find(b=>/doEndTurn|endTurnUi|turnEndBtn/.test(b.getAttribute("onclick")||"")||/ターン.?終了/.test(b.textContent));const rb=ALLY3.kuro.restBlk(B.hr||0);
    if(eb){/* ★v0.77 BUG-55：ボタンの横（上）の3行が「↓シフト」にのる → 防御・すまし顔は「ターン終了」ボタンの中の上と下の余白に1行ずつ（ほかのボタンにかからない）。盾はメーターの行へ（「刃」の横） */
      const T=TEXT.ui||{},bb=RULE().baseBlk||0,rs=rb?(T.kuro_rest_line2||T.kuro_rest_btn||"すまし顔 +{n}").replace("{n}",rb):`${T.kuro_rest_name||"すまし顔"} なし`,top=parseFloat(eb.style.top),h=parseFloat(eb.style.height)||54;
      const mk=(txt,y)=>{const t=document.createElement("div");t.className="a3rest";t.textContent=txt;t.title=T.kuro_rest_help||"";Object.assign(t.style,{left:eb.style.left,top:y+"px",width:eb.style.width,lineHeight:"10px",fontSize:"9px",whiteSpace:"nowrap",background:"none",color:"#1b1d10",fontWeight:"bold",zIndex:7});u.appendChild(t);for(const fs of [8,7]){if(t.scrollWidth<=t.clientWidth+1)break;t.style.fontSize=fs+"px"}return t};
      if(bb){mk((T.kuro_rest_line1||"防御 +{a}").replace("{a}",bb),top+2);if(rb)mk(rs,top+h-12)}else mk(rs,top+2)}}
  if(A3.partsOK)A3.skin(u);
  if(A3.bandOn&&A3.chars.includes(G.char))A3.band(u);/* ★v0.81 ③の6人とも（左はしは走りかた） *//* ★v0.80 資源の行（design・AD の決まり・10人共通） */
 }catch(e){}}}
/* MIO は走りかたを選ばない（CVT）：走りかたの画面は1つだけ */
if(typeof showModes==="function"){const _sm=showModes;showModes=function(){_sm();const bs=[...document.querySelectorAll("#ui .mdcard")];if(curChar()==="KURO"){/* ★v0.33 KURO：走りかたは「自転車」1つ（中は MT） */if(bs[1]){bs[1].style.display="none";bs[1].classList.remove("main")}if(bs[0]){bs[0].style.left="185px";bs[0].classList.add("main");const h=bs[0].querySelector(".mdh"),n=bs[0].querySelector(".mdn"),t=bs[0].querySelectorAll(".mdt");if(h)h.textContent="自転車";if(n)n.textContent="心拍で走る";if(t[0])t[0].textContent="ギアも回転もない。カードは心拍で払う。";if(t[1])t[1].textContent="200 をこえると転倒。グリッチを積んで撃つ。"}return}if(curChar()!=="MIO")return;
  if(bs[0]){bs[0].style.display="none";bs[0].classList.remove("main")}if(bs[1]){bs[1].style.left="185px";bs[1].classList.add("main");const h=bs[1].querySelector(".mdh"),n=bs[1].querySelector(".mdn"),t=bs[1].querySelectorAll(".mdt");/* ★v0.8 CVT＝AT の札（パーキングレンジが使える） */
    if(h)h.textContent="CVT";if(n)n.textContent="段のない変速";if(t[0])t[0].textContent="シフトはない。回転をいちばん強い所に保つ。";if(t[1])t[1].textContent="ガソリン2で1枚引ける（パーキングレンジ）。";}}}
/* ★v0.18 design v0.11.66：MIO の札はどれも「CVT」（走りかたの帯・AT 版のカードの印）。ドライブモードは MIO には出さない（①が入れたら showDrive などをここで止める） */
A3.cvtNow=()=>{const r=RULE().cvt;if(!r||!B)return null;const v=B.rpm,m=(v>=r.clo&&v<=r.chi)?r.cm:(v>=r.lo&&v<=r.hi)?r.bm:1;return{lo:r.clo,hi:r.chi,m}};
if(typeof modeBanner==="function"){const _mb=modeBanner;modeBanner=function(){if(!(G&&G.char==="MIO"))return _mb();const c=A3.cvtNow()||{lo:0,hi:0,m:1};return[`CVT：強い所 ${c.lo}〜${c.hi}`,`今 ×${c.m}・ブローしない`]}}
if(typeof hud==="function"){const _hd=hud;hud=function(){const h=_hd.apply(this,arguments);return G&&G.char==="MIO"?h.replace('<span class="md">AT</span>','<span class="md">CVT</span>'):h}}
A3.cvtLabels=()=>{if(G&&G.char==="KURO")document.querySelectorAll('#ui .md').forEach(e=>{if(e.textContent==="MT")e.textContent="BIKE"});if(G&&G.char==="MIO")document.querySelectorAll('#ui .md').forEach(e=>{if(e.textContent==="AT")e.textContent="CVT"})};
if(typeof modeBanner==="function"){const _mb2=modeBanner;modeBanner=function(){if(G&&G.char==="KURO")return["自転車：カードは心拍で払う","200 をこえると転倒"];return _mb2()}}
{const _hd2=hud;hud=function(){const h=_hd2.apply(this,arguments);return G&&G.char==="KURO"?h.replace(/<span class="md">MT<\/span>/,'<span class="md">BIKE</span>'):h}}
if(typeof modeMark==="function"){const _mm=modeMark;modeMark=function(c){const r=_mm(c);return r==="AT"&&G&&G.char==="MIO"?"CVT":r}}
if(typeof modePick==="function"){const _mp=modePick;modePick=function(m){if(curChar()!=="MIO")return _mp(m);const l=PRF().lastMode;_mp("AT");try{if(l&&PRF().lastMode!==l){PRF().lastMode=l;SAVE.auto()}}catch(e){}}}/* ★v0.8 MIO の CVT＝AT。ほかの子の「前に選んだ走りかた」は変えない */

/* ★v0.39 新4人の画面の部品（グラフィック班 newfour・AD OK・revremit_ui_newfour_parts.json）。部品が読めたら字の仮の形を絵に置きかえる（読めなければ仮のまま） */
const PP=n=>`assets/c2/ui/c2/newfour/revremit_ui_${n}.png`;A3.partsOK=false;{const im=new Image();im.onload=()=>{A3.partsOK=true};im.src=PP("sora_staff")}
const IMG=(n,x,y,w,h,cls)=>`<img class="px a3pi ${cls||""}" src="${PP(n)}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px" alt="">`;
A3.skin=function(u){const t=u.querySelector(".a3staff");const ch=G.char;const lab=t?[...t.querySelectorAll("b")].map(b=>b.outerHTML).join(""):"";
  const box=(w,h,inner,extra)=>{const d=document.createElement("div");d.className="a3sk";Object.assign(d.style,{left:t?t.style.left:"184px",top:t?t.style.top:"236px"});d.innerHTML=`<span class="a3box" style="width:${w}px;height:${h}px">${inner}</span>${extra||""}`;if(t)t.replaceWith(d);else u.appendChild(d);return d};
  if(ch==="SORA"&&t){const is=[...t.querySelectorAll("i")],st=B.staff||[],CN={r:"red",b:"blue",g:"green",w:"white"};
    box(208,30,IMG("sora_staff",0,0,208,30)+st.map((c,k)=>IMG("sora_note_"+CN[c]+(is[k]&&is[k].classList.contains("use")?"_lit":""),Math.min(196,30+22*k-6),9,12,12)).join(""),lab?`<span class="a3lab">${lab}</span>`:"");
    u.querySelectorAll(".a3col").forEach(o=>{const m=/background:\s*([^;]+)/.exec(o.getAttribute("style")||"");const col=(o.style.background||"").replace(/\s/g,"");const k={"rgb(255,90,106)":"red","rgb(74,168,255)":"blue","rgb(91,227,122)":"green","rgb(244,244,244)":"white"}[col]||"white";const im=document.createElement("img");im.className="px a3cn"+(o.classList.contains("fin")?" fin":"");im.src=PP("sora_cardnote_"+k);o.replaceWith(im)})}
  if(ch==="RIN"&&t&&A3.rin){const PI=["rook","bishop","knight","queen"],R=A3.rin,mx=R.rule().range.max,rg=Math.min(3,B.range),cell=rg>=3?"far":rg===2?"mid":"near";
    const sq=IMG("rin_square",0,0,28,28)+(B.piece?IMG("rin_piece_"+B.piece,4,3,20,20):"")+Array.from({length:R.turns(B.piece||"rook")},(_,k)=>IMG(k<B.pieceT&&B.piece?"rin_turn_dot_on":"rin_turn_dot_off",2+k*6,30,5,5)).join("");
    const rf=IMG("rin_range_frame",34,3,128,22)+[0,1,2].map(k=>k<rg?IMG("rin_range_cell_"+cell,34+[21,56,91][k],10,30,8):"").join("")+`<span class="a3rt" style="left:${34+21}px;top:-9px">${["近","近め","中","遠","遠"][Math.min(4,B.range)]}（${B.range}）</span>`;
    box(166,36,sq+rf,lab?`<span class="a3lab">${lab}</span>`:"");
    handEls().forEach(([i,b2])=>{const c=B.hand[i];if(c&&CD(c).bow){const im=document.createElement("img");im.className="px a3bow";im.src=PP("rin_bow");b2.appendChild(im)}})}
  if(ch==="LUNA"&&t&&A3.luna&&B.sky){const L=A3.luna,p=L.moon(),is=[...t.querySelectorAll(".a3sky i")],MN=["new","crescent","half","full"];
    const sky=IMG("luna_sky",24,0,44,44)+B.sky.map((v,k)=>{const x=24+4+13*(k%3),y=4+13*Math.floor(k/3),c=is[k]?is[k].className:"";return(v?IMG("luna_star_on",x,y,12,12):c.indexOf("nx")>=0?IMG("luna_cell_hint",x,y,12,12):"")+(c.indexOf("ln")>=0?`<span class="a3gl" style="left:${x}px;top:${y}px;background-image:url(${PP("luna_cell_glow_sheet")})"></span>`:"")}).join("");
    const bx=box(70,44,IMG("luna_moon_"+MN[p],0,12,20,20)+sky,`<span class="a3lab">${esc(L.name())}${lab}</span>`);bx.style.top="220px";
    u.querySelectorAll(".a3cell").forEach(o=>{const v=o.textContent,k=v==="★"?"any":v==="╲"?"diag":v;if(!/^([1-9]|any|diag)$/.test(k))return;const im=document.createElement("img");im.className="px a3cm";im.src=PP("luna_cardmark_"+k);o.replaceWith(im)})}
  if(ch==="KURO"&&t&&A3.kuro){const K=A3.kuro,hr=B.hr||0,gm=K.glMax(),gl=B.gl||0,bt=hr>=170?"high":hr>=120?"mid":"low";
    const hf=IMG("kuro_heart_frame",0,0,128,30)+`<span class="a3beat" style="background-image:url(${PP("kuro_beat_"+bt)});animation-duration:${Math.max(.25,60/Math.max(60,hr)*2).toFixed(2)}s"></span>`+IMG("kuro_heart_icon",4,4,8,8)+`<span class="a3bpm" style="color:${hr>=170?"#ff5a6a":"#fff"}">${hr}</span>`;
    const gc=Array.from({length:gm},(_,k)=>k<gl?`<span class="a3gc" style="left:${134+k*10}px;background-image:url(${PP("kuro_glitch_cell_on_sheet")})"></span>`:IMG("kuro_glitch_cell_off",134+k*10,8,9,14)).join("");
    box(134+gm*10,30,hf+gc,lab?`<span class="a3lab">${lab}</span>`:"");
    u.querySelectorAll(".a3cell").forEach(o=>{if(o.textContent.indexOf("⚠")===0){const im=document.createElement("img");im.className="px a3wn";im.src=PP("kuro_warn");o.prepend(im);o.firstChild.nextSibling&&(o.firstChild.nextSibling.textContent=o.firstChild.nextSibling.textContent.replace("⚠",""))}})}};
/* 演出のシート（転倒・グリッチ・トリック・昇格・星座の完成・並び）：画面の上に重ねて1回流す */
A3.fx=function(n,fw,fh,frames,x,y,sc,ms,cols){if(!A3.partsOK||typeof document==="undefined"||(B&&B.sim))return;const ui=document.querySelector("#ui");if(!ui)return;const d=document.createElement("div");d.className="a3fx";cols=cols||frames;
  Object.assign(d.style,{left:x+"px",top:y+"px",width:fw+"px",height:fh+"px",backgroundImage:`url(${PP(n)})`,transform:`scale(${sc||1})`,transformOrigin:"0 0"});ui.appendChild(d);let f=0;const dt=(ms||600)/frames;
  const st=()=>{d.style.backgroundPosition=`-${(f%cols)*fw}px -${Math.floor(f/cols)*fh}px`};st();const iv=setInterval(()=>{f++;if(f>=frames){clearInterval(iv);d.remove();return}st()},dt)};
CSS.textContent+=`.a3sk{position:absolute;z-index:6;pointer-events:none;display:flex;align-items:flex-start;gap:6px}.a3box{position:relative;display:inline-block}.a3pi{position:absolute;image-rendering:pixelated}.a3lab{font-size:11px;color:#fff;background:rgba(0,0,0,.55);padding:1px 4px;border-radius:3px;white-space:nowrap}.a3lab b{color:#ffd54a;margin-left:4px}
.a3cn{position:absolute;right:3px;top:3px;width:9px;height:9px;z-index:5;pointer-events:none}.a3cn.fin{outline:1px solid #ffd54a}.a3bow{position:absolute;right:2px;top:2px;width:16px;height:16px;z-index:5;pointer-events:none}.a3cm{position:absolute;left:2px;top:14px;width:11px;height:11px;z-index:5;pointer-events:none}.a3wn{width:14px;height:12px;vertical-align:middle}
.a3rt{position:absolute;font-size:9px;color:#cfe}.a3gl{position:absolute;width:12px;height:12px;background-size:48px 12px;animation:a3gl .5s steps(4) infinite}@keyframes a3gl{to{background-position:-48px 0}}
.a3beat{position:absolute;left:16px;top:4px;width:96px;height:22px;background-repeat:repeat-x;background-size:32px 22px;animation:a3beat 1s linear infinite}@keyframes a3beat{from{background-position:0 0}to{background-position:-32px 0}}
.a3bpm{position:absolute;left:100px;top:8px;font-size:11px;font-weight:bold;text-shadow:0 0 2px #000}.a3gc{position:absolute;top:8px;width:9px;height:14px;background-size:36px 14px;animation:a3gl .4s steps(4) infinite}
.a3rest{position:absolute;z-index:6;pointer-events:none;font-size:10px;text-align:center;color:#7cffb2;text-shadow:0 0 2px #000}.a3fx{position:absolute;z-index:30;pointer-events:none;image-rendering:pixelated}@keyframes a3fx{to{background-position:var(--fx) 0}}`;
/* ★v0.38 KURO の選ぶ画面（design 16 の答え）：ドラフティング・道化札・隠し札・空振り誘い・グリッチ・トリック。取り消しなし・時間制限なし・オート／フルオートは③の自動 */
A3.kuroPickFor=function(i){const c=B.hand[i],id=(A3.pickAlias&&A3.pickAlias[c.id])||c.id,K=A3.kuro;/* ★v1.8 合成・ディグは材料の選ぶ画面を使う */const card=x=>cardSmall(x,{cost:0,gas:gasOf(x),gasNow:B.gas,attrs:'style="position:relative;display:inline-block"'});
  if(id==="ku_drafting"){const L=B.draw.length;if(L<2)return null;const t=[B.draw[L-1],B.draw[L-2]];return{ttl:"山札の上2枚：手札にする1枚をえらぶ（もう1枚は山札の下へ）",opts:t.map(x=>({v:x.uid,h:card(x)}))}}
  if(id==="ku_doukefuda"){const top=B.draw[B.draw.length-1];if(!top)return null;const hs=B.hand.filter((x,k)=>k!==i);if(!hs.length)return null;return{ttl:`山札の上は「${esc(CD(top).n)}」：すりかえる手札をえらぶ`,top:card(top),opts:hs.map(x=>({v:x.uid,h:card(x)}))}}
  if(id==="ku_kakushifuda"){const hs=B.hand.filter((x,k)=>k!==i&&CD(x).r!=="SK"&&!x.tmp);if(!hs.length)return null;return{ttl:(A3.pickTtl&&A3.pickTtl[c.id])||"写す手札をえらぶ（写しは打つと消える）",opts:hs.map(x=>({v:x.uid,h:card(x)}))}}
  if(id==="ku_karaburi"){const e=B.e,p=curPat(e),cur=e.pi%p.length;const dmg=a=>a[0]==="atk"?a[1]:a[0]==="multi"?a[1]*a[2]:a[0]==="prc"?a[1]*1.5:0;let bj=-1,bd=1e9;if(RULE().feintAtk)bj=K.feintTo(e);/* ★v0.58 攻撃どうしだけ */else p.forEach((a,j)=>{if(j!==cur&&dmg(a)<bd){bd=dmg(a);bj=j}});if(bj<0)return null;
    const tx=a=>esc(typeof intentText==="function"?intentText(e,a):(({atk:"攻撃",multi:"連撃",prc:"貫通",blk:"防御",rev:"回転",jam:"ジャマ",apd:"強化"}[a[0]]||a[0])+(typeof a[1]==="number"?" "+a[1]:"")+(a[2]&&a[0]==="multi"?"×"+a[2]:"")));
    return{ttl:"敵の次の行動をえらぶ",opts:[{v:cur,h:`<div class="kpi">今の予告<br><b>${tx(p[cur])}</b></div>`},{v:bj,h:`<div class="kpi">すりかえ<br><b>${tx(p[bj])}</b></div>`}]}}
  if(id==="ku_glitch"){const rs=[["half","心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチ 15 まで"],["pick2","引くときは2枚から選ぶ"]],T=TEXT.ui||{};const done=B.kRule||{};
    return{ttl:"ルールを1つ書きかえる",opts:rs.map(([k,n],j)=>({v:k,dis:!!done[k],h:`<div class="kpi">${esc(T["kuro_rule_"+(j+1)]||n)}</div>`}))}}
  if(id==="ku_og_douke"){/* ★v1.5 design 26-4：夜宴道化＝書きかえを {v} つ自分で選ぶ（前に選んだものは灰色） */const rs=[["half","心拍が半分"],["noFall","転倒を1回なしに"],["gl15","グリッチ 15 まで"],["pick2","引くときは2枚から選ぶ"]],T=TEXT.ui||{},done=B.kRule||{};
    const n=Math.min(c.up?CD(c).vu||CD(c).v:CD(c).v,rs.filter(r=>!done[r[0]]).length);if(n<=0)return null;
    return{multi:n,ttl:`ルールを書きかえる（${n} つえらぶ）`,opts:rs.map(([k,nm],j)=>({v:k,dis:!!done[k],h:`<div class="kpi">${esc(T["kuro_rule_"+(j+1)]||nm)}</div>`}))}}
  return null};
{const kp0=A3.kuroPickFor;A3.kuroPickFor=function(i){for(const f of(A3.pickPre||[])){const R=f(i);if(R!==undefined)return R}return kp0.apply(this,arguments)}}/* ★v2.0 ld から選ぶ画面を足す所（pickPre：undefined ならいつもの画面） */
A3.kuroModal=function(R,go){modal(`<div class="rotp"><div class="h">${R.ttl}</div>${R.top?`<div class="small">山札の上</div><div class="rotcards">${R.top}</div>`:""}<div class="rotcards kpk">${R.opts.map((o,k)=>`<button class="kpb${o.dis?" dis":""}" ${o.dis?"disabled":`onclick="A3K(${k})"`}>${o.h}</button>`).join("")}</div></div>`);
  window.A3K=k=>{closeModal();SND.se("ui_ok");go(R.opts[k].v)};const m=$("#modal .modal .box");if(m)m.classList.add("wide");SND.se("ui_ok")};
if(typeof doPlay==="function"){const _dpk=doPlay;doPlay=function(i,shift,ok){try{const c=B&&B.hand[i];
  if(c&&G.char==="KURO"&&A3.kuro&&!S.kuroPicked&&A3.human()&&preview(c).ok){const R=A3.kuroPickFor(i);
    if(R&&R.multi){const got=[],step=()=>{const R2=Object.assign({},R,{ttl:R.ttl+(got.length?`　あと ${R.multi-got.length}`:""),opts:R.opts.map(o=>Object.assign({},o,{dis:o.dis||got.includes(o.v)}))});
      A3.kuroModal(R2,v=>{got.push(v);if(got.length<R.multi&&R2.opts.some(o=>!o.dis&&o.v!==v))return step();B.kPicks=got;S.kuroPicked=true;try{doPlay(i,shift,ok)}finally{S.kuroPicked=false;if(B)B.kPicks=null}})};step();return}
    if(R){A3.kuroModal(R,v=>{B.kPick=v;S.kuroPicked=true;try{doPlay(i,shift,ok)}finally{S.kuroPicked=false;if(B)B.kPick=null}});return}}}catch(e){}
  return _dpk(i,shift,ok)}}
/* グリッチ・トリック ④：引いたあと「2枚から選ぶ」小窓（引いた1枚と山札の次の1枚） */
A3.kuroPend=function(tr){if(!B||B.over||G.char!=="KURO"||!(B.kPend&&B.kPend.length))return;if(document.querySelector("#modal .modal")||busy()){if((tr||0)<40)setTimeout(()=>A3.kuroPend((tr||0)+1),200);return}const q=B.kPend.shift();
  const hi=B.hand.findIndex(c=>c.uid===q.d),di=B.draw.findIndex(c=>c.uid===q.alt);if(hi<0||di<0)return A3.kuroPend();
  const card=x=>cardSmall(x,{cost:0,gas:gasOf(x),gasNow:B.gas,attrs:'style="position:relative;display:inline-block"'});
  A3.kuroModal({ttl:"2枚から選ぶ（もう1枚は山札の上へ）",opts:[{v:0,h:card(B.hand[hi])},{v:1,h:card(B.draw[di])}]},v=>{if(v===1){const h=B.hand[hi],d=B.draw.splice(di,1)[0];B.hand[hi]=d;B.draw.push(h);addLog(`2枚から選ぶ：「${CD(d).n}」`)}renderBattle()})};
/* KURO の戦闘ではエンジン音（engineBurst・レッド）を鳴らさない（audio-list 19-5） */
if(typeof SND!=="undefined"){const eb=SND.engineBurst,rd=SND.red;SND.engineBurst=function(){if(G&&G.char==="KURO")return;return eb.apply(this,arguments)};SND.red=function(){if(G&&G.char==="KURO")return;return rd.apply(this,arguments)};for(const k of ["limiter","blow"]){const f=SND[k];if(f)SND[k]=function(){if(G&&G.char==="KURO")return;return f.apply(this,arguments)}}/* v0.99 audio 19-5：overrev・blow も呼ばない */}
/* ★v0.37 LUNA：「好きなマス」は自分で選ぶ（design 20 の答え④）。打つと夜空の小窓：空きマスが光り、タップで置く。おすすめのマスは金の縁、外をタップするとおすすめに置く。オート・フルオートは③の自動 */
if(typeof doPlay==="function"){const _dp=doPlay;doPlay=function(i,shift,ok){try{const c=B&&B.hand[i];
  if(c&&G.char==="LUNA"&&ALLY3.luna&&!S.lunaPicked&&!(typeof AUTO!=="undefined"&&AUTO.on)&&preview(c).ok){const n=ALLY3.luna.anyN(c);
    if(n>0&&(B.sky||[]).some(v=>!v)){S.luna={i,shift,ok,n,picks:[]};lunaRender();return}}}catch(e){}
  return _dp(i,shift,ok)}}
ALLY3.ok1=()=>{const t=Date.now();if(t-(ALLY3._okT||0)<250)return;ALLY3._okT=t;SND.se("ui_ok")};/* 同じ瞬間に重ねない */
window.lunaRender=function(){const R=S.luna,L=ALLY3.luna,c=B.hand[R.i];const sk=(B.sky||[]).slice();
  /* 選んだマスまでを置いた夜空で、次のおすすめ */const sim=L.sim(c,R.picks);const cur=(B.sky||[]).slice();R.picks.forEach(q=>cur[q-1]=1);const rec=L.autoPick(cur);
  const cells=Array.from({length:9},(_,k)=>{const q=k+1,on=sk[q-1],pk=R.picks.includes(q);return`<button class="lsc${on?" on":pk?" pk":" open"}${!on&&!pk&&q===rec?" rec":""}" ${on||pk?"disabled":`onclick="lunaCell(${q})"`}>${pk?"★":on?"✦":q}</button>`}).join("");
  modal(`<div class="lspick" onclick="if(event.target===this)lunaCell(0)"><div class="h">星を置くマスをえらぶ（あと ${R.n-R.picks.length}）</div><div class="lsg">${cells}</div>
   <div class="small">金の縁＝おすすめ。外をタップするとおすすめに置く。${sim.lines.length?`　流れ星 ${sim.lines.length}本`:""}${sim.tris.length?`　三角 ${sim.tris.length}`:""}${sim.full?"　星座の完成！":""}</div>
   <div class="row"><button class="main" onclick="lunaCell(0)">おすすめに置く</button><button onclick="S.luna=null;closeModal();SND.se('ui_cancel')">やめる</button></div></div>`);if(!R.snd){R.snd=1;ALLY3.ok1()}};/* ★v1.3 QA：決定の音は1回（開いたときだけ） */
window.lunaCell=function(q){const R=S.luna;if(!R)return;const cur=(B.sky||[]).slice();R.picks.forEach(x=>cur[x-1]=1);if(!q)q=ALLY3.luna.autoPick(cur);if(q>0&&!cur[q-1])R.picks.push(q);
  ALLY3.ok1();if(R.picks.length<R.n&&cur.filter(v=>!v).length>1){lunaRender();return}
  S.luna=null;closeModal();B.lunaPicks=R.picks.slice();S.lunaPicked=true;try{doPlay(R.i,R.shift,R.ok)}finally{S.lunaPicked=false;if(B)B.lunaPicks=null}};
})();

/* ★v0.70 図鑑のカードの説明に、③のカードのフレーバー（flav）を足す（踏みこみ・text v0.22.40）。奥義（OG）は①のまま */
/* codex.js は ally3_ui.js より後に読まれるので、読みこみが終わってから包む */
if(typeof addEventListener==="function")addEventListener("DOMContentLoaded",()=>{if(typeof cdxDetailHTML!=="function")return;const cd0=cdxDetailHTML;cdxDetailHTML=function(t,L){let h=cd0.apply(this,arguments);try{const x=L.find(y=>y.id===CDX.sel),d=x&&CARDS[x.id];if(t==="card"&&x.seen&&d&&d.flav&&d.r!=="OG"){const f=`<div class="cdxflav">${rr2Esc(d.flav)}</div>`;h=h.includes('<div class="small dim cdxfoot">')?h.replace('<div class="small dim cdxfoot">',f+'<div class="small dim cdxfoot">'):h+f}}catch(e){}return h}})

/* ★design 22章（v0.11.103）：◎（starter）＝図鑑のカードとデッキの画面の名前の右に札「はじめから」。読み（yomi）＝図鑑のカードの名前の上にルビ。
   戦闘の手札・報酬・ショップ・用語のヘルプには出さない。図鑑は②・デッキの画面は①が作る＝ここは③の写しで出す形（データが正本） */
if(globalThis.ALLY3)ALLY3.isSt=(d,c)=>{if(!d)return false;if(!Array.isArray(d.starter))return!!d.starter;c=c||(()=>{try{return(typeof PRF==="function"&&PRF().char)||(G&&G.char)}catch(e){return null}})();return d.starter.includes(c)};
if(globalThis.ALLY3)ALLY3.stTag=()=>`<span class="a3st">${esc(((typeof TEXT!=="undefined"&&TEXT.ui)||{}).starter_tag||"はじめから")}</span>`;
if(typeof document!=="undefined"){const st=document.createElement("style");st.textContent=`.a3gi{width:12px;height:12px;vertical-align:-2px;margin-right:1px;image-rendering:pixelated}.a3st{display:inline-block;font-size:9px;line-height:11px;padding:0 3px;margin-left:4px;border:1px solid #ffd54a;color:#ffd54a;border-radius:2px;vertical-align:middle;white-space:nowrap;font-weight:normal}
#rr2v .cdxh.a3ruby{line-height:normal;padding-top:2px}.a3ruby ruby rt{font-size:8px;line-height:9px;color:#9fd3ff;letter-spacing:0}.dr .nm .a3st{margin-left:3px;font-size:8px;padding:0 2px}`;document.head.appendChild(st)}
if(typeof addEventListener==="function")addEventListener("DOMContentLoaded",()=>{
 if(typeof cdxDetailHTML==="function"){const cd1=cdxDetailHTML;cdxDetailHTML=function(t,L){let h=cd1.apply(this,arguments);try{const x=L.find(y=>y.id===CDX.sel),d=x&&CARDS[x.id];
   if(t==="card"&&x.seen&&d&&(d.yomi||ALLY3.isSt(d,d.own))&&!/<ruby|はじめから/.test(h)){/* ②の図鑑が出すようになったら③は出さない */const nm=rr2Esc(d.n)+(CDX.up?"+":""),a=`<div class="cdxh">${nm}</div>`;
     if(h.includes(a))h=h.replace(a,`<div class="cdxh${d.yomi?" a3ruby":""}">${d.yomi?`<ruby>${rr2Esc(d.n)}<rt>${rr2Esc(d.yomi)}</rt></ruby>${CDX.up?"+":""}`:nm}${ALLY3.isSt(d,d.own)?ALLY3.stTag():""}</div>`)}}catch(e){}return h}}
 if(typeof deckCardBox==="function"){const db0=deckCardBox;deckCardBox=function(id){let h=db0.apply(this,arguments);try{const d=CARDS[id];if(ALLY3.isSt(d)&&!/はじめから/.test(h)){/* ①（v0.22.118〜）が出していれば③は出さない */const a=`<div class="h">${esc(d.n)}</div>`;if(h.includes(a))h=h.replace(a,`<div class="h">${esc(d.n)}${ALLY3.stTag()}</div>`)}}catch(e){}return h}}
 if(typeof renderDeck==="function"){const rd0=renderDeck;renderDeck=function(){const r=rd0.apply(this,arguments);try{document.querySelectorAll("#dkl .dr").forEach(el=>{const m=/deckPick\('([^']+)'\)/.exec(el.getAttribute("onclick")||""),d=m&&CARDS[m[1]],nm=el.querySelector(".nm");if(ALLY3.isSt(d)&&nm&&!nm.querySelector(".a3st")&&!/はじめから/.test(el.textContent)){nm.insertAdjacentHTML("beforeend",ALLY3.stTag());/* 長い名前で入りきらない行は、名前の字を少し小さく */for(const fs of [11,10,9]){if(nm.scrollWidth<=nm.clientWidth+1)break;nm.style.fontSize=fs+"px"}}})}catch(e){}return r}}
});

/* ★v0.74 ③のカードの専用の絵（R-AD18 踏みこみ）：①のカードの絵は assets/manifest.json（ART_HAVE）かシートにあるものだけ出る。
   ③が渡す絵は、マニフェストに入るまで、読めたら ART_HAVE に足す（①がマニフェスト／シートに入れたら、この段は何もしない） */
ALLY3.cardArt=["ku_fumikomi"];
if(typeof addEventListener==="function")addEventListener("load",()=>{let n=0;const t=setInterval(()=>{if(++n>60)return clearInterval(t);if(!window.ART_HAVE||typeof CARD_ART!=="function")return;clearInterval(t);
  ALLY3.cardArt.forEach(id=>{const p=CARD_ART(id);if(ART_HAVE.has(p)||(window.CARD_SHEET_ART&&CARD_SHEET_ART[id]))return;const im=new Image();im.onload=()=>{ART_HAVE.add(p);try{if(typeof SCREEN!=="undefined"&&SCREEN==="battle"&&typeof renderBattle==="function")renderBattle()}catch(e){}};im.src=p})},250)});

{const A3=ALLY3,PP=n=>`assets/c2/ui/c2/newfour/revremit_ui_${n}.png`;
/* ★v0.80 資源の行（デザイン班・AD の決まり・10人共通）：左下のメーター枠のすぐ上の帯。1段 x4〜176・y233〜250／2段 y214〜250。
   左から 主の資源 → 倍率 → 守り・上乗せ。1つ＝アイコン 12×12＋数、1段に4つまで。字 10ドット白・黒縁、上がった数ライム・下がった数赤（ひと時）。
   下地は黒の半透明の帯（角は斜めの切り。部品はグラフィック班待ち＝今は CSS）。KURO は2段。SORA・RIN・LUNA は1段（前の「手札の上」の仮の板はやめる） */
A3.bandOn=true;
if(typeof document!=="undefined"){const st=document.createElement("style");st.textContent=`.a3band{position:absolute;left:4px;width:174px;z-index:6;pointer-events:none;background:#07080d;clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,0 100%);font:10px/12px var(--px,monospace);color:#fff;text-shadow:1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000}
.a3band .r{display:flex;align-items:center;gap:5px;height:17px;padding:0 4px;white-space:nowrap;overflow:hidden}.a3band .rs{position:absolute;right:0;top:0}.a3band .r.f{width:calc(100% - 8px)}.a3mslot{position:absolute;left:4px;width:44px;z-index:7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:0;border:1px solid #5d6680;background:#141826;color:#fff;font:10px/11px var(--px,monospace);text-shadow:1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000;cursor:pointer}.a3mslot b{font-size:10px}.a3mslot .dv{font-size:9px;color:#c8ff3a}.a3mslot.off .dv{color:#889}.a3mslot.drv{min-height:36px}.a3mslot.img{border:none;background:none;padding:0}.a3mslot.img .lo{position:absolute;left:0;top:19px;width:44px;height:17px;display:flex;align-items:center;justify-content:center}.a3mslot.img.off .lo{opacity:.55}.a3drvnote{position:absolute;z-index:8;pointer-events:none;white-space:nowrap;font:10px/12px var(--px,monospace);color:#c8ff3a;background:#07080d;padding:0 4px;text-shadow:1px 0 #000,-1px 0 #000,0 1px #000,0 -1px #000}.a3band .it{display:inline-flex;align-items:center;gap:2px}.a3band .ic{width:12px;height:12px;image-rendering:pixelated;flex:none}
.a3band .gl{display:inline-block;width:12px;height:12px;line-height:12px;text-align:center;font-size:9px;color:#000;border-radius:2px;flex:none;text-shadow:none}
.a3band .up{animation:a3up 1.4s}.a3band .dn{animation:a3dn 1.4s}@keyframes a3up{0%,60%{color:#c8ff3a}100%{color:#fff}}@keyframes a3dn{0%,60%{color:#ff4d5a}100%{color:#fff}}
.a3band .nt{display:inline-block;width:7px;height:7px;border-radius:50%;border:1px solid #556;margin-right:1px;box-sizing:border-box}.a3band .nt.use{outline:1px solid #fff}
.a3band .sky{display:inline-grid;grid-template-columns:repeat(3,4px);gap:1px;flex:none}.a3band .sky i{width:4px;height:4px;background:#2a3350}.a3band .sky i.on{background:#ffe680}.a3band .sky i.nx{background:#6a7cff}.a3band .sky i.ln{outline:1px solid #fff}`;document.head.appendChild(st)}
A3.bandPrev={};
A3.band=function(u){u.querySelectorAll(".a3staff,.a3sk").forEach(e=>e.remove());const ch=G.char,P=A3.bandPrev,T=TEXT.ui||{};
  const num=(k,v,txt)=>{const o=P[ch+k];let c="";if(typeof v==="number"&&o!=null&&o!==v)c=v>o?"up":"dn";P[ch+k]=v;return`<b class="${c}">${esc(txt!=null?txt:String(v))}</b>`};
  const ic=(n,alt,bg)=>A3.partsOK&&n?`<img class="ic" src="${PP(n)}" alt="">`:`<span class="gl" style="background:${bg||"#ccc"}">${alt}</span>`;
  const icf=(path,alt,bg)=>`<img class="ic" src="${path}" alt="" onerror="this.outerHTML='<span class=&quot;gl&quot; style=&quot;background:${bg}&quot;>${alt}</span>'">`;
  const it=x=>`<span class="it">${x}</span>`;let rows=[];
  if(ch==="KURO"){const K=ALLY3.kuro,R=K.R(),hr=B.hr||0,gm=K.glMax(),gl=B.gl||0,sc=S.sel>=0&&B.hand[S.sel],m0=RULE().hrMul?K.hrMul(hr):1,m1=sc&&RULE().hrMul?K.hrMul(Math.max(0,hr+K.hrOf(sc))):m0;
    const r1=[it(ic("kuro_heart_icon","♥","#ff5a6a")+num("hr",hr)+`<small>／${R.cap}</small>`)];if(RULE().hrMul)r1.push(it(RES("mult","×","#ffd54a")+num("mul",m0,m1!==m0?`${m0}→${m1}`:String(m0))));
    r1.push(it(RES("glitch","◆","#c38bff")+num("gl",gl,`${gl}／${gm}`)));
    const n=K.glAtk?K.glAtk(gl):0,g=K.glBlk?K.glBlk(gl):0,rb=RULE().restBlk&&!B.fallNext?K.restBlk(hr):0,r2=[];
    if(RULE().glitchAtk)r2.push(it(icf(NF("glitch_blade"),"刃","#c38bff")+num("blade",n,"+"+n)));if(RULE().glitchBlk)r2.push(it(icf(NF("glitch_shield"),"盾","#8fd8ff")+num("shield",g,"+"+g)));
    if(RULE().restBlk)r2.push(it(RES("face","顔","#7cffb2")+num("rest",rb,"+"+rb)));rows=[r1,r2.length?r2:null].filter(Boolean)}
  if(ch==="SORA"&&B.staff&&ALLY3.notes){const N=ALLY3.notes,L=N.cap(),st=B.staff,p=N.pats(),C={r:"#ff5a6a",b:"#4aa8ff",g:"#5be37a",w:"#f4f4f4"};
    rows=[[it(RES("note","♪","#9fd3ff")+Array.from({length:L},(_,i)=>`<i class="nt" style="${st[i]?`background:${C[st[i]]};border-color:${C[st[i]]}`:""}"></i>`).join("")+num("n",st.length,"")),p.n?it(`<b>${[p.up?"上り":"",p.strong?"強音":""].filter(Boolean).join("・")}</b>`):""].filter(Boolean)]}
  if(ch==="RIN"&&ALLY3.rin&&B.rinInit){const R=ALLY3.rin,th=R.rule().piece.th,n=B.cards+ALLY3.turnVal("extraN"),PI=["rook","bishop","knight","queen"],ci=PI.indexOf(B.piece),nx=th.find((v,i)=>v>n&&i>ci),PS={rook:"♜",bishop:"♝",knight:"♞",queen:"♛"};
    rows=[[it((B.piece?ic("rin_piece_"+B.piece,PS[B.piece],"#ffd54a"):`<span class="gl" style="background:#556">□</span>`)+num("pt",B.pieceT||0,B.piece?"●".repeat(B.pieceT):"—")),
      it(ic("rin_bow","🏹","#ffd54a")+num("range",B.range,["近","近め","中","遠","遠"][B.range])),
      it(`<span class="gl" style="background:#cde">↑</span>`+num("nx",nx?nx-n:0,nx?`あと${nx-n}`:"MAX"))]]}
  if(ch==="LUNA"&&ALLY3.luna&&B.sky){const L=ALLY3.luna,p=L.moon(),left=(3-p+4)%4,MN=["new","crescent","half","full"],sc=S.sel>=0&&B.hand[S.sel]?B.hand[S.sel]:null,sm=sc?L.sim(sc):null;
    const lnC=new Set(sm?[].concat(...sm.lines,...sm.tris):[]),nxC=new Set(sm?sm.cells:[]);
    rows=[[it(ic("luna_moon_"+MN[p],"☾","#ffe680")+num("moon",left,p===3?"満月":`あと${left}`)),it(`<span class="sky">${B.sky.map((v,k)=>`<i class="${v?"on":nxC.has(k+1)?"nx":""}${lnC.has(k+1)?" ln":""}"></i>`).join("")}</span>`+num("stars",B.sky.filter(Boolean).length,`${B.sky.filter(Boolean).length}／9`))]]}
  /* ★v0.81 design 23-1：帯の左はしは走りかた（MT 44×18「MT」＋パーフェクト連続の上乗せ／AT 44×36「AT」＋エコ／スポーツ（タップで切りかえ・番のはじめだけ）／CVT 44×18「CVT」／自転車（KURO）はなし）。その子の資源は x52 から。説明の2行（①の modeBanner）は帯に入れず、札をタップで小窓 */
  u.querySelectorAll(".modeban,.drvc").forEach(e=>e.remove());
  const bike=ch==="KURO",cvt=!!RULE().cvt,at2=!bike&&!cvt&&G.mode==="AT"&&typeof driveOn==="function"&&driveOn();
  /* ★v0.87 AD v1.16：MT の上乗せは 44×18 の MT の札のすぐ右（帯の行の頭）に「+0.1」、そのあと資源。26×11 の小さい札は使わない（右上の駆動の札用） */
  const paV=!bike&&!cvt&&G.mode==="MT"&&typeof perfChainAdd==="function"?perfChainAdd((B.perfChain||0)+1):0,lone=!rows.length&&paV;
  if(paV){const pi=it(`<b class="pa" style="color:#c8ff3a">+${paV}</b>`);if(rows.length)rows[0].unshift(pi);else rows=[[pi]]}
  const nRows=Math.max(rows.length,at2?2:1),h=nRows*17+(nRows>1?2:0),top=250-h;
  /* ★v0.82 AD v1.11 B：資源のない子（KAEDE・MIO）は帯を出さない＝札だけ */if(rows.length){const d=document.createElement("div");d.className="a3band";Object.assign(d.style,{top:top+"px",height:h+"px"});if(lone)d.style.width="auto";
  d.innerHTML=rows.map(r=>`<div class="r${bike?" f":""}" style="${bike?"":"margin-left:48px"}">${r.slice(0,4).join("")}</div>`).join("");u.appendChild(d)}
  if(!bike){const m=document.createElement("button");m.className="a3mslot"+(at2?" drv":"");const T=TEXT.ui||{},pa=typeof perfChainAdd==="function"?perfChainAdd((B.perfChain||0)+1):0;
    /* ★v0.85 走りかたの札の絵（グラフィック班・assets/c2/ui/c2/revremit_ui_drive_{mt,at,cvt}.png 44×18・_s 26×11・at_2row 44×36）。①の manifest にあれば絵、なければ字の札 */
    const DP=n=>`assets/c2/ui/c2/revremit_ui_drive_${n}.png`,hv=n=>window.ART_HAVE&&ART_HAVE.has(DP(n)),im=(n,w,h,st)=>`<img class="px" src="${DP(n)}" alt="" style="position:absolute;width:${w}px;height:${h}px;${st||""};image-rendering:pixelated">`;
    if(cvt)m.innerHTML=hv("cvt")?(m.classList.add("img"),im("cvt",44,18,"left:0;top:0")):"<b>CVT</b>";
    else if(G.mode==="AT"){if(at2){const k=B.drive||"eco",o=k==="eco"?"sport":"eco",can=typeof canDrive==="function"&&canDrive();if(!can)m.classList.add("off");const dv=`<span class="dv">${esc(T["drive_"+k]||(k==="eco"?"エコ":"スポーツ"))}</span>`;
        m.innerHTML=hv("at_2row")?(m.classList.add("img"),im("at_2row",44,36,"left:0;top:0")+`<span class="lo">${dv}</span>`):`<b>AT</b>${dv}`;m.dataset.o=o}
      else m.innerHTML=hv("at")?(m.classList.add("img"),im("at",44,18,"left:0;top:0")):"<b>AT</b>"}
    else m.innerHTML=hv("mt")?(m.classList.add("img"),im("mt",44,18,"left:0;top:0")):"<b>MT</b>";/* ★v0.87 上乗せは帯の行へ */
    Object.assign(m.style,{top:top+"px",height:(at2?h:Math.min(h,18))+"px"});if(!at2&&h>18)m.style.top=(250-18)+"px";
    /* ★v0.82 design 23-2：タップ＝番のはじめならエコ／スポーツの切りかえ（①の drivePick の真ん中の知らせは出さず、札のすぐ上に1行を1秒）。切りかえられないときと長押し＝説明の小窓（いつでも） */
    let lp=null,lpd=false;m.onpointerdown=()=>{lpd=false;lp=setTimeout(()=>{lpd=true;A3.modeTip(3000)},500)};m.onpointerup=m.onpointerleave=()=>{clearTimeout(lp)};
    m.onclick=e=>{e.stopPropagation();if(lpd)return;if(m.dataset.o&&canDrive()){A3.drvSwitch(m.dataset.o,top);return}A3.modeTip(3000)};u.appendChild(m);if(A3._drvNote&&Date.now()<A3._drvNote.t)A3.slotNote(A3._drvNote.s,top)}
  A3.modeTipAuto()};
/* 札をタップ：①の走りかたの説明の2行を小窓（toast2）。初めてその走りかたで走るランの最初の戦闘だけ、自動で3秒（プロフィールに印） */
A3.modeTip=function(ms){try{const L=modeBanner();if(L&&L.length)toast2(L.join("　"),56,ms||3000)}catch(e){}};
/* ★v0.82 印は①と同じ profile.modeHelp={MT:1,AT:1,CVT:1}（KURO は BIKE）。v0.81 の a3modeTip は移して消す */
A3.modeTipAuto=function(){try{const pf=PRF(),k=(G.char==="KURO"?"BIKE":RULE().cvt?"CVT":G.mode);pf.modeHelp=pf.modeHelp||{};if(pf.a3modeTip){Object.assign(pf.modeHelp,pf.a3modeTip);delete pf.a3modeTip}if(pf.modeHelp[k]||!B||B.pTurns>1||(G.st&&G.st.fights>0)||A3._tipShown)return;A3._tipShown=true;pf.modeHelp[k]=1;setTimeout(()=>A3.modeTip(3000),400)}catch(e){}};
A3.drvSwitch=function(k,top){const T=TEXT.ui||{};if(busy())uiSkip();A3._qDrv=true;let ok=false;try{ok=setDrive(k)}finally{A3._qDrv=false}if(!ok)return A3.modeTip(3000);SND.se(k==="eco"?"drive_eco":"drive_sport");
  const m=(x=>x%1?x:x.toFixed(1))(driveMult(k)),g=driveGas(k),s=(T["drive_note_"+k]||(k==="eco"?(g?"エコ：ガソリン +{g}・×{m}":"エコ：×{m}"):"スポーツ：×{m}・高回転まで")).replace("{g}",g).replace("{m}",m);
  A3._drvNote={s,t:Date.now()+1000};A.pv=null;if(S.sel>=0)setPreview(S.sel);renderBattle()};
A3.slotNote=function(s,top){const u=ui(),o=document.createElement("div");o.className="a3drvnote";o.textContent=s;Object.assign(o.style,{left:"4px",top:(top-13)+"px"});u.appendChild(o);setTimeout(()=>{if(A3._drvNote&&Date.now()>=A3._drvNote.t)o.remove()},Math.max(0,A3._drvNote.t-Date.now())+20)};
const NF=n=>`assets/c2/ui/c2/newfour/revremit_ui_kuro_${n}.png`;
/* ★v0.82 共通の資源のアイコン（graphics\\ui\\c2\\revremit_ui_res_{mult,face,note}.png・①が manifest に入れたら出る）。読めなければ色つきの字の札 */
const RES=(n,alt,bg)=>{const p=`assets/c2/ui/c2/revremit_ui_res_${n}.png`;return window.ART_HAVE&&ART_HAVE.has(p)?`<img class="ic" src="${p}" alt="">`:`<span class="gl" style="background:${bg}">${alt}</span>`};
}

/* ★v0.87 AD：③の札で切りかえたときは、①の「ドライブモード：スポーツ」のログ（左上の行に出る）を書かない＝札のすぐ上の1行1秒だけ */
if(typeof addLog==="function"){const al0=addLog;addLog=function(t){if(window.ALLY3&&ALLY3._qDrv&&/^ドライブモード：/.test(String(t)))return;return al0.apply(this,arguments)}}

/* ★v0.99（β のあと・音）：KAEDE〜MIO・KURO の場面の音（audio-list 10-2・10-5）。番号は場面の行（0 から）。影線の2台目のエンジン・潮騒の波もここ */
{const X=window.ALLY3,AUx=f=>{try{f(window.AUDIO&&SND.on?AUDIO:null)}catch(e){}},se=(id,o,ms)=>ms?setTimeout(()=>SND.se(id,o),ms):SND.se(id,o);
 const bow=()=>{se("bow_draw");se("bow_shot",null,480)},wave=on=>{X._wave=on;AUx(A=>{if(!A)return;if(on===true)A.ambient&&A.ambient("wave",.25);else if(on===false)A.ambientStop&&A.ambientStop(3)})};
 const T={
  join_sora:{8:()=>se("gate_boot")},/* audio-list 9-2・20-2 */
  kaede_op:{7:()=>se("turbo_swing")},area1_kaede:{1:()=>se("amb_signal",{vol:.7})},area3_kaede:{1:()=>se("amb_tire")},
  kaede_boss_post:{0:A=>{A&&A.engineGhost&&A.engineGhost(false);try{SND.engineBurst(4000,6500)}catch(e){}},1:()=>se("enemy_down")},
  boss3_phase_kaede:{1:()=>se("turbo_swing")},
  rin_op:{6:bow},area1_rin:{0:()=>se("amb_horn",{vol:.6})},
  area3_rin:{0:()=>[0,1,2,3].forEach(i=>se("num_tag",i===2?{miss:true}:{step:i},i*220))},
  rin_boss_pre:{0:()=>se("page_flip"),1:()=>[0,1,2].forEach(i=>se("num_tag",i===1?{miss:true}:{step:i},i*220)),8:()=>{se("page_flip");se("page_flip",null,380)}},
  rin_boss_post:{0:()=>[0,1,2,3,4,5].forEach(i=>se("num_tag",{step:i},i*220))},boss3_phase_rin:{1:bow},ed1_rin:{24:()=>se("amb_horn")},
  luna_op:{7:()=>se("pendulum")},area3_luna:{0:A=>{se("star_freeze");A&&A.bgmDuck&&A.bgmDuck(2.6,.25)}},luna_boss_pre:{0:A=>{se("star_freeze");A&&A.bgmDuck&&A.bgmDuck(2.6,.25)}},
  luna_boss_post:{0:()=>se("pendulum"),2:()=>se("shooting_star")},boss3_phase_luna:{1:()=>{se("shooting_star");se("shooting_star",null,350)}},
  join_kuro:{12:A=>A&&A.quiet&&A.quiet(.08,.5),13:A=>A&&A.quiet&&A.quiet(1,1.2),end:A=>A&&A.quiet&&A.quiet(1,.3)},kuro_op:{2:()=>se("heartbeat")},
  area3_kuro:{0:()=>se("rev_swell"),1:A=>A&&A.bgmDuck&&A.bgmDuck(2,.35),2:A=>A&&A.bgmDuck&&A.bgmDuck(2,.35)},kuro_boss_pre:{0:()=>se("rev_swell")},
  kuro_boss_post:{0:()=>se("flip_back")},boss3_phase_kuro:{1:()=>se("kuro_glitch")},
  mio_op:{1:()=>se("comm_open"),6:()=>se("belt_whip")},area1_mio:{0:()=>se("amb_horn",{vol:.6})},area3_mio:{0:()=>wave(true)},
  mio_boss_pre:{0:A=>A&&A.ambientVol&&A.ambientVol(.8,1.5)},mio_boss_post:{0:()=>wave(false)},
  boss3_phase_mio:{1:()=>{se("belt_whip");se("chain_up",{lv:6},250)}},ed1_mio:{5:()=>se("cup_set"),19:()=>se("mio_kit")},
 };
 for(const k in T)X.sceneSE[k]=Object.assign(X.sceneSE[k]||{},T[k]); // KURO の kuro_boss_post は flip_back に（10-2）
 // 影線の戦闘の間だけ2台目のエンジン。ほかの戦闘・マップでは1台。波は MIO の3つ目のエリアの間だけ
 const ab=SND.areaBgm;SND.areaBgm=function(kind){const r=ab.apply(SND,arguments);
  AUx(A=>{if(!A)return;A.engineGhost&&A.engineGhost(!!(kind==="battle"&&B&&B.key==="kagesen"));
   if(X._wave&&!(G&&G.char==="MIO"))wave(false)});return r};
 const jg=SND.jingle;if(jg)SND.jingle=function(id){if(id==="gameover"||id==="win"){AUx(A=>A&&A.engineGhost&&A.engineGhost(false));if(id==="gameover"&&X._wave)wave(false)}return jg.apply(SND,arguments)};
}

/* ★v1.0 文（text 37-4・23-9-1）：KURO の止まった字は PEDAL STOP。MIO で走るときは、裏道の通信をこゆきの文に */
{const RN=()=>(typeof TEXT!=="undefined"&&TEXT.ally3)||{};
 if(typeof fxWord==="function"){const fw=fxWord;fxWord=function(x,y,t){if(t==="ENGINE STOP"&&G&&G.char==="KURO"){const r=RN().run&&RN().run.run_stop_kuro;arguments[2]=(r&&r.title)||"PEDAL STOP"}return fw.apply(this,arguments)}}
 const MC=()=>RN().mioComm||{},j=a=>a&&a.map(([w,t])=>(w==="YUKI"?"こゆき：":"")+t).join("<br>");
 if(typeof TEXT!=="undefined"&&TEXT.scenes&&TEXT.scenes.hidden_in&&typeof showScene==="function"){const H=TEXT.scenes.hidden_in,base=H.lines.slice(0,2);
  const ss=showScene;showScene=function(key){if(key==="hidden_in"){const m=G&&G.char==="MIO",c=MC();
    const a=c["hidden_in`1"],b=c["hidden_in`2"];H.lines.splice(0,2,...(m&&a&&b?[[a[0][0],a[0][1],"normal"],[b[0][0],b[0][1],"serious"]]:base))}return ss.apply(this,arguments)}}
 if(typeof TEXT!=="undefined"&&TEXT.ui)for(const k of["hidden_win","hidden_lose"]){const v0=TEXT.ui[k];if(v0==null)continue;let v=v0;
  Object.defineProperty(TEXT.ui,k,{configurable:true,get(){return G&&G.char==="MIO"&&MC()[k]?j(MC()[k]):v},set(x){v=x}})}}

/* ★v1.0 音（audio-list 20-1）：①が AUDIO.cue(key,i) を呼ぶようになっても、③の場面（ALLY3.sceneSE に表がある場面）は③の表で鳴らす＝二重に鳴らさない */
if(window.AUDIO&&typeof AUDIO.cue==="function"){const cu=AUDIO.cue;AUDIO.cue=function(key,i){try{const k=(typeof S!=="undefined"&&S.sc&&S.sc.key)||key;const T=ALLY3.sceneSE[k]||ALLY3.sceneSE[key];if(T&&T[i])return}catch(e){}return cu.apply(this,arguments)}}

/* ★v1.0 絵（グラフィック班の取りこみの一覧 A-1・A-2）：6人のカードの絵（1枚ずつ・50×38）とストーリーの絵。
   ①の ART_HAVE（manifest）にない絵は、読めたら足す（①がシート・manifest に入れたら何もしない）。置き場は assets/c2/cards/c2/・assets/c2/story/c2/ */
{const C6=["SORA","KAEDE","RIN","LUNA","KURO","MIO"],lc=c=>c.toLowerCase();
 // カード：③の6人のカードぜんぶ（own）。spare_* は design のカードがないので読まない
 if(typeof CARDS!=="undefined"){const ids=Object.keys(CARDS).filter(k=>C6.includes(CARDS[k].own));ALLY3.cardArt=[...new Set(ALLY3.cardArt.concat(ids))]}
 const SP=n=>`assets/c2/story/c2/revremit_story_${n}.png`,story=[];
 for(const c of C6){const l=lc(c);["normal","serious","smile","surprise"].forEach(f=>story.push("bust_"+l+"_"+f));story.push("join_"+l,l+"_boss",l+"_boss_after","opening_road_"+l,"ending_"+l,"weapon_"+l)}
 story.push("rin_map","luna_starmap","kuro_map","mio_coastmap","mio_op_garage","ed_after_frame");
 ALLY3.storyArt=story;
 // その子のボスの前＝その子のボスの一枚絵（なければ今の fx:boss_intro）。エンディングの地図の行（text 20-8・21-8・22-8・23-8）
 if(typeof TEXT!=="undefined"&&TEXT.scenes){for(const c of C6){const s=TEXT.scenes[lc(c)+"_boss_pre"];if(s&&s.bg==="fx:boss_intro")s.bg=lc(c)+"_boss|fx:boss_intro"}
  const MAP={rin:["rin_map",8,11],luna:["luna_starmap",8,10],kuro:["kuro_map",9,12],mio:["mio_coastmap",10,11]};
  for(const l in MAP){const s=TEXT.scenes["ed1_"+l];if(!s||!s.bgs)continue;const [m,a,b]=MAP[l],back=s.bgs[s.bgs.length-1][1];if(s.bgs.some(x=>String(x[1]).startsWith(m)))continue;s.bgs.push([a,m+"|"+back],[b,back])}}
 if(typeof addEventListener==="function")addEventListener("load",()=>{let n=0;const t=setInterval(()=>{if(++n>60)return clearInterval(t);if(!window.ART_HAVE)return;clearInterval(t);
  story.map(SP).forEach(p=>{if(ART_HAVE.has(p))return;const im=new Image();im.onload=()=>ART_HAVE.add(p);im.src=p})},100)})}
/* ★v1.0 奥義18枚のカットイン（グラフィック班が作り始め）：assets/c2/cutin/c2/revremit_og_cutin_<og>.png が読めたら OUGI_ART に足す（なければ白い閃光＝①のまま） */
if(typeof addEventListener==="function")addEventListener("load",()=>{if(typeof OUGI_ART==="undefined"||typeof CARDS==="undefined")return;
 Object.keys(CARDS).filter(k=>CARDS[k].r==="OG"&&ALLY3.chars.includes(CARDS[k].own)&&!OUGI_ART[CARDS[k].og]).forEach(k=>{const og=CARDS[k].og,p=`assets/c2/cutin/c2/revremit_og_cutin_${og}.png`,im=new Image();
  im.onload=()=>{OUGI_ART[og]={cutin:p,cutin1:null,spr:null};if(window.ART_HAVE)ART_HAVE.add(p)};im.src=p})});

/* ★v1.1 仲間の通信（text v0.22.63 29-8・29-9）：①の duoShow（TEXT.duo・TEXT.banter）にそのまま乗せる。
   ①その組の文（29-2〜29-5・29-7・29-9）があればそれ ②なければ duo_any_{仲間}_{場面}_{n}（仲間の通信の1行だけ・走る子の行は出さない） */
if(typeof TEXT!=="undefined"&&TEXT.ally3&&TEXT.ally3.duoAny){const X=TEXT.ally3,ANY=X.duoAny,SYN=ALLY3.duoSyn=new Set();
 TEXT.duo=TEXT.duo||{};TEXT.banter=TEXT.banter||{};Object.assign(TEXT.duo,X.duo||{});
 const ch=[...new Set(["YUKI","HINA","MOMO","NANA","SORA","KAEDE","RIN","LUNA","KURO","MIO"].concat(typeof CHAR_ORDER!=="undefined"?CHAR_ORDER:[]))].map(c=>c.toLowerCase());
 const put=(T,pre,from,n)=>{for(let i=1;i<=n;i++){const l=ANY[`${from}_${i}`];if(l!=null&&T[pre+i]==null){T[pre+i]=["",l];SYN.add(pre+i)}}};
 for(const me of ch)for(const al of ch){if(me===al)continue;
  for(const sc of["rest","start","boss","win"])if(!TEXT.duo[`duo_${me}_${al}_${sc}_1`])put(TEXT.duo,`duo_${me}_${al}_${sc}_`,`duo_any_${al}_${sc}`,2);
  if(!TEXT.banter[`banter_${me}_${al}_start_1`])put(TEXT.banter,`banter_${me}_${al}_start_`,`duo_any_${al}_runstart`,2);
  if(!TEXT.banter[`banter_${me}_${al}_low_1`])put(TEXT.banter,`banter_${me}_${al}_low_`,`duo_any_${al}_low`,2)}
 if(typeof duoShow==="function"){const ds=duoShow;duoShow=function(){const r=ds.apply(this,arguments);try{if(G&&SYN.has(G.duoLast))document.querySelectorAll("#ui .duo .dl.me").forEach(e=>e.remove())}catch(e){}return r}}}

/* ★v2.1 audio.js v0.36：車ごとのエンジン音。①の SND.car() に voice（走る子の小文字）を足す（①が足したら同じ値なので何もしない） */
if(typeof SND!=="undefined"&&typeof SND.car==="function"&&!SND.car.__a3v){const c0=SND.car;SND.car=function(){const r=c0.apply(this,arguments)||{};if(r.voice==null)r.voice=((typeof G!=="undefined"&&G&&G.char)||"YUKI").toLowerCase();return r};SND.car.__a3v=1}
