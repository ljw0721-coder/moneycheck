# 개발 일지 (dev-journal) - moneycheck / 트렌드체크

규칙: 이 레포의 모든 변경은 푸시할 때 이 파일에 항목을 남긴다 (사용자 상시 규칙 2026-09-29: "깃허브 변경을 할때는 다른 모델이 빨리 파악할 수 있도록 변경 사항을 항상 일지를 써서 log를 남길것"). 새 항목을 위에 추가.
참고: 2026-10-24 이전 커밋들은 일지 없이 푸시됐다 (아래 2026-10-24 항목 중 일부도 사후 기록).

## 2026-10-24 - 캔버스 디자인 → 플랫폼 적용 v2 (사용자 지시: "플랫폼에 적용해")

- 이유: 사용자가 Claude Design Canvas 3개 아트보드(홈 1280px / 기사 1280px / 모바일 390px)에서 설계한 컴포넌트를 실제 trendcheck.today에 배포하도록 지시.
- 변경 파일: style.css (전면 교체), index.html (마크업 추가)

### style.css 추가 컴포넌트
- `.tc-chip-strip` + `.tc-chip` + `.tc-chip.active` — 국가 마켓 필터 칩 (가로 스크롤, 스크롤바 숨김)
- `.tc-verdict-badge` + `.verified` / `.unverified` / `.disputed` — 3-state 판정 배지 (검증 teal / 미검증 ochre / 논란 vermilion, SVG 아이콘 포함)
- `.tc-card-rank` — 카드 우상단 순위 워터마크 (64px, opacity .06)
- `.tc-answer-block` / `.tc-answer-pill` — `:has()` 폴백 유지하면서 명시 클래스 추가
- `.tc-source-chip` — 출처 칩 (기사 하단 링크 배지)
- `.tc-breadcrumb` + `.tc-breadcrumb-sep` — 기사 페이지 경로 표시
- `.tc-article-layout` + `.tc-article-aside` + `.tc-aside-card` — 2열 기사 레이아웃 (measure + sticky aside, 900px 이하 1열)
- `.tc-footer-grid` + `.tc-footer-brand` + `.tc-footer-col` + `.tc-footer-bottom` — 3열 푸터 그리드 (640px 이하 1열)
- `.tc-bottom-nav` — 모바일 고정 하단 내비 (680px 이하만 표시, safe-area-inset-bottom 대응)
- `.card` hover: `transform:translateY(-2px)` + `box-shadow` 업그레이드
- `td.tc-verified` / `.tc-unverified` / `.tc-disputed` — 팩트체크 테이블 셀 색상
- verdict 토큰 3쌍: `--verified`, `--unverified`, `--disputed` (각 색상+배경+잉크, 다크 재정의 포함)
- `--shadow-elevated` 토큰 추가 (hover 전용 깊은 그림자)

### index.html 변경
- `.tc-logo-accent` span: "Trend" 로고 강조 색상 (amber)
- `.tc-chip-strip` 삽입: ALL/KR/US/JP/TW/MX/SA 7개 칩, 국기 이모지 포함
- 카드에 `.tc-card-rank` 추가 (순위 워터마크)
- 카드 meta p 를 `div.card-footer > p.meta` 구조로 변경 (기존 콘텐츠 유지)
- AR 카드 `dir="rtl"` 추가
- `footer` 3열 그리드 구조로 교체 (국가별·주제별 링크 목록)
- `.tc-bottom-nav` 고정 하단 내비 추가 (홈/뉴스/경제/소개 4탭)

### 불변 사항
- 광고 슬롯: `.ad-slot[data-pos="top/bottom"]` 위치·클래스 유지
- ads.js / ads.config.json / 광고 스니펫 무변경
- 기존 기사 HTML 파일(articles/, en/, ja/, zh/, es/, ar/) 무수정
- `#tc-comments`, `.btn`, `nav a` 등 기존 셀렉터 모두 유지

- 검증: node scripts/verify-ads.mjs 실행 필요 (플랫폼 푸시 전 광고 설정 확인).

## 2026-10-24

### ARTICLE-GUIDE 기사 작성 기준 추가 (6341787)
- 이유: 사용자 지시 "매일 글 올릴때는 그 트렌드 주제 리써치해서 구조화한 팩트근거 가치있는글을 쓸 것" (2026-10-24 19:19 KST).
- 변경: ARTICLE-GUIDE.md 신설 (리서치→구조→품질→발행 전 체크 절차), OPERATING-AGREEMENT.md에 참조 추가.
- 검증: 없음(문서 변경). 자동 강제 장치 아님 - 각 작성자가 절차를 실행하는 방식.

