// Idempotent: guarantee search-engine site-verification meta tags in index.html.
// Run after ANY template/homepage regeneration, together with apply-ads.mjs.
import { readFileSync, writeFileSync } from 'fs';
const TAGS = [
  '<meta name="google-adsense-account" content="ca-pub-3867118796714043">',
  '<meta name="naver-site-verification" content="a0b71293b8c916cef43c3d046b57a5df7f0a5817">',
];
let s = readFileSync('index.html', 'utf8');
let added = [];
for (const t of TAGS) {
  const key = t.match(/name="([^"]+)"/)[1];
  if (!s.includes(key)) { s = s.replace('</head>', t + '\n</head>'); added.push(key); }
}
if (added.length) { writeFileSync('index.html', s); }
console.log(added.length ? 'added: ' + added.join(', ') : 'verify tags OK');
