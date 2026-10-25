
const BLOB = "__BLOB_STRIPPED__see_deploy_journal__";
let cache = null;
async function load() {
  if (cache) return cache;
  const bin = Uint8Array.from(atob(BLOB), c => c.charCodeAt(0));
  const ds = new DecompressionStream("gzip");
  const raw = new Uint8Array(await new Response(new Blob([bin]).stream().pipeThrough(ds)).arrayBuffer());
  const map = new Map(); const dec = new TextDecoder();
  let i = 0;
  while (i < raw.length) {
    let j = raw.indexOf(10, i); const key = dec.decode(raw.slice(i, j)); i = j + 1;
    j = raw.indexOf(10, i); const len = parseInt(dec.decode(raw.slice(i, j))); i = j + 1;
    map.set(key, raw.slice(i, i + len)); i += len;
  }
  cache = map; return map;
}
const enc = new TextEncoder();
async function sha(str) {
  const b = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function json(o, st) { return new Response(JSON.stringify(o), { status: st || 200, headers: { "content-type": "application/json", "cache-control": "no-store" } }); }
function cleanPath(p) {
  if (!p) return null;
  p = p.replace(/^\//, "").slice(0, 200);
  return /^[a-z0-9\/_.\-]+$/i.test(p) ? p : null;
}
function kstDay() { return new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); }
function ipOf(req) { return req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim(); }
/* member auth: PBKDF2-hashed passwords, hashed session tokens, HttpOnly cookie */
function parseCookies(req) {
  const h = req.headers.get("cookie") || ""; const out = {};
  h.split(";").forEach(p => { const i = p.indexOf("="); if (i > 0) out[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
  return out;
}
function b64(buf) { let s = ""; const b = new Uint8Array(buf); for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
function b64dec(s) { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b.buffer; }
async function hashPw(pw, saltB64) {
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64dec(saltB64), iterations: 100000, hash: "SHA-256" }, key, 256);
  return b64(bits);
}
function sessionCookie(token) { return "tc_session=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000"; }
function clearCookie() { return "tc_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"; }
async function currentUser(req, db) {
  const t = parseCookies(req).tc_session;
  if (!t) return null;
  const row = await db.prepare("SELECT s.user_id AS uid, u.name AS name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > datetime('now')").bind(await sha(t)).first();
  return row ? { id: row.uid, name: row.name } : null;
}
async function newSession(db, uid) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw);
  const token = [...raw].map(x => x.toString(16).padStart(2, "0")).join("");
  await db.prepare("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES(?,?,datetime('now','+30 days'))").bind(await sha(token), uid).run();
  return token;
}
function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function b64url(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlDec(s) { return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/")))); }
function safeReturn(r) { return r && r.startsWith("/") && !r.startsWith("//") && !r.includes("\\") ? r : "/"; }
function tempPw() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; let s = ""; const b = new Uint8Array(12); crypto.getRandomValues(b); for (const x of b) s += c[x % c.length]; return s; }
const SPAM_HOLD = /(https?:\/\/|www\.|카지노|바카라|토토|슬롯|먹튀|폰테크|출장마사지|비아그라|casino|baccarat|toto|slot|viagra)/i;
async function adminAuth(req, db) {
  const k = req.headers.get("x-admin-key") || "";
  if (!k) return false;
  const row = await db.prepare("SELECT v FROM admin_meta WHERE k='key_hash'").first();
  return row && row.v === await sha(k);
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const db = env.DB;
    if (url.pathname.startsWith("/api/")) {
      try {
        if (url.pathname === "/api/view" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const path = cleanPath(body.path);
          if (!path) return json({ error: "bad path" }, 400);
          const day = kstDay();
          const vh = await sha(ipOf(req) + "|" + (req.headers.get("user-agent") || "") + "|" + day);
          const now = new Date().toISOString();
          await db.batch([
            db.prepare("INSERT INTO page_views(path, views, updated_at) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET views=views+1, updated_at=excluded.updated_at").bind(path, 1, now),
            db.prepare("INSERT OR IGNORE INTO visits(day, visitor_hash) VALUES(?,?)").bind(day, vh),
          ]);
          const row = await db.prepare("SELECT views FROM page_views WHERE path=?").bind(path).first();
          return json({ views: row ? row.views : 0 });
        }
        if (url.pathname === "/api/stats" && req.method === "GET") {
          const paths = (url.searchParams.get("paths") || "").split(",").map(cleanPath).filter(Boolean).slice(0, 50);
          const counts = {};
          for (const p of paths) {
            const row = await db.prepare("SELECT views FROM page_views WHERE path=?").bind(p).first();
            counts[p] = row ? row.views : 0;
          }
          return json({ counts });
        }
        if (url.pathname === "/api/comments" && req.method === "GET") {
          const path = cleanPath(url.searchParams.get("path"));
          if (!path) return json({ error: "bad path" }, 400);
          const res = await db.prepare("SELECT id, name, text, created_at FROM comments WHERE path=? AND status='approved' ORDER BY created_at DESC LIMIT 100").bind(path).all();
          return json({ comments: res.results || [] });
        }
        if (url.pathname === "/api/auth/signup" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const name = String(body.name || "").trim().slice(0, 30);
          const email = String(body.email || "").trim().toLowerCase().slice(0, 100);
          const pw = String(body.password || "");
          if (!name || !validEmail(email) || pw.length < 8) return json({ error: "이름·이메일·8자 이상 비밀번호를 입력하세요." }, 400);
          const ex = await db.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
          if (ex) return json({ error: "이미 가입된 이메일입니다." }, 409);
          const salt = new Uint8Array(16); crypto.getRandomValues(salt);
          const saltB64 = b64(salt.buffer);
          const hash = await hashPw(pw, saltB64);
          const r = await db.prepare("INSERT INTO users(name, email, pw_salt, pw_hash, created_at) VALUES(?,?,?,?,?)").bind(name, email, saltB64, hash, new Date().toISOString()).run();
          const token = await newSession(db, r.meta.last_row_id);
          const res = json({ ok: true, name });
          res.headers.set("Set-Cookie", sessionCookie(token));
          return res;
        }
        if (url.pathname === "/api/auth/login" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const email = String(body.email || "").trim().toLowerCase().slice(0, 100);
          const pw = String(body.password || "");
          const u = await db.prepare("SELECT id, name, pw_salt, pw_hash FROM users WHERE email=?").bind(email).first();
          if (!u || (await hashPw(pw, u.pw_salt)) !== u.pw_hash) return json({ error: "이메일 또는 비밀번호가 맞지 않습니다." }, 401);
          const token = await newSession(db, u.id);
          const res = json({ ok: true, name: u.name });
          res.headers.set("Set-Cookie", sessionCookie(token));
          return res;
        }
        if (url.pathname === "/api/auth/logout" && req.method === "POST") {
          const t = parseCookies(req).tc_session;
          if (t) await db.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha(t)).run();
          const res = json({ ok: true });
          res.headers.set("Set-Cookie", clearCookie());
          return res;
        }
        if (url.pathname === "/api/auth/me" && req.method === "GET") {
          const u = await currentUser(req, db);
          return json(u ? { logged_in: true, name: u.name } : { logged_in: false });
        }
        if (url.pathname === "/api/comments" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const path = cleanPath(body.path);
          const text = String(body.text || "").trim().slice(0, 500);
          const u = await currentUser(req, db);
          if (!u) return json({ error: "댓글을 쓰려면 로그인하세요." }, 401);
          if (!path || !text) return json({ error: "댓글을 입력하세요." }, 400);
          const iph = await sha(ipOf(req));
          const cnt = await db.prepare("SELECT COUNT(*) AS n FROM comments WHERE user_id=? AND created_at > datetime('now','-1 hour')").bind(u.id).first();
          if (cnt && cnt.n >= 5) return json({ error: "잠시 후 다시 시도하세요." }, 429);
          // Immediate publishing, except link/spam-suspect comments held for review.
          const status = SPAM_HOLD.test(text) ? "pending" : "approved";
          await db.prepare("INSERT INTO comments(path, name, text, status, ip_hash, user_id, created_at) VALUES(?,?,?,?,?,?,?)").bind(path, u.name, text, status, iph, u.id, new Date().toISOString()).run();
          return json({ ok: true, status });
        }
        if (url.pathname === "/api/auth/change-password" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const u = await currentUser(req, db);
          if (!u) return json({ error: "로그인하세요." }, 401);
          const cur = String(body.current || "");
          const nw = String(body.new || "");
          if (nw.length < 8) return json({ error: "새 비밀번호는 8자 이상 입력하세요." }, 400);
          const row = await db.prepare("SELECT pw_salt, pw_hash FROM users WHERE id=?").bind(u.id).first();
          if (row && row.pw_hash && (await hashPw(cur, row.pw_salt)) !== row.pw_hash) return json({ error: "현재 비밀번호가 맞지 않습니다." }, 401);
          const salt = new Uint8Array(16); crypto.getRandomValues(salt);
          const saltB64 = b64(salt.buffer);
          await db.prepare("UPDATE users SET pw_salt=?, pw_hash=? WHERE id=?").bind(saltB64, await hashPw(nw, saltB64), u.id).run();
          await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id).run();
          const res = json({ ok: true });
          res.headers.set("Set-Cookie", clearCookie());
          return res;
        }
        if (url.pathname === "/api/auth/google" && req.method === "GET") {
          const cid = env.GOOGLE_CLIENT_ID;
          if (!cid) return new Response("<meta charset=utf-8><p>Google 로그인이 아직 설정되지 않았습니다. 관리자에게 문의하세요.</p>", { headers: { "content-type": "text/html;charset=utf-8" } });
          const ret = safeReturn(url.searchParams.get("return") || "/");
          const raw = new Uint8Array(16); crypto.getRandomValues(raw);
          const token = [...raw].map(x => x.toString(16).padStart(2, "0")).join("");
          const state = token + "." + b64url(ret);
          const dest = "https://accounts.google.com/o/oauth2/v2/auth?client_id=" + encodeURIComponent(cid)
            + "&redirect_uri=" + encodeURIComponent("https://trendcheck.today/api/auth/google/callback")
            + "&response_type=code&scope=" + encodeURIComponent("openid email profile") + "&state=" + encodeURIComponent(state);
          return new Response(null, { status: 302, headers: { Location: dest, "Set-Cookie": "tc_oauth_state=" + token + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600" } });
        }
        if (url.pathname === "/api/auth/google/callback" && req.method === "GET") {
          const fail = (m) => new Response("<meta charset=utf-8><p>" + m + ' <a href="/">홈으로</a></p>', { headers: { "content-type": "text/html;charset=utf-8" } });
          const state = url.searchParams.get("state") || "";
          const code = url.searchParams.get("code") || "";
          const dot = state.indexOf(".");
          const token = dot > 0 ? state.slice(0, dot) : "";
          const ret = dot > 0 ? safeReturn(b64urlDec(state.slice(dot + 1))) : "/";
          if (!code || !token || parseCookies(req).tc_oauth_state !== token) return fail("로그인 요청이 유효하지 않습니다. 다시 시도하세요.");
          const cid = env.GOOGLE_CLIENT_ID, sec = env.GOOGLE_CLIENT_SECRET;
          if (!cid || !sec) return fail("Google 로그인이 아직 설정되지 않았습니다.");
          const tokRes = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: cid, client_secret: sec, redirect_uri: "https://trendcheck.today/api/auth/google/callback", grant_type: "authorization_code" }) });
          const tok = await tokRes.json().catch(() => ({}));
          if (!tok.access_token) return fail("Google 인증에 실패했습니다. 다시 시도하세요.");
          const meRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: "Bearer " + tok.access_token } });
          const me = await meRes.json().catch(() => ({}));
          if (!me.email || me.email_verified !== "true" || !me.sub) return fail("Google 계정 정보를 확인할 수 없습니다.");
          const email = String(me.email).toLowerCase().slice(0, 100);
          const name = String(me.name || email.split("@")[0]).trim().slice(0, 30) || "회원";
          let user = await db.prepare("SELECT id, name FROM users WHERE google_sub=?").bind(me.sub).first();
          if (!user) {
            const byEmail = await db.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
            if (byEmail) { await db.prepare("UPDATE users SET google_sub=? WHERE id=?").bind(me.sub, byEmail.id).run(); user = { id: byEmail.id, name }; }
            else { const r = await db.prepare("INSERT INTO users(name, email, pw_salt, pw_hash, google_sub, created_at) VALUES(?,?,?,?,?,?)").bind(name, email, "", "", me.sub, new Date().toISOString()).run(); user = { id: r.meta.last_row_id, name }; }
          }
          const sess = await newSession(db, user.id);
          const out = new Response(null, { status: 302, headers: { Location: ret } });
          out.headers.append("Set-Cookie", sessionCookie(sess));
          out.headers.append("Set-Cookie", "tc_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
          return out;
        }
        if (url.pathname === "/api/admin/setup-probe") {
          const row = await db.prepare("SELECT v FROM admin_meta WHERE k='key_hash'").first();
          return json({ setup_open: !row });
        }
        if (url.pathname === "/api/admin/setup" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const k = String(body.key || "");
          if (k.length < 8) return json({ error: "8자 이상 입력하세요." }, 400);
          const row = await db.prepare("SELECT v FROM admin_meta WHERE k='key_hash'").first();
          if (row) return json({ error: "관리자 키가 이미 있습니다." }, 409);
          await db.prepare("INSERT INTO admin_meta(k, v) VALUES('key_hash',?)").bind(await sha(k)).run();
          return json({ ok: true });
        }
        if (!(await adminAuth(req, db))) return json({ error: "unauthorized" }, 401);
        if (url.pathname === "/api/admin/summary") {
          const tot = await db.prepare("SELECT COALESCE(SUM(views),0) AS n FROM page_views").first();
          const tv = await db.prepare("SELECT COUNT(*) AS n FROM visits WHERE day=?").bind(kstDay()).first();
          const pc = await db.prepare("SELECT COUNT(*) AS n FROM comments WHERE status='pending'").first();
          const top = await db.prepare("SELECT path, views FROM page_views ORDER BY views DESC LIMIT 20").all();
          const daily = await db.prepare("SELECT day, COUNT(*) AS visitors FROM visits GROUP BY day ORDER BY day DESC LIMIT 14").all();
          const recent = await db.prepare("SELECT id, path, name, text, status, created_at FROM comments ORDER BY created_at DESC LIMIT 20").all();
          return json({ total_views: tot.n, today_visitors: tv.n, pending_count: pc.n, top_pages: top.results || [], daily_visitors: daily.results || [], recent_comments: recent.results || [] });
        }
        if (url.pathname === "/api/admin/users") {
          const res = await db.prepare("SELECT id, name, email, CASE WHEN google_sub IS NOT NULL AND google_sub != '' THEN 1 ELSE 0 END AS has_google, created_at FROM users ORDER BY created_at DESC LIMIT 200").all();
          return json({ users: res.results || [] });
        }
        if (url.pathname === "/api/admin/user-reset" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const id = parseInt(body.id, 10);
          if (!id) return json({ error: "bad id" }, 400);
          const u = await db.prepare("SELECT id FROM users WHERE id=?").bind(id).first();
          if (!u) return json({ error: "no such user" }, 404);
          const tmp = tempPw();
          const salt = new Uint8Array(16); crypto.getRandomValues(salt);
          const saltB64 = b64(salt.buffer);
          await db.prepare("UPDATE users SET pw_salt=?, pw_hash=? WHERE id=?").bind(saltB64, await hashPw(tmp, saltB64), id).run();
          await db.prepare("DELETE FROM sessions WHERE user_id=?").bind(id).run();
          return json({ ok: true, temp_password: tmp });
        }
        if (url.pathname === "/api/admin/comments") {
          const st = url.searchParams.get("status") === "approved" ? "approved" : "pending";
          const res = await db.prepare("SELECT id, path, name, text, status, created_at FROM comments WHERE status=? ORDER BY created_at DESC LIMIT 100").bind(st).all();
          return json({ comments: res.results || [] });
        }
        if (url.pathname === "/api/admin/comment" && req.method === "POST") {
          const body = await req.json().catch(() => ({}));
          const id = parseInt(body.id, 10);
          if (!id) return json({ error: "bad id" }, 400);
          if (body.action === "approve") await db.prepare("UPDATE comments SET status='approved' WHERE id=?").bind(id).run();
          else if (body.action === "delete") await db.prepare("DELETE FROM comments WHERE id=?").bind(id).run();
          else return json({ error: "bad action" }, 400);
          return json({ ok: true });
        }
        return json({ error: "not found" }, 404);
      } catch (e) {
        return json({ error: "server_error" }, 500);
      }
    }
    const files = await load();
    let p = url.pathname.replace(/^\//, "");
    if (p === "") p = "index.html";
    if (p.endsWith("/")) p += "index.html";
    let v = files.get(p);
    if (!v && !p.includes(".")) { const alt = p + "/index.html"; v = files.get(alt); if (v) p = alt; }
    if (!v) return new Response("Not Found", { status: 404 });
    const ext = p.split(".").pop().toLowerCase();
    const types = { html: "text/html;charset=utf-8", css: "text/css", js: "text/javascript", txt: "text/plain;charset=utf-8", xml: "application/xml", md: "text/markdown;charset=utf-8" };
    const hdrs = { "content-type": types[ext] || "application/octet-stream", "cache-control": "public,max-age=600" };
    if (ext === "js") {
      let h = 5381; for (let i = 0; i < v.length; i++) h = ((h << 5) + h + v[i]) >>> 0;
      hdrs["cache-control"] = "public,max-age=0,must-revalidate";
      hdrs["etag"] = '"tc-' + v.length + "-" + h.toString(36) + '"';
      if (req.headers.get("if-none-match") === hdrs["etag"]) return new Response(null, { status: 304, headers: hdrs });
    }
    return new Response(v, { headers: hdrs });
  }
}
