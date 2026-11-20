/* js/farm_ui.js（プログラム班②） */
"use strict";
/* ===== フルオート周回の画面（★虎雪 08:31・08:33・design 10-22-4）=====
   ① スタートの2択（横・ゲームの小窓）：「自分で走る」「フルオート周回」（説明つき）。今のタイトルの「MT／AT で走る」（startFlow）の前に出す。
   ② 準備・③ 周回中・④ 結果まとめ は **スマホ縦** の専用画面（#farmui。ゲームの #stage の上にかぶせる・position:fixed）。
      原寸 220×（高さ）で組んで、画面の幅（縦）か高さに合わせて拡大（ドットのフォント）。PC・横の画面では真ん中に縦長の枠。
   ③ の並び（★08:33）：上＝戦っている所（ゲームの canvas を縮めて写す）／マスの帯（横スクロール・今のマスが左）／数字／いちばん下＝流れる記録。「止める」は右上にいつも。
   文は仮（シナリオ班が整える）。数は design 10-22（FARM_RULE）。 */
const FUI={view:null,sel:{char:null,night:null,mode:"MT",limit:5,stopLose:false},follow:true,raf:0};
const FUI_LIMITS=[[1,"1回"],[5,"5回"],[10,"10回"],[0,"止めるまで"]];
const FUI_TXT={/* シナリオ班が整える文（design 10-22-4 の案のまま） */
  self:"いつもの走り。ミニカー・カードの解放・夜のクリアの★・ストーリーは、こちらで走ったときだけ。",
  farm:`クリアしたキャラと夜を、自動で走りつづける。ログは少なめ（1日 ${FARM_RULE.softCap} をこえると ×${FARM_RULE.overMul}）、ミニカーは作らない。ときどき、自分で走るときに使える整備チケットやめずらしいカードが見つかる。`,
  none:"どこかの夜を自分で全クリアすると使えます。",lock:"自分で走ってクリアすると選べます"};

