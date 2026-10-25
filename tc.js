/* TrendCheck client: view counting + member comments.
   View counts: POST /api/view (IP is hashed per-day on the server, never stored raw).
   Visitors: counted once per day per browser (server-side hash).
   Comments: members only. Signup/login use an HttpOnly session cookie;
   passwords are PBKDF2-hashed on the server and never stored in plain text. */
(function () {
  var lang = (document.documentElement.lang || "ko").slice(0, 2);
  var L = {
    ko: { views: "조회수", comments: "댓글", name: "이름", write: "댓글 쓰기", send: "등록", posted: "댓글이 등록되었습니다.", held: "댓글이 접수되었습니다. 검토 후 표시됩니다.", empty: "아직 댓글이 없습니다.", loadFail: "댓글을 불러오지 못했습니다.",
      needLogin: "댓글을 쓰려면 로그인하세요.", email: "이메일", password: "비밀번호", password8: "비밀번호 (8자 이상)", login: "로그인", signup: "회원가입",
      noAccount: "아직 회원이 아니신가요? 회원가입", hasAccount: "이미 회원이신가요? 로그인", signedAs: "{n}님으로 로그인됨", logout: "로그아웃",
      badLogin: "이메일 또는 비밀번호가 맞지 않습니다.", usedEmail: "이미 가입된 이메일입니다.", fillAll: "이름·이메일·8자 이상 비밀번호를 입력하세요.", google: "Google로 계속하기", forgot: "비밀번호 찾기", forgotGuide: "Google 계정으로 가입하셨다면 Google 로그인을 이용하세요. 그 외의 경우 support@trendcheck.today으로 임시비밀번호 발급을 요청하세요.", changePw: "비밀번호 변경", currentPw: "현재 비밀번호 (Google 가입자는 비워두세요)", newPw: "새 비밀번호 (8자 이상)", pwChanged: "비밀번호가 바뀌었습니다. 다시 로그인하세요.", badCurrent: "현재 비밀번호가 맞지 않습니다." },
    en: { views: "Views", comments: "Comments", name: "Name", write: "Write a comment", send: "Post", posted: "Your comment was posted.", held: "Your comment was received and will appear after review.", empty: "No comments yet.", loadFail: "Could not load comments.",
      needLogin: "Log in to comment.", email: "Email", password: "Password", password8: "Password (8+ characters)", login: "Log in", signup: "Sign up",
      noAccount: "New here? Sign up", hasAccount: "Already a member? Log in", signedAs: "Signed in as {n}", logout: "Log out",
      badLogin: "Wrong email or password.", usedEmail: "This email is already registered.", fillAll: "Please fill in name, email, and a password of 8+ characters.", google: "Continue with Google", forgot: "Forgot password?", forgotGuide: "If you signed up with Google, use Google login. Otherwise, ask the admin at support@trendcheck.today for a temporary password.", changePw: "Change password", currentPw: "Current password (leave blank for Google accounts)", newPw: "New password (8+ characters)", pwChanged: "Password changed. Please log in again.", badCurrent: "Current password is wrong." },
    ja: { views: "閲覧数", comments: "コメント", name: "名前", write: "コメントを書く", send: "投稿", posted: "コメントを投稿しました。", held: "コメントを受け付けました。確認後に表示されます。", empty: "まだコメントがありません。", loadFail: "コメントを読み込めませんでした。",
      needLogin: "コメントするにはログインしてください。", email: "メールアドレス", password: "パスワード", password8: "パスワード（8文字以上）", login: "ログイン", signup: "会員登録",
      noAccount: "初めての方はこちら：会員登録", hasAccount: "会員の方はこちら：ログイン", signedAs: "{n}としてログイン中", logout: "ログアウト",
      badLogin: "メールアドレスまたはパスワードが違います。", usedEmail: "このメールアドレスは既に登録されています。", fillAll: "名前・メールアドレス・8文字以上のパスワードを入力してください。", google: "Googleで続ける", forgot: "パスワードをお忘れですか？", forgotGuide: "Googleで登録した方はGoogleログインをご利用ください。それ以外の方は support@trendcheck.today まで仮パスワードの発行をご依頼ください。", changePw: "パスワード変更", currentPw: "現在のパスワード（Google登録の方は空欄で可）", newPw: "新しいパスワード（8文字以上）", pwChanged: "パスワードを変更しました。再度ログインしてください。", badCurrent: "現在のパスワードが違います。" },
    zh: { views: "浏览量", comments: "评论", name: "姓名", write: "写评论", send: "发布", posted: "评论已发布。", held: "评论已收到，审核通过后显示。", empty: "暂无评论。", loadFail: "无法加载评论。",
      needLogin: "请登录后发表评论。", email: "邮箱", password: "密码", password8: "密码（至少8位）", login: "登录", signup: "注册",
      noAccount: "还没有账号？注册", hasAccount: "已有账号？登录", signedAs: "已登录：{n}", logout: "退出登录",
      badLogin: "邮箱或密码不正确。", usedEmail: "该邮箱已被注册。", fillAll: "请填写姓名、邮箱和至少8位密码。", google: "使用 Google 继续", forgot: "忘记密码？", forgotGuide: "如果您使用 Google 注册，请使用 Google 登录。其他情况请联系 support@trendcheck.today 申请临时密码。", changePw: "修改密码", currentPw: "当前密码（Google 账号可留空）", newPw: "新密码（至少8位）", pwChanged: "密码已修改，请重新登录。", badCurrent: "当前密码不正确。" },
    es: { views: "Vistas", comments: "Comentarios", name: "Nombre", write: "Escribe un comentario", send: "Publicar", posted: "Tu comentario fue publicado.", held: "Tu comentario fue recibido y aparecerá tras su revisión.", empty: "Aún no hay comentarios.", loadFail: "No se pudieron cargar los comentarios.",
      needLogin: "Inicia sesión para comentar.", email: "Correo electrónico", password: "Contraseña", password8: "Contraseña (8+ caracteres)", login: "Iniciar sesión", signup: "Registrarse",
      noAccount: "¿Nuevo aquí? Regístrate", hasAccount: "¿Ya eres miembro? Inicia sesión", signedAs: "Sesión iniciada como {n}", logout: "Cerrar sesión",
      badLogin: "Correo o contraseña incorrectos.", usedEmail: "Este correo ya está registrado.", fillAll: "Escribe nombre, correo y una contraseña de 8+ caracteres.", google: "Continuar con Google", forgot: "¿Olvidaste tu contraseña?", forgotGuide: "Si te registraste con Google, usa el inicio de sesión con Google. En otro caso, pide una contraseña temporal a support@trendcheck.today.", changePw: "Cambiar contraseña", currentPw: "Contraseña actual (déjala en blanco si usas Google)", newPw: "Nueva contraseña (8+ caracteres)", pwChanged: "Contraseña cambiada. Inicia sesión de nuevo.", badCurrent: "La contraseña actual es incorrecta." },
    ar: { views: "المشاهدات", comments: "التعليقات", name: "الاسم", write: "اكتب تعليقًا", send: "نشر", posted: "تم نشر تعليقك.", held: "تم استلام تعليقك وسيظهر بعد المراجعة.", empty: "لا توجد تعليقات بعد.", loadFail: "تعذر تحميل التعليقات.",
      needLogin: "سجّل الدخول للتعليق.", email: "البريد الإلكتروني", password: "كلمة المرور", password8: "كلمة المرور (8 أحرف على الأقل)", login: "تسجيل الدخول", signup: "إنشاء حساب",
      noAccount: "جديد هنا؟ أنشئ حسابًا", hasAccount: "عضو بالفعل؟ سجّل الدخول", signedAs: "تم تسجيل الدخول باسم {n}", logout: "تسجيل الخروج",
      badLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.", usedEmail: "هذا البريد الإلكتروني مسجّل بالفعل.", fillAll: "أدخل الاسم والبريد الإلكتروني وكلمة مرور من 8 أحرف على الأقل.", google: "المتابعة باستخدام Google", forgot: "هل نسيت كلمة المرور؟", forgotGuide: "إذا سجلت باستخدام Google، استخدم تسجيل الدخول عبر Google. في غير ذلك، اطلب كلمة مرور مؤقتة من support@trendcheck.today.", changePw: "تغيير كلمة المرور", currentPw: "كلمة المرور الحالية (اتركها فارغة لحسابات Google)", newPw: "كلمة المرور الجديدة (8 أحرف على الأقل)", pwChanged: "تم تغيير كلمة المرور. سجّل الدخول مجددًا.", badCurrent: "كلمة المرور الحالية غير صحيحة." }
  }[lang] || { views: "Views", comments: "Comments", name: "Name", write: "Write a comment", send: "Post", posted: "Posted.", held: "Received; will appear after review.", empty: "No comments yet.", loadFail: "Could not load comments.",
      needLogin: "Log in to comment.", email: "Email", password: "Password", password8: "Password (8+ characters)", login: "Log in", signup: "Sign up",
      noAccount: "New here? Sign up", hasAccount: "Already a member? Log in", signedAs: "Signed in as {n}", logout: "Log out",
      badLogin: "Wrong email or password.", usedEmail: "This email is already registered.", fillAll: "Please fill in name, email, and a password of 8+ characters.", google: "Continue with Google", forgot: "Forgot password?", forgotGuide: "If you signed up with Google, use Google login. Otherwise, ask the admin at support@trendcheck.today for a temporary password.", changePw: "Change password", currentPw: "Current password (leave blank for Google accounts)", newPw: "New password (8+ characters)", pwChanged: "Password changed. Please log in again.", badCurrent: "Current password is wrong." };

  var path = location.pathname.replace(/^\//, "");
  if (!path) path = "index.html";

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  /* view count for this page */
  var viewsEl = document.querySelector("[data-tc-views]");
  if (viewsEl) {
    fetch("/api/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: path }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j.views != null) viewsEl.textContent = j.views; })
      .catch(function () {});
  }
  /* view counts on listing cards */
  var cards = document.querySelectorAll("[data-tc-views-path]");
  if (cards.length) {
    var paths = Array.prototype.map.call(cards, function (el) { return el.getAttribute("data-tc-views-path"); });
    fetch("/api/stats?paths=" + encodeURIComponent(paths.join(",")))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        cards.forEach(function (el) {
          var n = (j.counts || {})[el.getAttribute("data-tc-views-path")];
          if (n != null) el.textContent = n;
        });
      })
      .catch(function () {});
  }
  /* comments widget (members only) */
  var box = document.getElementById("tc-comments");
  if (box) {
    var cpath = box.getAttribute("data-path") || path;
    var listEl = box.querySelector(".tc-list");
    var msgEl = box.querySelector(".tc-msg");
    var form = box.querySelector("form");
    function load() {
      fetch("/api/comments?path=" + encodeURIComponent(cpath))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var items = j.comments || [];
          listEl.innerHTML = items.length ? items.map(function (c) {
            return '<div class="tc-comment"><b>' + esc(c.name) + '</b> <span class="meta">' + esc(c.created_at.slice(0, 10)) + '</span><p>' + esc(c.text) + '</p></div>';
          }).join("") : "<p>" + L.empty + "</p>";
        })
        .catch(function () { listEl.innerHTML = "<p>" + L.loadFail + "</p>"; });
    }
    load();
    var authEl = document.createElement("div");
    authEl.className = "tc-auth";
    if (form) box.insertBefore(authEl, form);
    else box.appendChild(authEl);

    function postAuth(url, body, msgTarget, onOk) {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json().then(function (j) { return { st: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j.ok) onOk();
          else if (res.st === 401) msgTarget.textContent = L.badLogin;
          else if (res.st === 409) msgTarget.textContent = L.usedEmail;
          else msgTarget.textContent = res.j.error || "error";
        })
        .catch(function () { msgTarget.textContent = "error"; });
    }
    function showLoggedOut() {
      authEl.innerHTML = "<p>" + L.needLogin + "</p>"
        + '<p><a class="tc-google" href="/api/auth/google?return=' + encodeURIComponent(location.pathname) + '">' + L.google + "</a></p>"
        + '<p><a href="#" class="tc-toggle-forgot">' + L.forgot + "</a></p>"
        + '<div class="tc-forgot" style="display:none"><p>' + L.forgotGuide + "</p></div>"
        + '<form class="tc-login"><p><input name="email" type="email" placeholder="' + esc(L.email) + '" required></p><p><input name="password" type="password" placeholder="' + esc(L.password) + '" required></p><p><button type="submit">' + L.login + "</button></p><p class=\"tc-msg\"></p></form>"
        + '<p><a href="#" class="tc-toggle-auth">' + L.noAccount + "</a></p>"
        + '<form class="tc-signup" style="display:none"><p><input name="name" placeholder="' + esc(L.name) + '" maxlength="30" required></p><p><input name="email" type="email" placeholder="' + esc(L.email) + '" required></p><p><input name="password" type="password" placeholder="' + esc(L.password8) + '" required></p><p><button type="submit">' + L.signup + "</button></p><p class=\"tc-msg\"></p></form>";
      if (form) form.style.display = "none";
      var loginF = authEl.querySelector(".tc-login");
      var signupF = authEl.querySelector(".tc-signup");
      var toggle = authEl.querySelector(".tc-toggle-auth");
      var showingSignup = false;
      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        showingSignup = !showingSignup;
        loginF.style.display = showingSignup ? "none" : "";
        signupF.style.display = showingSignup ? "" : "none";
        toggle.textContent = showingSignup ? L.hasAccount : L.noAccount;
      });
      var forgotT = authEl.querySelector(".tc-toggle-forgot");
      var forgotP = authEl.querySelector(".tc-forgot");
      forgotT.addEventListener("click", function (e) {
        e.preventDefault();
        forgotP.style.display = forgotP.style.display === "none" ? "" : "none";
      });
      loginF.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = loginF.querySelector(".tc-msg");
        postAuth("/api/auth/login", { email: loginF.querySelector('[name="email"]').value.trim(), password: loginF.querySelector('[name="password"]').value }, m, function () { location.reload(); });
      });
      signupF.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = signupF.querySelector(".tc-msg");
        var nm = signupF.querySelector('[name="name"]').value.trim();
        var em = signupF.querySelector('[name="email"]').value.trim();
        var pw = signupF.querySelector('[name="password"]').value;
        if (!nm || !em || pw.length < 8) { m.textContent = L.fillAll; return; }
        postAuth("/api/auth/signup", { name: nm, email: em, password: pw }, m, function () { location.reload(); });
      });
    }
    function showLoggedIn(name) {
      authEl.innerHTML = "<p>" + L.signedAs.replace("{n}", esc(name)) + ' <button type="button" class="tc-logout">' + L.logout + "</button></p>";
      authEl.querySelector(".tc-logout").addEventListener("click", function () {
        fetch("/api/auth/logout", { method: "POST" }).then(function () { location.reload(); });
      });
      var cp = document.createElement("form");
      cp.className = "tc-changepw";
      cp.innerHTML = '<p><input name="current" type="password" placeholder="' + esc(L.currentPw) + '"></p><p><input name="new" type="password" placeholder="' + esc(L.newPw) + '" required></p><p><button type="submit">' + L.changePw + "</button></p><p class=\"tc-msg\"></p>";
      authEl.appendChild(cp);
      cp.addEventListener("submit", function (e) {
        e.preventDefault();
        var m = cp.querySelector(".tc-msg");
        var nw = cp.querySelector('[name="new"]').value;
        if (nw.length < 8) { m.textContent = L.fillAll; return; }
        fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ current: cp.querySelector('[name="current"]').value, new: nw }) })
          .then(function (r) { return r.json().then(function (j) { return { st: r.status, j: j }; }); })
          .then(function (res) {
            if (res.j.ok) { m.textContent = L.pwChanged; setTimeout(function () { location.reload(); }, 1500); }
            else if (res.st === 401) m.textContent = L.badCurrent;
            else m.textContent = res.j.error || "error";
          })
          .catch(function () { m.textContent = "error"; });
      });
      if (form) {
        form.style.display = "";
        var np = form.querySelector('[name="name"]');
        if (np) { np.removeAttribute("required"); np.value = ""; if (np.parentNode) np.parentNode.style.display = "none"; }
      }
    }
    fetch("/api/auth/me")
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j.logged_in) showLoggedIn(j.name); else showLoggedOut(); })
      .catch(function () { showLoggedOut(); });
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var text = form.querySelector('[name="text"]').value.trim();
        if (!text) return;
        fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: cpath, text: text }) })
          .then(function (r) { return r.json().then(function (j) { return { st: r.status, j: j }; }); })
          .then(function (j) {
            if (j.j.ok) { msgEl.textContent = j.j.status === "pending" ? L.held : L.posted; form.reset(); load(); }
            else if (j.st === 401) { msgEl.textContent = L.needLogin; showLoggedOut(); }
            else msgEl.textContent = j.j.error || "error";
          })
          .catch(function () { msgEl.textContent = "error"; });
      });
    }
  }
})();
