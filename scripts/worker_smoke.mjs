// Pre-deploy runtime smoke for the staged TrendCheck worker.
// Imports the actual staged module (real BLOB -> Uint8Array representation)
// and exercises the static-file path + conditional GET before any upload.
// Usage: node worker_smoke.mjs <staged-worker.mjs>   (exit 0 = pass)
const path = process.argv[2];
if (!path) { console.error('usage: worker_smoke.mjs <worker>'); process.exit(2); }
const mod = await import('file://' + path);
const worker = mod.default;
const env = { DB: null };
const fails = [];
async function get(p, headers) {
  return await worker.fetch(new Request('https://trendcheck.today' + p, { headers: headers || {} }), env);
}
const checks = [
  ['/', 200, 'text/html'],
  ['/style.css', 200, 'text/css'],
  ['/i18n.js', 200, 'text/javascript'],
  ['/tc.js', 200, 'text/javascript'],
  ['/robots.txt', 200, 'text/plain'],
  ['/sitemap.xml', 200, 'application/xml'],
];
for (const [p, st, ct] of checks) {
  try {
    const r = await get(p);
    if (r.status !== st) fails.push(p + ' status ' + r.status);
    if (!(r.headers.get('content-type') || '').startsWith(ct)) fails.push(p + ' content-type ' + r.headers.get('content-type'));
    const b = await r.text();
    if (!b || b.length < 10) fails.push(p + ' empty body');
  } catch (e) { fails.push(p + ' threw: ' + e.message); }
}
// js cache-validation contract
try {
  const r = await get('/i18n.js');
  const cc = r.headers.get('cache-control') || '';
  const et = r.headers.get('etag');
  if (!cc.includes('max-age=0')) fails.push('i18n.js cache-control missing max-age=0: ' + cc);
  if (!et) fails.push('i18n.js missing etag');
  else {
    const r304 = await get('/i18n.js', { 'If-None-Match': et });
    if (r304.status !== 304) fails.push('conditional GET status ' + r304.status + ' (want 304)');
    const r200 = await get('/i18n.js', { 'If-None-Match': '"tc-0-stale"' });
    if (r200.status !== 200) fails.push('stale-etag GET status ' + r200.status + ' (want 200)');
  }
} catch (e) { fails.push('js cache check threw: ' + e.message); }
// css must keep the shared caching behavior (other writer's theme asset)
try {
  const r = await get('/style.css');
  const cc = r.headers.get('cache-control') || '';
  if (!cc.includes('max-age=600')) fails.push('style.css cache-control changed unexpectedly: ' + cc);
} catch (e) { fails.push('style.css check threw: ' + e.message); }
if (fails.length) { console.error('SMOKE FAIL:'); for (const f of fails) console.error(' - ' + f); process.exit(1); }
console.log('SMOKE PASS: ' + checks.length + ' paths 200 + js etag/304 contract + css cache preserved');
