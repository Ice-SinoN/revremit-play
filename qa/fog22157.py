# ★v0.22.157 design 24-9（★v0.22.163 AD v1.25：雲は縦いっぱい y17〜304・左に縦のふち ／★v0.22.158 text 34-2b の文・夜霧のルビ・タップで説明） 霧の見せ方（強さは変えない）：a 霧の予告は種類だけ（攻撃？・守り？・ジャマ？…）・大きな攻撃の音は鳴る／b 霧でシフトしたら資源の帯の上に「霧 防御 +2」1秒・数字が飛ぶ／c 霧の夜のマップの見えない所は「夜霧」の雲1枚と上の1行（マスは出さない）。python qa/fog22157.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(1280,720)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    o=pg.evaluate("""async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));qaSetProgress({slot:1,nightMax:3,tutorial:true});PRF().modeHelp={MT:1,AT:1,CVT:1};OPTS.banter=false;const o={};
      qaNewRun({mode:'MT',night:1});const row=G.map[G.row],j=row.findIndex(n=>n.k==='battle');row[j].wx='fog';G.path[G.row]=j;startBattleState('kei');B.wx='fog';enterBattle();await w(1200);
      const it=()=>(document.querySelector('#ui .intent')||{}).textContent||'';o.types=[];for(const a of [['atk',10],['multi',3,2],['blk',8],['jam','mud',1],['buf',2],['rev',500],['zzz',1]]){B.e.pat=[a];B.e.pi=0;B.e.mi=0;renderBattle();o.types.push(it())}
      const se=[];const oo=SND.se;SND.se=(i,x)=>{se.push(i);return oo.call(SND,i,x)};B.e.pat=[['atk',99]];B.e.pi=0;renderBattle();await w(100);SND.se=oo;
      B.hand=[inst('hyouga')];B.rpm=5000;B.gear=0;B.gas=9;renderBattle();const b0=B.block;doPlay(0,true);o.blk=B.block-b0;o.note=[];for(let i=0;i<60&&!o.note.length;i++){await w(50);o.note=[...document.querySelectorAll('#ui .drvnote.wxn')].map(e=>e.textContent)}await w(1300);o.note2=document.querySelectorAll('#ui .drvnote.wxn').length;
      PRF().night=3;qaNewRun({mode:'MT',night:3});G.row=0;showMap();await w(300);const y=document.querySelector('#ui .yogiri');o.yg=y&&y.innerText.replace(/\\n/g,'|');
      const yr=y.getBoundingClientRect();const stg=document.querySelector('#stage').getBoundingClientRect(),kk=stg.height/360;o.yv=[Math.round((yr.top-stg.top)/kk),Math.round((yr.bottom-stg.top)/kk)];o.edge=!!y.querySelector('.yge');const T2=[];const ot=window.toast2;window.toast2=(t)=>T2.push(t);y.click();window.toast2=ot;o.help=T2[0]||'';o.ruby=!!y.querySelector('ruby rt');o.under=[...document.querySelectorAll('#ui .node')].filter(n=>{const r=n.getBoundingClientRect();return r.right>yr.left+2}).length;o.q=[...document.querySelectorAll('#ui .node')].filter(n=>n.textContent.includes('？')&&!/k-hidden/.test(n.className)).length;
      qaNewRun({mode:'MT',night:2});showMap();await w(200);o.n2=!!document.querySelector('#ui .yogiri');return o}""")
    R[str(vw)]=o
    if o["types"]!=["次：攻撃？","次：攻撃？","次：守り？","次：ジャマ？","次：強化？","次：回転？","次：？？？"]:R["ng"].append([vw,"types",o["types"]])
    if o["blk"]<2 or o["note"]!=["霧 防御 +2"] or o["note2"]:R["ng"].append([vw,"blk",o["blk"],o["note"],o["note2"]])
    if o["yv"]!=[17,304] or not o["edge"] or o["help"]!="霧の夜は、マップが3段先までしか見えない。その先は夜霧の中。" or not o["ruby"] or not o["yg"] or "夜霧" not in o["yg"] or "3段先まで見える" not in o["yg"] or o["under"] or o["n2"]:R["ng"].append([vw,"yogiri",o])
    pg.screenshot(path=f"/tmp/fog157_{vw}.png");pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False))
