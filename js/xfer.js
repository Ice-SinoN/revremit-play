"use strict";
/* ===== ★v0.22.26 引き継ぎコード（★虎雪 11-19 11:19「1 でいいよ」・窓口 11:20）=====
   母艦（PC）・スマホ・試作ページ・revremit-play で同じセーブを使う。
   書き出し：選んだスロット（＋そのスロットのオートセーブ。同じ中身なら1つだけ）を
     JSON → deflate-raw（CompressionStream。使えない端末は圧縮なし）→ base64url にして、
     「RR.<セーブの版>.<z|n>.<本体>.<CRC32>」の文字列にする。QR は長ければ何枚かに分ける（「RRQ<i>/<n>:」＋かけら）。
   読み込み：貼りつけ／QR（カメラ・写真）→ チェックの値を確かめる → normSave で今の版に直す（MIGRATE）。
     新しい版のセーブ（v が今より大きい）は直せないので読まない。壊れた文字列は読まずに知らせる。
   入れないもの：音量・早送り・全画面（OPTS＝端末ごとの設定。セーブの外にある）。 */
const XFER={TAG:"RR",QRMAX:700,/* ★v0.22.79 1100 → 700：スマホのカメラで読みやすい細かさ（1枚が細かいと読めない） */
  crc32(u8){let c,t=XFER._t;if(!t){t=XFER._t=new Uint32Array(256);for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}}
    c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=t[(c^u8[i])&255]^(c>>>8);return((c^0xFFFFFFFF)>>>0).toString(16).padStart(8,"0")},
  b64(u8){let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")},
  unb64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u},
  async pipe(u8,cls,mode){const st=new Blob([u8]).stream().pipeThrough(new cls(mode));return new Uint8Array(await new Response(st).arrayBuffer())},
  canZ(){return typeof CompressionStream==="function"&&typeof DecompressionStream==="function"},
  /* 同じか（書いた時刻などはくらべない） */
  same(a,b){const k=o=>{const x=Object.assign({},o);delete x.at;delete x.game;delete x.slot;delete x.plays;return JSON.stringify(x)};try{return k(a)===k(b)}catch(e){return false}},
  /* スロット n の中身（今あそんでいるスロットは今のデータ） */
  pick(n){const s=n===SAVE.slot&&SAVE.cur?SAVE.cur:readSave(n).d,a=readAuto(n).d;return{s,a:a&&s&&!XFER.same(a,s)?a:null}},
  async make(n){const{s,a}=XFER.pick(n);if(!s)return null;
    const clean=d=>{const o=JSON.parse(JSON.stringify(d));delete o.newer;return o};
    const body={x:1,g:VERSION_NO(),n,s:clean(s)};if(a)body.a=clean(a);
    let u8=new TextEncoder().encode(JSON.stringify(body)),z="n";
    if(XFER.canZ()){try{u8=await XFER.pipe(u8,CompressionStream,"deflate-raw");z="z"}catch(e){z="n"}}
    return`${XFER.TAG}.${SAVE_V}.${z}.${XFER.b64(u8)}.${XFER.crc32(u8)}`},
  /* 読む。{ok,s,a,g,n} か {err:"…"} */
  async parse(code){code=String(code||"").replace(/\s+/g,"");
    const m=code.match(/^RR\.(\d+)\.([zn])\.([A-Za-z0-9_-]+)\.([0-9a-f]{8})$/);
    if(!m)return{err:code?"引き継ぎコードの形ではありません（途中で切れているかもしれません）":"引き継ぎコードを入れてください"};
    let u8;try{u8=XFER.unb64(m[3])}catch(e){return{err:"引き継ぎコードがこわれています"}}
    if(XFER.crc32(u8)!==m[4])return{err:"引き継ぎコードがこわれています（チェックの値が合いません。1文字ちがうか、途中で切れています）"};
    if(+m[1]>SAVE_V)return{err:"新しい版の試作で書き出したデータです。この試作を新しくしてから読んでください"};
    if(m[2]==="z"){if(!XFER.canZ())return{err:"この端末のブラウザでは読めません（圧縮をほどけません）。ブラウザを新しくしてください"};
      try{u8=await XFER.pipe(u8,DecompressionStream,"deflate-raw")}catch(e){return{err:"引き継ぎコードがこわれています"}}}
    let o;try{o=JSON.parse(new TextDecoder().decode(u8))}catch(e){return{err:"引き継ぎコードがこわれています"}}
    if(!o||o.x!==1||!o.s)return{err:"引き継ぎコードの中身が読めません"};
    if(+o.s.v>SAVE_V)return{err:"新しい版の試作で書き出したデータです。この試作を新しくしてから読んでください"};
    const s=normSave(o.s);if(!s)return{err:"セーブの中身が読めません（今の版に直せませんでした）"};
    const a=o.a?normSave(o.a):null;return{ok:true,s,a:a&&!a.newer?a:null,g:o.g||"",n:+o.n||1,old:+o.s.v<SAVE_V}},
  /* QR のかけら（1枚に入らなければ分ける） */
  qrParts(code){if(code.length<=XFER.QRMAX)return[code];const n=Math.ceil(code.length/XFER.QRMAX),L=Math.ceil(code.length/n),a=[];
    for(let i=0;i<n;i++)a.push(`RRQ${i+1}/${n}:`+code.slice(i*L,(i+1)*L));return a},
  qrCanvas(text){if(typeof qrcode!=="function")return null;const q=qrcode(0,"L");q.addData(text,"Byte");q.make();
    const k=q.getModuleCount(),cell=6,pad=4,cv=document.createElement("canvas");cv.width=cv.height=(k+pad*2)*cell;const g=cv.getContext("2d");
    g.fillStyle="#fff";g.fillRect(0,0,cv.width,cv.height);g.fillStyle="#000";
    for(let r=0;r<k;r++)for(let c=0;c<k;c++)if(q.isDark(r,c))g.fillRect((c+pad)*cell,(r+pad)*cell,cell,cell);cv.className="xqr";return cv},
  /* 読んだ文字（貼りつけ・QR）を集める。全部そろえばコードを返す */
  feed(t){t=String(t||"").trim();const m=t.match(/^RRQ(\d+)\/(\d+):(.*)$/s);
    if(!m){XFER.col=null;return t}
    const i=+m[1],n=+m[2];if(!XFER.col||XFER.col.n!==n)XFER.col={n,p:{}};XFER.col.p[i]=m[3].replace(/\s+/g,"");
    const got=Object.keys(XFER.col.p).length;if(got<n)return null;
    let s="";for(let k=1;k<=n;k++){if(XFER.col.p[k]==null)return null;s+=XFER.col.p[k]}XFER.col=null;return s},
  colTxt(){const c=XFER.col;if(!c)return"";return`QR ${Object.keys(c.p).length}／${c.n} 枚 読みました（${Array.from({length:c.n},(_,i)=>c.p[i+1]!=null?"●":"○").join("")}）`},
  /* 画像（写真・カメラの1コマ）から QR の文字 */
  async readImg(src){try{if("BarcodeDetector" in window){const bd=new BarcodeDetector({formats:["qr_code"]}),r=await bd.detect(src);if(r&&r[0])return r[0].rawValue}}catch(e){}
    if(typeof jsQR!=="function")return null;const w=src.videoWidth||src.naturalWidth||src.width,h=src.videoHeight||src.naturalHeight||src.height;if(!w||!h)return null;
    const sc=Math.min(1,1200/Math.max(w,h)),cv=document.createElement("canvas");cv.width=Math.round(w*sc);cv.height=Math.round(h*sc);const g=cv.getContext("2d");g.drawImage(src,0,0,cv.width,cv.height);
    const d=g.getImageData(0,0,cv.width,cv.height),r=jsQR(d.data,cv.width,cv.height,{inversionAttempts:"attemptBoth"});return r?r.data:null}};