### 네이버 사이트 인증 메타 + 복원 가드 (38a35e1, 6259242)
- 이유: 네이버 서치어드바이저 소유 확인용 메타 태그 설치 (사용자가 태그 전달).
- 변경: index.html head에 naver-site-verification 메타, scripts/apply-site-verify.mjs 신설 (애드센스·네이버 메타 멱등 복원), OPERATING-AGREEMENT.md 안내 추가. 6259242에서 다른 작성자의 템플릿 재생성으로 오염된 ads.js/ads.txt 실값 복원.
- 검증: 배포 후 https://trendcheck.today/ 에서 메타 태그 직접 확인 (curl).

### 문의 메일 주소 교체 + 광고 검증 가드 (5c095de)
- 이유: 사용자 지시 "사이트에 메일 주소 안 바뀌었어. 교체해" - 공개 문의처를 hello@trendcheck.today로.
- 변경: 41개 HTML 파일의 trend@nuvystra.com → hello@trendcheck.today. scripts/verify-ads.mjs 신설 (placeholder/실값 누락 시 실패하는 수동 검사 스크립트), OPERATING-AGREEMENT.md에 푸시 전 실행 안내.
- 검증: 전 사이트맵 URL + 4개 호스트명 curl 확인, 소개·문의 페이지 스크린샷 확인.

### canonical 링크 전 페이지 추가 (98aef5e)
- 이유: 같은 콘텐츠가 3개 호스트명(money./trend.nuvystra.com, trendcheck.today)으로 서비스돼 SEO 통합 필요.
- 변경: 156개 HTML에 trendcheck.today 기준 <link rel="canonical"> 추가.
- 검증: 배포 후 /, /topic-news.html, /articles/a001.html curl 확인.

### (기록 누락분) 이날 다른 변경들
- 다른 작성자 커밋(be49995, 30796e6, 3387abb 등)은 해당 작성자 환경에서 푸시됐으며 이 일지에 기록되지 않았다. 상대 환경의 일지 작성 여부는 확인할 수 없다.

## 2026-10-24 - Adsterra 광고 네트워크 연동 (사용자 지시: 뭐든 다 붙여줘)
- 이유: 사용자가 트렌드체크에 여러 광고업체 연동 요청. Adsterra 퍼블리셔 가입(이메일 인증 완료), 사이트 심사 Approved, 광고단위 3개 Active.
- 변경: ads.js 에 NET.adsterra728 / NET.adsterraNative 추가. mid 슬롯 = AdFit 우선, 없으면 Adsterra 728x90. bottom 슬롯 = Dable/Coupang 우선, 없으면 Adsterra Native. top 슬롯은 애드센스 유지(기존 위치분리 원칙). atOptions 전역 충돌로 클래식 배너는 페이지당 1개만.
- 검증: node --check 통과. 로컬 서빙 + headless chrome: a101.html DOM에 atOptions/728 스크립트/native container 주입 확인, 레이아웃 스크린샷 정상. 라이브 광고 렌더는 배포 후 확인 예정.
- 참고: Adsterra ads.txt 항목은 계정별 공식 포맷 미확인으로 미추가(지어내지 않음). Popunder/Social Bar 등 본문 가림 포맷과 성인 광고는 정책상 제외.

## 2026-10-24 - Adsterra 슬롯 일시 중지 (도박 광고 노출)
- 이유: 라이브 검증 중 mid 728x90 슬롯에 MELBET 도박 광고(100유로 첫입금 보너스, 크립토 결제) 노출 확인. 한국 사용자 대상 도박 광고는 법적·정책적 위험, 애드센스 심사 진행 중이라 브랜드 안전 우선.
- 변경: ads.js 의 NET.adsterra728/adsterraNative 를 빈 값으로 (코드는 유지, ID만 중지). 카테고리 차단 방법(Adsterra 지원팀 문의 등) 확보 후 재활성 예정. 계정·광고단위는 Active 상태로 남아 있음.
- 검증: node --check 통과. 배포 후 라이브 DOM 에 bauval 스크립트 부재 확인 예정.

