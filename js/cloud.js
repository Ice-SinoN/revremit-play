/* js/cloud.js（プログラム班②） */
"use strict";
/* ===== クラウドセーブ（Google ドライブ・案A。★虎雪 11-20 09:14）=====
   ・「Google でログイン」→ セーブ（3スロット＋スロットごとのオートセーブ＋最後に遊んだスロット）を Google ドライブの appDataFolder に自動で読み書き。
     中身は profile の全部（ログ・解放・図鑑・ランの記録・フルオートの整備チケットなど）。音量などの端末の設定（revremit_opts）は入れない。
   ・Google Identity Services の token client（クライアント側だけ・client secret なし・パスワードは扱わない）。scope は drive.appdata だけ。
   ・同期：起動したら読む → 端末とクラウドの新しい方。両方とも前の同期のあとに変わっていたら「端末／クラウド どちらを使う？」（日時と進み具合を並べる）。
     セーブのたびに書く（まとめて 5秒に1回まで）。オフラインのときは端末に貯めて、つながったら書く。ログアウト・クラウドのセーブを消す。
   ・動くのは revremit-play（ice-sinon.github.io）とホーム画面のアプリだけ。claude.ai の試作ページではボタンを出さない（引き継ぎコードのまま）。
   ・Client ID は虎雪が作って窓口から → CLOUD.clientId に入れるだけ。空のあいだはボタンを出さない。
   ・Google の画面（ポップアップ）は、ボタンを押したときか、最初のタップのとき（ブラウザがタップなしのポップアップを止めるため）。 */
const CLOUD={
  clientId:"1073125302705-81emsi0jlehul3q1q9cp80efik429c6q.apps.googleusercontent.com",/* ★虎雪 11-20 09:25（公開してよい値。client secret は使わない） */
  scope:"https://www.googleapis.com/auth/drive.appdata",
  file:"revremit_cloud_save.json",
  hosts:["ice-sinon.github.io","localhost"],     /* 動かす所（localhost は確かめ用） */
  debounce:5000,
  KEY:/^revremit_save_(\d+|auto_\d+|last)$/,     /* 同期するキー（壊れたデータの保管 revremit_save_broken_* は入れない） */
  st:{token:null,exp:0,busy:false,dirty:false,err:"",lastAt:0,fileId:null,ready:false},
  drive:null                                     /* Drive の読み書き（QA では偽物に差しかえる） */
};
window.CLOUD=CLOUD;
/* 端末に覚える：ログインしたか・最後に同期したときの中身の目印と時刻（セーブには入れない） */
function cloudMem(v){try{if(v===undefined)return JSON.parse(localStorage.getItem("revremit_cloud")||"{}");localStorage.setItem("revremit_cloud",JSON.stringify(v))}catch(e){return{}}}
function cloudHere(){try{if(window.self!==window.top)return false}catch(e){return false}/* claude.ai の中（iframe）は出さない */return CLOUD.hosts.includes(location.hostname)}
function cloudUsable(){return!!CLOUD.clientId&&cloudHere()}
window.cloudUsable=cloudUsable;

/* ---------- 端末のセーブ（同期するキーだけ）---------- */
function cloudLocal(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(CLOUD.KEY.test(k))o[k]=localStorage.getItem(k)}return o}
function cloudHash(o){const s=Object.keys(o).sort().map(k=>k+"="+o[k]).join("\n");let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(16)+":"+s.length}
function cloudPack(){const keys=cloudLocal();let at=0;Object.values(keys).forEach(v=>{try{const d=JSON.parse(v);if(d&&d.at>at)at=d.at}catch(e){}});
  return{fmt:"revremit-cloud",v:1,game:(typeof VERSION==="string"?VERSION:""),save:(typeof SAVE_V!=="undefined"?SAVE_V:null),at:at||Date.now(),put:Date.now(),dev:navigator.userAgent.slice(0,80),keys}}
