/* TrendCheck client: view counting + comments. No cookies, no personal data.
   View counts: POST /api/view (IP is hashed per-day on the server, never stored raw).
   Visitors: counted once per day per browser (server-side hash). */
(function () {
  var lang = (document.documentElement.lang || "ko").slice(0, 2);
  var L = {
    ko: { views: "조회수", comments: "댓글", name: "이름", write: "댓글 쓰기", send: "등록", pending: "댓글이 등록되었습니다. 관리자 승인 후 표시됩니다.", empty: "아직 댓글이 없습니다.", loadFail: "댓글을 불러오지 못했습니다." },
    en: { views: "Views", comments: "Comments", name: "Name", write: "Write a comment", send: "Post", pending: "Your comment was received and will appear after approval.", empty: "No comments yet.", loadFail: "Could not load comments." },
    ja: { views: "閲覧数", comments: "コメント", name: "名前", write: "コメントを書く", send: "投稿", pending: "コメントを受け付けました。承認後に表示されます。", empty: "まだコメントがありません。", loadFail: "コメントを読み込めませんでした。" },
    zh: { views: "浏览量", comments: "评论", name: "姓名", write: "写评论", send: "发布", pending: "评论已收到，审核通过后显示。", empty: "暂无评论。", loadFail: "无法加载评论。" },
    es: { views: "Vistas", comments: "Comentarios", name: "Nombre", write: "Escribe un comentario", send: "Publicar", pending: "Tu comentario fue recibido y aparecerá tras su aprobación.", empty: "Aún no hay comentarios.", loadFail: "No se pudieron cargar los comentarios." },
    ar: { views: "المشاهدات", comments: "التعليقات", name: "الاسم", write: "اكتب تعليقًا", send: "نشر", pending: "تم استلام تعليقك وسيظهر بعد الموافقة.", empty: "لا توجد تعليقات بعد.", loadFail: "تعذر تحميل التعليقات." }
  }[lang] || { views: "Views", comments: "Comments", name: "Name", write: "Write a comment", send: "Post", pending: "Received; will appear after approval.", empty: "No comments yet.", loadFail: "Could not load comments." };

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
  /* comments widget */
  var box = document.getElementById("tc-comments");
  if (box) {
    var cpath = box.getAttribute("data-path") || path;
    var listEl = box.querySelector(".tc-list");
    var msgEl = box.querySelector(".tc-msg");
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
    var form = box.querySelector("form");
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = form.querySelector('[name="name"]').value.trim();
        var text = form.querySelector('[name="text"]').value.trim();
        if (!name || !text) return;
        fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: cpath, name: name, text: text }) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j.ok) { msgEl.textContent = L.pending; form.reset(); }
            else msgEl.textContent = j.error || "error";
          })
          .catch(function () { msgEl.textContent = "error"; });
      });
    }
  }
})();
