# ★v0.22.79 引き継ぎ（スマホ）：端末A で書き出し（QR を画面に）→ 端末B のカメラ（にせのカメラに QR の動画）で読む → スロットに上書きの確認 → 同じデータ。貼りつけも。python qa/xfercam2279.py <revremit-play のフォルダ>
import sys,json,threading,http.server,functools,subprocess,base64,os,tempfile
from playwright.sync_api import sync_playwright
d=sys.argv[1];R={"ng":[]};errs=[]
class Q(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
srv=http.server.ThreadingHTTPServer(("127.0.0.1",8772),functools.partial(Q,directory=d));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL="http://localhost:8772/index.html";W="window.SCREEN==='data'||window.SCREEN==='title'"
PH=dict(viewport={"width":844,"height":390},is_mobile=True,has_touch=True,device_scale_factor=3)
tmp=tempfile.mkdtemp()
with sync_playwright() as p:
  b=p.chromium.launch()
  A=b.new_context(**PH);pa=A.new_page();pa.on("pageerror",lambda e:errs.append(str(e)))
  pa.goto(URL);pa.wait_for_function(W,timeout=120000)
  pa.evaluate("qaSetProgress({slot:1,nightMax:0,tutorial:1,log:777,cards:'all'})")
  if os.environ.get('BIG'):pa.evaluate("(()=>{let t='';for(let i=0;i<2600;i++)t+=Math.random().toString(36).slice(2,4);PRF().qaPad=t;SAVE.auto()})()")
  # 1タップで行けるか：タイトルの「データ」→ スロットの「書き出す」
  pa.evaluate("showTitle()");pa.wait_for_timeout(300)
  R["title_data"]=pa.evaluate("[...document.querySelectorAll('#ui button')].some(b=>/データ/.test(b.textContent))")
  pa.evaluate("showData()");pa.wait_for_timeout(300)
  R["data_line"]=pa.evaluate("(()=>{const e=document.querySelector('#ui .dlocal');if(!e||!e.innerText.includes('別の端末へは'))return false;const a=e.getBoundingClientRect();return ![...document.querySelectorAll('#ui button')].some(b=>{const c=b.getBoundingClientRect();return a.left<c.right&&c.left<a.right&&a.top<c.bottom&&c.top<a.bottom})&&e.scrollWidth<=e.clientWidth+1})()")
  R["data_buttons"]=pa.evaluate("[...document.querySelectorAll('#ui button')].map(b=>b.textContent.trim()).filter(t=>/書き出|読み込/.test(t))")
  pa.evaluate("xferExport(1,'data')");pa.wait_for_function("S.xfer&&S.xfer.parts",timeout=20000)
  parts=pa.evaluate("S.xfer.parts");code=pa.evaluate("S.xfer.code");R["parts"]=len(parts);R["qrw"]=pa.evaluate("(t)=>XFER.qrCanvas(t).width",parts[0])
  # QR が画面に見えるか（はみ出しなし）
  R["qr_vis"]=pa.evaluate("(()=>{const c=document.querySelector('#xqrw canvas');if(!c)return false;const r=c.getBoundingClientRect();return r.width>=120&&r.top>=0&&r.bottom<=innerHeight})()")
  pa.click("#xqrw");pa.wait_for_timeout(300)
  R["qr_big"]=pa.evaluate("(()=>{const c=document.querySelector('#xqrw canvas');if(!c)return 0;const r=c.getBoundingClientRect();return Math.round(Math.min(r.width,r.height))})()")
  pa.screenshot(path="/tmp/xfer_big.png")
  # QR を画像にして動画（1枚 1.5秒ずつ・くり返し）
  for i,pt in enumerate(parts):
    u=pa.evaluate("(t)=>{const c=XFER.qrCanvas(t),o=document.createElement('canvas');o.width=1280;o.height=960;const g=o.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1280,960);g.imageSmoothingEnabled=false;const s=Math.min(880/c.width,880/c.height);g.drawImage(c,640-c.width*s/2,480-c.height*s/2,c.width*s,c.height*s);window.__qw=c.width;return o.toDataURL('image/png')}",pt)
    open(f"{tmp}/q{i}.png","wb").write(base64.b64decode(u.split(",")[1]))
  lst=open(f"{tmp}/l.txt","w")
  for k in range(4):
    for i in range(len(parts)):lst.write(f"file '{tmp}/q{i}.png'\nduration 1.5\n")
  lst.close()
  subprocess.run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",f"{tmp}/l.txt","-vf","fps=10,format=yuv420p","-pix_fmt","yuv420p",f"{tmp}/qr.y4m"],check=True)
  A.close();b.close()
  b2=p.chromium.launch(args=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream",f"--use-file-for-fake-video-capture={tmp}/qr.y4m"])
  B=b2.new_context(permissions=["camera"],**PH);pb=B.new_page();pb.on("pageerror",lambda e:errs.append(str(e)))
  pb.goto(URL);pb.wait_for_function(W,timeout=120000)
  pb.evaluate("qaSetProgress({slot:1,nightMax:1,tutorial:1,log:5})")
  pb.evaluate("showData()");pb.wait_for_timeout(200);pb.evaluate("xferImport('data')");pb.wait_for_timeout(300)
  R["cam_btn"]=pb.evaluate("[...document.querySelectorAll('#modal button')].map(b=>b.textContent.trim())")
  pb.evaluate("xferCam()")
  try:pb.wait_for_function("document.querySelector('#modal')&&/どのスロット/.test(document.querySelector('#modal').innerText)",timeout=40000);R["cam_read"]=True
  except Exception as e:R["cam_read"]=False;R["cam_msg"]=pb.evaluate("(document.querySelector('#xmsg')||{}).textContent||''")
  pb.screenshot(path="/tmp/xfer_cam.png")
  if R["cam_read"]:
    pb.evaluate("xferConfirm(1)");pb.wait_for_timeout(200);R["confirm"]=pb.evaluate("document.querySelector('#modal').innerText.split('\\n')[0]")
    pb.evaluate("xferDo(1)");pb.wait_for_timeout(800)
    R["after"]=pb.evaluate("({log:PRF().log,nm:PRF().unlock.nightMax,chars:PRF().unlock.chars})")
  # 貼りつけ（カメラなし）
  C=b2.new_context(**PH);pc=C.new_page();pc.goto(URL);pc.wait_for_function(W,timeout=120000)
  pc.evaluate("showData()");pc.evaluate("xferImport('data')");pc.wait_for_timeout(200)
  pc.fill("#modal .xin",code);pc.evaluate("xferRead()")
  try:pc.wait_for_function("/どのスロット/.test(document.querySelector('#modal').innerText)",timeout=15000);pc.evaluate("xferConfirm(2)");pc.evaluate("xferDo(2)");pc.wait_for_timeout(600);R["paste"]=pc.evaluate("({log:PRF().log,nm:PRF().unlock.nightMax})")
  except Exception as e:R["paste"]=str(e)[:100]
  b2.close()
srv.shutdown()
ok=lambda x:isinstance(x,dict)and x.get("log")==777
if not R["title_data"]:R["ng"].append("title_data")
if not R["data_line"]:R["ng"].append("data_line")
if not R["qr_vis"]:R["ng"].append("qr_vis")
if not R.get("cam_read"):R["ng"].append("cam_read")
if not ok(R.get("after")):R["ng"].append("after")
if not ok(R.get("paste")):R["ng"].append("paste")
R["errors"]=errs;print(json.dumps(R,ensure_ascii=False,indent=1))