/* 進み具合（確認の小窓に並べる）：スロットごとに 夜・ログ・ミニカー・クリア */
function cloudSummary(keys){const L=[];for(let n=1;n<=3;n++){const v=keys["revremit_save_"+n];if(!v){L.push({n,empty:true});continue}
  try{const d=JSON.parse(v),p=d.profile||{},u=p.unlock||{},cr=p.clearRec||{};const stars=Object.values(cr).reduce((a,x)=>a+(Array.isArray(x)?x.filter(n=>n>0).length:0),0);
   L.push({n,at:d.at,v:d.v,game:d.game,night:u.nightMax||0,log:p.log||0,mc:(p.minicars||[]).length,clears:(p.stats||{}).clears||0,runs:(p.stats||{}).runs||0,plays:d.plays||0,chars:(u.chars||[]).slice(),stars,cr})}catch(e){L.push({n,broken:true})}}return L}
/* 進み具合の大きさ（くらべる用）：夜・★・クリア・ラン・ミニカー・ログ */
function cloudScore(keys){return cloudSummary(keys).reduce((a,s)=>a+(s.empty||s.broken?0:s.night*1e6+s.stars*1e4+s.clears*100+s.runs+s.mc*10+s.log/1000),0)}
function cloudLatest(keys){let at=0;Object.values(keys||{}).forEach(v=>{try{const d=JSON.parse(v);if(d&&d.at>at)at=d.at}catch(e){}});return at}

/* ---------- Google Identity Services（token client）---------- */
let cloudGIS=null;
function cloudLoadGIS(){if(cloudGIS)return cloudGIS;cloudGIS=new Promise((ok,ng)=>{if(window.google&&google.accounts&&google.accounts.oauth2){ok();return}
  const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.onload=()=>ok();s.onerror=()=>{cloudGIS=null;ng(new Error("gis"))};document.head.appendChild(s)});return cloudGIS}
/* トークンをもらう。prompt:"" ＝前に OK した人は Google の画面をすぐ閉じる。タップの中から呼ぶ */
function cloudToken(prompt){return cloudLoadGIS().then(()=>new Promise((ok,ng)=>{
  const tc=google.accounts.oauth2.initTokenClient({client_id:CLOUD.clientId,scope:CLOUD.scope,prompt:prompt==null?"":prompt,
    callback:r=>{if(r&&r.access_token){CLOUD.st.token=r.access_token;CLOUD.st.exp=Date.now()+((+r.expires_in||3600)-120)*1000;ok(r.access_token)}else ng(new Error(r&&r.error||"token"))},
    error_callback:e=>ng(new Error(e&&e.type||"popup"))});tc.requestAccessToken()}))}
function cloudHasToken(){return CLOUD.st.token&&Date.now()<CLOUD.st.exp}

/* ---------- Drive（appDataFolder の1ファイル）---------- */
const CLOUD_DRIVE={
  async req(url,o){o=o||{};o.headers=Object.assign({Authorization:"Bearer "+CLOUD.st.token},o.headers||{});const r=await fetch(url,o);
    if(r.status===401){CLOUD.st.token=null;throw Object.assign(new Error("auth"),{auth:true})}if(!r.ok)throw new Error("drive "+r.status);return r},
  async find(){const q=encodeURIComponent(`name='${CLOUD.file}'`);const r=await this.req(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,modifiedTime)&pageSize=10`);
    const j=await r.json();const f=(j.files||[])[0];return f?f.id:null},
  async read(id){const r=await this.req(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);return r.json()},
  async write(id,data){const body=JSON.stringify(data);
    if(id){await this.req(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`,{method:"PATCH",headers:{"Content-Type":"application/json"},body});return id}
    const b="rr"+Math.random().toString(36).slice(2),meta={name:CLOUD.file,parents:["appDataFolder"],mimeType:"application/json"};
    const mp=`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
    const r=await this.req("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+b},body:mp});return(await r.json()).id},
  async del(id){await this.req(`https://www.googleapis.com/drive/v3/files/${id}`,{method:"DELETE"})}};
CLOUD.drive=CLOUD_DRIVE;

