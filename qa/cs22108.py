# ★v0.22.108 キャラ選択 案1：タイトル → ①えらぶ → ②準備 → ラン。ロック・NEW・ミニカー・型・夜・走りかた。見切れ・重なり（4つの大きさ×3つの文字の大きさ）
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
OVER="""(()=>{const st=document.querySelector('#stage').getBoundingClientRect();const els=[...document.querySelectorAll('#ui *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'});
  const out=els.filter(e=>{const r=e.getBoundingClientRect();return !e.closest('.scroll')&&(r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1)}).map(e=>e.className||e.tagName);
  const clip=[...document.querySelectorAll('#ui .sign, #ui button, #ui .chdet')].filter(e=>e.scrollHeight>e.clientHeight+2&&!e.classList.contains('scroll')&&getComputedStyle(e).overflowY!=='auto').map(e=>(e.className+':'+e.innerText.slice(0,20)));
  const tops=[...document.querySelectorAll('#ui > .sign, #ui > .col, #ui > button, #ui > .row, #ui > .hdr')].map(e=>[e.className,e.getBoundingClientRect()]);const hit=[];
  for(let i=0;i<tops.length;i++)for(let j=i+1;j<tops.length;j++){const a=tops[i][1],b=tops[j][1];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1&&!(tops[i][0]+tops[j][0]).includes('scroll'))hit.push(tops[i][0]+' x '+tops[j][0])}
  return{out:out.slice(0,5),clip:clip.slice(0,5),hit:hit.slice(0,5)}})()"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(667,375),(956,440),(1920,1080),(1280,720)]:
   for fs in ["s","m","l"]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000);pg.wait_for_timeout(300)
    pg.evaluate("""()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO'],tutorial:true});PRF().night=2;PRF().lastMode='AT';PRF().char='HINA';try{OPTS.fsz="%s"}catch(e){}
      saveMinicars([{v:2,id:'m0',char:'HINA',rank:'S',mode:'AT',clear:true,score:9,cards:[{id:'h_youda',up:true},{id:'h_fullthrottle',up:false}],part:'h_12inch',tune:{},at:1},{v:2,id:'m1',char:'YUKI',rank:'B',mode:'MT',clear:false,score:5,cards:[{id:'nadare',up:false},{id:'shironeko',up:true}],part:'forged',tune:{},at:2}])}"""%fs)
    def shot(name):
      pg.evaluate("()=>{try{fsAll()}catch(e){}}");pg.wait_for_timeout(300);r=pg.evaluate(OVER)
      if r["out"] or r["clip"] or r["hit"]:R["ng"].append([vw,fs,name,r])
      if fs=="m":pg.screenshot(path=f"/tmp/cs_{name}_{vw}.png")
    pg.evaluate("()=>{S.farmChoiceMode=null;farmChoiceSelf()}");R.setdefault("s1",pg.evaluate("()=>[window.SCREEN,S.csSel]"));shot("select")
    pg.evaluate("()=>csSelect('MOMO')");R.setdefault("new",pg.evaluate("()=>[PRF().csSeen,document.querySelectorAll('.csnew').length]"))
    pg.evaluate("()=>csSelect('KAEDE')");shot("locked");R.setdefault("lock",pg.evaluate("()=>[document.querySelector('.csdesc').innerText.replace(/\\n/g,' | '),document.querySelector('.csgo').disabled]"))
    pg.evaluate("()=>csSelect('HINA')");shot("select_hina")
    R.setdefault("deck",pg.evaluate("()=>document.querySelector('.csdeck').innerText"))
    pg.evaluate("()=>document.querySelector('.csgo').click()");R.setdefault("s2",pg.evaluate("()=>[window.SCREEN,S.flow.mode,PRF().char]"));shot("ready")
    pg.evaluate("()=>{readyMode('MT');readyNight(-1)}");R.setdefault("rn",pg.evaluate("()=>[S.flow.mode,PRF().night]"))
    pg.evaluate("()=>readyMc()");R.setdefault("g",pg.evaluate("()=>window.SCREEN"));pg.evaluate("()=>{toggleBring(0);toggleBring(1);startWithMinicars()}")
    R.setdefault("back2",pg.evaluate("()=>[window.SCREEN,S.flowBring.length]"));shot("ready_mc")
    pg.evaluate("()=>readyTree(0)");R.setdefault("tree",pg.evaluate("()=>window.SCREEN"));pg.evaluate("()=>treeBack()");R.setdefault("treeback",pg.evaluate("()=>window.SCREEN"))
    pg.evaluate("()=>readyGo()");pg.wait_for_timeout(300);pg.evaluate("()=>bootSkip()");pg.wait_for_timeout(500)
    r=pg.evaluate("()=>({s:window.SCREEN,mode:G&&G.mode,ch:G&&G.char,bring:G&&G.bring&&G.bring.length})");R.setdefault("run",r)
    if r["mode"]!="MT" or r["bring"]!=2:R["ng"].append([vw,fs,"run",r])
    pg.close()
  b.close()
R["errs"]=errs[:5];print(json.dumps(R,ensure_ascii=False,indent=1))
