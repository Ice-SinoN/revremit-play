/* js/runlog.js（プログラム班②） */
"use strict";
/* ===== ランの記録（progression 1-25 の 4）=====
   1件：日時・キャラ・MT／AT・夜・結果（全クリア／負け／あきらめ）・どこまで（エリア・段）・負けた相手・時間（分）・ランク・最後のデッキ（カードと強化）・パーツ・持ちこんだミニカー・もらったログ・チューン。
   最新 50件（スロットごと・profile.runlog・新しい順）。チュートリアル・練習は数えない。引き継ぎコードには入れない（rr2_hooks.js の XFER で外す）。
   入口：データの画面の「ランの記録」・リザルトの「記録を見る」。画面は図鑑と同じかぶせる層（下の画面はそのまま＝リザルトの抽選はやり直さない）。
   書き出し：CSV（1ラン1行）と JSON をコピー（デザイン班・LD の材料）。 */
const RUNLOG_MAX=50;
const RL={who:"all",mode:"all",night:"all",sel:null};
function rlList(){const p=RR2.P();if(!p)return[];if(!Array.isArray(p.runlog))p.runlog=[];p.runlog=p.runlog.filter(x=>x&&typeof x==="object"&&x.at).sort((a,b)=>b.at-a.at);return p.runlog}
/* ラン中の記録の入れ物は G._rr2（途中のランのセーブに入る＝つづきからでも時間が続く）。★①に頼む：G に t0 を正式に */
RRHOOK.on("run_start",()=>{if(!G||RR2.tut())return;G._rr2={t0:Date.now(),give:0}});
RRHOOK.on("run_giveup",()=>{if(G){G._rr2=G._rr2||{};G._rr2.give=1}});
RRHOOK.on("run_end",o=>{if(!G||RR2.tut())return;const X=G._rr2=G._rr2||{};if(X.done)return;X.done=1;
  const e=rlEntry(o.clear,X);if(X.extra)rlMerge(e,X.extra);X.id=e.at;
  const L=rlList();L.unshift(e);if(L.length>RUNLOG_MAX)L.length=RUNLOG_MAX;try{SAVE.auto()}catch(e){}});
function rlEntry(clear,X){const g=G;let a=0,row=0;try{const r=Math.min(g.row,g.map.length-1);a=g.map[r][0].a;row=r-g.map.findIndex(x=>x[0].a===a)+1}catch(e){}
  const deck=(g.deck||[]).filter(c=>!c.gen).map(c=>({id:c.id,up:c.up?1:0}));/* v2：ゴースト（design 10-17-3）のため [{id,up}] に */
  const res=clear?"clear":X.give?"giveup":"lose";
  return{at:Date.now(),v:2,ver:(typeof VERSION_NO==="function"?VERSION_NO():""),farm:X.farm?1:0,char:g.char,mode:g.mode,night:g.night||0,res,result:res,area:a+1,row,reach:{area:a+1,row},
    stats:{maxHp:g.maxhp||0,tune:Object.assign({tire:0,shift:0,engine:0,light:0,ecu:0},g.tune)},heatMax:+(g.heatMax||g.heat||0)||0,
    enemy:!clear&&!X.give&&B&&B.result==="dead"?B.key:null,min:X.t0?Math.max(0,Math.round((Date.now()-X.t0)/60000)):null,
    rank:(S.res&&S.res.rank)||null,log:+S.runEndLog||0,deck,parts:(g.parts||[]).slice(),
    bring:(g.bring||[]).map(m=>({char:m.char,rank:m.rank,cards:(m.cards||[]).map(c=>c.id+(c.up?"+":""))})),tune:Object.assign({},g.tune)}}
const RL_RES={clear:"全クリア",lose:"負け",giveup:"あきらめ"};
const rlWhen=t=>{const d=new Date(t),z=n=>String(n).padStart(2,"0");return`${z(d.getMonth()+1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`};
const rlCard=k=>{const id=k.replace(/\+$/,"");return(CARDS[id]?CARDS[id].n:id)+(k.endsWith("+")?"+":"")};
function rlFiltered(){return rlList().filter(x=>(RL.who==="all"||x.char===RL.who)&&(RL.mode==="all"||x.mode===RL.mode)&&(RL.night==="all"||x.night===+RL.night))}

