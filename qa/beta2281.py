# ★v0.22.81 公開β の締め：NIGHT 4 の初クリア → ally_next → next_sora → 締めの画面（文・影6人・案内・タイトルへ）／ガレージの「正式版の予告」／夜の選択の NIGHT 5〜「正式版で」。python qa/beta2281.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
OV="""(()=>{const st=document.querySelector('#stage').getBoundingClientRect();const els=[...document.querySelectorAll('#ui *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0});
 const out=els.filter(e=>{const r=e.getBoundingClientRect();return r.left<st.left-1||r.right>st.right+1||r.top<st.top-1||r.bottom>st.bottom+1}).map(e=>e.className||e.tagName);
 const clip=[...document.querySelectorAll('#ui .sign,#ui button')].filter(e=>e.scrollHeight>e.clientHeight+2&&!e.classList.contains('scroll')).map(e=>e.className);
 const tops=[...document.querySelectorAll('#ui > *')].filter(e=>!/hdr/.test(e.className)&&e.className!=='sign'&&!/betap|besbg|beart/.test(e.className)).map(e=>[e.className,e.getBoundingClientRect()]);const hit=[];
 for(let i=0;i<tops.length;i++)for(let j=i+1;j<tops.length;j++){const a=tops[i][1],b=tops[j][1];if(a.width&&b.width&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1)hit.push(tops[i][0]+' x '+tops[j][0])}
 return{out:out.slice(0,4),clip:clip.slice(0,4),hit:hit.slice(0,4)}})()"""
with sync_playwright() as p:
  b=p.chromium.launch()
  for vw,vh in [(1280,720),(667,375),(956,440)]:
    pg=b.new_page(viewport={"width":vw,"height":vh});pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    pg.evaluate("qaSetProgress({slot:1,nightMax:4,tutorial:1});showTitle();closeModal()")
    pg.evaluate("S.__seen=[];const o=showScene;window.showScene=(k,d)=>{S.__seen.push(k);d&&d()};playJoins(['__next'],()=>{S.__after=1;showTitle()})")
    pg.wait_for_timeout(500)
    pages=[];sil=None;ovs=[]
    for k in range(5):
      pages.append(pg.evaluate("document.querySelector('#ui').innerText"));ovs.append(pg.evaluate(OV))
      if k==1:
        pg.wait_for_timeout(1500);sil=pg.evaluate("[...document.querySelectorAll('.besil canvas')].map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>200)n++;return n})");pg.screenshot(path=f"/tmp/betaend_{vw}_2.png")
      if k==4:pg.screenshot(path=f"/tmp/betaend_{vw}_5.png")
      pg.mouse.click(vw//2,vh//3);pg.wait_for_timeout(150)
    r={"scr":pg.evaluate("SCREEN"),"seen":pg.evaluate("S.__seen"),"pages":[x.split(chr(10))[0] for x in pages],"sil":sil,"btn":"タイトルへ" in pages[4] and "タイトルへ" not in pages[0]}
    r["ov"]={k:sum([o[k] for o in ovs],[]) for k in ["out","clip","hit"]}
    ok=r["scr"]=="betaend" and r["seen"]==["ally_next","next_sora"] and "正式版" in pages[0] and pages[1].count("？？？")>=6 and "このまま遊べます" in pages[2] and "ありがとう" in pages[3] and "待ってる" in pages[4] and r["btn"] and sil and all(n>500 for n in sil) and not any(x in "".join(pages) for x in ["SORA","そら","KAEDE","かえで"])
    if not ok or any(r["ov"].values()):R["ng"].append([vw,r])
    pg.evaluate("betaEndGo()");pg.wait_for_timeout(200);R[f"after{vw}"]=pg.evaluate("[SCREEN,!!S.__after]")
    if R[f"after{vw}"]!=["title",True]:R["ng"].append([vw,"after",R[f"after{vw}"]])
    pg.evaluate("showHub()");hb=pg.evaluate("[...document.querySelectorAll('#ui button')].some(b=>/正式版の予告/.test(b.textContent))");hov=pg.evaluate(OV)
    pg.evaluate("showBetaEnd(()=>showHub(),true)");pg.wait_for_timeout(600);pg.evaluate("betaEndGo()");back=pg.evaluate("SCREEN")
    if not hb or back!="hub" or any(hov.values()):R["ng"].append([vw,"hub",hb,back,hov])
    # ★v0.22.143 E13：夜をえらぶ画面は消した。β は準備の画面で NIGHT 4 より上へ進めない
    nl=pg.evaluate("()=>{PRF().unlock.nightMax=11;PRF().night=4;S.flow={mode:'MT'};showReady();readyNight(1);return [typeof showNights,PRF().night,window.SCREEN]}")
    if nl!=["undefined",4,"runok"]:R["ng"].append([vw,"nights",nl])
    pg.screenshot(path=f"/tmp/nights_{vw}.png")
  R["errors"]=errs
print(json.dumps(R,ensure_ascii=False,indent=1)[:3000])
