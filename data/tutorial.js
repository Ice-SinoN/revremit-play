"use strict";
/* ===== チュートリアル（α3・v0.17）=====
   手順・練習の戦闘・光らせる所・押せる所・進む条件：revremit-design.md 8章（8-1・8-2・8-4・8-5）。正本は design.md。
   文：revremit-text.md v0.4 9章（シナリオ班）。正本は text.md。段の順は design 8-2（ebrake の段はなくなった）。
   ※text.md 9-14 のファイルは試作 v0.15 の形（手札・敵・ebrake の段が古い）なので、丸ごとは差しかえず、文だけ合わせている。
   1段：lines＝はじめの説明（タップで送る）→ wait＝操作を待つ間の一言（光らせた所だけ押せる）→ until を満たす → done＝一言（タップで次の段）。
     hl     光らせる所：{card:手札の id（並び可）, nth:同じカードの何枚目か, sel:"#ui の中の CSS セレクタ"}
     seq    1枚ずつ順に光らせる：[{card, shift:true＝「シフトして打つ」だけ／false＝「○速のまま打つ」だけ}]
     allow  押せるもの："card"・"play"・"down"・"end"・"free"（なんでも）
     shiftOnly／keepOnly／noPlay／noBlow  打ち方のしばり。setup：段のはじめの準備。after:"endTurn"：done の文のあと自動でターン終了
     screen:"map"：戦闘を閉じてマップを見せる段（選べない） */
