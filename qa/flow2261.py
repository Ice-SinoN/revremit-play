# ★v0.22.61 虎雪 11-20 07:58 ／★v0.22.140 今のキャラ選択（v0.22.108〜）に合わせて書きかえ：スタート1つ → キャラ → 準備（走りかた・夜）→ ミニカー（中身）→ 準備 → 出発。リザルトのパーツの効果。見切れ・重なり。python qa/flow2261.py <html>
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
  for vw,vh in [(1280,720),(956,440),(1920,1080),(667,375),(1180,820)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000);pg.wait_for_timeout(400)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO'],tutorial:true});PRF().night=2;PRF().lastMode='MT';const a=[];a.push({v:2,id:'m0',char:'HINA',rank:'S',mode:'AT',clear:true,score:9,cards:[{id:'h_youda',up:true},{id:'h_fullthrottle',up:false}],part:'h_12inch',tune:{},at:1});a.push({v:2,id:'m1',char:'YUKI',rank:'B',mode:'MT',clear:false,score:5,cards:[{id:'nadare',up:false},{id:'shironeko',up:true}],part:'forged',tune:{},at:2});saveMinicars(a);showTitle()}")
    def shot(name):
      pg.wait_for_timeout(350);r=pg.evaluate(OVER)
      if r["out"] or r["clip"] or r["hit"]:R["ng"].append([vw,name,r])
      pg.screenshot(path=f"/tmp/f61_{name}_{vw}.png")
      m=pg.evaluate("()=>/★v0\\.|\\*\\//.test(document.querySelector('#ui').innerText)")
      if m:R["ng"].append([vw,name,"memo"])
    shot("title");R.setdefault("titleBtns",pg.evaluate("()=>[...document.querySelectorAll('#ui button')].map(b=>b.innerText.split('\\n')[0])"))
    if not pg.evaluate("()=>document.querySelectorAll('#ui button').length"):R["ng"].append([vw,"titleBtns"])
    pg.evaluate("()=>startFlow()");shot("startpick");pg.evaluate("()=>{S.farmChoiceMode=null;farmChoiceSelf()}");shot("chars")
    pg.evaluate("()=>csSelect('HINA')");pg.evaluate("()=>document.querySelector('.csgo').click()");R.setdefault("r",pg.evaluate("()=>window.SCREEN"));shot("ready")
    if pg.evaluate("()=>window.SCREEN")!="runok":R["ng"].append([vw,"ready",pg.evaluate("()=>window.SCREEN")])
    pg.evaluate("()=>{readyMode('AT');readyNight(1)}");R.setdefault("rn",pg.evaluate("()=>[S.flow.mode,PRF().night]"));shot("ready_at")
    fc=pg.evaluate("()=>{const e=document.querySelector('#ui .nface');return e?e.innerText.trim():null}");R.setdefault("face",fc)
    if fc!="霧の夜":R["ng"].append([vw,"face",fc])
    if pg.evaluate("()=>S.flow.mode!=='AT'"):R["ng"].append([vw,"readyMode",pg.evaluate("()=>S.flow.mode")])
    pg.evaluate("()=>readyMc()");R.setdefault("g",pg.evaluate("()=>window.SCREEN"));shot("garage0")
    pg.evaluate("()=>{toggleBring(0);toggleBring(1)}");shot("garage2")
    d=pg.evaluate("()=>{const s=document.querySelector('#mcd');return s?{t:s.innerText.slice(0,400),sc:s.scrollHeight>s.clientHeight}:null}");R.setdefault("mcd",d)
    if not d or not d["t"].strip():R["ng"].append([vw,"mcd",d])
    pg.evaluate("()=>startWithMinicars()");R.setdefault("back",pg.evaluate("()=>[window.SCREEN,S.flowBring.length,S.flow.mode]"));shot("ready_mc")
    if pg.evaluate("()=>window.SCREEN!=='runok'||S.flowBring.length!==2"):R["ng"].append([vw,"back",R["back"]])
    pg.evaluate("()=>{readyMode('MT');readyGo()}");pg.wait_for_timeout(300);pg.evaluate("()=>bootSkip()");pg.wait_for_timeout(600)
    R[f"run{vw}"]=pg.evaluate("()=>({s:window.SCREEN,mode:G&&G.mode,ch:G&&G.char,bring:G&&G.bring&&G.bring.length,last:PRF().lastMode})")
    if pg.evaluate("()=>!G||G.mode!=='MT'||G.char!=='HINA'||G.bring.length!==2"):R["ng"].append([vw,"run",R[f"run{vw}"]])
    memo=pg.evaluate("()=>/★v0\\.|\\*\\//.test(document.querySelector('#ui').innerText)")
    if memo:R["ng"].append([vw,"memo"])
    pg.evaluate("()=>{G.parts=['turbo','forged','studless','h_12inch','limiter'].filter(x=>PARTS[x]);G.st.clear=true;showResult(true)}");pg.wait_for_timeout(500);shot("result")
    rp=pg.evaluate("()=>{const r=document.querySelector('#rpd');if(!r)return null;const st=document.querySelector('#stage').getBoundingClientRect(),k=st.height/360,b=r.getBoundingClientRect();return{n:r.children.length,t:r.innerText.slice(0,200),bottom:(b.bottom-st.top)/k,scroll:r.scrollHeight>r.clientHeight}}")
    if not rp or rp["n"]<1:R["ng"].append([vw,"rpd",rp])
    R.setdefault("rpd",rp);pg.evaluate("()=>pickPart(2)");R.setdefault("rpsel",pg.evaluate("()=>[...document.querySelectorAll('#rpd .rp1')].map(x=>x.classList.contains('on'))"))
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
