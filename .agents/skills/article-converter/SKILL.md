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
