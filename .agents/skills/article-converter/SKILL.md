---
name: article-converter
description: >-
  QiitaとZennの記事フォーマット（フロントマター、タイトル最適化、本文記法、画像パス、クロスポスト注記）を相互変換します。
  ユーザーが「Qiitaの記事をZenn用に変換して」「Zennの記事をQiita用に移植して」などとリクエストした際に呼び出します。
---

# Article Converter Skill

Qiita CLI形式（`public/*.md`）と Zenn CLI形式（`articles/*.md`）の記事ファイルを相互変換し、各プラットフォームに最適化されたタイトル・メタデータ・本文記法・画像パス・クロスポスト（親記事）リンクを適切に設定します。

> [!NOTE]
> **画像ファイルの一元管理＆直参照**:
> - **画像ファイル管理**: すべての画像ファイル（ローカル画像・リモート画像）は、プロジェクトルート直下の `images/<slug>/` ディレクトリに一元保存されます。
> - **Qiita 記事での画像パス**: Qiita 記事（`public/*.md`）では GitHub の Raw 画像 URL（`https://raw.githubusercontent.com/yama0308/tech-articles/main/images/<slug>/<filename>`）へ自動変換され、直参照されます。
> - **Zenn 記事での画像パス**: Zenn 記事（`articles/*.md`）では `/images/<slug>/<filename>` へ自動変換されます。

## 変換手順

### 1. 変換スクリプトの実行（一次変換）

指定された対象ファイルに対して、以下の Node.js スクリプトを実行して一次変換（マークアップ・画像ファイルの同期・パス置換）を行います。

```bash
# Qiita -> Zenn 変換の場合
node scripts/convert-article.mjs public/<slug>.md --to zenn

# Zenn -> Qiita 変換の場合
node scripts/convert-article.mjs articles/<slug>.md --to qiita
```

※ `--to` を省略した場合は、ファイルパス（`public/` または `articles/`）から自動判定されます。

### 2. プラットフォーム向けタイトルの再考・最適化

変換元（親記事）の内容および元タイトルを踏まえ、変換先（子記事）のプラットフォーム特性に合わせた魅力的なタイトルへ書き直します。

#### 💡 プラットフォーム別のタイトル最適化方針

- **Qiita 向けタイトル（Zenn → Qiita 変換時）**:
  - **特性**: 検索性（SEO）、技術キーワード、実用性・解決策の明確さ重視。
  - **ポイント**:
    - 「何ができるか」「どの技術を使っているか」「どう解決するか」を具体的かつ端的に記述。
    - 検索されやすい技術名（ライブラリ名、ツール名、言語名など）を自然に含める。
    - `【プロンプト付】` や `【完全解説】` などのプレフィックスも効果的。
  - **実例**:
    - 元（Zenn）: `「記事書くの面倒」を解消！Agent Skills×GitHub ActionsでQiita/Zennの執筆環境を作った`
      → Qiita: `QiitaとZennを一元管理！GitHub ActionsとAgent Skillsで実現する技術記事執筆環境`
    - 元（Zenn）: `Gemini Notebookに「キャラクターの人格」を構築し、Geminiで対話させるプロンプト術`
      → Qiita: `【プロンプト付】Gemini Notebookでキャラの人格を再現し、Gemini上でAI同士を掛け合いさせる方法`

- **Zenn 向けタイトル（Qiita → Zenn 変換時）**:
  - **特性**: キャッチーさ、開発者体験（DX）、読者の共感・ストーリー性・やってみた感重視。
  - **ポイント**:
    - 読者の興味を引くキャッチコピー（「〜を解消！」「〜した話」「〜の作り方」など）。
    - 開発者が直面する課題への共感や、体験談・エピソード感を表現。
  - **実例**:
    - 元（Qiita）: `QiitaとZennを一元管理！GitHub ActionsとAgent Skillsで実現する技術記事執筆環境`
      → Zenn: `「記事書くの面倒」を解消！Agent Skills×GitHub ActionsでQiita/Zennの執筆環境を作った`
    - 元（Qiita）: `AWS Cloud Practitionerを取得して得られたメリットと学習法`
      → Zenn: `非エンジニアがAWS Cloud Practitionerに合格して人生変わった話`

### 3. クロスポスト説明文（親記事リンク）の追記

変換された子記事の**本文冒頭（最初の見出し `##` の直前）**に、変換元（親記事）へのクロスポスト（転載元）記事であることを明記するメッセージブロックを挿入します。

#### (A) Zenn → Qiita 変換時（Qiita 側 `public/<slug>.md` へ挿入）
Qiita 用の `:::note info` 記法を使用します。

```markdown
:::note info
本記事は [親記事（Zenn）のタイトル](https://zenn.dev/yymm/articles/<slug>) からのクロスポスト記事です。
:::
```

#### (B) Qiita → Zenn 変換時（Zenn 側 `articles/<slug>.md` へ挿入）
Zenn 用の `:::message` 記法を使用します。

```markdown
:::message
本記事は [親記事（Qiita）のタイトル](https://qiita.com/yymm/items/<id>) からのクロスポスト記事です。
:::
```
※Qiita記事の Front Matter に `id` がある場合は `https://qiita.com/yymm/items/<id>` を指定します。まだ未公開等で id がない場合は `https://qiita.com/yymm` などを指定します。

### 4. エージェントによるメタデータの仕上げ・最適化

生成されたファイルを開き、以下のメタデータ（Front Matter）を調整します。

#### (A) Qiita -> Zenn 変換時の調整
1. **`title`**: ステップ 2 で考案した Zenn 向けタイトルを設定します。
2. **`emoji` (絵文字)**:
   - 記事のテーマ（例: Reactなら `⚛️`、インフラなら `☁️`、自動化なら `⚡`、AIなら `🤖` など）に合った最適な絵文字（全角1文字）に変更します。
3. **`topics` (トピック)**:
   - 1個以上5個以下であるか確認します。
   - 英小文字・数字・ハイフンのみに正規化されているか確認します（例: `React.js` -> `react`）。
4. **`type` (記事タイプ)**:
   - 技術解説記事なら `tech`、体験談・ポエム・キャリア系なら `idea` に設定します。

#### (B) Zenn -> Qiita 変換時の調整
1. **`title`**: ステップ 2 で考案した Qiita 向けタイトルを設定します。
2. **`tags` (タグ)**:
   - Qiitaに適したタグ表記に調整します（例: `react`, `typescript`, `GitHub` など）。
   - 1個以上5個以下であるか確認します。

### 5. バリデーション実行

変換・調整が完了したら、リンターを実行してフォーマットエラーがないか確認してください。

```bash
# Zenn への変換の場合
npm run lint:zenn

# Qiita への変換の場合
npm run lint:qiita

# 全体チェック（文章校正含む）
npm run lint
```

エラーが出力された場合は、メッセージに従って修正してください。
