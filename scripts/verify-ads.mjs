// Pre-push/pre-deploy guard: fail if any ad artifact carries a placeholder
// publisher ID or the real ID is missing. Run after ANY template/page
// regeneration, together with apply-ads.mjs. Idempotent, read-only.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
const cfg = JSON.parse(readFileSync('ads.config.json', 'utf8'));
const pub = cfg.adsense_pub; // e.g. pub-3867118796714043
let bad = [];
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  if (f === 'node_modules' || f === '.git') return [];
  return statSync(p).isDirectory() ? walk(p) : [p];
});
for (const p of walk('.')) {
  if (!/\.(html|js|txt|json)$/.test(p)) continue;
  const s = readFileSync(p, 'utf8');
  if (s.includes('pub-XXXXXXXXXXXXXXXX')) bad.push(p + ': placeholder publisher ID');
}
const adsTxt = readFileSync('ads.txt', 'utf8');
if (!adsTxt.includes(pub)) bad.push('ads.txt: real publisher ID missing');
const adsJs = readFileSync('ads.js', 'utf8');
if (!adsJs.includes(pub)) bad.push('ads.js: real publisher ID missing');
if (!readFileSync('index.html', 'utf8').includes('ca-' + pub)) bad.push('index.html: adsense meta missing');
if (bad.length) { console.error('ADS VERIFY FAIL\n' + bad.join('\n')); process.exit(1); }
console.log('ADS VERIFY OK (' + pub + ')');