const TUT={
  key:"revremit_tutorial_done",
  // design 8-1：練習の敵（エリアの倍率はかけない＝noAreaMul）
  enemy:{n:"練習用ゴースト",hp:200,spd:12,pat:[["atk",3],["blk",4],["atk",3]],art:"van"},
  noAreaMul:true,noLose:true,
  rpm:1000,gear:0,
  hand:["hakusen","rikka","pitboard","hakusen","hyouga","shimo","counter"],
  draw:["whiteout","braking","hakunetsu","rinkai"],   // 引く順（先頭から）。シャッフルしない
  hello:[
    ["MIO","こゆきさん、聞こえますか？<br>ROAD に入る前に、練習しておきましょう。"],
    ["YUKI","……ん。手短にね。"],
    ["MIO","は、はい……！<br>練習なので、負けることはありません。"]],
  steps:[
    {id:"preview",hl:{card:"hakusen",nth:0},allow:["card"],until:()=>S.sel>=0&&B.hand[S.sel]&&B.hand[S.sel].id==="hakusen",
      lines:[["MIO","カードにさわると、打ったときの結果が出ます。<br>相手の HP の黄色いところが、減る分です。"],["MIO","カードの下の数字は、今打ったときのダメージ。<br>光っているカードに、さわってみてください。"]],
      wait:"光っているカードに、さわってください。",done:[["YUKI","……打つ前に、わかるんだ。"]]},
    {id:"rpm",hl:{card:"hakusen",nth:0,sel:".detail button"},allow:["card","play"],keepOnly:true,until:()=>B.cards>=1,
      lines:[["MIO","もう一度さわると、打てます。<br>打つと、カードの左上の数だけ回転が上がります。"],["MIO","左下のタコメーターを見ていてくださいね。"]],
      wait:"光っているカードを、打ってください。",done:[["YUKI","……針、上がった。"]]},
    {id:"shift",hl:{card:"rikka",sel:".detail button"},allow:["card","play"],shiftOnly:true,until:()=>B.gear>=1,
      lines:[["MIO","針がシフトの帯に入ります。<br>「シフトして打つ」で、ギアが1つ上がります。"],["MIO","帯の真ん中ならパーフェクト。ガソリンが2つ<br>もどって、1枚引けます。グッドは1つです。"]],
      wait:"光っているカードを「シフトして打つ」。",
      done:()=>TUTS.lastGrade==="perfect"?[["MIO","パーフェクトです……！"],["YUKI","……ん。いい感じ。"]]:[["MIO","グッドです。真ん中なら、もっともどります。"],["YUKI","……次は、真ん中。"]]},
    {id:"gas",hl:{card:["pitboard","hakusen"],sel:".detail button"},allow:["card","play"],keepOnly:true,until:()=>TUTS.turns>=1,
      lines:[["MIO","カードを打つと、右上の G の数だけ<br>ガソリンが減ります。0になると、相手の番です。"],["MIO","残すほど、次の番が早く来ます。<br>今は、使い切ってみましょう。"]],
      wait:"ガソリンを、使い切ってください。",done:[["MIO","相手が動きます。……攻撃が来ます。"],["YUKI","……配分、大事だね。"]]},
    {id:"chain",seq:[{card:"hyouga"},{card:"shimo",shift:true},{card:"counter",shift:true},{card:"whiteout",shift:false}],allow:["card","play"],until:()=>B.chain>=4,
      lines:[["MIO","1ターンに続けて打つほど「CHAIN」が増えて、<br>1枚ごとに強くなります。"],["MIO","カードの L・M・R は、回転の帯です。<br>針がその帯にあるときに打つと、1.5倍です。"]],
      wait:"光る帯のカードを、続けて打ってください。",done:[["YUKI","……打つ順番で、伸びる。"]]},
    {id:"red",setup(){B.gear=5;B.rpm=7400},hl:{card:"hakunetsu"},allow:["card"],noPlay:true,after:"endTurn",
      until:()=>S.sel>=0&&B.hand[S.sel]&&B.hand[S.sel].id==="hakunetsu",
      // 1行目は text.md v0.4 9-5（B.gear は 0 から数える＝5 が6速・いちばん上のギア）
      lines:[["MIO","練習なので、いちばん上の6速にしておきました。<br>針は今、レッドゾーンの中です。"],["MIO","7000 から 8000 は、レッドゾーン。<br>危ないけど、強いカードが打てます。"],["MIO","でも 8000 をこえると……いちばん上のギアなら、<br>エンジンブロー。ランが、そこで終わります。"],["MIO","光っているカードに、さわるだけにしてください。<br>予告に、ブローと出ます……。"]],
      wait:"さわるだけ。打たないでください。",done:[["YUKI","……やりすぎない。わかった。"]]},
    {id:"down",hl:{sel:"button.sub"},allow:["down"],until:()=>TUTS.downs>=1,
      lines:[["MIO","「↓シフト」で、ギアを1つ下げて1枚引けます。<br>ガソリンは1つ使います。"],["MIO","回転は上がるので、レッドゾーンに<br>気をつけてくださいね。"]],
      wait:"「↓シフト」を押してください。",done:[["YUKI","……手札が足りないときに、使う。"]]},
    {id:"finish",setup(){B.e.hp=Math.min(B.e.hp,30)},hl:{card:"rinkai"},allow:["free"],noBlow:true,until:()=>B.over&&B.result==="win",
      lines:[["MIO","あとは、自由に戦ってみてください。<br>相手の残りは、わずかです。"]],
      wait:"相手を倒してください。",done:[[null,"REMIT"],["YUKI","……こんな感じ、か。"]]},
    {id:"map",screen:"map",lines:[["MIO","これが ROAD の地図です。<br>左から右へ、マスを1つずつ選んで進みます。"],["MIO","いちばん右にボス。チューニングショップや<br>ガレージにも、寄り道できます。"]],
      wait:null,done:[["YUKI","……ん。だいたい、わかった。"]]},
    {id:"at",lines:[["MIO","AT で走るときは、シフトは自動です。<br>↓シフトのかわりに、パーキングで1枚引きます。"]],done:[]},
    {id:"end",lines:[["MIO","練習は、これでおしまいです。<br>タイトルの「あそびかた」から、また見られます。"],["MIO","……こゆきさん。気をつけて、くださいね。"],["YUKI","……ん。行ってくる。"]],done:[],end:true},
  ],
  skip:{q:"練習をスキップしますか？",note:"タイトルの「あそびかた」から、いつでも見られます。",yes:"スキップする",no:"つづける"},
};
