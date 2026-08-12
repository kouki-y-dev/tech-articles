import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';

const ARTICLES_DIR = path.join(process.cwd(), 'articles');

// Zenn の slug 定義 (12~50文字、小文字英数字・ハイフン・アンダースコア)
const slugRegex = /^[a-z0-9_-]{12,50}$/;

// Front Matter の Zod スキーマ
const zennFrontMatterSchema = z.object({
  title: z.string().min(1, 'title は必須です').max(100, 'title が長すぎます'),
  emoji: z.string().min(1, 'emoji は必須です'),
  type: z.enum(['tech', 'idea'], {
    errorMap: () => ({ message: 'type は "tech" または "idea" である必要があります' }),
  }),
  topics: z
    .array(z.string())
    .min(1, 'topics は少なくとも1つ指定してください')
    .max(5, 'topics は最大5つまで指定可能です'),
  published: z.boolean({
    required_error: 'published (true/false) は必須です',
    invalid_type_error: 'published は boolean (true または false) である必要があります',
  }),
  published_at: z.string().optional(),
});

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
    const fileErrors = [];

    // 1. ファイル名 (slug) チェック
    if (!slugRegex.test(slug)) {
      fileErrors.push(
        `ファイル名 (slug: "${slug}") は12〜50文字の小文字英数字、ハイフン(-)、アンダースコア(_)で指定してください。`
      );
    }

    // 2. Front Matter 解析
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = matter(content);

      const result = zennFrontMatterSchema.safeParse(parsed.data);
      if (!result.success) {
        for (const err of result.error.issues) {
          fileErrors.push(`[${err.path.join('.')}] ${err.message}`);
        }
      }
    } catch (e) {
      fileErrors.push(`Front Matter の YAML パースに失敗しました: ${e.message}`);
    }

    if (fileErrors.length > 0) {
      hasError = true;
      console.error(`❌ ${file}`);
      for (const err of fileErrors) {
        console.error(`   - ${err}`);
      }
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
