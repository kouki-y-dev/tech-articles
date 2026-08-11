# Tech Articles Management

Zenn および Qiita の技術記事・書籍を Markdown 形式で一元管理するためのリポジトリです。  
現在は Zenn の記事管理に対応しており、GitHub 連携による自動投稿・更新運用を想定しています。

---

## ディレクトリ構成

```text
.
├── articles/       # Zenn 記事ファイル (.md)
├── books/          # Zenn 本・チャプター (必要に応じて利用)
├── package.json    # 依存ライブラリ管理 (zenn-cli)
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

#### 4. 公開・更新手順
1. 記事ファイル内の Frontmatter（ヘッダー部分）の `published:` を `true` に設定します。
2. 変更を Git コミットし、GitHub の対象ブランチ（`main` 等）へプッシュします。
3. Zenn と GitHub の連携設定により、自動的に記事が公開・更新されます。

---

### Qiita

> **Coming soon...**  
> 将来的には `@qiita/qiita-cli` を導入し、Qiita 記事も本リポジトリで管理・自動同期できるように拡張予定です。