/* ---------- ① スタートの2択（startFlow の前）---------- */
if(typeof startFlow==="function"){const f=startFlow;window.startFlow=function(mode){if(S.farmChoiceOk){S.farmChoiceOk=false;return f.apply(this,arguments)}farmChoice(mode)};window.startFlow.__orig=f}
function farmChoice(mode){S.farmChoiceMode=mode;const ok=farmAvailable();SND.se("ui_ok");
  modal(`<div class="fch"><div class="h">どうやって走る？</div><div class="fchrow">
    <button class="fcb self" onclick="farmChoiceSelf()"><b>自分で走る</b><span class="small">${esc(FUI_TXT.self)}</span></button>
    <button class="fcb farm${ok?"":" off"}" ${ok?"":"aria-disabled=\"true\""} onclick="${ok?"farmChoiceFarm()":"SND.se('card_cant')"}"><b>フルオート周回</b><span class="small">${esc(FUI_TXT.farm)}</span>${ok?"":`<span class="small lock">${esc(FUI_TXT.none)}</span>`}</button></div>
    <div class="row"><button onclick="closeModal()">もどる</button></div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("fchbox")}
function farmChoiceSelf(){closeModal();S.farmChoiceOk=true;startFlow(S.farmChoiceMode)}
function farmChoiceFarm(){closeModal();const cs=farmChars();const s=FUI.sel;if(!cs.includes(s.char))s.char=cs.includes(curChar())?curChar():cs[0];
  const ns=farmNights(s.char);if(!ns.includes(s.night))s.night=ns.includes(curNight())?curNight():ns[ns.length-1];s.mode=S.farmChoiceMode||PRF().lastMode||"MT";fuiOpen("setup")}

/* ---------- 縦の画面の入れ物 ---------- */
function fuiRoot(){let r=document.getElementById("farmui");if(!r){r=document.createElement("div");r.id="farmui";r.innerHTML=`<div class="fuiw"><div class="fuip" id="fuip"></div></div><div class="fuirot">スマホを縦にすると見やすくなります</div>`;document.body.appendChild(r);addEventListener("resize",fuiFit);if(window.visualViewport)visualViewport.addEventListener("resize",fuiFit)}return r}
/* 原寸 220 幅。縦は画面の高さ。拡大は幅か高さの小さいほう（PC は高さに合わせて真ん中に縦長） */
function fuiFit(){const r=document.getElementById("farmui");if(!r)return;const p=$("#fuip"),vv=window.visualViewport,W=vv?vv.width:innerWidth,H=vv?vv.height:innerHeight;
  let pr=document.getElementById("fuisa");if(!pr){pr=document.createElement("div");pr.id="fuisa";pr.style.cssText="position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)";document.body.appendChild(pr)}
  const cs=getComputedStyle(pr),T=parseFloat(cs.paddingTop)||0,Bm=parseFloat(cs.paddingBottom)||0;
  const s=Math.max(1,Math.min(W/220,(H-T-Bm)/420)),h=Math.floor((H-T-Bm)/s);p.style.width="220px";p.style.height=h+"px";p.style.transform=`scale(${s})`;
  p.parentElement.style.width=Math.round(220*s)+"px";p.parentElement.style.height=Math.round(h*s)+"px";p.parentElement.style.marginTop=T+"px";
  r.classList.toggle("land",W>H*1.1&&matchMedia("(pointer:coarse)").matches)}
function fuiOpen(v){FUI.view=v;fuiRoot().style.display="flex";fuiFit();try{if(screen.orientation&&screen.orientation.lock&&document.fullscreenElement)screen.orientation.lock("portrait").catch(()=>{})}catch(e){}fuiRender()}
function fuiClose(){FUI.view=null;const r=document.getElementById("farmui");if(r)r.style.display="none";cancelAnimationFrame(FUI.raf);try{if(screen.orientation&&screen.orientation.lock&&document.fullscreenElement)screen.orientation.lock("landscape").catch(()=>{})}catch(e){}}
function fuiRender(){const p=$("#fuip");if(!p)return;p.className="fuip v-"+FUI.view;p.innerHTML=FUI.view==="setup"?fuiSetup():FUI.view==="run"?fuiRun():FUI.view==="result"?fuiResult():"";
  if(FUI.view==="run"){fuiRunBind();fuiLoop()}}

/* ---------- ② 準備 ---------- */
function fuiSetup(){const s=FUI.sel,d=farmData(),U=TEXT.names,all=typeof charsOpen==="function"?charsOpen():["YUKI"],ok=farmChars();
  const chip=(on,lab,click,off)=>`<button class="fc${on?" on":""}${off?" no":""}" onclick="${off?"SND.se('card_cant');toast2('"+FUI_TXT.lock+"')":click}">${lab}</button>`;
  const ns=farmNights(s.char);const tix={};d.tickets.forEach(k=>tix[k]=(tix[k]||0)+1);
  return`<div class="fhead"><b>フルオート周回</b><button class="fbtn sub" onclick="fuiClose();SND.se('ui_cancel')">◀ もどる</button></div>
  <div class="fscroll"><div class="fbox"><div class="fl">キャラ</div><div class="fcs">${all.map(ch=>chip(s.char===ch,esc(U[ch]||ch),`FUI.sel.char='${ch}';FUI.sel.night=farmNights('${ch}').slice(-1)[0];SND.se('ui_ok');fuiRender()`,!ok.includes(ch))).join("")}</div>${ok.length<all.length?`<div class="fn dim">暗いキャラ：${esc(FUI_TXT.lock)}</div>`:""}</div>
  <div class="fbox"><div class="fl">夜（クリアした夜だけ）</div><div class="fcs">${NIGHTS.slice(0,typeof BETA_NIGHTS==="number"?BETA_NIGHTS:NIGHTS.length).map((_,i)=>i+1).map(n=>chip(s.night===n,"N"+n,`FUI.sel.night=${n};SND.se('ui_ok');fuiRender()`,!ns.includes(n))).join("")}</div></div>
  <div class="fbox"><div class="fl">走りかた</div><div class="fcs">${["MT","AT"].map(m=>chip(s.mode===m,m,`FUI.sel.mode='${m}';SND.se('ui_ok');fuiRender()`)).join("")}</div></div>
  <div class="fbox"><div class="fl">回数</div><div class="fcs">${FUI_LIMITS.map(([v,n])=>chip(s.limit===v,n,`FUI.sel.limit=${v};SND.se('ui_ok');fuiRender()`)).join("")}</div>
   <div class="fcs" style="margin-top:3px">${chip(s.stopLose,`負けたら止める ${s.stopLose?"入":"切"}`,`FUI.sel.stopLose=!FUI.sel.stopLose;SND.se('ui_ok');fuiRender()`)}</div></div>
  <div class="fbox"><div class="fnum"><span>今日のログ</span><b class="gold">${d.dayLog}／${FARM_RULE.softCap}</b></div>${d.dayLog>=FARM_RULE.softCap?`<div class="fn red">今日の上限をこえました：ログ ×${FARM_RULE.overMul}</div>`:""}
   <div class="fnum"><span>整備チケット</span><b>${d.tickets.length}／${FARM_RULE.ticket.max}</b></div>${d.tickets.length?`<div class="fn">${Object.entries(tix).map(([k,n])=>`${esc(FARM_TICKET_JP[k])}×${n}`).join("・")}</div>`:""}</div>
  <div class="fbox fdk"><div class="fl">デッキ・型・ミニカー</div><div class="fn">今の設定のまま（${esc(U[s.char]||s.char)}のデッキ${TREE&&TREE[s.char]?`・型「${esc(treeName(s.char))}」`:""}）。かえるときは「自分で走る」の画面で。</div></div>
  <div class="fn dim">全部おまかせ・早送り×${FARM_RULE.speed}。ログは 1/8（今日 ${FARM_RULE.softCap} をこえると ×${FARM_RULE.overMul}）、ミニカーは作らない、★はつかない。画面を消さないようにします（できる端末だけ）。</div></div>
  <button class="fbtn main fgo" onclick="fuiGo()">周回スタート</button>`}
function fuiGo(){const s=FUI.sel;SND.se("ui_ok");if(!farmGo({char:s.char,night:s.night,mode:s.mode,bring:fuiBring(s.char),limit:s.limit,stopLose:s.stopLose}))return;FUI.follow=true;fuiOpen("run")}
/* 持ちこみのミニカー：今の設定（ガレージで選んでいるもの）。なければなし */
function fuiBring(ch){try{const L=loadMinicars(),sel=(S.mcSel||[]);return sel.map(i=>L[i]).filter(Boolean)}catch(e){return[]}}

/* ---------- ③ 周回中（上から：戦っている所／マスの帯／数字／流れる記録。「止める」は右上） ---------- */
function fuiRun(){return`<div class="fhead"><div><b>周回 <span class="lime" id="fu-n"></span></b><div class="fn dim" id="fu-who"></div></div><button class="fbtn warn fstop" onclick="farmStopAsk()">止める</button></div>
  <div class="fview"><canvas id="fu-cv" width="440" height="248"></canvas><div class="fcap" id="fu-cap"></div></div>
  <div class="fstrip" id="fu-strip"></div>
  <div class="fbox fnums" id="fu-nums"></div>
  <div class="ffeed" id="fu-feed"></div><button class="fbtn sub fnew" id="fu-new" onclick="FUI.follow=true;fuiUiFeedScroll()">▼ 最新へ</button>`}
function fuiRunBind(){const f=$("#fu-feed");if(f)f.onscroll=()=>{const at=f.scrollTop+f.clientHeight>=f.scrollHeight-4;FUI.follow=at;$("#fu-new").style.display=at?"none":"block"};farmUiFeed()}
/* 毎コマ：ゲームの canvas（#cv）を縮めて写す。数字とマスは 4コマに1回 */
function fuiLoop(){cancelAnimationFrame(FUI.raf);let k=0;const step=()=>{if(FUI.view!=="run")return;
  const c=$("#fu-cv"),g=$("#cv");if(c&&g&&g.width){const x=c.getContext("2d");x.imageSmoothingEnabled=false;x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);try{x.drawImage(g,0,0,g.width,g.height,0,0,c.width,c.height)}catch(e){}}
  if(k++%4===0)fuiNums();FUI.raf=requestAnimationFrame(step)};step();if(!FUI.tick)FUI.tick=setInterval(()=>{if(FUI.view==="run"&&document.hidden)fuiNums()},1000)}
function fuiNums(){if(!G&&!FARM.on)return;const n=$("#fu-n");if(!n)return;
  n.textContent=`${FARM.n+(FARM.on?1:0)}${FARM.limit?"／"+FARM.limit:""}回目`;const U=TEXT.names;
  if(G){const a=G.map[Math.min(G.row,G.map.length-1)][0].a,A=AREAS[a],rows=G.map.filter(r=>r[0].a===a),r0=G.map.findIndex(r=>r[0].a===a);
    $("#fu-who").textContent=`${U[G.char]||G.char}・NIGHT ${G.night}・${G.mode}・エリア${a+1} ${A.n} ${Math.min(rows.length,G.row-r0+1)}／${rows.length}段`;
    const sc=window.SCREEN,cap={battle:"",map:"マップ",shop:"ショップ",sim:"シムトレーニング",rest:"ガレージで休憩",parts:"パーツを選ぶ",win:"勝ち！",result:"リザルト",scene:"…"}[sc];
    const last=FARM.feed[FARM.feed.length-1];$("#fu-cap").textContent=sc==="battle"?"":(cap||"")+(last&&sc!=="map"?"　"+last.t:"");$("#fu-cap").style.display=sc==="battle"?"none":"block";
    fuiStrip(a,r0,rows.length)}
  const d=farmData(),inB=window.SCREEN==="battle"&&B&&!B.over,lim=inB&&typeof limit==="function"?limit():0,red=inB&&typeof redLo==="function"?redLo():0;
  $("#fu-nums").innerHTML=`<div class="fnum"><span>耐久</span><b>${G?G.hp:"－"}<span class="dim">/${G?G.maxhp:"－"}</span></b></div>
   <div class="fnum"><span>ヒート</span><b class="${inB&&B.rpm>=red?"red":""}">${inB?B.rpm:"－"}${inB?`<span class="dim">/${lim}</span>`:""}</b></div>
   <div class="fnum"><span>ギア</span><b>${inB?(B.gear+1)+"速":"－"}${inB?`<span class="dim"> G${B.gas}</span>`:""}</b></div>
   <div class="fnum"><span>お金</span><b>${G?G.money:"－"}</b></div>
   <div class="fnum flog"><span>勝ち負け</span><b><span class="lime">${FARM.sum.clear}</span> / <span class="red">${FARM.sum.lose}</span></b></div>
   <div class="fnum flog"><span>ログ</span><b class="gold">+${FARM.log}</b><span class="${d.dayLog>=FARM_RULE.softCap?"red":"dim"} small">今日 ${d.dayLog}/${FARM_RULE.softCap}</span></div>${d.dayLog>=FARM_RULE.softCap?`<div class="fnum wide red small">今日の上限をこえました：ログ ×${FARM_RULE.overMul}</div>`:""}
   ${inB?`<div class="fnum wide"><span>${esc(B.e.name||(ENEMIES[B.key]||{}).n||"")}</span><span class="fbar"><i style="width:${Math.max(0,Math.round(B.e.hp/B.e.maxhp*100))}%"></i></span><b>${B.e.hp}</b></div>`:""}`}
/* マスの帯：今のエリアの段を左から。通った段＝選んだマス、今の段＝光る枠（選ぶ前は候補を縦に小さく）、先の段＝候補を縦に小さく（裏道の先は「？」） */
function fuiStrip(a,r0,n){const el=$("#fu-strip");if(!el)return;const key=G.row+"|"+(G.path[G.row]??"")+"|"+a;if(el.dataset.k===key)return;el.dataset.k=key;
  const ic=(k,st,big)=>{const p=MAP_ICON(k,st),q=artHave(p)?p:MAP_ICON(k==="hidden"?"elite":k,st);return artHave(q)?`<img class="px" src="${artURL(q)}" alt="" style="width:${big?24:12}px">`:`<span class="${big?"":"sm"}">${NODE_ICON[k]||"・"}</span>`};
  let h="";for(let i=r0;i<r0+n;i++){const r=G.map[i],st=i<G.row?"done":i===G.row?"now":"later";
    if(i<G.row){const j=G.path[i]||0;h+=`<div class="fsn done">${ic(r[j].k,"done",1)}<span>${NODE_JP[r[j].k]||""}</span></div>`}
    else if(i===G.row&&G.path[i]!=null){const j=G.path[i];h+=`<div class="fsn now">${ic(r[j].k,"on",1)}<span>${NODE_JP[r[j].k]||""}</span></div>`}
    else h+=`<div class="fsn ${st}${r.length>1?" multi":""}">${r.map(x=>ic(x.k==="hidden"&&i>G.row+1?"unknown":x.k,st==="now"?"on":"off",r.length===1)).join("")}${r.length===1?`<span>${NODE_JP[r[0].k]||""}</span>`:""}</div>`;
    if(i<r0+n-1)h+=`<span class="fsa">→</span>`}
  el.innerHTML=h;const now=el.querySelector(".now");if(now)el.scrollTo({left:Math.max(0,now.offsetLeft-4),behavior:document.hidden?"auto":"smooth"})}
/* 流れる記録 */
function farmUiFeed(){const f=$("#fu-feed");if(!f||FUI.view!=="run")return;const L=FARM.feed,have=+f.dataset.n||0;
  if(have>L.length){f.innerHTML="";f.dataset.n=0}
  let h="";for(let i=+f.dataset.n||0;i<L.length;i++){const x=L[i];h+=`<div class="fl1 ${x.c}">${esc(x.t)}</div>`}
  if(h)f.insertAdjacentHTML("beforeend",h);f.dataset.n=L.length;while(f.children.length>200)f.firstChild.remove();if(FUI.follow)fuiUiFeedScroll()}
window.farmUiFeed=farmUiFeed;
function fuiUiFeedScroll(){const f=$("#fu-feed");if(f)f.scrollTop=f.scrollHeight;const b=$("#fu-new");if(b)b.style.display="none"}

/* ---------- ④ 結果まとめ ---------- */
function farmUiResult(){if(!document.getElementById("farmui")||!FUI.view){showTitle();FUI.view="result";fuiOpen("result");return}fuiOpen("result")}
window.farmUiResult=farmUiResult;
function fuiResult(){const s=FARM.sum,min=Math.round((Date.now()-(FARM.t0||Date.now()))/60000),d=farmData();
  const runs=(typeof rlList==="function"?rlList():[]).filter(x=>x.farm&&x.at>=(FARM.t0||0)).slice(0,FARM.n).reverse();
  const tix={};s.tix.forEach(k=>tix[k]=(tix[k]||0)+1);
  return`<div class="fhead"><b>周回の結果</b></div>
  <div class="fbox"><div>${FARM.n}回 走りました</div><div>全クリア <b class="lime">${s.clear}</b>・負け <b class="red">${s.lose}</b></div><div>ログ <b class="gold">+${FARM.log}</b><span class="dim small">（今日 ${d.dayLog}/${FARM_RULE.softCap}）</span></div>
   ${d.dayLog>=FARM_RULE.softCap?`<div class="fn red">今日の上限をこえました：ログ ×${FARM_RULE.overMul}</div>`:""}<div>型のポイント +${s.pts}</div><div class="dim small">かかった時間 ${min}分</div></div>
  ${s.dig.length?`<div class="fbox fdig"><b>めずらしいカードを見つけた！</b><div>${s.dig.map(id=>esc(CARDS[id].n)).join("・")}</div><div class="fn">自分で走るときも使えます</div></div>`:""}
  <div class="fbox"><div class="fl">整備チケット</div><div>${s.tix.length?Object.entries(tix).map(([k,n])=>`${esc(FARM_TICKET_JP[k])}×${n}`).join("・"):"なし"}</div><div class="fn dim">持っている数 ${d.tickets.length}／${FARM_RULE.ticket.max}（自分で走るランの前に1枚使える）</div></div>
  <div class="fbox fruns"><div class="fl">1回ずつ</div>${runs.map((x,i)=>`<div class="fl1 ${x.res==="clear"?"win":"lose"}">${i+1}　${x.res==="clear"?"全クリア":x.res==="giveup"?"あきらめ":"負け（エリア"+x.area+"）"}　${x.rank||"－"}　ログ +${x.log}</div>`).join("")||`<div class="dim">－</div>`}</div>
  <div class="fn dim">ミニカーは作っていません。中身は「ランの記録」にあります（オートの印）。</div>
  <div class="fbtns"><button class="fbtn main" onclick="fuiOpen('setup')">もう一度</button><button class="fbtn sub" onclick="fuiClose();showTitle()">ホームへ</button></div>`}

/* ---------- 止める（帯の「止める」と同じ。縦の画面の上にも出す）---------- */
const _farmBar=window.farmBar;window.farmBar=function(){if(FUI.view==="run"){const b=$("#farmbar");if(b)b.remove();return}return _farmBar&&_farmBar()};
/* 小窓（止めますか）は縦の画面の上に出す：ゲームの #modal は #stage の中なので、縦の画面では自前の小窓 */
const _farmStopAsk=window.farmStopAsk;window.farmStopAsk=function(){if(FUI.view!=="run")return _farmStopAsk();
  const p=$("#fuip");const m=document.createElement("div");m.className="fmodal";m.innerHTML=`<div class="fbox"><b>周回を止めますか？</b><div class="fn">周回 ${FARM.n+1}回目を走っています。</div>
   <button class="fbtn main" onclick="FARM.stopEnd=true;this.closest('.fmodal').remove();farmFeed('このランの終わりで止まります','dim')">このランの終わりで</button>
   <button class="fbtn warn" onclick="this.closest('.fmodal').remove();farmStop(true);FARM.n&&0;fuiOpen('result')">すぐ止める</button>
   <button class="fbtn sub" onclick="this.closest('.fmodal').remove()">つづける</button></div>`;p.appendChild(m)};
RRHOOK.on("run_end",o=>{if(FARM.on)FARM.lastClear=!!o.clear});