function showRunLog(from){RL.from=from||null;RL.sel=null;try{SND.se("ui_ok")}catch(e){}renderRunLog()}
function runLogBack(){rr2CloseLayer();try{SND.se("ui_cancel")}catch(e){}}
function renderRunLog(){const v=rr2Layer(),L=rlFiltered(),all=rlList();
  const chip=(k,val,n)=>`<button class="u9 cdxf${RL[k]===val?" main":""}" onclick="RL.${k}='${val}';RL.sel=null;renderRunLog()">${rr2Esc(n)}</button>`;
  const chars=[...new Set(all.map(x=>x.char))],nights=[...new Set(all.map(x=>x.night))].sort((a,b)=>a-b);
  const flt=chip("who","all","全員")+chars.map(c=>chip("who",c,rr2Name(c))).join("")+`<i class="sp"></i>`+chip("mode","all","MT・AT")+chip("mode","MT","MT")+chip("mode","AT","AT")+`<i class="sp"></i>`+
    chip("night","all","夜 全部")+nights.map(n=>chip("night",String(n),n?"N"+n:"夜なし")).join("");
  const rows=L.length?L.map((x,i)=>`<button class="cdxrow rlrow${RL.sel===x.at?" sel":""} rl-${x.res}" onclick="RL.sel=${x.at};renderRunLog()"><span>${rlWhen(x.at)}</span><span>${rr2Esc(rr2Name(x.char))}</span><span>${x.mode}</span><span>${x.night?"N"+x.night:"－"}</span><span class="rlres">${RL_RES[x.res]||x.res}</span>${x.farm?'<span class="rlauto">オート</span>':""}${x.ghostWon?'<span class="rlghost won" title="ゴーストに勝った">G</span>':""}<span>${x.rank||"－"}</span></button>`).join("")
    :`<div class="small dim">${all.length?"この絞りこみの記録はありません":"まだ記録がありません（ランが終わると、ここに残ります）"}</div>`;
  v.innerHTML=`<div class="hdr" ${at(40,22,140,18)}>ランの記録</div><div class="small dim" ${at(186,24,200,14)}>${all.length}／${RUNLOG_MAX}件（古いものから消えます）</div>`+
    `<button class="u9" ${at(396,18,130,30)} ${all.length?"":"disabled"} onclick="rlExport()">記録を書き出す</button>`+backBtn("もどる","runLogBack()")+
    `<div class="cdxbar rlbar" ${at(8,56,624,28)}><span class="cdxflt">${flt}</span></div>`+
    `<div class="cdxlist rllist" ${at(8,88,300,264)}>${rows}</div><div class="cdxdet sign" ${at(316,88,316,264)}>${rlDetail(L.find(x=>x.at===RL.sel))}</div>`}
