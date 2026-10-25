#!/usr/bin/env node
// apply-article-meta.mjs — 기존 기사 head에 메타만 추가 (사용자 요청 2026-10-25 13:49).
// 추가: NewsArticle JSON-LD, robots max-image-preview:large, OG 태그(og-default.png 폴백).
// 규칙: 제목·본문 일절 변경 없음(삽입 위치는 </head> 직전 단 한 곳). 이미 있으면 skip(멱등).
import { readFileSync, writeFileSync } from 'node:fs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SITE = 'https://trendcheck.today';
const OG_IMG = `${SITE}/og-default.png`;

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: apply-article-meta.mjs <article.html>...'); process.exit(2); }

const results = [];
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (html.includes('NewsArticle') || html.includes('og:title')) { results.push([f, 'skip: already has meta']); continue; }
  if ((html.match(/<\/head>/g) || []).length !== 1) { results.push([f, 'ERROR: </head> count != 1']); continue; }

  const lang = (html.match(/<html lang="([^"]+)"/) || [])[1];
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1] || `${SITE}/${f.replace(/^\.\//, '')}`;
  const metaP = html.match(/<p class="meta">([^<]*(\d{4})-(\d{2})-(\d{2})[^<]*)<\/p>/);
  const date = metaP ? metaP[1].match(/\d{4}-\d{2}-\d{2}/)[0] : null;
  if (!lang || !title || !desc || !date) { results.push([f, `ERROR: missing field lang=${!!lang} title=${!!title} desc=${!!desc} date=${!!date}`]); continue; }

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: title, datePublished: date, inLanguage: lang,
    author: { '@type': 'Organization', name: 'TrendCheck' },
    publisher: { '@type': 'Organization', name: 'TrendCheck' },
    mainEntityOfPage: canon,
  });
  const ins = [
    `<meta name="robots" content="max-image-preview:large">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:url" content="${esc(canon)}">`,
    `<meta property="og:image" content="${OG_IMG}">`,
    `<meta property="og:site_name" content="TrendCheck">`,
    `<meta property="article:published_time" content="${date}">`,
    `<script type="application/ld+json">${jsonld}</script>`,
  ].join('\n') + '\n';

  const out = html.replace('</head>', ins + '</head>');
  // 안전 검증: 삽입 외 바이트 동일 + 제목 문자열 불변
  if (out.replace(ins, '') !== html) { results.push([f, 'ERROR: non-insertion delta']); continue; }
  if ((out.match(/<title>([^<]*)<\/title>/) || [])[1] !== title) { results.push([f, 'ERROR: title changed']); continue; }
  writeFileSync(f, out);
  results.push([f, `added (${lang}, ${date})`]);
}
for (const [f, s] of results) console.log(`${f}: ${s}`);
if (results.some(([, s]) => s.startsWith('ERROR'))) process.exit(1);
