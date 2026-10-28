// Meaningful publication regressions; all generated HTML stays in a temporary directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadImageRights, buildImageObject, validateRightsRecord, validateArticleImages, jsonForHtml, parseJsonLd } from '../scripts/image-metadata.mjs';

const registry = loadImageRights();
const urls = Object.keys(registry);
const markup = (image, url = image.contentUrl) => `<meta property="og:image" content="${url}"><script type="application/ld+json">${jsonForHtml({ '@type': 'NewsArticle', image })}</script>`;

test('all three reviewed works keep their exact credit and do not invent holders', () => {
  for (const url of urls) {
    const image = buildImageObject(url, registry);
    assert.equal(image.creditText, registry[url].creditText);
    assert.equal(image.contentUrl, url);
    assert.equal(image.copyrightHolder, undefined);
    assert.equal(image.acquireLicensePage, undefined);
    assert.deepEqual(validateArticleImages(markup(image), registry), []);
  }
});

test('CC0 and NASA use distinct notices and NASA retains its US limitation', () => {
  assert.match(buildImageObject(urls[0], registry).copyrightNotice, /no copyright reserved/);
  assert.match(buildImageObject(urls[1], registry).copyrightNotice, /United States/);
  assert.notEqual(registry[urls[1]].license, registry[urls[0]].license);
});

test('missing notice or contentUrl fails validation', () => {
  for (const field of ['copyrightNotice', 'contentUrl']) {
    const image = buildImageObject(urls[0], registry);
    delete image[field];
    assert.ok(validateArticleImages(markup(image, urls[0]), registry).some((error) => error.includes(field)));
  }
});

test('public-domain copyright ownership and invented acquisition links are rejected', () => {
  const record = structuredClone(registry[urls[0]]);
  record.copyrightHolder = { '@type': 'Organization', name: 'TrendCheck' };
  assert.throws(() => validateRightsRecord(urls[0], record), /must not claim/);
  const image = buildImageObject(urls[0], registry);
  image.acquireLicensePage = 'https://creativecommons.org/publicdomain/zero/1.0/';
  assert.ok(validateArticleImages(markup(image), registry).some((error) => error.includes('unverified acquireLicensePage')));
});

test('a non-CC0 public-domain release cannot silently be relabeled CC0', () => {
  const record = structuredClone(registry[urls[2]]);
  record.license = registry[urls[0]].license;
  assert.throws(() => validateRightsRecord(urls[2], record), /not automatically CC0/);
});

test('licensed fixture requires an explicit source-verified holder and notice', () => {
  // Fictional fixture, never published or added to the live rights registry.
  const url = 'https://example.org/photo.jpg';
  const record = { ...registry[urls[0]], rightsStatus: 'copyrighted', license: 'https://example.org/terms', copyrightNotice: '© 2026 Test Photographer', copyrightHolder: { '@type': 'Person', name: 'Test Photographer' } };
  const image = buildImageObject(url, { [url]: record });
  assert.equal(image.copyrightHolder.name, 'Test Photographer');
  delete record.copyrightHolder;
  assert.throws(() => validateRightsRecord(url, record), /copyrightHolder/);
});

test('a changed credit, unknown image or missing ImageObject fails', () => {
  const image = buildImageObject(urls[0], registry);
  image.creditText = 'TrendCheck';
  assert.ok(validateArticleImages(markup(image), registry).some((error) => error.includes('creditText')));
  assert.throws(() => buildImageObject('https://example.org/unverified.jpg', registry), /rightsStatus/);
  assert.ok(validateArticleImages(`<meta property='og:image' content='${urls[0]}'>`, registry).some((error) => error.includes('no ImageObject')));
});

test('malformed JSON-LD fails; @graph image arrays are checked', () => {
  assert.ok(validateArticleImages('<script type="application/ld+json">{broken}</script>', registry)[0].includes('Invalid JSON-LD'));
  const image = buildImageObject(urls[0], registry);
  delete image.copyrightNotice;
  const html = `<script type='application/ld+json'>${jsonForHtml({ '@graph': [{ '@type': 'NewsArticle', image: [image] }] })}</script>`;
  assert.ok(validateArticleImages(html, registry).some((error) => error.includes('copyrightNotice')));
});

