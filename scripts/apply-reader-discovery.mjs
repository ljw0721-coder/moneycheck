#!/usr/bin/env node
// apply-reader-discovery: idempotent reader-discovery reconciliation.
// (1) Home "more articles" sections: links every article file of that locale
//     not already linked on the page (covers backfill AND future articles).
// (2) Locale home category-card counts: synced to the cat-*.html pages,
//     which are the source of truth for published-per-category counts.
// Strictly additive to others' markup; only its own marker-bounded section is
// rebuilt. Fail-closed on structural surprises. Run before every deploy and
// after any home regeneration.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.';
const LOCALES = [
  { dir: '', home: 'index.html', label: '이번 주에 더 올라온 글', counted: false },
  { dir: 'en', home: 'en/index.html', label: 'More from this week', counted: true },
  { dir: 'ja', home: 'ja/index.html', label: '今週の記事をもっと読む', counted: true },
  { dir: 'zh', home: 'zh/index.html', label: '本週更多文章', counted: true },
  { dir: 'es', home: 'es/index.html', label: 'Más artículos de esta semana', counted: true },
  { dir: 'ar', home: 'ar/index.html', label: 'المزيد من مقالات هذا الأسبوع', counted: true },
];
const MARK = /<!-- tc-backfill-links v\d -->/;
const BLOCK = /<!-- tc-backfill-links v\d --><section class="tc-backfill">[\s\S]*?<\/section>\n?/;
const NEW_MARK = '<!-- tc-backfill-links v2 -->';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let fail = false;

for (const loc of LOCALES) {
  const hp = path.join(root, loc.home);
  if (!fs.existsSync(hp)) { console.error('MISSING PAGE ' + loc.home); fail = true; continue; }
  let html = fs.readFileSync(hp, 'utf8');
  html = html.replace(BLOCK, ''); // remove own previous block first so its links never suppress the scan

  // (1) article link section
  const adir = path.join(root, loc.dir, 'articles');
  const files = fs.existsSync(adir) ? fs.readdirSync(adir).filter(f => f.endsWith('.html')).sort() : [];
  const cards = [];
  for (const f of files) {
    const href = `/${loc.dir ? loc.dir + '/' : ''}articles/${f}`;
    if (html.includes(`href="${href}"`)) continue;
    const src = fs.readFileSync(path.join(adir, f), 'utf8');
    const title = esc((src.match(/<title>([^<]*)<\/title>/) || [, f])[1].trim());
    const date = (src.match(/20\d\d-\d\d-\d\d/) || [''])[0];
    cards.push(`<div class="card"><a href="${href}">${title}</a><p class="meta">${date}</p></div>`);
  }
  if (cards.length) {
    const block = `${NEW_MARK}<section class="tc-backfill"><h2>${esc(loc.label)}</h2><div class="grid">${cards.join('')}</div></section>\n`;
    const i = html.indexOf('</main>');
    if (i === -1) { console.error('NO </main> IN ' + loc.home); fail = true; continue; }
    html = html.slice(0, i) + block + html.slice(i);
  }

  // (2) category-card counts synced from cat pages
  if (loc.counted) {
    for (const c of ['a', 'b', 'c', 'd', 'e']) {
      const cp = path.join(root, loc.dir, `cat-${c}.html`);
      if (!fs.existsSync(cp)) { console.error('MISSING CAT PAGE ' + cp); fail = true; continue; }
      const h1 = (fs.readFileSync(cp, 'utf8').match(/<h1>([^<]*)<\/h1>/) || [])[1] || '';
      const cnt = (h1.match(/\((\d+)\)/) || [])[1];
      if (cnt === undefined) { console.error('NO COUNT IN ' + cp); fail = true; continue; }
      const re = new RegExp(`(<a href="/${loc.dir}/cat-${c}\\.html">[^<(]*)\\(\\d+\\)`, 'g');
      html = html.replace(re, `$1(${cnt})`);
    }
  }
  fs.writeFileSync(hp, html);
  console.log(`${loc.home}: ${cards.length} extra article links${loc.counted ? ', counts synced' : ''}`);
}
if (fail) { console.error('FAILED - no partial trust, fix inputs'); process.exit(1); }
console.log('done');
