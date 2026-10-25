#!/usr/bin/env python3
"""TrendCheck traffic feeds: news sitemap + RSS, regenerated from article files.

Source of truth is the article files themselves (same approach as the repo's
apply-reader-discovery.mjs), NOT the CSVs, so collaborator backfills are included.

Outputs (into the repo root):
  news-sitemap.xml  - Google News sitemap: articles from the last 48h only
  feed.xml          - combined RSS 2.0, latest 30 across all locales
  feed-{ko,en,ja,zh,es,ar}.xml - per-locale RSS 2.0, latest 20 each

Publication times are approximate (article files carry dates, not times):
noon KST on the article date. Run after every publish, before push/deploy.
"""
import os
import re
from datetime import date, datetime, timedelta, timezone
from email.utils import format_datetime
from xml.sax.saxutils import escape

import sys
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..")
BASE = "https://trendcheck.today"
KST = timezone(timedelta(hours=9))

LOCALES = [
    ("", "ko", "한국"),
    ("en", "en", "미국"),
    ("ja", "ja", "일본"),
    ("zh", "zh", "대만"),
    ("es", "es", "멕시코"),
    ("ar", "ar", "사우디아라비아"),
]

TITLE_RE = re.compile(r"<title>([^<]*)</title>")
DATE_RE = re.compile(r"20\d\d-\d\d-\d\d")
PARA_RE = re.compile(r"<p([^>]*)>(.*?)</p>", re.S)
TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(s):
    return TAG_RE.sub("", s).strip()


def scan_locale(d):
    adir = os.path.join(SITE, d, "articles") if d else os.path.join(SITE, "articles")
    items = []
    if not os.path.isdir(adir):
        return items
    for f in sorted(os.listdir(adir)):
        if not f.endswith(".html"):
            continue
        src = open(os.path.join(adir, f), encoding="utf-8", errors="replace").read()
        title = (TITLE_RE.search(src) or [None, f])[1].strip()
        dm = DATE_RE.search(src)
        if not dm:
            continue
        dstr = dm.group(0)
        desc = ""
        for attrs, body in PARA_RE.findall(src):
            if "tc-views" in attrs or 'class="meta"' in attrs:
                continue
            text = strip_tags(body)
            if len(text) >= 40:
                desc = text[:500]
                break
        path = f"/{d + '/' if d else ''}articles/{f}"
        items.append({"title": title, "date": dstr, "desc": desc or title,
                      "url": BASE + path})
    items.sort(key=lambda it: (it["date"], it["url"]), reverse=True)
    return items


def home_title(d):
    p = os.path.join(SITE, d, "index.html") if d else os.path.join(SITE, "index.html")
    try:
        src = open(p, encoding="utf-8", errors="replace").read()
        t = TITLE_RE.search(src)
        if t:
            return t.group(1).strip()
    except FileNotFoundError:
        pass
    return "TrendCheck"


def rss(channel_title, channel_link, channel_lang, items):
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<rss version="2.0">', "<channel>",
           f"<title>{escape(channel_title)}</title>",
           f"<link>{escape(channel_link)}</link>",
           "<description>오늘의 트렌드, 답부터 확인</description>"]
    if channel_lang:
        out.append(f"<language>{channel_lang}</language>")
    for it in items:
        dt = datetime.strptime(it["date"], "%Y-%m-%d").replace(
            hour=12, tzinfo=KST)
        out.append("<item>")
        out.append(f"<title>{escape(it['title'])}</title>")
        out.append(f"<link>{escape(it['url'])}</link>")
        out.append(f"<guid isPermaLink=\"true\">{escape(it['url'])}</guid>")
        out.append(f"<pubDate>{format_datetime(dt)}</pubDate>")
        out.append(f"<description>{escape(it['desc'])}</description>")
        out.append("</item>")
    out.append("</channel></rss>")
    return "\n".join(out) + "\n"


def main():
    per_locale = {}
    all_items = []
    for d, lang, label in LOCALES:
        items = scan_locale(d)
        per_locale[(d, lang, label)] = items
        all_items.extend(items)
    all_items.sort(key=lambda it: (it["date"], it["url"]), reverse=True)

    # --- Google News sitemap (last 48h) ---
    today = datetime.now(KST).date()
    cutoff = today - timedelta(days=2)
    news_items = []
    for d, lang, label in LOCALES:
        for it in per_locale[(d, lang, label)]:
            if date.fromisoformat(it["date"]) >= cutoff:
                news_items.append((lang, it))
    news_items.sort(key=lambda x: (x[1]["date"], x[1]["url"]), reverse=True)
    ns = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
          'xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">']
    for lang, it in news_items:
        pub = f"{it['date']}T12:00:00+09:00"
        ns.append("<url>")
        ns.append(f"<loc>{escape(it['url'])}</loc>")
        ns.append("<news:news><news:publication>"
                  f"<news:name>TrendCheck</news:name>"
                  f"<news:language>{lang}</news:language>"
                  "</news:publication>"
                  f"<news:publication_date>{pub}</news:publication_date>"
                  f"<news:title>{escape(it['title'])}</news:title></news:news>")
        ns.append("</url>")
    ns.append("</urlset>")
    open(os.path.join(SITE, "news-sitemap.xml"), "w", encoding="utf-8").write(
        "\n".join(ns) + "\n")
    print(f"news-sitemap.xml: {len(news_items)} urls (cutoff {cutoff})")

    # --- RSS: combined + per locale ---
    open(os.path.join(SITE, "feed.xml"), "w", encoding="utf-8").write(
        rss("TrendCheck — 오늘의 트렌드, 답부터 확인", BASE, None,
            all_items[:30]))
    print(f"feed.xml: {len(all_items[:30])} items")
    for d, lang, label in LOCALES:
        items = per_locale[(d, lang, label)][:20]
        fname = f"feed-{lang}.xml"
        open(os.path.join(SITE, fname), "w", encoding="utf-8").write(
            rss(home_title(d), BASE + (f"/{d}/" if d else "/"), lang, items))
        print(f"{fname}: {len(items)} items ({label})")


if __name__ == "__main__":
    main()
