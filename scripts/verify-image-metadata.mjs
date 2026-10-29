#!/usr/bin/env node
// Read-only publish gate: check the registry, JSON-LD and every article's custom images.
// Usage: node scripts/verify-image-metadata.mjs [site-root] [rights-registry.json]
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { SITE, loadImageRights, validateRightsRecord, validateArticleImages, parseJsonLd, imageObjects } from './image-metadata.mjs';

const root = process.argv[2] || '.';
const registry = loadImageRights(process.argv[3]);
const errors = [];
for (const [url, record] of Object.entries(registry)) {
  try {
    validateRightsRecord(url, record);
    if (new URL(url).origin === SITE) {
      if (!/^[a-f0-9]{64}$/.test(record.sha256 || '')) throw new Error('local image requires a reviewed sha256');
      const bytes = readFileSync(join(root, decodeURIComponent(new URL(url).pathname)));
      if (createHash('sha256').update(bytes).digest('hex') !== record.sha256) throw new Error('image bytes differ from reviewed source; recheck rights before replacing the asset');
    }
  } catch (error) { errors.push(`${url}: ${error.message}`); }
}
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (['.git', '.github', 'node_modules', 'tests', 'docs', 'scripts', 'guard'].includes(entry.name)) return [];
    const file = join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
  });
}
let articles = 0, images = 0;
for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/');
  const html = readFileSync(file, 'utf8');
  const isArticle = /(^|\/)articles\/[^/]+\.html$/.test(rel);
  if (isArticle) articles++;
  // Other public pages are checked too if they explicitly publish ImageObject data.
  try {
    const count = parseJsonLd(html).flatMap(imageObjects).length;
    images += count;
    if (isArticle || count) errors.push(...validateArticleImages(html, registry).map((error) => `${rel}: ${error}`));
  } catch (error) { errors.push(`${rel}: Invalid JSON-LD: ${error.message}`); }
}
if (errors.length) { console.error(`IMAGE METADATA FAIL\n${errors.join('\n')}`); process.exit(1); }
console.log(`IMAGE METADATA PASS: ${articles} articles, ${images} ImageObjects, ${Object.keys(registry).length} verified rights records`);
