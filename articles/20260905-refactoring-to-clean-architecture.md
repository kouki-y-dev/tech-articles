---
title: "段階的リファクタリングで理解するクリーンアーキテクチャ ～過剰設計の罠まで～"
emoji: "🧅"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ["python", "cleanarchitecture", "architecture", "refactoring", "設計"]
published: true
---

## 初めに

「クリーンアーキテクチャの同心円の図は見たことがあるけれど、実際のコードにどう落とし込めばいいかわからない」

クリーンアーキテクチャを学ぼうとしたとき、このような壁にぶつかった経験はないでしょうか。
昨今、生成AIによるコード生成が当たり前になったからこそ、「保守しやすく破綻しないアーキテクチャを設計する力」の重要性はますます高まっています。しかし、概念や用語だけを丸暗記しても、現場で適切に適用するのは困難です。

そこで本記事では、**「1つの関数にすべてが詰め込まれた最悪の密結合コード」**を出発点に、段階的なリファクタリングを通じてクリーンアーキテクチャへ移行していくプロセスを解説します。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture

なお、本記事は筆者自身がクリーンアーキテクチャの役割や設計思想を改めて自分の中に定着させるための「思考整理・備忘録」も兼ねています。
「なぜその層が必要なのか」を一緒に体感しながら、クリーンアーキテクチャの本質を掴んでいきましょう。

## 実践前に座学

実際の検証へ入る前に、クリーンアーキテクチャとは何なのかを改めて整理したいと思います。理解できている人は読み飛ばして貰って大丈夫です。

### 前提: **関心の分離**について

クリーンアーキテクチャを理解するためには**関心の分離**という考え方を理解する必要があります。
ここを理解できているかできていないかでここから先の理解度が大きく変わると思います。