test('fallback image needs no fabricated rights, JSON-LD text cannot close script', () => {
  assert.deepEqual(validateArticleImages('<meta property="og:image" content="https://trendcheck.today/og-default.png">', registry), []);
  const text = '</script><script>alert(1)</script>';
  const json = jsonForHtml({ text });
  assert.ok(!json.includes('<'));
  assert.equal(JSON.parse(json).text, text);
});

test('backfill changes only head metadata, preserves credits, and is repeatable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tc-image-backfill-'));
  try {
    const file = join(dir, 'article.html');
    const image = buildImageObject(urls[0], registry);
    delete image.copyrightNotice;
    const original = `<!doctype html><head><title>기존 제목</title>${markup(image)}</head><body><p>기존 기사</p><figcaption>기존 크레딧</figcaption></body>`;
    writeFileSync(file, original);
    const run = () => spawnSync(process.execPath, ['scripts/apply-image-metadata.mjs', file], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    const repaired = readFileSync(file, 'utf8');
    assert.equal(repaired.slice(repaired.indexOf('</head>')), original.slice(original.indexOf('</head>')));
    assert.equal(run().status, 0);
    assert.equal(readFileSync(file, 'utf8'), repaired);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('generator produces linked rights metadata and rejects missing/mismatched evidence before writing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tc-image-shell-'));
  try {
    const body = join(dir, 'body.html'), out = join(dir, 'out.html');
    writeFileSync(body, '<p>검증된 기사 본문</p>');
    const args = ['scripts/article-shell.mjs', '--ref', 'articles/a106.html', '--out', out, '--title', '메타데이터 검증', '--desc', '검증 기사', '--date', '2026-10-29', '--meta-line', '검증', '--canon', 'https://trendcheck.today/articles/test.html', '--body-file', body];
    const run = (extra) => spawnSync(process.execPath, args.concat(extra), { encoding: 'utf8' });
    assert.equal(run(['--image-url', urls[0], '--image-alt', '단풍']).status, 0);
    const html = readFileSync(out, 'utf8');
    assert.deepEqual(validateArticleImages(html, registry), []);
    assert.ok(html.includes(registry[urls[0]].creditText));
    assert.ok(html.includes('Usage terms'));
    rmSync(out);
    assert.notEqual(run(['--image-url', urls[0], '--image-alt', '단풍', '--image-credit', 'Unverified']).status, 0);
    assert.equal(existsSync(out), false);
    assert.notEqual(run(['--image-url', 'https://example.org/unknown.jpg', '--image-alt', 'unknown']).status, 0);
    assert.equal(existsSync(out), false);
    assert.equal(run([]).status, 0);
    assert.equal(parseJsonLd(readFileSync(out, 'utf8'))[0].image, undefined);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('deploy entrypoint rejects missing copyrightNotice before upload or reader changes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tc-image-deploy-'));
  try {
    const root = join(dir, 'site');
    // An article is enough to trigger the new first gate; no later gates should run.
    const setup = spawnSync('python', ['-c', 'import pathlib,sys; p=pathlib.Path(sys.argv[1]); (p/"articles").mkdir(parents=True); (p/"data").mkdir()', root]);
    assert.equal(setup.status, 0);
    const image = buildImageObject(urls[0], registry);
    delete image.copyrightNotice;
    writeFileSync(join(root, 'articles', 'a001.html'), markup(image));
    writeFileSync(join(root, 'data', 'image-rights.json'), JSON.stringify(registry));
    const marker = join(dir, 'uploaded.json');
    const result = spawnSync('python', ['scripts/deploy_safe.py', root, join(dir, 'allow.txt'), resolve('guard/worker-src.mjs')], { encoding: 'utf8', env: { ...process.env, DEPLOY_SAFE_MOCK_UPLOAD_FILE: marker } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /image metadata validation failed/);
    assert.equal(existsSync(marker), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('replacing a reviewed local image requires a new rights review', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tc-image-hash-'));
  try {
    mkdirSync(join(dir, 'images'));
    const asset = join(dir, 'images', 'og-a106.jpg');
    writeFileSync(asset, readFileSync('images/og-a106.jpg'));
    const rights = join(dir, 'rights.json');
    writeFileSync(rights, JSON.stringify({ [urls[0]]: registry[urls[0]] }));
    const run = () => spawnSync(process.execPath, ['scripts/verify-image-metadata.mjs', dir, rights], { encoding: 'utf8' });
    assert.equal(run().status, 0);
    writeFileSync(asset, 'different image content');
    const result = run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /image bytes differ from reviewed source/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