/* ---------- 画面 ---------- */
function xferBack(){if(S.xferFrom==="opts"&&typeof renderOpts==="function")renderOpts();else{closeModal();if(window.SCREEN==="data")showData()}}
/* 書き出す */
async function xferExport(n,from){S.xferFrom=from||"data";n=+n||SAVE.slot;SND.se("ui_ok");
  modal(`<div class="xf"><div class="h">引き継ぎコード（スロット${n}）</div><div class="small dim">作っています…</div></div>`);
  let code=null;try{code=await XFER.make(n)}catch(e){console.error(e)}
  if(!code){modal(`<div class="xf"><div class="h">書き出せませんでした</div><div class="small">スロット${n}にデータがありません。</div><div class="row"><button onclick="xferBack()">もどる</button></div></div>`);return}
  S.xfer={code,parts:XFER.qrParts(code),i:0,n};xferRenderExport()}
function xferRenderExport(){const X=S.xfer,np=X.parts.length;
  if(X.big){modal(`<div class="xf xbig"><div class="xqrw xqrb" id="xqrw" onclick="S.xfer.big=false;xferRenderExport()"></div>
    <div class="row xpg">${np>1?`<button onclick="xferPg(-1)" ${X.i?"":"disabled"}>◀</button><span class="small">${X.i+1}／${np}</span><button onclick="xferPg(1)" ${X.i<np-1?"":"disabled"}>▶</button>`:""}<button onclick="S.xfer.big=false;xferRenderExport()">もどす</button></div></div>`);
    const w=$("#xqrw"),cv=XFER.qrCanvas(X.parts[X.i]);if(w&&cv)w.appendChild(cv);const m=$("#modal .modal .box");if(m)m.classList.add("xfbig");return}/* QR をタップで大きく（スマホで読みやすく） */
  modal(`<div class="xf xfe"><div class="h">引き継ぎコード（スロット${X.n}）</div>
   <div class="xrow"><div class="xqrw" id="xqrw" onclick="S.xfer.big=true;xferRenderExport()" title="タップで大きく"></div><div class="xcol">
    <div class="small">別の端末で「データ」→「読み込む（引き継ぎ）」を押して、コードを貼りつけるか、QR を読んでください。</div><div class="small dim">QR はタップで大きく</div>
    ${np>1?`<div class="small gold">QR は ${np} 枚に分けています。<br>全部読むと、そろいます。</div><div class="row xpg"><button onclick="xferPg(-1)" ${X.i?"":"disabled"}>◀</button><span class="small">${X.i+1}／${np}</span><button onclick="xferPg(1)" ${X.i<np-1?"":"disabled"}>▶</button></div>`:""}
    <div class="small dim">${X.code.length} 文字・音量などの設定は入りません。</div></div></div>
   <textarea class="xcode" readonly onclick="this.select()">${esc(X.code)}</textarea>
   <div class="row"><button class="main" onclick="xferCopy()">コピー</button><button onclick="xferBack()">とじる</button></div></div>`);
  const w=$("#xqrw"),cv=XFER.qrCanvas(X.parts[X.i]);if(w&&cv)w.appendChild(cv);const m=$("#modal .modal .box");if(m)m.classList.add("xfbox")}
