#!/usr/bin/env node
// Head-only, repeatable repair. Article text, captions and titles remain byte-identical.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadImageRights, buildImageObject, imageObjects, jsonForHtml, validateArticleImages } from './image-metadata.mjs';

const registry = loadImageRights();
const files = process.argv.slice(2);
if (!files.length) throw new Error('usage: node scripts/apply-image-metadata.mjs <article.html>...');
for (const file of files) {
  const old = readFileSync(file, 'utf8');
  const end = old.indexOf('</head>');
  if (end < 0) throw new Error(`${file}: head missing`);
  const head = old.slice(0, end).replace(/(<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>)([\s\S]*?)(<\/script>)/gi, (_, open, json, close) => {
    const node = JSON.parse(json);
    for (const image of imageObjects(node)) {
      const repaired = buildImageObject(image.contentUrl || image.url, registry);
      // Replace only rights fields; preserve unrelated dimensions/descriptions if present.
      for (const key of ['copyrightHolder', 'copyrightYear', 'acquireLicensePage', 'usageInfo']) delete image[key];
      Object.assign(image, repaired);
    }
    return open + jsonForHtml(node) + close;
  });
  const next = head + old.slice(end);
  if (next.slice(next.indexOf('</head>')) !== old.slice(end) || next.match(/<title>[\s\S]*?<\/title>/)?.[0] !== old.match(/<title>[\s\S]*?<\/title>/)?.[0]) throw new Error(`${file}: article content changed`);
  const errors = validateArticleImages(next, registry);
  if (errors.length) throw new Error(`${file}: ${errors.join('; ')}`);
  if (next !== old) writeFileSync(file, next, 'utf8');
  console.log(`${file}: ${next === old ? 'unchanged' : 'image metadata repaired; body preserved'}`);
}
