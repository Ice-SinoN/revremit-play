# ★v0.22.69 ガレージ（ランの外のメニュー）：タイトル → ガレージ → ミニカー（一覧・中身・処分）／型（キャラごと・もどるとガレージ）／デッキ・ラボ（もどるとガレージ）／図鑑。見切れ・重なり。python qa/hub2269.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
OVER="""(()=>{const st=document.querySelector('#stage').getBoundingClientRect();const els=[...document.querySelectorAll('#ui *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'});
  const out=els.filter(e=>{const r=e.getBoundingClientRect();return r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1}).map(e=>e.className||e.tagName);
  const clip=[...document.querySelectorAll('#ui .sign, #ui button, #ui .chdet')].filter(e=>e.scrollHeight>e.clientHeight+2&&!e.classList.contains('scroll')&&getComputedStyle(e).overflowY!=='auto').map(e=>(e.className+':'+e.innerText.slice(0,20)));
  const tops=[...document.querySelectorAll('#ui > .sign, #ui > .col, #ui > button, #ui > .row, #ui > .hdr')].map(e=>[e.className,e.getBoundingClientRect()]);const hit=[];
  for(let i=0;i<tops.length;i++)for(let j=i+1;j<tops.length;j++){const a=tops[i][1],b=tops[j][1];if(a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1&&!(tops[i][0]+tops[j][0]).includes('scroll'))hit.push(tops[i][0]+' x '+tops[j][0])}
  return{out:out.slice(0,5),clip:clip.slice(0,5),hit:hit.slice(0,5)}})()"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(956,440),(667,375),(1180,820),(1920,1080)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000);pg.wait_for_timeout(300)
    pg.evaluate("()=>{qaSetProgress({slot:1,nightMax:3,chars:['HINA','MOMO','NANA'],tutorial:true,log:300});const a=[];for(let i=0;i<5;i++)a.push({v:2,id:'m'+i,char:['YUKI','HINA','MOMO','NANA','YUKI'][i],rank:'A',mode:'MT',clear:true,score:9,cards:[{id:'hyouga',up:false},{id:'nadare',up:true}],part:'turbo',tune:{},at:i});saveMinicars(a);showTitle()}")
    def shot(name):
      pg.wait_for_timeout(300);r=pg.evaluate(OVER)
      if name!="lab" and (r["out"] or r["clip"] or r["hit"]):R["ng"].append([vw,name,r])
      pg.screenshot(path=f"/tmp/hub_{name}_{vw}.png")
    shot("title");pg.evaluate("()=>[...document.querySelectorAll('.col button')].find(b=>b.textContent.startsWith('ガレージ')).click()");shot("hub")
    R.setdefault("hub",pg.evaluate("()=>[...document.querySelectorAll('.hubb b')].map(x=>x.textContent)"))
    pg.evaluate("()=>showMcBox()");shot("mcbox");n0=pg.evaluate("()=>loadMinicars().length");pg.evaluate("()=>{mcDispose();S.mcDisGo()}");n1=pg.evaluate("()=>loadMinicars().length")
    if n1!=n0-1:R["ng"].append([vw,"dispose",n0,n1])
    pg.evaluate("()=>showHub()");pg.evaluate("()=>[...document.querySelectorAll('.hubt')][2].click()");shot("tree");tch=pg.evaluate("()=>document.querySelector('.hdr').textContent")
    pg.evaluate("()=>treeBack()");s1=pg.evaluate("()=>window.SCREEN")
    pg.evaluate("()=>showDeck()");pg.evaluate("()=>document.querySelector('.backbtn, button.back')&&0");pg.evaluate("()=>{S.deck=null;hubBack()}");s2=pg.evaluate("()=>window.SCREEN")
    pg.evaluate("()=>{showLab();}");shot("lab");pg.evaluate("()=>hubBack()");s3=pg.evaluate("()=>window.SCREEN")
    R[f"{vw}"]=[tch,s1,s2,s3]
    if not(tch=="ももの型" and s1==s2==s3=="hub"):R["ng"].append([vw,"nav",tch,s1,s2,s3])
    pg.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False)[:2500])