function xferPg(d){const X=S.xfer;X.i=Math.max(0,Math.min(X.parts.length-1,X.i+d));SND.se("ui_ok");xferRenderExport()}
async function xferCopy(){const t=S.xfer&&S.xfer.code;if(!t)return;let ok=false;
  try{await navigator.clipboard.writeText(t);ok=true}catch(e){}
  if(!ok){const a=$("#modal .xcode");if(a){a.removeAttribute("readonly");a.select();try{ok=document.execCommand("copy")}catch(e){}a.setAttribute("readonly","")}}
  SND.se(ok?"save_ok":"card_cant");toast2(ok?"コピーしました":"コピーできませんでした。コードを長押しして選んでください")}
/* 読み込む */
function xferImport(from){S.xferFrom=from||"data";XFER.col=null;S.xin={msg:"",txt:""};SND.se("ui_ok");xferRenderImport()}
function xferRenderImport(){const I=S.xin;
  modal(`<div class="xf"><div class="h">引き継ぎコードを読み込む</div>
   <textarea class="xcode xin" placeholder="ここに貼りつけ" oninput="S.xin.txt=this.value">${esc(I.txt||"")}</textarea>
   <div class="row"><button class="main" onclick="xferRead()">読む</button><button onclick="xferCam()">QR をカメラで</button><button onclick="$('#xfile').click()">QR の写真</button></div>
   <input type="file" id="xfile" accept="image/*" style="display:none" onchange="xferPhoto(this)">
   <div id="xcamw"></div>
   <div class="small ${I.err?"ngc":"gold"}" id="xmsg">${esc(I.msg||XFER.colTxt()||"")}</div>
   <div class="row"><button onclick="xferCamStop();xferBack()">やめる</button></div></div>`);
  const m=$("#modal .modal .box");if(m)m.classList.add("xfbox")}
function xferMsg(t,err){S.xin.msg=t;S.xin.err=!!err;const e=$("#xmsg");if(e){e.textContent=t;e.className="small "+(err?"ngc":"gold")}}
async function xferRead(){const t=($("#modal .xin")||{}).value||S.xin.txt||"";const code=XFER.feed(t);if(code==null){xferMsg(XFER.colTxt());return}xferCheck(code)}
async function xferGot(text){if(!text)return false;const code=XFER.feed(text);if(code==null){SND.se("ui_ok");xferMsg(XFER.colTxt());return false/* ★v0.22.79 かけらを1枚読んだら、カメラは止めずに次の QR を待つ（前は止まって2枚目から読めなかった） */}xferCamStop();await xferCheck(code);return true}
async function xferPhoto(inp){const f=inp.files&&inp.files[0];inp.value="";if(!f)return;xferMsg("写真を読んでいます…");
  const url=URL.createObjectURL(f),img=new Image();img.onload=async()=>{const t=await XFER.readImg(img);URL.revokeObjectURL(url);if(!t){SND.se("card_cant");xferMsg("写真から QR を読めませんでした（QR を大きく、まっすぐ写してください）",true);return}xferGot(t)};
  img.onerror=()=>{URL.revokeObjectURL(url);xferMsg("写真を開けませんでした",true)};img.src=url}
