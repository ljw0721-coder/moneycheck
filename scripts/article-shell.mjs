#!/usr/bin/env node
// article-shell.mjs — 저녁 신규 기사 HTML 셸 생성 (사용자 요청 2026-10-25 13:49, 항목 2·3).
// 같은 로케일의 기존 기사(--ref)에서 header/footer/comments/ad-slot 구조를 그대로 가져오고,
// head에는 NewsArticle JSON-LD + max-image-preview:large + OG 태그를 기본 포함,
// 본문 하단에는 공유 버튼(X/Threads/Facebook/링크복사)을 넣는다.
//
// usage:
//   node scripts/article-shell.mjs --ref articles/a106.html --out articles/a107.html \
//     --title '...' --desc '...' --date 2026-10-25 --meta-line '연예·문화 · 2026-10-25' \
//     --canon https://trendcheck.today/articles/a107.html --body-file /tmp/body.html
import { readFileSync, writeFileSync } from 'node:fs';
import { loadImageRights, imageUrl, buildImageObject, jsonForHtml, validateArticleImages } from './image-metadata.mjs';

const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : null; };
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://trendcheck.today';

const [ref, out, title, desc, date, metaLine, canon, bodyFile] =
  ['ref', 'out', 'title', 'desc', 'date', 'meta-line', 'canon', 'body-file'].map(arg);
const [imgUrl, imgCredit, imgAlt] = ['image-url', 'image-credit', 'image-alt'].map(arg);
// --image-rights-file may select another reviewed registry; absent metadata fails
// before any output is written. Omitting --image-url keeps the generic fallback.
const registry = loadImageRights(arg('image-rights-file') || undefined);
let image;
try {
  if (imgUrl) {
    if (!imgAlt) throw new Error('--image-url requires --image-alt');
    image = buildImageObject(imgUrl, registry);
    if (imgCredit && imgCredit !== image.creditText) throw new Error('--image-credit differs from the verified rights record');
  } else if (imgCredit || imgAlt) throw new Error('Image credit/alt requires --image-url');
} catch (error) { console.error(error.message); process.exit(2); }
if (!ref || !out || !title || !desc || !date || !metaLine || !canon || !bodyFile) {
  console.error('required: --ref --out --title --desc --date --meta-line --canon --body-file');
  process.exit(2);
}
const refHtml = readFileSync(ref, 'utf8');
const body = readFileSync(bodyFile, 'utf8');

const lang = (refHtml.match(/<html lang="([^"]+)"/) || [])[1] || 'ko';
const dir = (refHtml.match(/<html[^>]* dir="([^"]+)"/) || [])[1] || 'ltr';

// header: <body> ~ <main> 사이 / footer: </main> 이후 — 기존 기사 구조 재사용
const header = (refHtml.match(/<body>([\s\S]*?)<main>/) || [])[1];
const footer = (refHtml.match(/<\/main>([\s\S]*?)<\/body>/) || [])[1];
// comments 섹션: ref에서 가져와 data-path만 새 경로로
const comments = (refHtml.match(/<section id="tc-comments"[\s\S]*?<\/section>/) || [])[0];
if (!header || footer === undefined || !comments) { console.error('ERROR: reference structure parse failed'); process.exit(1); }
const canonPath = canon.replace(SITE + '/', '').replace(/^\//, '');
const commentsNew = comments.replace(/data-path="[^"]*"/, `data-path="${canonPath}"`);

const LABELS = {
  ko: ['공유', '링크 복사', '복사됨'], en: ['Share', 'Copy link', 'Copied'], ja: ['共有', 'リンクをコピー', 'コピーしました'],
  zh: ['分享', '复制链接', '已复制'], es: ['Compartir', 'Copiar enlace', 'Copiado'], ar: ['مشاركة', 'نسخ الرابط', 'تم النسخ'],
};
const [shareL, copyL, copiedL] = LABELS[lang] || LABELS.en;

const jsonld = jsonForHtml({
  '@context': 'https://schema.org', '@type': 'NewsArticle',
  headline: title, datePublished: date, inLanguage: lang,
  author: { '@type': 'Organization', name: 'TrendCheck' },
  publisher: { '@type': 'Organization', name: 'TrendCheck' },
  mainEntityOfPage: canon,
  ...(image ? { image } : {}),
});

const share = `<section class="tc-share" aria-label="${esc(shareL)}"><p>${esc(shareL)}:
<a href="https://twitter.com/intent/tweet?url=${encodeURIComponent(canon)}&text=${encodeURIComponent(title)}" target="_blank" rel="noopener">X</a> ·
<a href="https://www.threads.net/intent/post?text=${encodeURIComponent(title + ' ' + canon)}" target="_blank" rel="noopener">Threads</a> ·
<a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canon)}" target="_blank" rel="noopener">Facebook</a> ·
<button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${canon}').then(()=>{this.textContent='${copiedL}'})">${copyL}</button></p></section>`;

const html = `<!DOCTYPE html><html lang="${lang}" dir="${dir}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><link rel="canonical" href="${esc(canon)}"><meta name="description" content="${esc(desc)}">
<meta name="google-adsense-account" content="ca-pub-3867118796714043">
<link rel="stylesheet" href="/style.css"><script src="/ads.js" defer></script><script src="/i18n.js" defer></script><script src="/tc.js" defer></script>
<meta name="robots" content="max-image-preview:large">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${esc(canon)}">
<meta property="og:image" content="${esc(image ? imageUrl(imgUrl) : SITE + '/og-default.png')}">
<meta property="og:site_name" content="TrendCheck">
<meta property="article:published_time" content="${date}">
<script type="application/ld+json">${jsonld}</script>
</head><body>${header}<main><p class="meta">${esc(metaLine)}</p>
<h1>${esc(title)}</h1>
<p class="tc-views">${lang === 'ko' ? '조회수' : 'Views'} <span data-tc-views>0</span></p>
${image ? `<figure class="tc-hero" style="margin:16px 0"><img src="${esc(image.contentUrl)}" alt="${esc(imgAlt)}" width="1600" height="900" loading="lazy" style="max-width:100%;height:auto;border-radius:8px"><figcaption style="font-size:12px;color:#666;margin-top:4px">${esc(image.creditText)} · <a href="${esc(image.isBasedOn)}" rel="noopener">Source</a> · <a href="${esc(image.license)}" rel="noopener">Usage terms</a> · ${esc(registry[image.contentUrl].modifications || '')}</figcaption></figure>` : ''}
${body}
${share}
<div class="ad-slot" data-pos="bottom"></div>
${commentsNew}
</main>${footer}</body></html>
`;
const imageErrors = validateArticleImages(html, registry);
if (imageErrors.length) { console.error(imageErrors.join('\n')); process.exit(2); }
writeFileSync(out, html, 'utf8');
console.log(JSON.stringify({ ok: true, out, lang, canon }));
