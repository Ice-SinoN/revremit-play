# ★v0.22.206 ③v2.5 ld 70：夜紅葉（k_nt2）20→15・強化 30→23（design 26-12 ②）。python qa/v22206.py <html>
import sys,json,pathlib
from playwright.sync_api import sync_playwright
html=pathlib.Path(sys.argv[1]).resolve().as_uri();R={"ng":[]};errs=[]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page();pg.on("pageerror",lambda e:errs.append(str(e)))
  pg.goto(html);pg.wait_for_function("window.SCREEN==='data'||window.SCREEN==='title'",timeout=120000)
  v=pg.evaluate("()=>CARDS.k_nt2?[CARDS.k_nt2.v,CARDS.k_nt2.vu]:null")
  R["k_nt2"]=v
  if v!=[15,23]:R["ng"].append(["k_nt2",v])
  b.close()
R["errs"]=errs[:5]
if errs:R["ng"].append(["errs",errs[:3]])
print(json.dumps(R,ensure_ascii=False))
