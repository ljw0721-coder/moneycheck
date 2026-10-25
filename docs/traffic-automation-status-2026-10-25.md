# 트래픽 자동화 상황 공유 (아침 → 저녁, 2026-10-25)

작성: 아침 라인(Muse). 저녁 작업 전 main 동기화 시 이 파일을 확인한다.

## 이미 라이브 + main에 있는 것 (commit 24d036d, 중복 작업 금지)

- `news-sitemap.xml`: 최근 48시간 글 전용 Google News 사이트맵 (31개 URL)
- `feed.xml` (통합, 최신 30개) + `feed-ko/en/ja/zh/es/ar.xml` (언어별, 최신 20개)
- `og-default.png` (1200x630, 브로드시트 스타일 기본 OG 이미지)
- `robots.txt`: 뉴스 사이트맵 Sitemap 라인 추가
- 발행 cron 2개(한국 08:48, 다언어 09:48) 업데이트:
  - 재생성 후 `scripts/apply-ads.mjs` → `scripts/apply-site-verify.mjs` →
    `scripts/apply-reader-discovery.mjs` 실행 (백필·집계·hreflang·네이버 인증
    태그가 아침 재생성으로 날아가지 않게 함)
  - 그 다음 `traffic_feeds.py`로 피드 재생성 → 푸시·배포에 포함
  - 신규 글 head부터 NewsArticle JSON-LD + `max-image-preview:large` +
    OG 태그(기본 이미지 `og-default.png`) 자동 포함
- 네이버 인증 메타 태그는 이미 라이브에 있음 (서치어드바이저 등록 확인·
  사이트맵 제출은 사용자 측 진행 중)

## 저녁에 요청하는 것

1. 기존 글 31개 전체(한국 6개 + 언어 25개) head에 메타만 추가 (제목·본문 변경 금지):
   NewsArticle JSON-LD + `max-image-preview:large` + OG 태그
   (og:image는 `https://trendcheck.today/og-default.png` 사용).
2. 저녁 신규 글 템플릿에도 위 head를 기본 포함.
3. 글 하단 공유 버튼(X/Threads/Facebook/링크복사) 템플릿 추가.
4. 글별 이미지(1200px 이상 16:9, Unsplash/Pexels/Wikimedia 등 라이선스
   안전 소스 + 출처 표기)는 og-default를 폴백으로 두고 단계 적용. 무단 전재 금지.
5. 저녁 배포 시 `news-sitemap.xml`·`feed*.xml`이 빠지지 않게 한다.
   배포 전 `scripts/traffic_feeds.py` 실행이 가장 확실하고, 최소한 main의
   최신 피드 파일을 배포 트리에 포함한다.

## 제약 (배포 가드 규칙, scripts/deploy_guard.py)

- 기존 글 파일 수정·삭제 금지. 1번 같은 메타 추가도 제목 변경 금지이며,
  작업용 allowlist에 `MOD:<경로>`를 기재한다.
- 다른 작성자(아침) 글 파일은 건드리지 않는다. 신규 글은 로케일별 max+1 번호 규칙.
- 배포 전 main 동기화, 배포 후 라이브 검증(해당 글·홈 200 + 내용 확인) 후 main push.

## 피드 재생성 스크립트

`scripts/traffic_feeds.py` (글 파일을 소스로 삼아 뉴스 사이트맵 + RSS 재생성).
사용법: `python3 scripts/traffic_feeds.py [레포 루트]` (인자 없으면 스크립트
위치 기준 레포 루트). 발행 시각은 글 파일에 날짜만 있으므로 정오(KST)로 근사한다.
