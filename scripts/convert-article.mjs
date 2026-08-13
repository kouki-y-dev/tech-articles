import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Helper: Normalize tag / topic names for Zenn (lowercase, remove invalid chars, max 5)
function normalizeZennTopics(tags = []) {
  if (!Array.isArray(tags)) return ['tech'];
  const topics = tags
    .map((t) =>
      String(t)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\-_]/g, '')
    )
    .filter(Boolean);
  const uniqueTopics = [...new Set(topics)];
  return uniqueTopics.slice(0, 5);
}

// Helper: Convert body markup between Qiita and Zenn
function convertBody(content, targetFormat) {
  let result = content;

  if (targetFormat === 'zenn') {
    // :::note warn -> :::message alert
    result = result.replace(/:::note\s+warn(ing)?/gi, ':::message alert');
    // :::note info / :::note -> :::message
    result = result.replace(/:::note(\s+info)?/gi, ':::message');

    // <details><summary>TITLE</summary>BODY</details> -> :::details TITLE\nBODY\n:::
    result = result.replace(
      /<details>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/gi,
      (match, summary, body) => `:::details ${summary.trim()}\n${body.trim()}\n:::`
    );
  } else if (targetFormat === 'qiita') {
    // :::message alert -> :::note warn
    result = result.replace(/:::message\s+alert/gi, ':::note warn');
    // :::message -> :::note
    result = result.replace(/:::message/gi, ':::note');

    // :::details TITLE\nBODY\n::: -> <details><summary>TITLE</summary>BODY</details>
    result = result.replace(
      /:::details\s+(.*?)\n([\s\S]*?)\n:::/gi,
      (match, summary, body) => `<details><summary>${summary.trim()}</summary>\n\n${body.trim()}\n\n</details>`
    );
  }

  return result;
}

// Helper: Process and copy images (including remote URL downloads)
async function convertImages(body, slug, sourceFormat, targetFormat, sourceDir) {
  let updatedBody = body;
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;

  const matches = [];
  let match;
  while ((match = imgRegex.exec(body)) !== null) {
    matches.push({
      fullMatch: match[0],
      altText: match[1],
      imagePath: match[2],
    });
  }

  for (const { fullMatch, altText, imagePath } of matches) {
    const isRemote = imagePath.startsWith('http://') || imagePath.startsWith('https://');

    if (targetFormat === 'zenn') {
      let imgName = isRemote
        ? path.basename(new URL(imagePath).pathname)
        : path.basename(imagePath);

      if (!path.extname(imgName)) {
        imgName = `${imgName || 'image'}.png`;
      }

      const targetRelPath = `/images/${slug}/${imgName}`;
      const targetAbsDir = path.join(process.cwd(), 'images', slug);
      const targetAbsPath = path.join(targetAbsDir, imgName);

      fs.mkdirSync(targetAbsDir, { recursive: true });

      if (isRemote) {
        try {
          console.log(`🌐 Downloading remote image: ${imagePath} -> ${targetAbsPath}`);
          const res = await fetch(imagePath);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(targetAbsPath, buffer);
            console.log(`📥 Saved remote image: ${targetAbsPath}`);
            updatedBody = updatedBody.replace(fullMatch, `![${altText}](${targetRelPath})`);
          } else {
            console.warn(`⚠️ Failed to fetch remote image: ${imagePath} (HTTP ${res.status})`);
          }
        } catch (err) {
          console.warn(`⚠️ Download error for ${imagePath}: ${err.message}`);
        }
      } else {
        const candidatePaths = [
          path.resolve(sourceDir, imagePath),
          path.join(process.cwd(), imagePath),
          path.join(process.cwd(), 'public', imagePath),
          path.join(process.cwd(), 'public', 'images', imagePath),
          path.join(process.cwd(), 'public', 'images', slug, imgName),
          path.join(process.cwd(), 'public', 'images', imgName),
          path.join(process.cwd(), 'images', slug, imgName),
          path.join(process.cwd(), 'images', imgName),
        ];

        const srcFile = candidatePaths.find((p) => fs.existsSync(p));

        if (srcFile) {
          fs.copyFileSync(srcFile, targetAbsPath);
          console.log(`📷 Copied local image: ${srcFile} -> ${targetAbsPath}`);
        } else {
          console.warn(`⚠️ Source image not found: ${imagePath}`);
        }
        updatedBody = updatedBody.replace(fullMatch, `![${altText}](${targetRelPath})`);
      }
    } else if (targetFormat === 'qiita') {
      let imgName = isRemote
        ? path.basename(new URL(imagePath).pathname)
        : path.basename(imagePath);

      if (!path.extname(imgName)) {
        imgName = `${imgName || 'image'}.png`;
      }

      const targetRelPath = `./images/${slug}/${imgName}`;
      const targetAbsDir = path.join(process.cwd(), 'public', 'images', slug);
      const targetAbsPath = path.join(targetAbsDir, imgName);

      fs.mkdirSync(targetAbsDir, { recursive: true });

      if (isRemote) {
        try {
          console.log(`🌐 Downloading remote image: ${imagePath} -> ${targetAbsPath}`);
          const res = await fetch(imagePath);
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            fs.writeFileSync(targetAbsPath, buffer);
            console.log(`📥 Saved remote image: ${targetAbsPath}`);
            updatedBody = updatedBody.replace(fullMatch, `![${altText}](${targetRelPath})`);
          } else {
            console.warn(`⚠️ Failed to fetch remote image: ${imagePath} (HTTP ${res.status})`);
          }
        } catch (err) {
          console.warn(`⚠️ Download error for ${imagePath}: ${err.message}`);
        }
      } else {
        const candidatePaths = [
          path.resolve(sourceDir, imagePath),
          path.join(process.cwd(), imagePath),
          path.join(process.cwd(), 'public', imagePath),
          path.join(process.cwd(), 'public', 'images', imagePath),
          path.join(process.cwd(), 'public', 'images', slug, imgName),
          path.join(process.cwd(), 'images', slug, imgName),
        ];

        const srcFile = candidatePaths.find((p) => fs.existsSync(p));

        if (srcFile) {
          fs.copyFileSync(srcFile, targetAbsPath);
          console.log(`📷 Copied local image: ${srcFile} -> ${targetAbsPath}`);
        } else {
          console.warn(`⚠️ Source image not found: ${imagePath}`);
        }
        updatedBody = updatedBody.replace(fullMatch, `![${altText}](${targetRelPath})`);
      }
    }
  }

  return updatedBody;
}