/* ---------- 同期 ---------- */
async function cloudEnsure(interactive){if(cloudHasToken())return true;if(!CLOUD.drive.fake){try{await cloudToken(interactive?"consent":"")}catch(e){CLOUD.st.err=interactive?"ログインできませんでした":"もう一度ログインしてください";return false}}else CLOUD.st.token="fake",CLOUD.st.exp=Date.now()+3600e3;return true}
/* 起動のとき（と、ログインした直後）：読む → くらべる */
async function cloudSyncStart(interactive){if(!cloudUsable()&&!CLOUD.drive.fake)return;if(CLOUD.st.busy)return;CLOUD.st.busy=true;cloudRender();
  try{if(!await cloudEnsure(interactive))return;const D=CLOUD.drive;CLOUD.st.fileId=await D.find();const mem=cloudMem();
    const local=cloudLocal(),lh=cloudHash(local);
    if(!CLOUD.st.fileId){await cloudPut();return}/* クラウドにまだない → 端末のを上げる */
    const remote=await D.read(CLOUD.st.fileId);const rk=remote&&remote.keys||{},rh=cloudHash(rk);
    if(rh===lh){mem.hash=lh;mem.at=Date.now();cloudMem(mem);CLOUD.st.lastAt=remote.put||Date.now();CLOUD.st.ready=true;return}
    const localChanged=mem.hash!==lh,remoteChanged=mem.hash!==rh;
    if(!Object.keys(local).length){cloudApply(remote);return}/* 端末は空 → クラウドを使う */
    if(remoteChanged&&!localChanged){if(cloudScore(rk)>=cloudScore(local)){cloudApply(remote);return}cloudAsk(local,remote);return}/* クラウドだけ変わった → 使う。ただし進み具合が端末より少ないときは、だまって使わずにたずねる */
    if(localChanged&&!remoteChanged){await cloudPut();return}/* 端末だけ新しい → 上げる */
    cloudAsk(local,remote)/* 両方変わった（別の端末で遊んだ・同期がはじめて）→ えらぶ */
  }catch(e){CLOUD.st.err=e.auth?"もう一度ログインしてください":navigator.onLine===false?"オフライン（つながったら保存します）":"クラウドに届きませんでした";console.warn(e)}
  finally{CLOUD.st.busy=false;cloudRender()}}
/* クラウドの中身を端末に書いて、読みこみ直す（開いている画面のデータも入れかえるため） */
/* ★11-20 10:17 虎雪の報告を受けて：上書きする前に、上書きされる側を端末に取っておく（同期しないキー revremit_cloudbak_*・新しい3つまで）。設定の「前のセーブにもどす」から戻せる */
function cloudBackup(tag,keys){try{const k="revremit_cloudbak_"+tag+"_"+Date.now();localStorage.setItem(k,JSON.stringify({at:Date.now(),tag,keys}));
  const L=Object.keys(localStorage).filter(x=>x.startsWith("revremit_cloudbak_")).sort((a,b)=>+b.split("_").pop()-+a.split("_").pop());L.slice(6).forEach(x=>localStorage.removeItem(x))}catch(e){console.warn("cloud backup",e)}}
function cloudApply(remote){const rk=remote.keys||{};cloudBackup("device",cloudLocal());Object.keys(cloudLocal()).forEach(k=>{if(!(k in rk))localStorage.removeItem(k)});Object.entries(rk).forEach(([k,v])=>{try{localStorage.setItem(k,v)}catch(e){}});
  const mem=cloudMem();mem.hash=cloudHash(rk);mem.at=Date.now();cloudMem(mem);CLOUD.st.ready=true;CLOUD.st.lastAt=remote.put||Date.now();
  try{sessionStorage.setItem("revremit_cloud_loaded","1")}catch(e){}location.reload()}
async function cloudPut(){const D=CLOUD.drive,data=cloudPack();if(CLOUD.st.fileId&&!CLOUD.st.bakDone){try{const old=await D.read(CLOUD.st.fileId);if(old&&old.keys&&cloudHash(old.keys)!==cloudHash(data.keys))cloudBackup("cloud",old.keys)}catch(e){}CLOUD.st.bakDone=true}CLOUD.st.fileId=await D.write(CLOUD.st.fileId,data);const mem=cloudMem();mem.hash=cloudHash(data.keys);mem.at=Date.now();cloudMem(mem);
  CLOUD.st.lastAt=data.put;CLOUD.st.dirty=false;CLOUD.st.err="";CLOUD.st.ready=true}