function rlDetail(x){if(!x)return`<div class="small dim">記録をタップすると、ここに中身が出ます。</div>`;
  const dm=rlDeckMap(x),deck=Object.entries(dm).map(([k,n])=>`${rr2Esc(rlCard(k))}×${n}`).join("　"),n=Object.values(dm).reduce((a,b)=>a+b,0);
  const tune=Object.entries(x.tune||{}).filter(([,v])=>v).map(([k,v])=>`${({tire:"タイヤ",shift:"シフト",engine:"エンジン",light:"ライト",ecu:"ECU"})[k]||k} ${v}`).join("・")||"なし";
  return`<div class="cdxh">${rlWhen(x.at)}　${rr2Esc(rr2Name(x.char))}・${x.mode}・${x.night?"NIGHT "+x.night:"夜なし"}${x.farm?'<span class="rlauto">オート</span>':""}</div>
   <div class="small"><span class="rlres rl-${x.res}">${RL_RES[x.res]||x.res}</span>　エリア${x.area} ${x.row}段まで${x.enemy&&ENEMIES[x.enemy]?`・相手 ${rr2Esc(ENEMIES[x.enemy].n)}`:""}</div>
   <div class="small">ランク ${x.rank||"－"}・ログ +${x.log||0}・${x.min!=null?x.min+"分":"時間 －"}${x.heatMax?`・ヒート最大 ${x.heatMax}`:""}</div>${x.ghostMet?`<div class="small"><span class="rlghost${x.ghostWon?" won":""}">${x.ghostWon?"ゴーストに勝った":"ゴーストに会った"}</span></div>`:""}
   <div class="rlsc"><div class="small"><span class="gold">デッキ ${n}枚</span><br><span class="rlwrap">${deck||"－"}</span></div>
   <div class="small"><span class="gold">パーツ</span> <span class="rlwrap">${(x.parts||[]).map(p=>rr2Esc(PARTS[p]?PARTS[p].n:p)).join("・")||"なし"}</span></div>
   <div class="small"><span class="gold">持ちこんだミニカー</span> <span class="rlwrap">${(x.bring||[]).map(m=>`${rr2Esc(rr2Name(m.char))} ${m.rank}（${m.cards.map(rlCard).map(rr2Esc).join("・")}）`).join("／")||"なし"}</span></div>
   <div class="small"><span class="gold">チューン</span> ${rr2Esc(tune)}</div></div>`}
