#!/usr/bin/env node
// tc-backfill-links: idempotently append crawlable reader links for the
// 2026-10-25 backfill article set to the 6 home pages (ko + 5 locales).
// Additive only: never edits or removes existing markup; marker-guarded so
// running it any number of times (e.g. after a homepage regeneration) is safe.
// Run after any home/index regeneration, same as apply-site-verify.mjs.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.';
const MARK = '<!-- tc-backfill-links v1 -->';
const SETS = {
  'index.html':    { label: '이번 주에 더 올라온 글', hrefs: ['/articles/a104.html', '/articles/a105.html', '/articles/a106.html'] },
  'en/index.html': { label: 'More from this week', hrefs: ['/en/articles/en003.html', '/en/articles/en004.html'] },
  'ja/index.html': { label: '今週の記事をもっと読む', hrefs: ['/ja/articles/ja003.html', '/ja/articles/ja004.html', '/ja/articles/ja005.html'] },
  'zh/index.html': { label: '本週更多文章', hrefs: ['/zh/articles/zh003.html', '/zh/articles/zh004.html'] },
  'es/index.html': { label: 'Más artículos de esta semana', hrefs: ['/es/articles/es003.html', '/es/articles/es004.html', '/es/articles/es005.html', '/es/articles/es006.html'] },
  'ar/index.html': { label: 'المزيد من مقالات هذا الأسبوع', hrefs: ['/ar/articles/ar003.html', '/ar/articles/ar004.html', '/ar/articles/ar005.html'] },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let changed = 0, skipped = 0;
for (const [page, cfg] of Object.entries(SETS)) {
  const p = path.join(root, page);
  if (!fs.existsSync(p)) { console.error('MISSING PAGE ' + page); process.exitCode = 1; continue; }
  let html = fs.readFileSync(p, 'utf8');
  if (html.includes(MARK)) { skipped++; continue; }
  const cards = [];
  for (const href of cfg.hrefs) {
    const fp = path.join(root, href.replace(/^\//, ''));
    if (!fs.existsSync(fp)) { console.error('MISSING ARTICLE ' + href); process.exitCode = 1; continue; }
    const src = fs.readFileSync(fp, 'utf8');
    const title = esc((src.match(/<title>([^<]*)<\/title>/) || [, href])[1].trim());
    const date = (src.match(/20\d\d-\d\d-\d\d/) || [''])[0];
    if (html.includes(`href="${href}"`)) continue; // already linked on the page
    cards.push(`<div class="card"><a href="${href}">${title}</a><p class="meta">${date}</p></div>`);
  }
  if (!cards.length) { skipped++; continue; }
  const block = `${MARK}<section class="tc-backfill"><h2>${esc(cfg.label)}</h2><div class="grid">${cards.join('')}</div></section>\n`;
  const i = html.indexOf('</main>');
  if (i === -1) { console.error('NO </main> IN ' + page); process.exitCode = 1; continue; }
  html = html.slice(0, i) + block + html.slice(i);
  fs.writeFileSync(p, html);
  changed++;
  console.log('linked ' + cards.length + ' articles into ' + page);
}
console.log(`done: ${changed} pages updated, ${skipped} already up to date`);
