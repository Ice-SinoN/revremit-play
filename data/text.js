"use strict";
/* ===== 会話・画面の文（revremit-text.md v0.1 をそのまま。正本は text.md）=====
   scenes：[話す人, 文]。話す人 null＝ト書き、"FILE"＝記録ファイル、"YUKI_IN"＝心の声。<br> は改行。
   bg：場面の絵（グラフィック班 story\c2 の一枚絵。なければ戦闘の背景を暗くして出す）。face：立ち絵の表情（story\c2）。 */
const TEXT={
  names:{YUKI:"こゆき",MIO:"みお",FILE:"",YUKI_IN:"こゆき"},
  scenes:{
    op:{bg:"opening",lines:[
      [null,"春先の夜。.50 CAL のガレージ。"],
      ["MIO","こゆきさん。ZC のロガー、<br>つないでみますね……。"],
      [null,"筐体が、ひとりでに起動する。<br>エンジンの始動音のような起動音。"],
      ["YUKI","……今の音。"],
      [null,"SELECT YOUR WORLD<br>新しい枠「ROAD」"],
      ["MIO","あたらしい世界……？<br>名前は、ROAD……。"],
      ["YUKI","……ん。あたしが行く。"],
      [null,"夜が明けない街。<br>ZC33S がほどけて、右腕に。"],
      ["YUKI","……ZC。<br>そういう形になるんだ。"],
      ["MIO","こゆきさん、聞こえますか？<br>こっちの画面に映ってます。"],
      ["MIO","タコメーターが武器の心臓です。<br>回すほど強く……理論上は。"],
      ["YUKI","……わかった。行こ。"]]},
    first_remit:{lines:[
      [null,"REMIT"],
      ["MIO","記録が……もとの場所に、<br>帰っていきました。"],
      ["YUKI","……送り返した、ってこと。"],
      ["MIO","はい。ゴーストは、<br>持ち主からはがれた走りの記録です。"],
      ["YUKI","……じゃ、全部返す。"]]},
    area1:{title:"エリア1　ストリート",lines:[["YUKI","人、いないのに。<br>ネオンだけ明るい。"]]},
    area2:{title:"エリア2　峠",lines:[["YUKI","……ガレージ前の峠に、似てる。"]]},
    area3:{title:"エリア3　サーキット",lines:[["YUKI","……サーキット。ここで最後。"]]},
    boss1_pre:{bg:"fx:boss_intro",lines:[
      ["MIO","この先、大きい反応……。<br>いろんな人の記録がまざってます。"],
      [null,"テールランプの残像が、<br>人の形に集まっていく。"],
      ["YUKI","……だれのでもない帰り道、か。<br>全部受けて、全部返す。"]]},
    boss1_post:{bg:"boss1_after",lines:[
      [null,"街の灯りが、ひとつずつ消えていく。"],
      ["MIO","みんな、帰っていきます……。"],
      ["YUKI","……おかえり。"]]},
    boss2_pre:{bg:"fx:boss_intro",lines:[
      [null,"夜なのに、この峠だけ白く明るい。"],
      [null,"白いクーペの影が、<br>こゆきと同じラインで曲がる。"],
      ["YUKI","……その線。あたしの走り方。"],
      ["MIO","こゆきさんと、同じ動き……？"]]},
    boss2_post:{bg:"boss2_after",lines:[
      ["YUKI","……悪くなかったよ。"],
      ["MIO","この記録、持ち主が……<br>わかりません。"],
      ["YUKI","……ん。今は、いい。"]]},
    boss3_pre:{bg:"fx:boss_intro",lines:[
      [null,"無人のサーキット。<br>掲示板の名前が、黒く塗られている。"],
      [null,"どこかで、起動音が鳴る。"],
      ["YUKI","……この音。知ってる。"],
      ["MIO","名前が読めません……！<br>形も、決まってない……。"],
      ["YUKI","……関係ない。返す。"]]},
    boss3_phase:{lines:[["MIO","形が、くずれていきます……！"]]},
    ed1:{bg:"boss3_after",bgs:[[0,"boss3_after"],[4,"ending"]],lines:[
      [null,"零号がほどけていく。<br>でも光は、どこへも行かない。"],
      ["MIO","送り先が……読めません。"],
      ["YUKI","……返せない記録、か。"],
      [null,"夜は、明けない。<br>白い光に包まれる。"],
      [null,".50 CAL のガレージ。<br>朝は、まだ来ていない。"],
      [null,"ポケットが、少しだけ重い。"],
      ["YUKI","……ちっちゃい ZC。"],
      ["MIO","こゆきさん……送り先が出ました。<br>「PROJECT ZERO」って。"],
      ["YUKI","……ん。次の夜、また行く。"]]},
    roadlog_001:{title:"PROJECT ZERO - ROAD LOG No.001",file:1,lines:[
      ["FILE","エンジンの始動音の録音。"],
      ["FILE","CROSS GATE の起動音と、<br>波形がぴったり重なる。"],
      ["FILE","録音の日付は、何年も前。"],
      ["YUKI_IN","……この音。<br>どこで聞いたんだっけ。"]]},
  },
  run:{run_start:["ROAD OPEN","……今夜も、開いてる。"],run_stop:["ENGINE STOP","……止まった。次の夜、また来る。"],run_blow:["ENGINE BLOW","……やりすぎた。"],
    run_minicar:["","……今夜の走り、入ってる。"],run_lowhp:["MIO","エンジンの数値が……！"]},
};
/* どの場面をもう見たか（オープニング・初めての REMIT・エリアの一言は1回だけ） */
const SEEN_KEY="revremit_seen_v1";
function seenGet(){try{return JSON.parse(localStorage.getItem(SEEN_KEY)||"{}")||{}}catch(e){return{}}}
function seenSet(k){try{const s=seenGet();s[k]=1;localStorage.setItem(SEEN_KEY,JSON.stringify(s))}catch(e){}}
