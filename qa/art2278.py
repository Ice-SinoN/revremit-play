# ★v0.22.78 4人の戦闘の絵が本番か（仮のドットでないか）・幅 4096 をこえる絵がないか・読めなかったときの読み直し。python qa/art2278.py <html か フォルダ（index.html のある所）>
import sys,json,pathlib,threading,http.server,functools
from playwright.sync_api import sync_playwright
arg=pathlib.Path(sys.argv[1]).resolve();R={"ng":[]};errs=[]
srv=None
if arg.is_dir():
  class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
  srv=http.server.ThreadingHTTPServer(("127.0.0.1",8771),functools.partial(Q,directory=str(arg)));threading.Thread(target=srv.serve_forever,daemon=True).start();url="http://127.0.0.1:8771/index.html"
else:url=arg.as_uri()
with sync_playwright() as p:
  b=p.chromium.launch()
  for nm,vp in [("phone",dict(viewport={"width":844,"height":390},is_mobile=True,has_touch=True,device_scale_factor=3)),("pc",dict(viewport={"width":1280,"height":720}))]:
    pg=b.new_page(**vp);pg.on("pageerror",lambda e:errs.append(str(e)))
    pg.goto(url);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
    r=pg.evaluate("""async()=>{const out={};qaSetProgress({slot:1,nightMax:4,tutorial:1,chars:['YUKI','HINA','MOMO','NANA']});
      const wide=[...ART_HAVE].filter(f=>f.endsWith('.png'));const big=[];await Promise.all(wide.filter(f=>/characters\\/|_sheet/.test(f)).map(async f=>{const im=await loadImg0(f);if(im&&(im.width>4096||im.height>4096))big.push(f)}));out.big=big;
      for(const ch of ['YUKI','HINA','MOMO','NANA']){PRF().char=ch;qaNewRun({mode:'MT',night:1});G.row=0;enterNode&&0;startBattleState('sedan');enterBattle();await new Promise(r=>setTimeout(r,300));
        const s=PSPR();out[ch]={real:!!(SPR[ch]&&!SPR[ch].proc),mine:s===SPR[ch],frames:s&&s.frames?s.frames.length:0,w:s&&s.frames?s.frames[0].width:0,screen:SCREEN}}
      /* 読めなかったときの読み直し：HINA を仮にして戦闘へ */
      const keep=SPR.HINA;SPR.HINA={proc:1,frames:[]};PRF().char='HINA';qaNewRun({mode:'MT',night:1});startBattleState('sedan');enterBattle();await new Promise(r=>setTimeout(r,1500));out.retry=!!(SPR.HINA&&!SPR.HINA.proc)&&PSPR()===SPR.HINA;if(!out.retry)SPR.HINA=keep;return out}""")
    R[nm]=r
    if r["big"]:R["ng"].append([nm,"big",r["big"]])
    for ch in ["YUKI","HINA","MOMO","NANA"]:
      x=r[ch]
      if not(x["real"] and x["mine"] and x["frames"]>=30 and x["w"]==224):R["ng"].append([nm,ch,x])
    if not r["retry"]:R["ng"].append([nm,"retry"])
    pg.screenshot(path=f"/tmp/art2278_{nm}.png")
if srv:srv.shutdown()
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
