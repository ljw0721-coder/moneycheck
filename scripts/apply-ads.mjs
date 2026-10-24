#!/usr/bin/env node
// apply-ads.mjs - regenerate ALL ad wiring from ads.config.json (single source of truth).
// Run after any template/page regeneration. Idempotent: re-running makes no changes.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const cfg = JSON.parse(readFileSync(join(root, 'ads.config.json'), 'utf8'));
const PUB = cfg.adsense_pub;              // pub-...
const CA = 'ca-' + PUB;                    // ca-pub-...

let changed = [];
function swap(file, fn) {
  const p = join(root, file);
  let s; try { s = readFileSync(p, 'utf8'); } catch { return; }
  const t = fn(s);
  if (t !== s) { writeFileSync(p, t); changed.push(file); }
}

// 1. ads.txt: exact approved line only
writeFileSync(join(root, 'ads.txt'), '# 애드센스 연결됨 (ads.config.json 에서 생성)\n' + cfg.ads_txt_line + '\n');

// 2. Global placeholder sweep (README-adsense.md step 3: bulk replace of pub-XXXX...)
function* walk(dir) {
  for (const e of readdirSync(dir)) {
    if (e === '.git' || e === 'node_modules') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (/\.(html|js|txt)$/.test(e)) yield p;
  }
}
for (const p of walk(root)) {
  const rel = p.slice(root.length);
  if (rel === 'ads.txt') continue;
  let s = readFileSync(p, 'utf8');
  const t = s.replaceAll('ca-pub-XXXXXXXXXXXXXXXX', CA).replaceAll('pub-XXXXXXXXXXXXXXXX', PUB);
  if (t !== s) { writeFileSync(p, t); changed.push(rel); }
}

// 2b. ads.js: normalize the "is AdSense configured" sentinel (templates compare against the
// placeholder, which the sweep above would otherwise rewrite into a self-negating check)
swap('ads.js', s => s.replace(/const hasAdsense = [^;]+;/, 'const hasAdsense = NET.adsense.startsWith("pub-");'));

// 3. Homepages: guarantee the AdSense loader script in <head>
const SNIPPET = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CA}" crossorigin="anonymous"></script>`;
for (const hp of cfg.homepages) {
  swap(hp, s => {
    if (s.includes('adsbygoogle.js?client=' + CA)) return s;
    // remove stale loaders with another/absent client, then inject before </head>
    s = s.replace(/<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]*" crossorigin="anonymous"><\/script>\s*/g, '');
    if (!s.includes('</head>')) return s;
    return s.replace('</head>', SNIPPET + '\n</head>');
  });
}

console.log(changed.length ? 'updated: ' + changed.join(', ') : 'already up to date');
