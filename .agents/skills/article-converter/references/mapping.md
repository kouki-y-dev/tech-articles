# Qiita ⇔ Zenn 記法・メタデータ対応一覧

## 1. フロントマター (Frontmatter) 対応表

| 項目 | Qiita (`public/*.md`) | Zenn (`articles/*.md`) | 変換仕様 |
| :--- | :--- | :--- | :--- |
| **タイトル** | `title: string` | `title: string` | そのまま維持 |
| **分類** | `tags: string[]` | `topics: string[]` | Zenn: 小文字・ハイフン限定、最大5個 |
| **公開状態** | `private: boolean` | `published: boolean` | `private: false` ⇔ `published: true` |
| **絵文字** | （なし） | `emoji: string` | Qiita→Zenn変換時にLLMが適切な絵文字を設定 |
| **記事種別** | （なし） | `type: "tech" \| "idea"` | デフォルト `tech` |
| **記事ID** | `id: string \| null` | （ファイル名slug管理） | Qiitaへの変換時は `null` を初期化 |

## 2. 本文記法 (Body Syntax) 対応表

| 要素 | Qiita 記法 | Zenn 記法 |
| :--- | :--- | :--- |
| **標準メッセージ** | `:::note` / `:::note info` | `:::message` |
| **警告メッセージ** | `:::note warn` / `:::note warning` | `:::message alert` |
| **アコーディオン** | `<details><summary>題</summary>文</details>` | `:::details 題\n文\n:::` |
| **画像パス** | `./images/<slug>/filename` 等 | `/images/<slug>/filename` |