[Wikipedia - 関心の分離](https://ja.wikipedia.org/wiki/%E9%96%A2%E5%BF%83%E3%81%AE%E5%88%86%E9%9B%A2)

> 関心の分離とは、ソフトウェア工学においては、プログラムを関心（責任・何をしたいのか）毎に分離された構成要素で構築することである。

自分の中の理解としては、「**1つのファイルや関数に全てを詰め込むのではなく、ちゃんと役割や機能単位で適切に分ける事**」と理解してます。
良く聞くMVCモデルとかも、大枠で言えばこの関心の分離をしていると言えます。

#### 簡単な具体例（例: 飲食店）

イメージを一旦掴んでもらうため、**飲食店**を例に簡単な具体例を出します。

飲食店と言えば普通は**ホール担当やキッチン担当、仕入れ担当や経営者**と色々な人間が居て店が回ります。
各担当者は**お互いの担当範囲は把握しています**が、**各々の細かい作業内容までは把握していません**。

キッチン担当はホールの作業に口出ししませんし、ホール担当は調理工程を把握していたりはしません。
仕入れ担当も仕事は在庫管理で接客には関与しませんし、経営者は(健全な会社なら)現場にマイクロマネジメントしたりしません。

ただ、完全にお互いの作業を知らないわけではありません。
キッチンとホールは**お互いが注文のやり取りをするという事だけ**知っています。
仕入れ担当はキッチンが**どんな物を欲しているかだけ**知っています。
経営者はそれぞれが何を担当していて、**現場がどう回っているのか**だけ知っています。
この状態にしておくと、仮に1人退職者が出たとしてもそこの穴埋めを雇って引き継ぐだけで済みます。

「**お互いの大まかな仕事内容とやり取りの仕方だけは知っているが、それをどうやるかまでは知らない**」という状態です。
これが世間一般で見ても健全な状態だと思います。この状態は所謂**関心が分離された状態**になります。

----

これを踏まえると、飲食店における**関心が分離されていない状態**とは何でしょうか？

そう、正解は**何もかもが1人に押し付けられているワンオペのブラック企業状態**になります。
1人の人間がキッチンとホールも担当しますし、在庫が足りなければ仕入れもして何なら経営も行います。

こうなってしまうと、何か業務が1つ変わる度にこの人が全てを覚え直す必要があります。
キッチンの手順を覚え直す際にはホールの作業を止めなくてはいけません。1か所を変える際の影響範囲が計り知れません。

| 項目 | 分離されている状態 | 分離されていない状態 |
| :--- | :--- | :--- |
| 担当範囲 | 各々が独立（ホール、キッチン、仕入れなど） | 1人が全てワンオペ |
| 作業内容の把握 | お互いのやり取りの仕方のみ知っている | 全ての業務内容・手順を1人で把握 |
| 変更時の影響 | 影響が局所的（他の作業が止まらない） | 影響範囲が計り知れない（他の作業が止まる） |


### **クリーンアーキテクチャ**とは

ではいよいよ、クリーンアーキテクチャについての解説です。

[Wikipedia - ポートとアダプタ](https://ja.wikipedia.org/wiki/%E3%83%9D%E3%83%BC%E3%83%88%E3%81%A8%E3%82%A2%E3%83%80%E3%83%97%E3%82%BF)
> 2012年には、ロバート・C・マーチン（英語版）によってクリーンアーキテクチャが提唱された。クリーンアーキテクチャは、ヘキサゴナルアーキテクチャ、オニオンアーキテクチャ、他いくつかのアーキテクチャの原則を組み合せたものであり、コンポーネントにさらに詳細なレベルを追加している。

> また、クリーンアーキテクチャでは、アダプターやインターフェース（UIやデータベース、外部システム、デバイス）をより外側のレイヤーに分離し、ユースケースやエンティティをより内側のレイヤーに置く。クリーンアーキテクチャは外側から内側への依存関係のみを許し、その逆を許さないという厳格なルールのもとで、依存性逆転の原則を利用している。

はい、これだけ聞くとよくわかりませんね。
自分の中の理解をまとめると「**関心の分離をしまくって依存の向きを外から内にする事**」と理解しています。

例えば、クリーンアーキテクチャについて調べると確実に出てくるこの画像。

![clean architecture](/images/20260905-refactoring-to-clean-architecture/cleanarchitecture.webp)

これだけ見るとなんか複雑そうな印象を受けますが、この画像で伝えたい事はシンプルで、「**外側の物は内側の物しか見ず、内側から外側の物は見ない**」という事です。
外側の円の物から内側に向かって矢印が書いてあるのはこれを表したいからになります。

#### 内側と外側って？

内側と外側っていきなり出てきてそもそも何やねんって話だと思うのでここで具体例を交えつつ説明したいと思います。

ざっくり書くと以下のような感じになります。

- 外側: データベースやWebフレームワーク、外部APIなど変わりやすく差し替え可能な物。 
- 内側: どんなデータベースや外部APIを使っても変わる事が無いそのシステム特有のロジックやルールの事。

先ほどの画像だと、DBやUI等の水色の部分が最も外側に来ていたと思います。
各円は自分より内側の物しか見ないようにしつつ、そのシステム特有のロジックは中の方に入れましょう事があの画像の最も伝えたい事になります。
こういったシステム特有のロジックやルールの事を**ビジネスロジック**と言います。

つまるところ、プログラムに対して関心の分離をし各ロジックを内側と外側で分けましょうという事です。

#### なぜこんなことするの？

もしもですが、これが逆で「内側の層が外側見る」という状態になっていたらどうなってしまうでしょうか？
例えばプログラムが「**データをMySQLに合わせた形式で作ってMySQLに保存する**」という実装になっていたとしましょう。

- データベースを MySQL から PostgreSQL に乗り換えた
- データベースのバージョンが上がって処理を書き直す必要が出て来た
- データベースへの保存を廃止して別の物へ保存するようにした

こういった「外側の都合」が変わるたびに、一番大事なはずの「内側のビジネスルール（計算ロジックなど）」まで巻き添えで修正しなければならなくなります。

先ほどの飲食店で例えるなら、**「注文伝票を紙からタブレット端末に変えただけなのに、なぜかキッチンのシェフのレシピまで書き直さなければいけなくなった」** というくらいおかしな状態です。

#### でも普通に書いたら「内から外」になるよね？

そう思ったあなたは賢いです。

普通にプログラムを書いた場合、「注文処理の中でデータベースに保存する処理を呼び出す」というコードになりがちです。
これだとどうしても「内側から外側」に矢印が向いてしまいます。

```javascript
// 注文処理（内側：ビジネスルール）
処理 注文を確定する(注文データ) {

    // 内側のルール：在庫チェックや金額計算
    もし 在庫が足りない なら エラーを返す
    合計金額 = 計算する(注文データ)

    // MySQLに依存してるのでデータを整える必要がある
    MySQL用データ = 整形する(合計金額)

    // 外側の都合：特定のデータベースに直接保存（★ここが外側への依存！）
    MySQLデータベースに接続する()
    MySQLにSQLを発行して保存する("INSERT INTO orders ...")
}
```
そこで、クリーンアーキテクチャでは、**インターフェース**という物をうまく挟むことで、依存の矢印を無理くり「外から内」にむけてひっくり返すという事をやります。

…さて、ここまで言葉と図だけで説明されても中々実際のコードが出てこないとピンと来ないと思います。

座学はここまでにして次は実践編です。実際にコードを動かしながら段階的にクリーンアーキテクチャへリファクタリングしていきます！

## クリーンアーキテクチャを段階的に導入して検証

ではいよいよ実践編です。
実際のコードへ段階的にクリーンアーキテクチャを導入して1つ1つ理解していきましょう。

### 課題設定

今回は下記のECサイトの機能を題材に行っていきます。

#### 機能

| 機能 | 説明 |
|------|------|
| 商品一覧の取得 | カタログから商品を一覧表示する |
| カートへの追加・削除 | ユーザーが商品をカートに追加・削除する |
| 注文確定 | 在庫チェック → 合計金額計算 → 注文作成 |
| 注文履歴の参照 | 過去の注文を確認する |

#### ビジネス上のルール（ビジネスロジック）

- 在庫が不足している場合、注文は確定できない
- 合計金額には消費税（10%）が加算される
- 注文が確定すると在庫が減少する

#### その他

- 注文のやり取りはCLI上で完結させる
- データベースは外部に用意せずメモリ上で構築する（簡単にするため）

## Phase 1: 基礎的な責務の分離（Step 0 〜 Step 2）

ここからは具体的なコードを元に進めて行きます。
詳しくはGitHubのリンクを見ながら読み進めて頂くと理解が捗ると思います。

### [Step 0. モノリシックコード](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step0_monolith)

ではまず、一番最初の状態であるクリーンアーキテクチャどころか関心の分離すら何もされていない状態のコードを用意します。
こういったコードを`モノリシックコード`と言います。

特に深く考える事も無く、1つのファイルに全てを詰め込んだ実装になります。
ありがちな実装で、各機能ごとに関数を用意して、それらを呼び出す関数を1つ定義するという実装になります。

#### コード本体

一部抜粋します。全文はGitHubを参照ください。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/blob/main/steps/step0_monolith/src/main.py#L159-L310

#### このコードの問題点

一見すると問題無いように見えますし成り立っていますが、このコードは以下のような問題を抱えています。

1. 責務の混在
    - 1つの関数が「UI」「ビジネスルール」「データ永続化」の3役を同時に担っている
2. コードの重複が多い
    - ビジネスルールである消費税計算や在庫チェックが複数関数に書かれている
    - もしもルールが変わった場合はこれら全てを直す必要がある
3. 型の不在
    - データが全て辞書型のため、タイポに気付けず不正な値（在庫のマイナスなど）を防げない
4. グローバル状態と密結合
    - ロジックが処理に結合してしまっているため、単体テストができない
    - データやり取り用のdictがグローバルでアクセスできるため、どこからアクセスされるか追跡できない
5. 差し替え不能
    - CLIの print() やインメモリ操作が直書きされており、FastAPI等の別フレームワークやDBへの移行が不可能

ざっと上げるとこんな感じです。
確かに成り立ちはしますし動きはしますが、これでは今後改修するのがあまりにも大変です。

**コードが動く事**と**コードが保守しやすい事**は別物です。

ここからは段階を踏んでこのクリーンアーキテクチャに導いていきます。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step0_monolith

---

### [Step 1. 関心の分離（3層へのファイル分割）](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step1_separate_layers)

クリーンアーキテクチャを導入する前に手始めとして、先ほど例でも出した**関心の分離**をこのコードに適用します。
これをするだけでもかなり読みやすくなると思います。

- **Step 0 の問題点**：
  - 1つのファイルに UI、ビジネスロジック、データアクセスが混在し、変更の影響範囲が広すぎる。
  - ロジックが全て1つにまとまっているのが原因でテストがとにかくしにくい
  - ビジネスロジックとUI部分が結合しており、CLIから別のUIへ差し替えたい場合に対応不可能
- **リファクタリング内容**：
  - 責務ごとに 3 つのファイルへ分割：
    - `cli.py`：入出力（UI）のみを担当
    - `service.py`：金額計算や注文の流れ（ビジネスロジック）を担当
    - `data_access.py`：データ（商品・カート・注文）の保持を担当
    - `main.py`：エントリーポイント
- **得られた効果と残る課題**：
  - **効果**
    - UI を伴わない`service.py`を切り出した事により、ここだけ単体テストが可能になった。また、
    - 責務を各ファイルに分けたことで、修正が必要な際はどのファイルを直せば良いか明確になった
    - ビジネスロジックが`service.py`に独立したおかげで、UI部分を変えたとしてもビジネスロジックは影響を受けない形ができた
  - **次の課題**
    - `service.py` が `data_access.py` を直接参照しており、ビジネスロジックがデータアクセスの実装詳細に依存している。また、データが単なる`dict`のままである。

次のステップ以降では、ビジネスロジックがデータへ直接依存しないようにしていきます。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step1_separate_layers

---

### [Step 2. ドメインモデルの導入](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step2_domain_model)

`ドメインモデル`を導入する事により、最も重要なビジネスロジックを内側に持ってくることができます。
また、これまでdictでやり取りしていたデータ型を厳密な型で扱う事ができます。

これまではデータを単なる生の dict で扱っていたため、キー名のタイポに気付けず、在庫がマイナスになるような不正な状態も防げませんでした。
ドメインモデルを導入し、「データ」と「それを操作するビジネスルール（在庫を減らす等）」をクラスの中へひとまとめに閉じ込めることで、常にデータが正しい状態を保てるようになります。

```diff python
# Before:生の dict と、外から直接書き換える手続き関数
- products = {"P001": {"name": "Tシャツ", "price": 2000, "stock": 10}}
- 
- def update_product_stock(product_id: str, quantity: int) -> None:
-     if product_id in products:
-         products[product_id]["stock"] -= quantity

# After: 型定義と「在庫を減らすルール」を自身の中に閉じ込めたエンティティ
+ class Product(BaseModel):
+     id: str
+     name: str
+     price: int = Field(ge=0)
+     stock: int = Field(ge=0)
+ 
+     def decrease_stock(self, quantity: int) -> None:
+         if not self.has_enough_stock(quantity):
+             raise ValueError(f"エラー: {self.name} の在庫が不足しています")
+         self.stock -= quantity
```

- **Step 1 の問題点**：
  - データを単なる `dict` で受け渡しているため、キー名のタイポや不正な値の混入を防げず、より厳密にする必要がある
  - ビジネスルール（在庫減少など）がサービス層に手続き的に散らばっている。
- **リファクタリング内容**：
  - Pydantic(データクラス)を用いてデータモデルクラス（`Product`, `CartItem`, `Cart`, `Order`等）を定義。
  - データの整合性チェックや計算ロジックをエンティティ自身に持たせる事で、ロジックを1か所に集約
- **得られた効果と残る課題**：
  - **効果**
    - Pydantic は型の保証をしてくれるため、タイポや不正な値の入る余地が無くなった
    - ビジネスルールがここに集約されるため、今後変更が必要な場合はここだけを直せば良い
    - ビジネスルールのみがここへ抽出されたため、ここのみで単体テストがとてもしやすい状態になった
  - **次の課題**
    - `service.py`が未だデータの取得・保存処理に依存してしまっているため、データの保存先を変えたい場合に改修が困難
    - データをどう保存・取得するか定義されていないため、`data_access.py`がインメモリの辞書データベースに縛られてる
    - ドメインモデル部分は独立してテストしやすくなったが、service.py はまだテストが困難

データのやり取りがかなり厳密になりつつビジネスルールも1か所に集約されました。これに伴い、`service.py`の役割がドメインとデータアクセスの連携係になりました。
ただ、この`service.py`がまだ具体的にどうドメインを操作するかを取り決めていないため、データアクセス部分にガッツリ依存してしまっている状態です。
次はこの部分を解消したいと思います。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step2_domain_model

---

## Phase 2: 依存関係の逆転（Step 3 〜 Step 5）

### [Step 3. Repository パターンの導入](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step3_repository)

Step3では`service.py`が直接データアクセス部分へ依存しないようにしていきます。そのためにリポジトリを導入し、ここにデータアクセス部分を集約していきます。

これまでは `service.py` が「データがどのような辞書で管理されているか」という詳細を直接知ってしまっていました。
リポジトリを挟むことで、データの保持形式や検索ロジックをリポジトリの中に閉じ込め、サービス側から「データの管理方法」という関心を切り離すことができます。

```diff python
# Before: モジュール直下の辞書と取得関数
- products: dict[str, Product] = {
-     "P001": Product(id="P001", name="Tシャツ", price=2000, stock=10),
-     # ...
- }
- 
- def get_all_products() -> dict[str, Product]:
-     return products

# After: データの保持と取得をカプセル化したリポジトリクラス
+ class ProductRepository:
+     def __init__(self, products: dict[str, Product] | None = None) -> None:
+         if products is None:
+             self._products = {
+                 "P001": Product(id="P001", name="Tシャツ", price=2000, stock=10),
+                 # ...
+             }
+         else:
+             self._products = products.copy()
+ 
+     def find_all(self) -> list[Product]:
+         return list(self._products.values())
```

- **Step 2 の問題点**：
  - サービス層がデータの保存先やデータ構造の詳細を直接意識してしまっていて、依存している。
- **リファクタリング内容**：
  - データ永続化の詳細を隠し、メモリ上のリスト感覚でデータを出し入れできる `Repository` クラス（`ProductRepository` 等）を導入。
    - 「データを全て取得する」というロジックの詳細を知ることなく、ただ`find_all()`だけで呼び出すことができる
    - もしもこの「データを全て取得する」のやり方を変えたい場合は `find_all()`を直すだけで良い
- **得られた効果と残る課題**：
  - **効果**
    - もしデータの持ち方が変わっても、修正するのはリポジトリの中身だけでよく、サービス側を直す必要がない。
    - リポジトリの初期化時にテスト用データを渡せるようになり、テストごとに自由なデータを扱えるようになった。
  - **次の課題**
    - 商品一覧、カート操作、注文処理などのロジックがすべて `service.py` 1つに集まっており、コードが肥大化しやすい
    - `service.py` が「インメモリ用のリポジトリクラス」を直接 `import` して使っているため、本物のDBやモックに差し替えにくい状態のまま

リポジトリを導入する事で、サービス部分は具体的なデータの操作ロジックを知る必要は無く、ただリポジトリを操作するだけでデータの操作ができるようになりました。
これによって、データの操作とそれを呼び出す側で関心の分離が実現できました。

ただ、まだ課題は残っています。
現状ですと、`service.py` にあらゆるロジックが集約されているので、今後機能追加する度にここが肥大化します。Step4ではこれを解消します。
また、依然として`service.py` が直接リポジトリをimportしてしまっていて、DB接続やテスト用のモックに差し替えにくい状態です。Step5でこれを解消します。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step3_repository

---

### [Step 4. ユースケース層の導入](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step4_usecase)

Step3ではリポジトリパターンを導入する事で、データアクセス部分の関心の分離を実現しました。しかし、`service.py` にあらゆるビジネスロジックが集約されており、肥大化しやすい状態です。また、直接リポジトリを参照しているためテストもしにくい状態です。
そこで、「ユースケース層」を導入し、これらの問題を解消していきます。

ユースケースとは、その名の通り「ユーザーがシステムを使ってやりたいこと」を1つのクラスとして表現したものです。
例えば、「商品を一覧表示する」「カートに商品を追加する」「注文を確定する」といった単位でクラスを分割します。
ユースケース自身は細かい計算ルールを持たず、「リポジトリからデータを取得し、ドメインモデルに計算させ、結果をリポジトリに保存する」という一連の流れを指揮する役割を担います。

```diff python
# Before: あらゆる操作が1つのクラスに混在した「巨大なサービス」
- class ShopService:
-     def get_products_list(self) -> list[Product]:
-         return self.product_repo.find_all()
-     # ... カート追加や注文処理などもすべて同居

# After: 「商品一覧の取得」という1つの目的に特化したユースケース
+ class ListProductsUseCase:
+     def __init__(self, product_repo: ProductRepository) -> None:
+         self.product_repo = product_repo
+ 
+     def execute(self) -> list[Product]:
+         return self.product_repo.find_all()
```


- **Step 3 の問題点**：
  - `service.py` が商品一覧、カート追加、注文確定などあらゆる機能を引き受ける「何でも屋」になっていた。
  - カート機能を直したいだけなのに、注文処理と同じファイルを編集することになり、思わぬバグやコード衝突の温床になっていた。
- **リファクタリング内容**：
    - アプリケーションの利用シーンごとに 1 つのクラス（`ListProductsUseCase`, `AddToCartUseCase`, `PlaceOrderUseCase` 等）へ完全に分離。
  - それぞれのユースケースが、自分に必要なリポジトリだけを受け取る形に変更。
- **得られた効果と残る課題**：
  - **効果**
    - 「カート追加を直すときは `AddToCartUseCase` だけを触ればいい」状態になり、他の機能に影響を与えるリスクがなくなった。
    - そのユースケースが必要とする最小限のリポジトリだけを用意すれば単体テストが書けるようになった。
  - **次の課題**
    - ユースケースが `ProductRepository`を直接型注釈やコード内で指定してしまっている。
    - 本来一番重要なユースケースが、データアクセスの都合に縛られており、本番用DBやテスト用モックへ差し替える仕組みがまだない

ユースケース層を導入しユースケースごとにクラスを分ける事で、改修する際の影響範囲が非常に明確になったと思います。また、各ユースケースが必要最低限のリポジトリを参照する事で、各クラスの依存度も必要最小限になっています。
まだ残っている課題として、ユースケース層が特定のリポジトリ実装を直接参照してしまっているため、将来データベースを変更したり、テスト用のモックに差し替えたりすることが難しい状態です。これが座学でも説明した「内から外に依存している状態」です。
次のStep5ではインタフェースを導入していよいよ**依存関係逆転の原則**を適用し、この依存関係をひっくり返していきます。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step4_usecase

---

### [Step 5. 依存関係逆転の原則](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step5_dependency_inversion)

:::message alert

**ここが最大の山場！**  
座学で触れた「依存の矢印を外から内にひっくり返す」をコードで実現します。

:::

Step 4 ではユースケースを導入し、機能を1クラスずつに整理しました。しかし、ユースケースが「インメモリ用のリポジトリ」を直接 import してしまっているため、まだデータアクセスの詳細に縛られています。
そこで、クリーンアーキテクチャの根幹をなす**依存関係逆転の原則**を適用します。

これまでは「**ユースケースがリポジトリの実装に合わせていた**」状態でした。今回は「**ユースケース側で『こういう操作を行えるリポジトリが欲しい』というインターフェースを定義し、外側のリポジトリはそのルールに従って実装する**」形に変えます。

まずは、ドメイン層にインターフェースを定義し、リポジトリ層でそれを実装します。

```python
# 1. ドメイン層：注文リポジトリが満たすべき仕様（インターフェース）を定義
class IOrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None:
        pass

    @abstractmethod
    def find_by_user_id(self, user_id: str) -> list[Order]:
        pass
    # ... 他のメソッド（find_all, count など）


# 2. リポジトリ層：インターフェースを実装した具象クラス
class InMemoryOrderRepository(IOrderRepository):
    def __init__(self, orders: dict[str, Order] | None = None) -> None:
        self._orders: dict[str, Order] = orders if orders is not None else {}

    def save(self, order: Order) -> None:
        self._orders[order.order_id] = order

    def find_by_user_id(self, user_id: str) -> list[Order]:
        return [
            order
            for order in self._orders.values()
            if order.user_id == user_id
        ]
    # ... 他のメソッド
```

このインターフェースをユースケースに適用すると、ユースケースの書き方は以下のように変化します。

```diff python
# Before: 具体的なリポジトリ実装（OrderRepository）を直接受け取っていた
- class GetOrderHistoryUseCase:
-     def __init__(self, order_repo: OrderRepository) -> None:
-         self.order_repo = order_repo
- 
-     def execute(self, user_id: str) -> list[Order]:
-         return self.order_repo.find_by_user_id(user_id)

# After: ドメイン層のインターフェース（IOrderRepository）を受け取るように変更
+ class GetOrderHistoryUseCase:
+     def __init__(self, order_repo: IOrderRepository) -> None:
+         self.order_repo = order_repo
+ 
+     def execute(self, user_id: str) -> list[Order]:
+         return self.order_repo.find_by_user_id(user_id)
```

こうする事で、ユースケースは具体的な注文の処理を知るのではなく、あくまで「注文する物を受け取ってそれを実行する」という形になります。

- **Step 4 の問題点**：
  - ユースケースが `OrderRepository`を直接 `import` してしまっていた。
  - そのため、「将来 MySQL などの本番DBに切り替えたい」「テスト用に偽物のリポジトリを使いたい」と思っても、ユースケース側のコードを書き換えないと差し替えられない状態だった。
  - 本来一番守るべき「業務の手順」が、データアクセスの都合に引きずられていた。
- **リファクタリング内容**：
  - ドメイン層に「こういう操作ができるリポジトリであってほしい」という規約（抽象インターフェース：`IOrderRepository`）を定義。
  - ユースケースはインターフェースだけに依存させ、特定の実装を見ないようにした。
  - リポジトリではそのインターフェースを継承して実装し、具体的なデータ保存処理を作った。
- **次の課題**：
    - テクニックは揃ったが、全体のフォルダ構成やレイヤー境界が、クリーンアーキテクチャの「4つの同心円」として体系的に整理されていない

インターフェースの導入により、元々ユースケースがインメモリリポジトリに直接依存していたところを、「こういう操作をしたい」という抽象的なインターフェースに依存する形へと切り替えることができました。
そして、リポジトリ側がそのインターフェースに合わせて実装することで、依存の向きが完全に逆転しました。これこそが、クリーンアーキテクチャの代名詞ともいえる「**依存関係逆転の原則**」です。

ここまでのリファクタリングでクリーンアーキテクチャの要素は一通り揃いましたが、ディレクトリ構造が一般的な構成とはまだ異なる状態です。次の Step 6 では、全体のフォルダ構成を同心円モデルに合わせて綺麗に整えていきます。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step5_dependency_inversion

---

## Phase 3: アーキテクチャの完成と「過剰設計」の罠（Step 6 〜 Step 7）

### [Step 6. クリーンアーキテクチャの完成形](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step6_clean_architecture)

Step 5 までで、クリーンアーキテクチャに必要な要素は一通り出揃いました。
この Step 6 ではこれまで作ってきた要素を総ざらいし、クリーンアーキテクチャの同心円モデル（先ほどの図）に沿ってディレクトリ構成を体系的に整理します。

```
├── src/
│   ├── domain/                                # 【最内層】Enterprise Business Rules (Entities)
│   │   ├── __init__.py
│   │   ├── entity.py                          # ドメインエンティティ・値オブジェクト (Product, Cart, Order 等)
│   │   └── repository.py                      # リポジトリ抽象インターフェース (IProductRepository 等)
│   ├── usecase/                               # 【内層】Application Business Rules (Use Cases)
│   │   ├── __init__.py
│   │   ├── add_to_cart.py                     # カート追加ユースケース
│   │   ├── get_order_history.py               # 注文履歴取得ユースケース
│   │   ├── list_products.py                   # 商品一覧取得ユースケース
│   │   ├── place_order.py                     # 注文確定ユースケース
│   │   ├── remove_from_cart.py                # カート削除ユースケース
│   │   └── view_cart.py                       # カート表示ユースケース
│   ├── presentation/                          # 【外層】Interface Adapters (Presentation / Controllers)
│   │   ├── __init__.py
│   │   └── cli.py                             # CLI ユーザーインターフェース (UI アダプタ)
│   ├── infrastructure/                        # 【最外層】Frameworks & Drivers / Gateways
│   │   ├── __init__.py
│   │   └── repository/                        # リポジトリ具象実装 (インメモリ / DB / 外部API等)
│   │       ├── __init__.py
│   │       ├── cart_repository.py             # InMemoryCartRepository
│   │       ├── order_repository.py            # InMemoryOrderRepository
│   │       └── product_repository.py          # InMemoryProductRepository
│   └── main.py                                # Composition Root (最外層・DI とブートストラップ)
└── tests/
    ├── conftest.py                            # pytest フィクスチャ (DI コンテナ相当)
    ├── test_domain.py                         # ドメイン層の単体テスト
    ├── test_infrastructure.py                 # インフラ層 (具象リポジトリ) の単体テスト
    ├── test_presentation.py                   # プレゼンテーション層 (CLI) の単体テスト
    └── test_usecase.py                        # ユースケース層の単体テスト
```

#### 整理された4つのレイヤー
- **最内層：`domain/`（Entities）**
  - 純粋なビジネスルール（`Product` や `Order`）と、リポジトリの抽象インターフェース。外部のライブラリやDB、UIの都合には一切依存しない。
- **内層：`usecase/`（Use Cases）**
  - アプリケーション固有の業務フロー（「注文する」「一覧を見る」など）。ドメインモデルやリポジトリを使って処理の手順を組み立てる。
- **外層：`presentation/`（Interface Adapters）**
  - ユーザーとの接点（今回はCLI）。ユーザー入力を受け取り、ユースケースを呼び出す。
- **最外層：`infrastructure/`（Frameworks & Drivers）**
  - 具体的な技術（今回はインメモリ辞書のリポジトリ実装）。ドメイン層のインターフェースを満たす形で実装される。

#### 完成形によって得られたメリット
- **依存の向きが完全に外側から内側へ**
  - 外側（CLIやインフラ）は内側（ユースケースやドメイン）に依存していますが、内側は外側の詳細を一切知りません。
- **高いテスト容易性と差し替え性**
  - 単体テスト（`tests/`）も各層ごとに綺麗に分離され、ビジネスロジックを安全かつ迅速にテスト・改修できる基盤が完成しました。

実務においては、この **Step 6 の状態はもっともバランスが良く、保守しやすい「王道のクリーンアーキテクチャ」** と言えます。

これでクリーンアーキテクチャへのリファクタリングが完成しました！…が、もう少し続きます。
このクリーンアーキテクチャの罠なのですが、**抽象化をやりすぎてしまい逆にコードが保守しにくい状態になってしまう事**があります。次の Step 7 では、あえてその「やりすぎパターン」を見てみましょう。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step6_clean_architecture

---

### [Step 7. 【発展】過剰な抽象化](https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step7_over_engineering)

:::message alert

原典のルールを適用しすぎた場合の「やりすぎ」パターンです。

:::

前回まででクリーンアーキテクチャは完成しましたので、ここからは「**実験のおまけ編**」です。

クリーンアーキテクチャの原典には、あの有名な同心円の図があります。さらに、**「境界を越えるときは必ず専用のインターフェース（Port）やデータ変換用クラス（DTO/Presenter）を挟む」**という非常に厳格なルールも書かれています。

この Step 7 では、その原典の教えを「**あえて1ミリも妥協せずに100%忠実に実装**」してみました。
その結果、コードがどうなってしまったのかを見てみましょう。

まず、ディレクトリ構成から見て見ます。
```
├── src/
│   ├── domain/                                # 【最内層】Enterprise Business Rules
│   │   ├── __init__.py
│   │   ├── entity.py                          # 純粋なドメインエンティティ・値オブジェクト
│   │   └── gateway.py                         # ドメインゲートウェイインターフェース (IProductGateway 等)
│   ├── usecase/                               # 【内層】Application Business Rules
│   │   ├── __init__.py
│   │   ├── port/                              # 境界インターフェース & DTO 群
│   │   │   ├── __init__.py
│   │   │   ├── add_to_cart_port.py            # InputPort, OutputPort, RequestDTO, ResponseDTO
│   │   │   ├── get_order_history_port.py
│   │   │   ├── list_products_port.py
│   │   │   ├── place_order_port.py
│   │   │   ├── remove_from_cart_port.py
│   │   │   └── view_cart_port.py
│   │   └── interactor/                        # ユースケース具象実装 (Interactor)
│   │       ├── __init__.py
│   │       ├── add_to_cart_interactor.py
│   │       ├── get_order_history_interactor.py
│   │       ├── list_products_interactor.py
│   │       ├── place_order_interactor.py
│   │       ├── remove_from_cart_interactor.py
│   │       └── view_cart_interactor.py
│   ├── presentation/                          # 【外層】Interface Adapters (Controllers & Presenters)
│   │   ├── __init__.py
│   │   ├── controller/                        # コントローラー (入力を RequestDTO に変換し InputPort を呼ぶ)
│   │   │   ├── __init__.py
│   │   │   └── order_controller.py
│   │   ├── presenter/                         # プレゼンター (OutputPort を実装し ViewModel を構築)
│   │   │   ├── __init__.py
│   │   │   ├── add_to_cart_presenter.py
│   │   │   ├── get_order_history_presenter.py
│   │   │   ├── list_products_presenter.py
│   │   │   ├── place_order_presenter.py
│   │   │   ├── remove_from_cart_presenter.py
│   │   │   └── view_cart_presenter.py
│   │   ├── view_model/                        # UI 表示専用データ構造 (ViewModel)
│   │   │   ├── __init__.py
│   │   │   └── models.py
│   │   └── cli/                               # UI / View 実装 (画面入出力)
│   │       ├── __init__.py
│   │       └── cli.py
│   ├── infrastructure/                        # 【最外層】Frameworks & Drivers / Gateways
│   │   ├── __init__.py
│   │   ├── persistence/                       # ストレージ専用データモデル (Persistence Record)
│   │   │   ├── __init__.py
│   │   │   └── models.py
│   │   ├── mapper/                            # Entity ↔ Record の双方向 Data Mapper
│   │   │   ├── __init__.py
│   │   │   └── data_mapper.py
│   │   └── gateway/                           # 具象ゲートウェイ実装 (InMemoryProductGateway 等)
│   │       ├── __init__.py
│   │       ├── cart_gateway.py
│   │       ├── order_gateway.py
│   │       └── product_gateway.py
│   └── main.py                                # Composition Root (全レイヤーの DI と起動)
└── tests/
    ├── conftest.py                            # DI コンテナフィクスチャ
    ├── test_domain.py                         # ドメイン層の単体テスト
    ├── test_infrastructure.py                 # インフラ層 (Mapper / Gateway) の単体テスト
    ├── test_presentation.py                   # プレゼンテーション層 (Controller / Presenter / CLI) のテスト
    └── test_usecase.py                        # ユースケース層 (Interactor / Port / DTO) のテスト
```
はい、この時点でかなりカオスですね。ファイル数がStep6から膨大に増えています。もう見るだけでは何がどれを担当するのか判断できません。

では次にソースコードの具体例として、`ListProductsUseCase`を見て見ましょう。

まず、Step6時点の実装はこちらです。インターフェースを経由してリポジトリを受け取り、その中身を返すだけで非常にシンプルです。
```python
class ListProductsUseCase:
    def __init__(self, product_repo: IProductRepository) -> None:
        self.product_repo = product_repo

    def execute(self) -> list[Product]:
        return self.product_repo.find_all()
```

これが Step 7 になると…なんと**商品一覧を取得して表示するだけで、これだけのクラスとコードが必要になります。**

```python
# -------------------------------------------------------------
# 1. ユースケースの入出力データ（DTO: Data Transfer Object）
# -------------------------------------------------------------
class ListProductsRequestDTO(BaseModel):
    model_config = ConfigDict(frozen=True)  # パラメータなし


class ProductItemDTO(BaseModel):
    product_id: str
    name: str
    price: int = Field(ge=0)
    stock: int = Field(ge=0)
    model_config = ConfigDict(frozen=True)


class ListProductsResponseDTO(BaseModel):
    products: list[ProductItemDTO]
    model_config = ConfigDict(frozen=True)


# -------------------------------------------------------------
# 2. 境界インターフェース（Input Port / Output Port）
# -------------------------------------------------------------
class ListProductsInputPort(ABC):
    @abstractmethod
    def execute(self, request: ListProductsRequestDTO) -> None:
        pass


class ListProductsOutputPort(ABC):
    @abstractmethod
    def present_success(self, response: ListProductsResponseDTO) -> None:
        pass

    @abstractmethod
    def present_error(self, error_message: str) -> None:
        pass


# -------------------------------------------------------------
# 3. ユースケース実装（Interactor）: データを DTO に詰め替えて OutputPort へ通知
# -------------------------------------------------------------
class ListProductsInteractor(ListProductsInputPort):
    def __init__(
        self,
        product_gateway: IProductGateway,
        output_port: ListProductsOutputPort,
    ) -> None:
        self.product_gateway = product_gateway
        self.output_port = output_port

    def execute(self, request: ListProductsRequestDTO) -> None:
        products = self.product_gateway.find_all()

        # 【詰め替え①】Entity -> DTO への変換
        items = [
            ProductItemDTO(
                product_id=p.id,
                name=p.name,
                price=p.price,
                stock=p.stock,
            )
            for p in products
        ]
        response = ListProductsResponseDTO(products=items)
        self.output_port.present_success(response)


# -------------------------------------------------------------
# 4. 出力アダプタ（Presenter）: DTO を画面用の ViewModel に詰め替える
# -------------------------------------------------------------
class ListProductsPresenter(ListProductsOutputPort):
    def __init__(self) -> None:
        self.view_model = ListProductsViewModel()

    def present_success(self, response: ListProductsResponseDTO) -> None:
        # 【詰め替え②】DTO -> ViewModel（画面用表示モデル）への変換
        items = [
            ProductItemViewModel(
                product_id=p.product_id,
                name=p.name,
                price_display=f"¥{p.price}",
                stock_display=str(p.stock),
            )
            for p in response.products
        ]
        self.view_model = ListProductsViewModel(
            is_success=True, products=items
        )

    def present_error(self, error_message: str) -> None:
        self.view_model = ListProductsViewModel(
            is_success=False, error_message=error_message
        )


# -------------------------------------------------------------
# 5. 画面表示用モデル（ViewModel）
# -------------------------------------------------------------
@dataclass
class ProductItemViewModel:
    product_id: str
    name: str
    price_display: str  # 例: "¥2,000"
    stock_display: str  # 例: "10"


@dataclass
class ListProductsViewModel:
    is_success: bool = True
    error_message: str = ""
    products: list[ProductItemViewModel] = field(default_factory=list)
```

読むだけでヤバいという事が伝わりますが、やっている事としてはまさに「**データのバケツリレー**」です。
1. **DTO**: ユースケースの実行・受け渡しに必要な専用データクラスを定義
2. **Input Port / Output Port**: ユースケースの入力口と出力先を縛るインターフェースを定義
3. **Interactor**: Port に従い、リポジトリから取ってきたドメインモデルを **DTO に詰め替えて** 出力 Port を呼ぶ
4. **Presenter**: 受け取った DTO を、画面表示用の **ViewModel にさらに詰め替える**
つまり、次のようになります。
- 「リポジトリ ⇔ ユースケース」の間は **ドメインモデル**
- 「ユースケース ⇔ プレゼンター」の間は **DTO**
- 「プレゼンター ⇔ 画面（UI）」の間は **ViewModel**

このように、**レイヤーの境界を超えるたびに毎回専用の型へ詰め替えを行っている**わけです。  
これこそが、クリーンアーキテクチャの原典が求めた「境界を超えるときは必ずインターフェースと専用モデル（DTO）を用意する」というルールの実態です。

これを行ってしまうと、バケツリレーのコードばかりが肥大化してしまい、**本来最も重要なビジネスロジックが埋もれてしまいます**。

もちろんシステムの規模感にもよりますが、これが実務において「Step 6 くらいが最もバランスが良くちょうどいい」と言われる所以です。

https://github.com/kouki-y-dev/refactoring-to-clean-architecture/tree/main/steps/step7_over_engineering

---

## まとめ

今回はモノリシックなコードから段階的にクリーンアーキテクチャを導入し、各層の役割を改めて整理しました。さらには、やり過ぎてしまった場合どうなるのかを自分の中に落とし込むため、リポジトリを構築してこの記事を作成しました。

確かにクリーンアーキテクチャを導入する事でコードの可読性や保守性は上がりますが、規模感によって導入するかは要検討だなと自分は考えています。
小さい物であればStep 1 の関心の分離で事足りる事もありますし、中規模であれば Step 6までの導入を考えますし、大きい物であればもっとその先を考えるべきか…。
脳死でとりあえずクリーンアーキテクチャを導入するのではなく、規模感に応じてどこまで導入するかの判断基準を自分で持っておくことが大事だなと感じました。

実際の所、筆者はStep 1かStep 6をよく使い分けているのですが、もしも今後大きいプロジェクトを作る場合はその先の抽象化も検討すべきだなと感じました。

この記事やリポジトリが誰かの参考になれば幸いです！ぜひ手元で差分を見比べてみてください。最後まで読んでいただきありがとうございました！