/* セーブのたびに（まとめて 5秒に1回まで）。ログインしていてクラウドと合わせたあとだけ */
let cloudTimer=0;
function cloudDirty(){if(!cloudMem().on||!CLOUD.st.ready)return;CLOUD.st.dirty=true;if(cloudTimer)return;cloudTimer=setTimeout(()=>{cloudTimer=0;cloudFlush()},CLOUD.debounce)}
async function cloudFlush(){if(!CLOUD.st.dirty||CLOUD.st.busy)return;if(navigator.onLine===false){CLOUD.st.err="オフライン（つながったら保存します）";cloudRender();return}
  CLOUD.st.busy=true;try{if(!cloudHasToken()&&!CLOUD.drive.fake){CLOUD.st.err="もう一度ログインしてください（タップで）";return}await cloudPut()}catch(e){CLOUD.st.err=e.auth?"もう一度ログインしてください（タップで）":"クラウドに届きませんでした（あとで保存します）";console.warn(e)}finally{CLOUD.st.busy=false;cloudRender()}}
addEventListener("online",()=>{if(CLOUD.st.dirty)cloudFlush()});
/* ★①へ：save.js の lsSet のあとに CLOUD_HOOK(k) を1行（今は lsSet を外から包む） */
function CLOUD_HOOK(k){if(CLOUD.KEY.test(k))cloudDirty()}
window.CLOUD_HOOK=CLOUD_HOOK;
if(typeof lsSet==="function"&&!lsSet.__cloud){const f=lsSet;window.lsSet=function(k,v){const r=f.apply(this,arguments);if(r)CLOUD_HOOK(k);return r};window.lsSet.__cloud=1}
/* トークンが切れたら、次のタップでそっと取りなおす（ブラウザのポップアップの決まり） */
document.addEventListener("pointerdown",()=>{if(!cloudMem().on||!cloudUsable()||cloudHasToken()||CLOUD.st.busy)return;
  cloudToken("").then(()=>{CLOUD.st.err="";if(!CLOUD.st.ready)cloudSyncStart(false);else if(CLOUD.st.dirty)cloudFlush();cloudRender()}).catch(()=>{})},true);
/* 起動：ログインしたことがあれば、最初のタップで同期（読みこみ直した直後は、もう合わせてあるので書くだけの準備） */
addEventListener("load",()=>{if(!cloudMem().on)return;let just=false;try{just=sessionStorage.getItem("revremit_cloud_loaded")==="1";sessionStorage.removeItem("revremit_cloud_loaded")}catch(e){}
  if(just){CLOUD.st.ready=true;CLOUD.st.lastAt=cloudMem().at||0;setTimeout(()=>toast2&&toast2("クラウドのセーブを読みこみました"),800)}});