async function xferCam(){xferCamStop();const w=$("#xcamw");if(!w)return;
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){xferMsg("この画面ではカメラを使えません。「QR の写真」で読んでください",true);return}
  let st;try{st=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment",width:{ideal:1920},height:{ideal:1080}},audio:false})/* ★v0.22.79 ふつうは 640×480 で来るので、細かい QR が読めない */}catch(e){xferMsg("カメラを使えませんでした（許可がない・ページの中では使えない）。「QR の写真」で読んでください",true);return}
  w.innerHTML=`<video class="xcam" playsinline muted></video>`;const v=w.firstChild;v.srcObject=st;S.xcam={st,v,on:true};try{await v.play()}catch(e){}xferMsg(XFER.colTxt()||"QR をカメラに向けてください");
  const loop=async()=>{if(!S.xcam||!S.xcam.on)return;let t=null;try{t=await XFER.readImg(v)}catch(e){}if(t&&S.xcam&&S.xcam.last!==t){S.xcam.last=t;if(await xferGot(t))return}setTimeout(loop,250)};loop()}
function xferCamStop(){const c=S.xcam;S.xcam=null;if(c){c.on=false;try{c.st.getTracks().forEach(t=>t.stop())}catch(e){}}const w=$("#xcamw");if(w)w.innerHTML=""}
async function xferCheck(code){xferMsg("確かめています…");const r=await XFER.parse(code);
  if(!r.ok){SND.se("card_cant");xferMsg(r.err,true);return}
  S.xin.res=r;SND.se("ui_ok");xferPickSlot()}
function xferPickSlot(){const r=S.xin.res,L=SAVE.list();
  modal(`<div class="xf"><div class="h">読み込むデータ</div>
   <div class="small">${esc(SAVE.label(r.s))}</div><div class="small dim">${esc(SAVE.when(r.s))}${r.g?esc((TEXT.ui&&TEXT.ui.xfer_in_from||"・{日時} に書き出し").replace("{日時}",r.g)):""}${r.old?"・今の版に直した":""}${r.a?"・オートセーブつき":""}</div>
   <div class="small gold">どのスロットに入れますか？</div>
   ${L.map(x=>`<button class="${x.k===r.n?"main":""} xsl" onclick="xferConfirm(${x.k})">スロット${x.k}<span class="small dim">　${esc(x.broken?"読めないデータ":x.d?SAVE.label(x.d):"（空き）")}</span></button>`).join("")}
   <div class="row"><button onclick="xferImport(S.xferFrom)">もどる</button></div></div>`);const m=$("#modal .modal .box");if(m)m.classList.add("xfbox")}
function xferConfirm(n){const x=SAVE.list().find(q=>q.k===n),has=x&&(x.d||x.broken);SND.se(has?"overwrite_warn":"ui_ok");
  modal(`<div class="h">スロット${n}に${has?"上書きしますか？":"読み込みますか？"}</div>
   ${has?`<div class="small">今の中身（${esc(x.broken?"読めないデータ":SAVE.label(x.d))}）は消えます。もとにはもどせません。</div>`:""}
   <div class="row"><button class="${has?"warn":"main"}" onclick="xferDo(${n})">${has?"上書きする":"読み込む"}</button><button onclick="xferPickSlot()">やめる</button></div>`)}
function xferDo(n){const r=S.xin&&S.xin.res;if(!r)return;
  const cur=r.a&&(r.a.at||0)>(r.s.at||0)?r.a:r.s;/* オートセーブのほうが新しければ、それを今のデータに（つづきから） */
  writeSave(n,r.s,n);writeSave(autoKey(n),r.a||r.s,n,true);lsSet(LAST_KEY,String(n));
  SAVE.slot=n;SAVE.cur=(cur===r.a?readAuto(n).d:readSave(n).d)||cur;
  S.xin=null;S.deck=null;S.mcSel=[];SND.se("load_ok");closeModal();if(S.xferFrom==="opts"){S.optsOpen=false}showTitle();toast2(`スロット${n}に読み込みました${loadRun()?"（つづきから あそべます）":""}`)}
