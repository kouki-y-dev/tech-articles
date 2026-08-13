import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

function validateQiitaArticles() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.log('ℹ️ public ディレクトリが存在しません。スキップします。');
    process.exit(0);
  }

  // public ディレクトリ直下およびサブディレクトリ内の .md ファイルを取得（必要に応じて再帰）
  const getMarkdownFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // .remote や dotfile フォルダは除外
        if (!entry.name.startsWith('.')) {
          results = results.concat(getMarkdownFiles(fullPath));
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
    return results;
  };

  const files = getMarkdownFiles(PUBLIC_DIR);

  if (files.length === 0) {
    console.log('ℹ️ public ディレクトリに Markdown ファイルがありません。');
    process.exit(0);
  }

  let hasError = false;

  for (const filePath of files) {
    const relativePath = path.relative(process.cwd(), filePath);
    const errors = [];

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);

      // 1. title チェック
      if (!frontmatter.title || typeof frontmatter.title !== 'string' || frontmatter.title.trim() === '') {
        errors.push('title は必須です（文字列で指定してください）。');
      }

      // 2. tags チェック
      if (!frontmatter.tags || !Array.isArray(frontmatter.tags)) {
        errors.push('tags は必須です（配列で指定してください）。');
      } else {
        if (frontmatter.tags.length < 1 || frontmatter.tags.length > 5) {
          errors.push(`tags は1個以上5個以下で指定してください（現在の要素数: ${frontmatter.tags.length}）。`);
        }
        const hasEmptyTag = frontmatter.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '');
        if (hasEmptyTag) {
          errors.push('tags に空文字が含まれています。');
        }
      }

      // 3. private チェック
      if (typeof frontmatter.private !== 'boolean') {
        errors.push('private は必須です (true または false を指定してください)。');
      }

      // 4. id チェック (null または string)
      if (frontmatter.id !== undefined && frontmatter.id !== null && typeof frontmatter.id !== 'string') {
        errors.push('id は null または文字列で指定してください。');
      }

    } catch (e) {
      errors.push(`Front Matter の YAML パースに失敗しました: ${e.message}`);
    }

    if (errors.length > 0) {
      hasError = true;
      console.error(`❌ ${relativePath}`);
      for (const err of errors) {
        console.error(`   - ${err}`);
      }
    }
  }

  if (hasError) {
    console.error('\n💥 Qiita 記事のバリデーションに失敗しました。上記のエラーを修正してください。');
    process.exit(1);
  } else {
    console.log(`✅ すべての Qiita 記事 (${files.length} 件) のバリデーションに成功しました！`);
  }
}

validateQiitaArticles();