/* ---------- ぶつかったとき：どちらを使う？ ---------- */
function cloudAsk(local,remote){const rk=remote.keys||{},L=cloudSummary(local),R=cloudSummary(rk),la=cloudLatest(local),ra=cloudLatest(rk),ls=cloudScore(local),rs=cloudScore(rk);
  const when=t=>t?new Date(t).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"－";
  const nm=c=>(TEXT.names&&TEXT.names[c])||c;
  const col=(S_,at,sc,title,cls)=>`<div class="cdcol ${cls}"><div class="h">${title}</div><div class="small">最後に遊んだ ${when(at)}${at===Math.max(la,ra)&&la!==ra?' <span class="gold">新しい</span>':""}${sc===Math.max(ls,rs)&&ls!==rs?' <span class="gold">進んでいる</span>':""}</div>${S_.map(s=>`<div class="small cdslot">スロット${s.n}：${s.empty?"空き":s.broken?"読めない":`NIGHT ${s.night}・★${s.stars}・クリア ${s.clears}／${s.runs}ラン・ミニカー ${s.mc}・ログ ${s.log}<br><span class="dim">仲間：${s.chars.filter(c=>c!=="YUKI").map(nm).join("・")||"なし"}</span>`}</div>`).join("")}</div>`;
  CLOUD.pending=remote;SND.se("overwrite_warn");
  modal(`<div class="h">どちらのセーブを使いますか？</div><div class="small dim">この端末とクラウドで、ちがうセーブがあります。使わない方は、この端末に取っておきます（設定の「前のセーブにもどす」）。</div>
   <div class="cdrow">${col(L,la,ls,"この端末","dev")}${col(R,ra,rs,"クラウド","cl")}</div>
   <div class="row"><button class="main" onclick="cloudPick('local')">この端末を使う</button><button class="main" onclick="cloudPick('cloud')">クラウドを使う</button><button onclick="closeModal();CLOUD.st.err='どちらを使うか、まだ決めていません';cloudRender()">あとで</button></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("wide")}
async function cloudPick(k){closeModal();if(k==="cloud"){cloudApply(CLOUD.pending);return}CLOUD.st.busy=true;try{await cloudPut();toast2("この端末のセーブをクラウドに保存しました")}catch(e){CLOUD.st.err="クラウドに届きませんでした"}finally{CLOUD.st.busy=false;cloudRender()}}

/* ---------- ボタン ---------- */
async function cloudLogin(){SND.se("ui_ok");const m=cloudMem();m.on=1;cloudMem(m);CLOUD.st.err="";await cloudSyncStart(true);if(!CLOUD.st.ready&&!document.querySelector("#modal .cdrow")){const mm=cloudMem();if(!CLOUD.st.token){mm.on=0;cloudMem(mm)}}cloudRender()}
function cloudLogout(){SND.se("ui_cancel");const t=CLOUD.st.token;try{if(t&&window.google&&google.accounts)google.accounts.oauth2.revoke(t,()=>{})}catch(e){}
  CLOUD.st=Object.assign(CLOUD.st,{token:null,exp:0,ready:false,dirty:false,err:"",fileId:null});cloudMem({});cloudRender();toast2("ログアウトしました（この端末のセーブはそのまま）")}
async function cloudSaveNow(){SND.se("ui_ok");if(!await cloudEnsure(true))return cloudRender();CLOUD.st.dirty=true;CLOUD.st.ready=true;await cloudFlush();if(!CLOUD.st.err)toast2("クラウドに保存しました")}
function cloudDeleteAsk(){SND.se("overwrite_warn");modal(`<div class="h">クラウドのセーブを消しますか？</div><div class="small">Google ドライブに置いたセーブを消します。この端末のセーブは消えません。ほかの端末では、もう引き継げなくなります。</div>
  <div class="row"><button class="warn" onclick="cloudDelete()">消す</button><button onclick="closeModal();showOpts()">やめる</button></div>`)}
async function cloudDelete(){closeModal();try{if(!await cloudEnsure(true))return;const id=CLOUD.st.fileId||await CLOUD.drive.find();if(id)await CLOUD.drive.del(id);CLOUD.st.fileId=null;CLOUD.st.ready=false;const m=cloudMem();delete m.hash;m.on=0;cloudMem(m);toast2("クラウドのセーブを消しました");SND.se("ui_cancel")}catch(e){toast2("消せませんでした（つながっていないかも）")}showOpts()}

/* ---------- 前のセーブにもどす（取っておいた分）・セーブの診断（コピーして窓口へ）---------- */
function cloudBaks(){return Object.keys(localStorage).filter(k=>k.startsWith("revremit_cloudbak_")).sort((a,b)=>+b.split("_").pop()-+a.split("_").pop()).map(k=>{try{return Object.assign({k},JSON.parse(localStorage.getItem(k)))}catch(e){return null}}).filter(Boolean)}
function cloudBakAsk(){const L=cloudBaks();SND.se("ui_ok");const when=t=>new Date(t).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"});
  modal(`<div class="h">前のセーブにもどす</div><div class="small dim">クラウドと合わせたときに、上書きされる前のセーブを取ってあります。もどすと、今のセーブはまた取っておかれます。</div>
   <div class="scroll" style="max-height:170px">${L.map(b=>{const S_=cloudSummary(b.keys||{}).filter(s=>!s.empty&&!s.broken);return`<div class="small cdslot">${when(b.at)}（${b.tag==="cloud"?"クラウドにあった":"この端末にあった"}）　${S_.map(s=>`S${s.n}: NIGHT ${s.night}・★${s.stars}・クリア ${s.clears}`).join("／")||"空"}　<button class="u9 mini" style="position:relative" onclick="cloudBakUse('${b.k}')">これにもどす</button></div>`}).join("")||`<div class="small dim">取ってあるセーブはありません</div>`}</div>
   <div class="row"><button onclick="closeModal();showOpts()">とじる</button></div>`);const m=$("#modal .modal .box");if(m)m.classList.add("wide")}
function cloudBakUse(k){let b;try{b=JSON.parse(localStorage.getItem(k))}catch(e){}if(!b||!b.keys)return;cloudBackup("device",cloudLocal());
  Object.keys(cloudLocal()).forEach(x=>{if(!(x in b.keys))localStorage.removeItem(x)});Object.entries(b.keys).forEach(([x,v])=>localStorage.setItem(x,v));
  const m=cloudMem();delete m.hash;cloudMem(m);/* 次の同期で「どちらを使う？」になる（だまってクラウドに上書きされない） */location.reload()}
/* 診断：端末（とクラウド）のスロットごとの中身の要約をコピー（セーブは書かない） */
async function cloudDiag(){const out={when:new Date().toISOString(),game:typeof VERSION==="string"?VERSION:"",host:location.host,mem:cloudMem(),slot:SAVE.slot,device:cloudSummary(cloudLocal()),last:localStorage.getItem("revremit_save_last"),baks:cloudBaks().map(b=>({at:b.at,tag:b.tag,s:cloudSummary(b.keys||{})}))};
  try{if(cloudHasToken()||CLOUD.drive.fake){const id=CLOUD.st.fileId||await CLOUD.drive.find();if(id){const r=await CLOUD.drive.read(id);out.cloud=cloudSummary(r.keys||{});out.cloudPut=r.put;out.cloudGame=r.game}}}catch(e){out.cloudErr=String(e.message||e)}
  const t=JSON.stringify(out);let ok=false;try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
  modal(`<div class="h">セーブの診断</div><div class="small">${ok?"コピーしました。窓口に貼ってください。":"下の文字を長押しでコピーして、窓口に貼ってください。"}</div><textarea class="rlout" readonly>${esc(t)}</textarea><div class="row"><button onclick="closeModal();showOpts()">とじる</button></div>`);return out}
window.cloudDiag=cloudDiag;

/* ---------- 設定の画面に「クラウドセーブ」の欄（試作ページでは出さない）---------- */
function cloudRow(){if(!cloudUsable()&&!CLOUD.drive.fake)return"";const on=!!cloudMem().on,st=CLOUD.st;
  const when=st.lastAt?new Date(st.lastAt).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):"－";
  const state=!on?"ログインしていない":st.busy?"つないでいます…":st.err?st.err:st.dirty?"保存を待っています":"ログイン中";
  return`<div class="oprow rr2opt cloudrow"><span>クラウドセーブ</span><span class="opbtns">${on?`<button onclick="cloudSaveNow()">今すぐ保存</button><button onclick="cloudLogout()">ログアウト</button>`:`<button class="main" onclick="cloudLogin()">Google でログイン</button>`}</span></div>
   <div class="small rr2opt cloudst"><span class="${st.err?"warnc":""}">${esc(state)}</span>${on?`　最後に保存 ${when}　<button class="u9 mini cloudel" onclick="cloudDeleteAsk()">クラウドのセーブを消す</button>`:`<span class="dim">　どの端末でも、同じセーブで遊べます（Google ドライブのアプリ用の場所）。「確認されていないアプリ」と出たら「詳細」→「Rev:Remit（安全ではないページ）に移動」</span>`}
   <br><button class="u9 mini cloudel" onclick="cloudBakAsk()">前のセーブにもどす（${cloudBaks().length}）</button> <button class="u9 mini cloudel" onclick="cloudDiag()">セーブの診断</button></div>`}
function cloudRender(){const b=$("#modal .opts");if(!b)return;b.querySelectorAll(".cloudrow,.cloudst").forEach(e=>e.remove());const h=cloudRow();if(!h)return;
  const anchor=[...b.querySelectorAll(".oprow")].find(r=>/引き継ぎ/.test(r.textContent));(anchor||b.querySelector(".row")).insertAdjacentHTML(anchor?"afterend":"beforebegin",h)}
RRHOOK.on("screen",o=>{if(o.n==="opts")cloudRender()});