export async function convertArticle(inputFile, options = {}) {
  const absInputPath = path.resolve(process.cwd(), inputFile);
  if (!fs.existsSync(absInputPath)) {
    throw new Error(`Input file does not exist: ${absInputPath}`);
  }

  const rawContent = fs.readFileSync(absInputPath, 'utf-8');
  const parsed = matter(rawContent);
  const originalData = parsed.data;
  const originalBody = parsed.content;

  const slug = path.basename(absInputPath, '.md');
  const sourceDir = path.dirname(absInputPath);

  // Infer target format if not specified
  let targetFormat = options.to;
  if (!targetFormat) {
    if (absInputPath.includes(path.join(process.cwd(), 'public'))) {
      targetFormat = 'zenn';
    } else if (absInputPath.includes(path.join(process.cwd(), 'articles'))) {
      targetFormat = 'qiita';
    } else {
      throw new Error('Please specify target format using --to zenn or --to qiita');
    }
  }

  const sourceFormat = targetFormat === 'zenn' ? 'qiita' : 'zenn';
  let newData = {};
  let targetOutputPath = '';

  if (targetFormat === 'zenn') {
    targetOutputPath = path.join(process.cwd(), 'articles', `${slug}.md`);
    newData = {
      title: originalData.title || '無題',
      emoji: originalData.emoji || '📝',
      type: originalData.type || 'tech',
      topics: normalizeZennTopics(originalData.tags || originalData.topics),
      published: originalData.private !== undefined ? !originalData.private : Boolean(originalData.published),
    };
  } else {
    targetOutputPath = path.join(process.cwd(), 'public', `${slug}.md`);
    const tags = Array.isArray(originalData.topics)
      ? originalData.topics
      : Array.isArray(originalData.tags)
      ? originalData.tags
      : ['tech'];

    newData = {
      title: originalData.title || '無題',
      tags: tags.slice(0, 5),
      private: originalData.published !== undefined ? !originalData.published : Boolean(originalData.private),
      updated_at: originalData.updated_at || null,
      id: originalData.id || null,
      organization_url_name: originalData.organization_url_name || null,
      slide: Boolean(originalData.slide),
      ignorePublish: Boolean(originalData.ignorePublish),
    };
  }

  // Convert body markup
  let newBody = convertBody(originalBody, targetFormat);

  // Process images
  newBody = await convertImages(newBody, slug, sourceFormat, targetFormat, sourceDir);

  // Reconstruct frontmatter and output
  const outputContent = matter.stringify(newBody, newData);

  const targetDir = path.dirname(targetOutputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(targetOutputPath, outputContent, 'utf-8');
  console.log(`✅ Converted ${sourceFormat} -> ${targetFormat}:`);
  console.log(`   Source: ${path.relative(process.cwd(), absInputPath)}`);
  console.log(`   Output: ${path.relative(process.cwd(), targetOutputPath)}`);

  return targetOutputPath;
}

// CLI execution handling
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.url.replace('file://', ''))) {
  const args = process.argv.slice(2);
  let inputFile = '';
  let toFormat = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--to' && args[i + 1]) {
      toFormat = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error('Usage: node scripts/convert-article.mjs <input_file> [--to zenn|qiita]');
    process.exit(1);
  }

  (async () => {
    try {
      await convertArticle(inputFile, { to: toFormat });
    } catch (err) {
      console.error(`❌ Conversion failed: ${err.message}`);
      process.exit(1);
    }
  })();
}