## 2026-10-24 - a101 미검증 순위 주장 제거 (콘텐츠 신뢰성 수정)
- 이유: a101이 "네이버 급상승 1위(블랙키위 집계)"라는 검증 불가 순위 주장을 제목·메타·본문에 포함. 네이버 공식 실시간 급상승검색어는 2021년 종료, 블랙키위 공개 순위표 없음 → 공개 검증 불가 주장. 메인 에이전트 긴급 지시.
- 검증 결과: 사건 자체는 실재 - 뉴스1·스포츠조선·조선일보·JTBC·뉴스엔·한국경제·동아일보·매일경제 10월 23~24일 보도로 교차 확인 (결혼 10/18, 모텔 동행 인정+애정행위 부인, 금품 요구 의혹·고소, 인스타 언팔). 기사의 의혹/확정 구분 문장은 적절했음.
- 변경: 제목·H1·description·근거줄·첫 문단에서 "네이버 급상승 1위" 주장 삭제. 근거 출처를 실제 확인된 매체(뉴스1·스포츠조선·조선일보·한국경제)로 교체. index.html/topic-ent.html 티저 문구 동기화. 인용 매체 중 코리아타임스·코리아헤럴드는 개별 확인 실패로 제외.
- 검증: grep 잔여 0 확인. 로컬 서빙 + headless chrome 스크린샷 정상.

## 2026-10-24 - 사이트 디자인 리뉴얼: style.css 교체 (사용자 지시: 글로벌·스타일리시·트렌디 디자인 설계 및 적용)
- 이유: 사용자가 trendcheck.today 를 글로벌하고 트렌디한 디자인으로 바꾸라고 지시. 디자인 시스템(Claude 디자인 시스템 아티팩트 "TrendCheck")을 먼저 설계하고 그 토큰을 실제 스타일시트에 반영.
- 변경: style.css 한 파일만 교체. 기존 HTML 마크업(header/nav/main/.card/.grid/.meta/.btn/#tc-comments/footer)을 그대로 쓰는 셀렉터라 기존 글·템플릿 수정 없음. 남색 #14213d·호박색 #fca311 유지, 라이트/다크(prefers-color-scheme), 한·일·중·아랍어 서체(:lang), RTL 논리 속성, "궁금한 답부터" 문단을 답 블록으로 표시(:has), 카드 전체 클릭. 광고 슬롯(.ad-slot) 규칙은 그대로 유지. ads.js·ads.config.json·광고 스니펫 무변경.
- 검증: node scripts/verify-ads.mjs OK. 로컬 서빙 + headless chrome 으로 홈(라이트/다크), a101(모바일 390px 다크), ar001(RTL) 확인, 가로 스크롤 없음. Google Fonts 는 샌드박스에서 차단돼 폴백 서체로 확인 — 실제 서체는 배포 후 확인 필요.
- 참고: 첫 문단 답 블록 위에 top 광고 슬롯이 있는 기존 구조는 그대로 둠(광고 위치 변경은 수익 영향이 있어 사용자 결정 사항).

## 2026-10-25 - a101 미검증 순위 주장 재제거 (0b95532 템플릿 재생성으로 되살아남)
- 이유: f1edde8 에서 제거한 "네이버 급상승 1위" 주장이 다른 라인의 0b95532(머니 아카이브 삭제 + 멤버 인프라) 커밋의 오래된 템플릿 재생성으로 a101.html·index.html·topic-ent.html 에 복원됐고, 그대로 라이브 배포됨. 메인 지시(검증 불가 순위 주장 금지) 위반 상태.
- 변경: f1edde8 의 정제 내용을 현재 리디자인 베이스(042ba86)에 재적용. 제목·H1·description·근거줄·첫 문단에서 순위 주장 제거, 근거를 실제 확인 매체(뉴스1·스포츠조선·조선일보·한국경제)로 교체. topic-ent.html 티저 동기화(원래 정제에서 누락됐던 파일). 맺음 문단의 미검증 인용 매체(코리아타임스·코리아헤럴드)도 확인 매체로 교체.
- 검증: 전체 트리 grep "네이버 급상승|블랙키위" 잔여 0, a101 내 코리아타임스·코리아헤럴드 0. 로컬 서빙 + headless chrome 스크린샷(home/a101/topic-ent) 정상.
## 2026-10-24 - 문의 주소 분리 support@/hello@ (브랜치, 머지 보류)
- 이유: 사용자 지시 - 고객 문의는 support@trendcheck.today, 파트너십·비즈니스는 hello@trendcheck.today 로 분리.
- 변경: about.html 에 두 주소 역할 병기. 나머지 40개 언어별 페이지 푸터 문의 주소를 support@ 로 교체. i18n.js 키에 이메일/문의 문자열 없음 확인(번역 동기화 불필요). 수신 라우팅(CF Email Routing) support@ 생성은 브라우저 대시보드 경로로 별도 처리(API 토큰에 Email Routing 권한 없음).
- 주의: 다른 작성자 환경의 페이지 템플릿이 hello@ 를 박아 재생성할 수 있음 - 상대 템플릿은 이 저장소에 없어 수정 불가. 재생성 시 support@ 덮어쓰기 감시 필요.
- 머지: 보류 (PR 경로 대기).
