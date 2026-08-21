---
title: QiitaとZennを一元管理！GitHub ActionsとAgent Skillsで実現する技術記事執筆環境
tags:
  - Qiita
  - Zenn
  - AgentSkills
  - 生成AI
  - ライティング
private: false
updated_at: '2026-08-21T21:52:05+09:00'
id: 3c75e3e81afeee57ea05
organization_url_name: null
slide: false
ignorePublish: false
posting_campaign_uuid: null
agreed_posting_campaign_term: false
---
:::note info
本記事は [「記事書くの面倒」を解消！Agent Skills×GitHub ActionsでQiita/Zennの執筆環境を作った](https://zenn.dev/yymm/articles/20260821-qiita-zenn-writing-setup) からのクロスポスト記事です。

:::


## はじめに

「とにかく楽に技術記事を書きたい！」
「アウトプットしたいけど書くのめんどくさい！」
「AIに記事書くの手伝ってもらいたい！でも毎回チャットにコピペするの面倒！」

そう思ったことがある方は、私以外にもいるのではないでしょうか。

今回は記事執筆のハードルをできる限り下げるため、DX(Developer Experience)に取り組んだ記録をお送りします。

最終的な成果物としては下記リポジトリが爆誕しました。
https://github.com/yama0308/tech-articles

## 感じていた課題・叶えたいこと

今後エンジニアとして勉強していくために、アウトプットする機会をもっと増やしたいなと考えていました。
自分は文書にまとめるのが得意なので、技術記事を書く機会を増やせればと思ったのですがいくつか課題がありました。

### 1. QiitaとZenn、それぞれで記事を管理するのが面倒

当初は記事の内容によってこの2つの媒体を使い分ける想定でしたが、毎回記事を書くたびに別のサイトを開くのは面倒だなと考えました。
それに、内容によってはQiitaとZennの両方に上げたい物も出てきそうだなと思いました。そうなると、片方に記事を書いてもう片方にはコピペをするというなんとも嫌な運用をする必要があります。これも解消したいなと。

第1に叶えたいこととして、**Qiita及びZennの記事を一元管理しつつ楽にクロスポストしたいなと考えました。**

### 2. そもそもブラウザで書くのが面倒だし、ブラウザで書くとGit管理もできない

毎回記事を書くってなったときに対応するサイトをブラウザで開いて記事を書くというのがそもそも嫌でした。
また、ブラウザ上で書く場合はGit管理ができずに管理もしにくいな〜と。
あと、オフラインで執筆作業ができないというのも気になりました。いつでも気軽に書けるようにするのがハードルを下げる第1歩かなと。

第2に叶えたいこととして、**ローカルで書けるようにしつつGit管理できるようにしたいなと考えました。**

### 3. AIの補助を受けやすい環境で執筆したい

昨今だと書いた記事をAIに添削・校閲してもらって上げる方も増えていると思います。
よくあるやり方だと、書いた記事をチャットにコピペして添削してもらうという運用になると思いますが、このコピペの手間は絶対に省きたいなと思いました。
また、最近だとSkillsだったりサブエージェントだったりで自律的に再現性のある添削・校閲も可能になっていますので、これらが利用できる環境で執筆したいと考えました。所謂エージェントループみたいな部分も執筆に応用できるのかなと。

第3に叶えたいこととして、**AIフレンドリーな環境で執筆を行えるようにしたいと考えました。**

## 作ったもの

これらの願いを叶えるために構築した執筆環境がこちらのリポジトリになります。
https://github.com/yama0308/tech-articles

大きく分けて以下の機能をサポートしています。

- Qiita、Zennの記事の一元管理&自動公開
- Qiita⇔Zenn の記事の相互変換
- CI/CDによる記事のバリデーション・校閲
- Agent Skills によるAI自動添削

この記事もこちらのリポジトリで管理し、QiitaとZennのクロス投稿を行っています！

### ディレクトリ構成

Qiita記事を`public`、Zenn記事を`articles`に配置し、画像ファイルは`images`に配置することで一元管理できるようにしました。
CI/CD や Agents Skill で校閲・デプロイを自動化することで、記事の作成に集中できる環境を整えました。

```
.
├── .agents/
│   └── skills/                # AI エージェント用 Agent Skills
│       ├── article-converter/   # Zenn ↔ Qiita 記事相互変換スキル
│       └── article-proofreader/ # 記事文章・フォーマット校閲スキル
├── articles/                  # Zenn 記事ファイル (.md)
├── books/                     # Zenn 本・チャプター (必要に応じて利用)
├── images/                    # 記事用画像の一元保存ディレクトリ
├── public/                    # Qiita 記事ファイル (.md)
├── scripts/
│   ├── check-zenn.mjs         # Zenn 記事フォーマットバリデータ
│   ├── check-qiita.mjs        # Qiita 記事フォーマットバリデータ
│   └── convert-article.mjs    # Zenn ↔ Qiita 記事相互変換スクリプト
├── .github/
│   └── workflows/
│       ├── check-zenn.yml     # Zenn 記事チェック CI ワークフロー
│       ├── check-qiita.yml    # Qiita 記事チェック CI ワークフロー
│       └── publish.yml        # Qiita 記事自動投稿 CI ワークフロー
├── .textlintrc.json           # textlint 設定ファイル
├── .textlintignore            # textlint 除外設定ファイル
├── qiita.config.json          # Qiita CLI 設定ファイル
├── package.json               # 依存ライブラリ管理 (zenn-cli, qiita-cli, textlint等)
└── README.md
```


### 記事執筆・公開(Zenn CLI & Qiita CLI)

記事の執筆・公開はZenn CLIとQiita CLIを使用しています。
以下手順でQiitaかZennの対応する方の環境の記事を開始できます。

```sh
# Zennで記事を作成する
npx zenn new:article

# Qiitaで記事を作成する
npx qiita new
```

公開はmainへマージされれば、自動で双方の対応サイトへ投稿されるようになっています。
Qiitaには自動公開用のCI/CDを構築しており、ZennはGithub連携を利用して公開・更新しています。

### CI/CD

Github ActionsによるCI/CDを構築しています。
主なワークフローは以下です。

#### Qiita 自動デプロイ

前述の通り、Qiitaには自動公開用のCI/CDを構築しています。
main へのプッシュで起動し、`public/`以下の.mdファイルをQiitaへ自動投稿するようになっています。

```yml
# Please set 'QIITA_TOKEN' secret to your repository
name: Publish articles

on:
  push:
    branches:
      - main
      - master
    paths:
      - 'public/**'
      - 'qiita.config.json'
      - '.github/workflows/publish.yml'
      - 'package.json'
      - 'package-lock.json'
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  publish_articles:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: increments/qiita-cli/actions/publish@v1
        with:
          qiita-token: ${{ secrets.QIITA_TOKEN }}
          root: "."
```

#### フォーマットチェック - Qiita & Zenn

Qiita、Zennそれぞれプッシュ時にフォーマットチェックが走るようになっています。
ぞれぞれの媒体のフォーマットに合っているかをチェックしつつ、textlint による日本語チェックを行っています。

`scripts/check-qiita.mjs` `scripts/check-zenn.mjs`でこれらのフォーマットチェックが実行されます。

```yml
name: Check Qiita Articles

on:
  push:
    paths:
      - 'public/**'
      - '.github/workflows/check-qiita.yml'
      - 'scripts/check-qiita.mjs'
      - 'package.json'
      - 'package-lock.json'
      - '.textlintrc*'
      - '.textlintignore'
  pull_request:
    paths:
      - 'public/**'
      - '.github/workflows/check-qiita.yml'
      - 'scripts/check-qiita.mjs'
      - 'package.json'
      - 'package-lock.json'
      - '.textlintrc*'
      - '.textlintignore'

jobs:
  check-qiita:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check Qiita Article Format
        run: npm run lint:qiita

      - name: Check Text Quality (textlint)
        run: npm run lint:text:qiita
```

```yml
name: Check Zenn Articles

on:
  push:
    paths:
      - 'articles/**'
      - '.github/workflows/check-zenn.yml'
      - 'scripts/check-zenn.mjs'
      - 'package.json'
      - 'package-lock.json'
      - '.textlintrc*'
  pull_request:
    paths:
      - 'articles/**'
      - '.github/workflows/check-zenn.yml'
      - 'scripts/check-zenn.mjs'
      - 'package.json'
      - 'package-lock.json'
      - '.textlintrc*'

jobs:
  check-zenn:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check Zenn Article Format
        run: npm run lint:zenn

      - name: Check Text Quality (textlint)
        run: npm run lint:text:zenn
```

### Agents Skills

ここからが個人的に最も気に入っている工夫点になります。
執筆作業をサポートするためのAgents Skillsを用意しました。

#### 記事の自動添削・校閲スキル

エージェント自身に記事を添削してもらうようにスキル化を行っています。
Linterを定義したことにより、再現性の高い文章添削が可能になりました。

毎回添削の指示を出す必要もなくなり、環境が変わっても再現性のある添削が可能になったのが非常に便利です。

````md
---
name: article-proofreader
description: >-
  npm run lint（textlint や Zenn/Qiita バリデータ）を活用し、元の主張やニュアンス、技術的意図を絶対に改変せずに、誤字脱字、表記ゆれ、文法エラー、フォーマット違反のみを安全に校閲・修正します。
---

# Article Proofreader Skill

記事の技術的内容・主張・著者独自の表現トーンを一切変えることなく、`npm run lint`（`textlint` および Zenn / Qiita バリデータ）を活用して誤字脱字、表記ゆれ、文法エラー、各種フォーマット違反を安全かつ最小限の変更で校閲・修正します。

> [!IMPORTANT]
> **絶対厳守ルール（Core Principles）**
> 1. **意味・主張の非改変（Content Integrity）**: 記事の技術的解説、コード例、主張、構成、著者の意図や個別のトーン＆マナーを勝手に変更・要約・削除・加筆しないでください。
> 2. **過剰なリライトの完全禁止（No Excessive Rewriting）**: 「より読みやすくするため」「洗練された表現にするため」といった理由で、誤りが存在しない文やパラグラフを勝手に書き換えてはいけません。
> 3. **最小限の変更（Minimal Editing）**: 指摘された誤字脱字・文法エラー・`textlint` / バリデータのエラーに対して、文章の意味やニュアンスに影響を与えない最小限の修正のみを適用します。
> 4. **コード・メタデータの保護**: サンプルコード（` ``` ` ブロック内部）や Front Matter（`---` ヘッダー部分）の主要データは勝手に変更しないでください（フォーマットエラーの修正が必要な場合を除く）。

---

## 校閲ワークフロー

### 1. 対象ファイルの確認と Lint コマンドの実行

対象の記事ファイル（またはプロジェクト全体）に対して、適切な `npm run lint` コマンドを実行し、エラーや警告を抽出します。

```bash
# 全体チェック（Zenn/Qiitaフォーマット & textlint）
npm run lint

# Zenn 記事（articles/*.md）のみを対象とする場合
npm run lint:zenn        # フォーマットチェック
npm run lint:text:zenn   # 日本語文章校正

# Qiita 記事（public/*.md）のみを対象とする場合
npm run lint:qiita       # フォーマットチェック
npm run lint:text:qiita  # 日本語文章校正
```

### 2. エラー内容の特定と最小限の修正策定

Lint コマンドの出力ログを確認し、各問題箇所について以下の通り対処方針を決めます。

- **textlint 指摘事項（例: `max-ten` 読点超過、重複表現、助詞連続など）**:
  - 文の意味や流れを変えずに、読点を1つ削除するか、文を自然に2つに分割する等の**最小限の修正**に留めます。
- **誤字脱字・送り仮名・表記ゆれ**:
  - 単語単位で正確な表記へ置換します。
- **Zenn / Qiita バリデータ指摘事項（`check-zenn.mjs`, `check-qiita.mjs`）**:
  - タイトル長、タグ数（1〜5個）、トピック形式、絵文字設定、slug 形式など、必要最低限のメタデータ修復を行います。

### 3. ファイルの修正（ピンポイント適用）

該当箇所の前後数行を確認し、`replace_file_content` を使用して問題のある行のみをピンポイントで修正します。全体の書き換えや、問題のない箇所の整形は絶対に行わないでください。

### 4. 再検証

修正完了後、再度対象の Lint コマンドを実行し、すべてのエラー・警告が解消されていることを確認します。

```bash
npm run lint
```

### 5. 報告

ユーザーに対して、以下の内容を分かりやすく報告します。
- 検出されたエラー件数と種類
- 実施した修正の箇条書き（どの行をどのように最小限修正したか）
- 「内容・主張・意味には変更を加えていないこと」の明記
````

#### Qiita⇔Zennの記事フォーマット相互変換スキル

これが一番お気に入りの機能です。
QiitaとZennの記事を両投稿する際、多くの方がフォーマットの違いに苦しんだと思うのですが、今回はスキルを導入する事で解決しました。

このスキルでは、QiitaとZennのフォーマットの違いを解決してくれます。
片方の記事を記述後、このスキルを実行する事でもう片方の記事が生成されます。
これにより、Zennの記事を書いた後にQiitaにも同じ内容の記事を投稿したい場合でも容易に対応できます。

単純なフォーマットや記法の違いだけでなく、画像パスの違いもこちらのスキルで吸収してくれます。
Qiitaの記事ではこのリポジトリをパブリックリポジトリにして `images/`を直接参照することで画像を表示させていますが、Zennの記事からフォーマット変換する際には画像パスの調整も行ってくれます。

````md
---
name: article-converter
description: >-
  QiitaとZennの記事フォーマット（フロントマター、本文記法、画像パス）を相互変換します。
  ユーザーが「Qiitaの記事をZenn用に変換して」「Zennの記事をQiita用に移植して」などとリクエストした際に呼び出します。

---
# Article Converter Skill

Qiita CLI形式（`public/*.md`）と Zenn CLI形式（`articles/*.md`）の記事ファイルを相互変換し、メタデータ・本文記法・画像パスを適切に移植します。

> [!NOTE]
> **画像ファイルの一元管理＆直参照**:
> - **画像ファイル管理**: すべての画像ファイル（ローカル画像・リモート画像）は、プロジェクトルート直下の `images/<slug>/` ディレクトリに一元保存されます。
> - **Qiita 記事での画像パス**: Qiita 記事（`public/*.md`）では GitHub の Raw 画像 URL（`https://raw.githubusercontent.com/yama0308/tech-articles/main/images/<slug>/<filename>`）へ自動変換され、直参照されます。
> - **Zenn 記事での画像パス**: Zenn 記事（`articles/*.md`）では `/images/<slug>/<filename>` へ自動変換されます。

## 変換手順

### 1. 変換スクリプトの実行

指定された対象ファイルに対して、以下の Node.js スクリプトを実行して一次変換（構文・画像ファイルの同期・パス置換）を行います。

```bash
# Qiita -> Zenn 変換の場合
node scripts/convert-article.mjs public/<slug>.md --to zenn

# Zenn -> Qiita 変換の場合
node scripts/convert-article.mjs articles/<slug>.md --to qiita
```

※ `--to` を省略した場合は、ファイルパス（`public/` または `articles/`）から自動判定されます。

### 2. エージェントによるメタデータの仕上げ・最適化

スクリプト実行後、生成されたファイル（`articles/<slug>.md` または `public/<slug>.md`）を開き、以下のメタデータ調整を行ってください。

#### (A) Qiita -> Zenn 変換時の調整
1. **`emoji` (絵文字)**:
   - デフォルトで `📝` が設定されているため、記事のテーマ（例: Reactなら `⚛️`、インフラなら `☁️`、自動化なら `⚡` など）に合った最適な絵文字（全角1文字）に変更します。
2. **`topics` (トピック)**:
   - 1個以上5個以下であるか確認します。
   - 英小文字・数字・ハイフンのみに正規化されているか確認します（例: `React.js` -> `react`）。
3. **`type` (記事タイプ)**:
   - 技術解説記事なら `tech`、体験談・ポエム・キャリア系なら `idea` に設定します。

#### (B) Zenn -> Qiita 変換時の調整
1. **`tags` (タグ)**:
   - Qiitaに適したタグ表記に調整します（例: `react`, `typescript` など）。
   - 1個以上5個以下であるか確認します。

### 3. バリデーション実行

変換が完了したら、既存のリンターを実行してフォーマットエラーがないか確認してください。

```bash
# Zenn への変換の場合
npm run lint:zenn

# Qiita への変換の場合
npm run lint:qiita
```

エラーが出力された場合は、メッセージに従って修正してください。
````

## 終わりに

実際にこの環境を運用して少し経ちましたが、快適で非常に気に入っています。
お盆休み中、オフラインで執筆するタイミングがあったのですが、この環境のおかげで作業が非常に捗りました。
AIのサポートもすぐに受けられるようになった事も現代の作業の進め方に追いつけている感があって良きです。

今後アウトプットする機会を増やしたいと思っていたのですが、やはり自動化しまくってハードルを下げるのが第一歩だなと感じました。

『記事を書きたいけど面倒…』と感じている方は、まず執筆環境の自動化から試してみてはいかがでしょうか！ この記事が誰かの『アウトプットの一歩』になれば幸いです！
