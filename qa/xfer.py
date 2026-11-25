# ★v0.22.26 引き継ぎコード：書き出し → 別の端末（別のブラウザの保存）で読み込み → つづきから。python qa/xfer.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
W="window.SCREEN==='data'||window.SCREEN==='title'"
with sync_playwright() as p:
  b=p.chromium.launch()
  A=b.new_context(viewport={"width":1280,"height":720});pa=A.new_page();pa.on("pageerror",lambda e:errs.append("A "+str(e)))
  pa.goto(html);pa.wait_for_function(W,timeout=120000)
  # 進みを作る：解放・ログ・ミニカー・ラン中
  R["A"]=pa.evaluate("""()=>{SAVE.use(1);const p=SAVE.cur.profile;p.tutorial=true;p.log=1234;p.unlock.chars.push('HINA','MOMO');p.unlock.nightMax=2;p.decks.YUKI=defaultDeck('YUKI');
    newRunState('MT','YUKI',[],null,{night:1});for(let i=0;i<30;i++)p.minicars.push(makeMinicar({rank:'A',total:900+i,ten:G.deck.slice(0,10)},[0,1,2,3,4],-1));G.row=4;G.hp=33;saveRun({s:'map'});SAVE.auto();
    return{label:SAVE.label(SAVE.cur),run:!!loadRun()}}""")
  pa.evaluate("()=>{G=null;B=null;showData()}");pa.wait_for_timeout(200);pa.screenshot(path="/tmp/xf_data.png")
  pa.evaluate("()=>xferExport(1,'data')");pa.wait_for_function("!!(S.xfer&&document.querySelector('canvas.xqr'))",timeout=20000);pa.wait_for_timeout(200)
  pa.screenshot(path="/tmp/xf_export.png")
  ex=pa.evaluate("""async()=>{const X=S.xfer,out=[];for(const t of X.parts){const cv=XFER.qrCanvas(t);out.push(await XFER.readImg(cv))}
    const box=document.querySelector('#modal .box').getBoundingClientRect(),st=document.querySelector('#stage').getBoundingClientRect();
    const inb=[...document.querySelectorAll('#modal .box *')].every(e=>{const q=e.getBoundingClientRect();return !q.width||(q.left>=box.left-1&&q.right<=box.right+1&&q.top>=box.top-1&&q.bottom<=box.bottom+1)});
    return{code:X.code,len:X.code.length,parts:X.parts.length,qrOK:out.every((t,i)=>t===X.parts[i]),boxIn:box.top>=st.top&&box.bottom<=st.bottom,inb}}""")
  R["export"]={k:v for k,v in ex.items() if k!="code"};code=ex["code"]
  if not ex["qrOK"] or not ex["boxIn"] or not ex["inb"]:R["ng"].append(["export",R["export"]])
  # 別の端末
  for vw,vh in [(1280,720),(844,390)]:
    Bc=b.new_context(viewport={"width":vw,"height":vh});pb=Bc.new_page();pb.on("pageerror",lambda e:errs.append("B "+str(e)))
    pb.goto(html);pb.wait_for_function(W,timeout=120000)
    pb.evaluate("()=>{showData();xferImport('data')}");pb.wait_for_timeout(150)
    # QR を分けて読んだときと同じ（かけらを順に入れる）
    parts=pa.evaluate("()=>S.xfer.parts")
    for t in parts[:-1]:
      pb.evaluate("t=>xferGot(t)",t)
    pb.wait_for_timeout(100);mid=pb.evaluate("()=>document.querySelector('#xmsg').innerText")
    pb.screenshot(path=f"/tmp/xf_import_{vw}.png")
    pb.evaluate("t=>xferGot(t)",parts[-1]);pb.wait_for_function("!!(S.xin&&S.xin.res)",timeout=20000);pb.wait_for_timeout(150)
    pb.screenshot(path=f"/tmp/xf_pick_{vw}.png")
    pb.evaluate("()=>xferConfirm(2)");pb.wait_for_timeout(100);pb.evaluate("()=>xferDo(2)");pb.wait_for_timeout(200)
    r=pb.evaluate("""()=>{const p=SAVE.cur.profile;return{slot:SAVE.slot,label:SAVE.label(SAVE.cur),log:p.log,chars:p.unlock.chars,mc:p.minicars.length,run:!!loadRun(),screen:window.SCREEN,
       stored:!!readSave(2).d,auto:!!readAuto(2).d}}""")
    pb.evaluate("()=>continueRun()");pb.wait_for_timeout(300);r["after"]=pb.evaluate("()=>({screen:window.SCREEN,row:G&&G.row,hp:G&&G.hp})")
    pb.reload();pb.wait_for_function(W,timeout=120000);r["reload"]=pb.evaluate("()=>({slot:SAVE.slot,run:!!loadRun(),log:SAVE.cur.profile.log})")
    R[f"B{vw}"]=dict(mid=mid,**r)
    if not(r["slot"]==2 and r["log"]==1234 and r["run"] and r["after"]["row"]==4 and r["after"]["hp"]==33 and r["reload"]["run"] and "MOMO" in r["chars"]):R["ng"].append([vw,r])
    # 壊れた文字列・新しい版・古い版
    R[f"bad{vw}"]=pb.evaluate("""async(code)=>{const bad=code.slice(0,40)+(code[40]==='A'?'B':'A')+code.slice(41);
      const old=JSON.parse(JSON.stringify(SAVE.cur));old.v=1;old.profile.money=55;delete old.profile.log;old.profile.unlock.diffMax=1;
      const mk=async(d,v)=>{let u8=new TextEncoder().encode(JSON.stringify({x:1,g:'v0.20',n:1,s:d}));u8=await XFER.pipe(u8,CompressionStream,'deflate-raw');return`RR.${v}.z.${XFER.b64(u8)}.${XFER.crc32(u8)}`};
      const nw=JSON.parse(JSON.stringify(SAVE.cur));nw.v=9;
      const r1=await XFER.parse(bad),r2=await XFER.parse(code.slice(0,code.length-30)),r3=await XFER.parse(await mk(old,1)),r4=await XFER.parse(await mk(nw,9)),r5=await XFER.parse('hello');
      return{bad:r1.err,cut:r2.err,old:r3.ok&&r3.old&&r3.s.v===2&&r3.s.profile.log===55,newer:r4.err,junk:r5.err}}""",code)
    x=R[f"bad{vw}"]
    if not(x["bad"] and x["cut"] and x["old"] and x["newer"] and x["junk"]):R["ng"].append(["bad",vw,x])
    # 設定から（ラン中は読み込むがない）
    pb.evaluate("()=>{showOpts()}");pb.wait_for_timeout(100);R[f"opts{vw}"]=pb.evaluate("()=>document.querySelector('#modal').innerText.includes('引き継ぎ')")
    pb.screenshot(path=f"/tmp/xf_opts_{vw}.png")
    Bc.close()
  b.close()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=0))
