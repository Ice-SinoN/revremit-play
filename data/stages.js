"use strict";
/* ===== 背景の動き（v0.9.1）=====
   ★虎雪 2026-11-06 14:35「待機中も背景を一部動かしたり、キャラを動かしたり」。★キャラより背景が目立たない強さで。
   背景は「動かない層」（ART_SRC の layers：遠景・中景・近景の透明 PNG）＋「動く層」（ここの move）。
   グラフィック班は assets/revremit_bg_<名前>_move.json に move の並びを書けば、ここの既定を置きかえられる（書き方は下）。
   座標は背景の絵の原寸（絵の大きさと画面の大きさがちがうときは、いっしょにのばす）。

   move の書き方（t＝種類）
     {t:"sheet", src:"assets/…_sheet.png", json:"assets/…_sheet.json", x, y, alpha}   Aseprite のシートをくり返し再生（ネオンの看板・信号など）
     {t:"blink", src:"assets/….png", period:ms, min:0〜1, max:0〜1, x, y}             1枚の絵を明るさだけゆっくり点滅（ネオンの光の層など）
     {t:"glow", layer:番号, period:ms, alpha}                                          絵の中の明るいネオン色の画素を自動で拾って、うすく脈打たせる（絵がまだ分かれていないとき用）
     {t:"flow", src:"assets/….png" か col:"#色", w, h, y, speed:ドット/秒, gap:ドット, alpha}  車のライトなどを横に流す（右から左は speed をマイナス）
     {t:"wave", layer:番号, y0, y1, amp:ドット, period:ms, band:ドット}                   その層の y0〜y1 の帯を横に少しゆらす（水面・ぬれた路面の映りこみ）
     {t:"snow", n:数, alpha}                                                            雪
   強さ：BG_FX.strength（0〜1）で動く層の明るさとゆれ幅をまとめて弱める。BG_FX.max は動く層の明るさの上限。 */
const BG_FX={strength:0.6,max:0.55};
const STAGES={
  street:{art:"bg_street",move:[
    {t:"glow",layer:0,period:2600,alpha:0.5},           // 遠景のネオン（自動で拾う）
    {t:"wave",layer:2,y0:160,y1:270,amp:1,period:2400,band:2},// 路面の映りこみ
    {t:"snow",n:50,alpha:0.6},
  ]},
};