/* 書き出し：CSV（1ラン1行）と JSON。列の名前は道具で読みやすい英字 */
const RL_COLS=["at","farm","char","mode","night","res","area","row","enemy","min","rank","log","heatMax","ghostMet","ghostWon","maxHp","ver","parts","bring","deck","tune"];
function rlCSV(L){const q=s=>{s=String(s==null?"":s);return/[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s};
  return[RL_COLS.join(",")].concat(L.map(x=>RL_COLS.map(k=>{const v=x[k];
    if(k==="at")return q(new Date(v).toISOString());if(k==="parts")return q((v||[]).join(" "));if(k==="deck")return q(Object.entries(rlDeckMap(x)).map(([a,n])=>a+"x"+n).join(" "));if(k==="maxHp")return q(x.stats?x.stats.maxHp:"");if(k==="ghostMet"||k==="ghostWon")return q(x[k]?1:0);
    if(k==="bring")return q((v||[]).map(m=>m.char+":"+m.rank+":"+m.cards.join("/")).join(" "));if(k==="tune")return q(Object.entries(v||{}).map(([a,n])=>a+"="+n).join(" "));return q(v)}).join(","))).join("\n")}
function rlExport(){const L=rlFiltered().slice().reverse();RL.csv=rlCSV(L);RL.json=JSON.stringify({fmt:"revremit-runlog",v:2,game:(typeof VERSION_NO==="function"?VERSION_NO():""),slot:SAVE.slot,runs:L});
  modal(`<div class="h">記録を書き出す（${L.length}件・いまの絞りこみ）</div><textarea class="rlout" readonly>${rr2Esc(RL.csv)}</textarea>
   <div class="row"><button class="main" onclick="rlCopy('csv')">CSV をコピー</button><button class="main" onclick="rlCopy('json')">JSON をコピー</button><button onclick="closeModal()">とじる</button></div><div class="small" id="rlmsg"></div>`);
  const b=$("#modal .modal .box");if(b)b.classList.add("wide")}
async function rlCopy(k){const t=RL[k]||"";let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
  if(!ok){const a=$("#modal .rlout");if(a){a.value=t;a.select();try{ok=document.execCommand("copy")}catch(e){}}}
  const m=$("#rlmsg");if(m)m.textContent=ok?`${k.toUpperCase()} をコピーしました`:"コピーできませんでした。上の文字を長押しで選んでコピーしてください";try{SND.se(ok?"ui_ok":"card_cant")}catch(e){}}
/* 入口：データの画面の下・リザルトの左上 */
RRHOOK.on("screen",o=>{const u=ui();if(!u)return;
  if(o.n==="data"&&!u.querySelector(".rlBtn"))u.insertAdjacentHTML("beforeend",`<button class="u9 rlBtn" ${at(40,316,160,30)} onclick="showRunLog('data')">ランの記録（${rlList().length}）</button>`);
  if(o.n==="result"&&!u.querySelector(".rlBtn"))u.insertAdjacentHTML("beforeend",`<button class="u9 rlBtn" ${at(8,4,88,28)} onclick="showRunLog('result')">記録を見る</button>`)});

/* ===== v0.5.11 ライバルのゴースト（design 10-17-2・10-17-3）=====
   1件の欄（v:2）：char・mode・night・reach{area,row}・result（＝res）・deck:[{id,up}]・parts:[id]・stats{maxHp,tune{tire,shift,engine,light,ecu}}・heatMax・ver。
   v:1 の古い記録（deck が {"id+":n} の形）も読める（rlDeckList／rlDeckMap）。
   runlog.add(o)：①がランの終わりに ghostMet・ghostWon・heatMax などを足す。記録より先に呼ばれても後でも、そのランの1件にまとまる。
   runlog.pickGhost(char)：そのキャラの直近5件（フルオートの記録は数えない）から、いちばん先まで進んだもの（全クリア＞エリア＞段、同じなら新しい方）。
     チュートリアル（もともと記録しない）・1エリア目であきらめたランは使わない。なければ null。今のゲームにないカード・パーツの id は外したコピーを返す。 */
function rlDeckList(x){const d=x&&x.deck;if(Array.isArray(d))return d.filter(c=>c&&c.id).map(c=>({id:c.id,up:c.up?1:0}));
  const L=[];Object.entries(d||{}).forEach(([k,n])=>{const up=k.endsWith("+")?1:0,id=k.replace(/\+$/,"");for(let i=0;i<(+n||0);i++)L.push({id,up})});return L}
function rlDeckMap(x){const m={};rlDeckList(x).forEach(c=>{const k=c.id+(c.up?"+":"");m[k]=(m[k]||0)+1});return m}
function rlMerge(e,o){Object.keys(o||{}).forEach(k=>{if(k==="heatMax")e.heatMax=Math.max(+e.heatMax||0,+o.heatMax||0);else if(k!=="at")e[k]=o[k]})}
function rlProg(x){return(x.res==="clear"?1e6:0)+(+(x.reach?x.reach.area:x.area)||0)*1000+(+(x.reach?x.reach.row:x.row)||0)}
const runlog={
  list:()=>rlList(),
  add(o){if(!o||typeof o!=="object")return null;const X=G&&(G._rr2=G._rr2||{});
    if(X&&X.id){const e=rlList().find(x=>x.at===X.id);if(e){rlMerge(e,o);try{SAVE.auto()}catch(err){}return e}}
    if(X){X.extra=Object.assign(X.extra||{},o,{heatMax:Math.max(+(X.extra&&X.extra.heatMax)||0,+o.heatMax||0)});return null}
    const e=rlList()[0];if(e){rlMerge(e,o);try{SAVE.auto()}catch(err){}}return e||null},
  pickGhost(char){const L=rlList().filter(x=>x.char===char&&!x.farm).slice(0,5)
      .filter(x=>!(x.res==="giveup"&&(+(x.reach?x.reach.area:x.area)||1)<=1));
    if(!L.length)return null;let b=L[0];L.forEach(x=>{const d=rlProg(x)-rlProg(b);if(d>0||(d===0&&x.at>b.at))b=x});
    const deck=rlDeckList(b).filter(c=>typeof CARDS!=="undefined"&&CARDS[c.id]),parts=(b.parts||[]).filter(id=>typeof PARTS!=="undefined"&&PARTS[id]);
    const st=b.stats||{maxHp:0,tune:Object.assign({},b.tune)};
    return{at:b.at,char:b.char,mode:b.mode,night:b.night||0,reach:b.reach||{area:b.area,row:b.row},result:b.res,deck,parts,
      stats:{maxHp:+st.maxHp||0,tune:Object.assign({tire:0,shift:0,engine:0,light:0,ecu:0},st.tune||{})},heatMax:+b.heatMax||0,ver:b.ver||""}}};
window.runlog=runlog;
