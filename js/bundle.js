/* ★v0.22.200 絵の束（アーティファクトの「1つの版に 512 ファイルまで」のため・窓口 11-27 案A）
   アーティファクトの版だけ window.RR_BUNDLED=1（tools/bundle_art.py が index.html に書く）。そのときは
   assets/bundles/index.json（path → [束, 位置, 長さ, 種類]）と assets/bundles/<束>.txt（元のファイルをそのままつないで base64 にしたもの）から絵を出す。
   ・ゲームのコードは今までどおり "assets/c2/…png" の名前で使う。<img> の src・style の url()・fetch・new Image() をここで束の blob URL に読みかえる。
   ・起動で読む束（eager）は先に全部ひらく。キャラの戦闘シート・奥義・カットインの束（lazy）は、その絵が初めて要るときにひらく。
   ・RR_BUNDLED がなければ何もしない（revremit-play・試作の1ファイル版はそのまま）。 */
(function(){
  if(!window.RR_BUNDLED)return;
  const BLOB=window.ART_BLOB={},LOADING={};let IDX=null;
  const norm=u=>String(u||"").replace(/^\.\//,"").replace(/^\/+/,"");
  const ent=u=>IDX&&IDX.files[norm(u)];
  function openGroup(g){if(LOADING[g])return LOADING[g];
    return LOADING[g]=(async()=>{const r=await _fetch("assets/bundles/"+g+".txt");if(!r.ok)throw new Error("bundle "+g);const bs=atob((await r.text()).trim()),buf=new Uint8Array(bs.length).buffer,u8=new Uint8Array(buf);for(let i=0;i<bs.length;i++)u8[i]=bs.charCodeAt(i);/* アーティファクトは .bin を置けないので base64 の .txt */
      for(const[p,e]of Object.entries(IDX.files)){if(e[0]!==g||BLOB[p])continue;BLOB[p]=URL.createObjectURL(new Blob([new Uint8Array(buf,e[1],e[2])],{type:e[3]}))}})()
      .catch(e=>{delete LOADING[g];console.warn(e)})}
  async function ensure(u){const e=ent(u);if(!e)return null;const p=norm(u);if(!BLOB[p])await openGroup(e[0]);return BLOB[p]||null}
  window.bundleURL=u=>BLOB[norm(u)]||null;window.bundleEnsure=ensure;window.bundleHas=u=>!!ent(u);
  const swap=s=>String(s).replace(/assets\/[^'")\s]+/g,m=>BLOB[m]||m);
  const lazyIn=s=>{const L=String(s).match(/assets\/[^'")\s]+/g)||[];return L.filter(m=>!BLOB[m]&&ent(m))};
  /* fetch */
  const _fetch=window.fetch.bind(window);
  window.fetch=async function(u,o){if(typeof u==="string"&&ent(u)){const b=await ensure(u);if(b)return _fetch(b,o)}return _fetch(u,o)};
  /* <img>.src・new Image() */
  const D=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");
  Object.defineProperty(HTMLImageElement.prototype,"src",{configurable:true,enumerable:D.enumerable,get(){return D.get.call(this)},
    set(v){const b=BLOB[norm(v)];if(b){D.set.call(this,b);return}if(ent(v)){const el=this;el.dataset.bsrc=v;ensure(v).then(x=>{if(el.dataset.bsrc===v)D.set.call(el,x||v)});return}D.set.call(this,v)}});
  /* setAttribute("src"|"style") */
  const _sa=Element.prototype.setAttribute;
  Element.prototype.setAttribute=function(n,v){if(n==="src"&&this instanceof HTMLImageElement){this.src=v;return}if(n==="style"&&/assets\//.test(v)){fixStyle(this,v);return}return _sa.call(this,n,v)};
  function fixStyle(el,v){const need=lazyIn(v);_sa.call(el,"style",swap(v));if(need.length)Promise.all(need.map(ensure)).then(()=>{if(el.getAttribute("style")===swap(v)||true)_sa.call(el,"style",swap(v))})}
  /* innerHTML などで入った物 */
  function fixEl(el){if(el.nodeType!==1)return;
    if(el.tagName==="IMG"){const s=el.getAttribute("src");if(s&&/^\.?\/?assets\//.test(s))el.src=s}
    const st=el.getAttribute("style");if(st&&/assets\//.test(st)&&swap(st)!==st)fixStyle(el,st);else if(st&&lazyIn(st).length)fixStyle(el,st);
    el.querySelectorAll&&el.querySelectorAll('img[src^="assets/"],img[src^="./assets/"],[style*="assets/"]').forEach(x=>{if(x.tagName==="IMG"){const s=x.getAttribute("src");if(s&&!/^blob:/.test(s))x.src=s}const t=x.getAttribute("style");if(t&&/assets\//.test(t))fixStyle(x,t)})}
  new MutationObserver(ms=>{for(const m of ms){if(m.type==="childList")m.addedNodes.forEach(fixEl);else if(m.type==="attributes")fixEl(m.target)}})
    .observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","style"]});
  /* 起動：目次と eager の束 */
  window.RR_BUNDLE_READY=(async()=>{try{const r=await _fetch("assets/bundles/index.json");if(!r.ok)return;IDX=await r.json();window.RR_BUNDLE=IDX;
      await Promise.all((IDX.eager||[]).map(openGroup))}catch(e){console.warn("bundle",e)}})();
})();
