<h1 align="center">Tech Articles Management</h1>

<div align="center">

[![Check Zenn Articles](https://github.com/kouki-y-dev/tech-articles/actions/workflows/check-zenn.yml/badge.svg)](https://github.com/kouki-y-dev/tech-articles/actions/workflows/check-zenn.yml)
[![Check Qiita Articles](https://github.com/kouki-y-dev/tech-articles/actions/workflows/check-qiita.yml/badge.svg)](https://github.com/kouki-y-dev/tech-articles/actions/workflows/check-qiita.yml)
[![Publish Articles](https://github.com/kouki-y-dev/tech-articles/actions/workflows/publish.yml/badge.svg)](https://github.com/kouki-y-dev/tech-articles/actions/workflows/publish.yml)

![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D22.0.0-339933?style=flat-square&logo=node.js&logoColor=white)
![Zenn CLI](https://img.shields.io/badge/Zenn-CLI-3EA8FF?style=flat-square)
![Qiita CLI](https://img.shields.io/badge/Qiita-CLI-55C500?style=flat-square)
![textlint](https://img.shields.io/badge/textlint-enabled-0052CC?style=flat-square)
![Agent Skills](https://img.shields.io/badge/Agent_Skills-2_Active-8A2BE2?style=flat-square&logo=openai&logoColor=white)

</div>

Zenn および Qiita の技術記事・書籍を Markdown 形式で一元管理するためのリポジトリです。  
GitHub 連携による自動投稿・更新、CI/CD による自動バリデーション運用、および AI Agent Skills による執筆補助・自動校閲・相互フォーマット変換に対応しています。

---

## ディレクトリ構成

```text
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

---

## Local Setup

### 前提条件
- **Node.js**: v22.0.0 以上推奨
- **npm**: Node.js に同梱

### インストール
リポジトリをクローン後、以下のコマンドで依存ライブラリをインストールします。

```bash
npm install
```

---

## 作業手順

### Zenn

#### 1. 記事の新規作成
以下のコマンドを実行すると、`articles/` ディレクトリ配下に記事の Markdown ファイルが生成されます。

```bash
npm run new:article
# または
npx zenn new:article
```

> **よく使うオプション:**
> ```bash
> # タイトルとスラッグを指定して作成
> npx zenn new:article --slug "article-slug-name" --title "記事のタイトル" --type tech
> ```

#### 2. 本 (Book) の新規作成
本を作成する場合は以下のコマンドを実行します。

```bash
npm run new:book
# または
npx zenn new:book
```

#### 3. プレビュー表示
執筆中の記事や本をブラウザでリアルタイムプレビューできます。

```bash
npm run preview
# または
npx zenn preview
```
実行後、 [http://localhost:8000](http://localhost:8000) にアクセスして確認します。

#### 4. バリデーション（リント・文章校正）
記事の公開前に、フォーマットエラーや誤字脱字がないかローカルでチェックできます。

```bash
# Zenn・Qiita 記事フォーマットと文章校正を一括チェック
npm run lint

# Zenn フォーマットチェックのみ（slug、Front Matterの型・必須項目）
npm run lint:zenn

# 日本語文章校正のみ（Zenn記事対象）
npm run lint:text:zenn
```

#### 5. 公開・更新手順
1. 記事ファイル内の Frontmatter（ヘッダー部分）の `published:` を `true` に設定します。
2. 変更を Git コミットし、GitHub の対象ブランチ（`main` 等）へプッシュします。
3. Zenn と GitHub の連携設定により、自動的に記事が公開・更新されます。

---

### Qiita

#### 1. 記事の新規作成
以下のコマンドを実行すると、`public/` ディレクトリ配下に Qiita 記事の Markdown ファイルが生成されます。

```bash
npx qiita new [basename]
```

#### 2. プレビュー表示
執筆中の Qiita 記事をブラウザでプレビューできます。

```bash
npx qiita preview
```
実行後、表示されるローカルサーバー URL（デフォルト: [http://localhost:8888](http://localhost:8888)）にアクセスして確認します。

#### 3. バリデーション（リント・文章校正）
Qiita 記事の投稿前に、Front Matter のフォーマット（タイトル、タグ数 1〜5 個制限、公開設定等）および文章品質をチェックします。

```bash
# Qiita 記事フォーマットチェックのみ
npm run lint:qiita

# 日本語文章校正のみ（Qiita記事対象）
npm run lint:text:qiita

# Zenn・Qiita 一括チェック
npm run lint
```

#### 4. 公開・更新手順
1. `public/` 配下の対象記事の Front Matter (`private: false` 等) や本文を更新します。
2. 変更を Git コミットし、`main` ブランチへプッシュします。
3. GitHub Actions (`publish.yml`) により、自動で Qiita へ同期・投稿されます。

---

## AI Agent Skills (`.agents/skills`)

当リポジトリでは、AI エージェント（Antigravity, Claude Code 等）を活用して執筆・校閲・フォーマット変換を安全かつ効率的に行うための **Agent Skills** を配置・運用しています。

| スキル名 | ディレクトリ | 概要 |
| :--- | :--- | :--- |
| [**article-converter**](.agents/skills/article-converter/SKILL.md) | `.agents/skills/article-converter` | Zenn 記事（`articles/`）と Qiita 記事（`public/`）の相互変換（プラットフォーム別タイトル最適化・クロスポスト注記・メタデータ・画像パス・記法変換） |
| [**article-proofreader**](.agents/skills/article-proofreader/SKILL.md) | `.agents/skills/article-proofreader` | 原文の主張・トーンを変えずに、誤字脱字・文法・リンターエラーのみを安全に校閲・修正 |

### スキルの詳細と主な機能

#### 1. Article Converter (`article-converter`)
- **主な用途**: 「Qiita の記事を Zenn 用に移植して」「Zenn の記事を Qiita 用に変換して」といった操作に対応します。
- **特徴**:
  - `convert-article.mjs` を利用し、Front Matter（`tags` ↔ `topics` / `emoji` / `type`）や記法を相互変換。
  - プラットフォームの特性に合わせてタイトルを再考・最適化（Qiita: 検索性・SEO・実用性重視 / Zenn: キャッチーさ・DX・体験談重視）。
  - 本文冒頭に親記事へのクロスポスト（転載元）リンク・説明文（Qiita: `:::note info` / Zenn: `:::message`）を自動付与。
  - 画像ファイルは `images/<slug>/` ディレクトリに一元管理し、Qiita 用には Raw GitHub URL、Zenn 用には `/images/...` へ自動変換。
  - 変換後に自動でバリデータ（`npm run lint:zenn` または `npm run lint:qiita`）を実行して整合性を検証。

#### 2. Article Proofreader (`article-proofreader`)
- **主な用途**: 執筆中・執筆後の記事に対する文章校閲やフォーマットチェックに対応します。
- **特徴**:
  - **原意・主張の絶対厳守**: 技術解説、サンプルのコード例、著者の主張や個別のトーン＆マナーを改変・要約・削除・加筆しません。
  - **最小限のピンポイント修正**: `textlint` や Zenn/Qiita バリデータで検出された誤字脱字・助詞重複・メタデータ違反などのみを最小限の手数でピンポイント修正。

---

## CI/CD (GitHub Actions)

記事の品質保持および自動更新のため、GitHub Actions ワークフローを運用しています。

### 1. Zenn 記事チェック (`check-zenn.yml`)
* **実行タイミング**: `articles/**` 等に変更があった Push / Pull Request 時
* **チェック内容**: Zenn フォーマットチェック (`npm run lint:zenn`) および文章校正 (`npm run lint:text:zenn`)

### 2. Qiita 記事チェック (`check-qiita.yml`)
* **実行タイミング**: `public/**` 等に変更があった Push / Pull Request 時
* **チェック内容**: Qiita フォーマットチェック (`npm run lint:qiita`) および文章校正 (`npm run lint:text:qiita`)

### 3. Qiita 記事自動投稿 (`publish.yml`)
* **実行タイミング**: `main` ブランチに `public/**` の変更がプッシュされた時
* **処理内容**: `increments/qiita-cli/actions/publish@v1` を利用して `QIITA_TOKEN` 経由で Qiita に記事を自動投稿・更新

