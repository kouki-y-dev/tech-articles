import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import zennModel from 'zenn-model';

const { validateArticle } = zennModel;

const ARTICLES_DIR = path.join(process.cwd(), 'articles');

function validateZennArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) {
    console.log('ℹ️ articles ディレクトリが存在しません。スキップします。');
    process.exit(0);
  }

  const files = fs.readdirSync(ARTICLES_DIR).filter((file) => file.endsWith('.md'));

  if (files.length === 0) {
    console.log('ℹ️ articles ディレクトリに Markdown ファイルがありません。');
    process.exit(0);
  }

  let hasError = false;

  for (const file of files) {
    const filePath = path.join(ARTICLES_DIR, file);
    const slug = path.basename(file, '.md');

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);

      const errors = validateArticle({ slug, ...frontmatter });
      if (errors.length > 0) {
        hasError = true;
        console.error(`❌ ${file}`);
        for (const err of errors) {
          console.error(`   - [${err.type}] ${err.message}`);
        }
      }
    } catch (e) {
      hasError = true;
      console.error(`❌ ${file}`);
      console.error(`   - Front Matter の YAML パースに失敗しました: ${e.message}`);
    }
  }

  if (hasError) {
    console.error('\n💥 Zenn 記事のバリデーションに失敗しました。上記のエラーを修正してください。');
    process.exit(1);
  } else {
    console.log(`✅ すべての Zenn 記事 (${files.length} 件) のバリデーションに成功しました！`);
  }
}

validateZennArticles();

