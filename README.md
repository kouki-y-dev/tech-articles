# Tech Articles Management

Zenn および Qiita の技術記事・書籍を Markdown 形式で一元管理するためのリポジトリです。  
GitHub 連携による自動投稿・更新および CI/CD による自動バリデーション運用に対応しています。

---

## ディレクトリ構成

```text
.
├── articles/                  # Zenn 記事ファイル (.md)
├── books/                     # Zenn 本・チャプター (必要に応じて利用)
├── public/                    # Qiita 記事ファイル (.md)
├── scripts/
│   ├── check-zenn.mjs         # Zenn 記事フォーマットバリデータ
│   └── check-qiita.mjs        # Qiita 記事フォーマットバリデータ
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
- **Node.js**: v18.0.0 以上推奨
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
