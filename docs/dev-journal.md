# 개발 일지 (dev-journal) - moneycheck / 트렌드체크

규칙: 이 레포의 모든 변경은 푸시할 때 이 파일에 항목을 남긴다 (사용자 상시 규칙 2026-09-29: "깃허브 변경을 할때는 다른 모델이 빨리 파악할 수 있도록 변경 사항을 항상 일지를 써서 log를 남길것"). 새 항목을 위에 추가.
참고: 2026-10-24 이전 커밋들은 일지 없이 푸시됐다 (아래 2026-10-24 항목 중 일부도 사후 기록).

## 2026-10-25 - 칩 스트립 죽은 링크 제거 (캔버스 적용 v2 후속)

- 이유: v2에서 넣은 "한국" 칩이 /ko/ 로 연결되지만 레포에 ko/ 디렉터리가 없어 404. 한국 글은 루트(/articles/)에 있고 ALL 칩이 곧 한국 포함 홈이므로 해당 칩만 삭제.
- 변경: index.html 한국 칩 1줄 삭제. 다른 칩·광고·기사 파일 무변경.
- 검증: node scripts/verify-ads.mjs 실행.

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
## 2026-10-24 - 빈 광고 슬롯 접힘 + a101 출처 URL (브랜치, 머지 보류)
- 이유: 애드센스 심사 중 ins.adsbygoogle 이 data-adsbygoogle-status="done" + height:280px 로 남아 (data-ad-status="unfilled" 아님) 기존 CSS 규칙이 매치되지 않아 슬롯당 280px 공백 발생. 메인 에이전트 지적. a101 에 출처 URL 명시 요구.
- 변경: ads.js 에 collapseUnfilledSlots 추가 (load 후 3.5s/8s 2회 점검, iframe 없고 status done/unfilled 인 슬롯 display:none). a101 에 검증된 4개 매체 기사 URL 출처 섹션 추가.
- 검증: node --check 통과. 로컬 서빙 + headless chrome(virtual-time-budget) 스크린샷으로 공백 소거 확인.
- 머지: PR 생성 권한 부재(토큰 스코프)로 머지 보류. 브랜치 fix/adslot-collapse-sources 푸시, 사용자 PR 또는 머지 승인 대기. 기존 로컬 ff-merge 관행은 이번부터 사용 안 함(메인 지시).

## 2026-10-24 - 슬롯 접힘 로직 보강 + 테스트 하네스 보존 (브랜치, 머지 보류 유지)
- 이유: 미충전 슬롯에도 빈 aswift iframe 이 존재(라이브 DOM 확인)해 iframe 유무 판별은 오류. 메인 지시로 시나리오 테스트와 원시 결과를 저장소에 보존(사용자 원시로그 규칙).
- 변경: evaluateAdSlot 이 data-ad-status(unfilled/filled) 우선, done+상태없음 은 프레임 존재로 폴백, MutationObserver 로 지연 충전 시 재표시. tests/adslot-collapse.html(하네스)+results.md+lastrun-dom.html 추가.
- 검증: 4 시나리오 PASS (지연 충전 표시/진짜 미충전 숨김/9초 후 재표시/빈 슬롯 숨김). a101 확인처 문장 미검증 매체명 제거 확인.
- 머지: 보류 유지. PR 경로 또는 사용자 명시 승인 대기.

## 2026-10-24 20:59 KST - contact-split 베이스 갱신
- origin/main 0b95532(머니 아카이브 100건 삭제·의도된 정리, 20:30 배포 확인) 위로 fix/contact-split 리베이스. 충돌은 about.html 1건: 상대방의 아카이브 링크 제거 유지 + 사용자 지시 문의 분리(support@/hello@) 병합. 삭제된 경로(a001-a100, money-archive) 미복원 확인, member-comments(tc.js/admin.html) 무접촉. 머지/배포는 PR 경로 확정 전까지 보류.

## 2026-10-24 20:59 KST - adslot-collapse-sources 베이스 갱신
- origin/main 0b95532 위로 리베이스(충돌 없음). 삭제된 머니 아카이브 경로 미복원, member-comments 인프라 무접촉 확인. ads.js 슬롯 collapse 변경 + a101 출처 URL + tests/ 하네스 유지. 머지/배포 보류.

## 2026-10-25 - a101 맺음 문단 중복 제거 (리베이스 자동병합 부산물)
- 이유: PR #6(순위 주장 재제거)와 PR #5(출처 링크 추가)가 a101 맺음 문단을 각각 고쳤고, ff 병합에서 두 버전이 모두 남아 동일 문단이 연속 중복됨.
- 변경: 중복 1문단 삭제. 아래 출처 목록을 가리키는 버전(PR #5)을 유지.
- 검증: 문단 수 grep 확인, 로컬 서빙 + headless chrome 스크린샷 정상.

## 2026-10-25 - 라이브 상태 정합성 기록 (리디자인 미배포 유지 + 승인된 수정만 선별 반영)
- 상태: main 은 리디자인(89d1278, 042ba86)을 포함하지만 라이브는 아직 리디자인 이전 디자인. 리디자인 배포 의도가 사용자 채널에서 확인되지 않아 main 통째 배포는 보류 중.
- 조치: 승인·검증된 콘텐츠 수정만 현재 라이브 소스에 선별 적용해 배포. (1) a101 미검증 순위 주장 제거(PR #6 동일 내용), (2) 문의 주소 분리 support@/hello@(PR #4 동일 내용, 41개 페이지), (3) 미충전 광고 슬롯 접힘 + a101 출처 링크(PR #5 동일 내용). 라이브의 나머지 파일·라우터·멤버 기능은 바이트 동일 유지.
- 라이브 반영 시 발견·해결된 라이브 잔여 문제: 언어별 페이지 푸터가 구 nuvystra 주소를 노출 중이었음(전 페이지 제거 확인), 라이브 ads.js 의 AdSense 플레이스홀더 검사 버그(실제 pub ID 와 비교해 항상 false → AdSense 미로딩)를 main 의 startsWith 판별로 교체.
- 검증: 배포 전 델타 정확히 43파일(라이브 대비) 확인, 배포 후 라이브 curl 바이트 비교(style.css·tc.js·i18n.js·index.html·topic-ent.html 동일), about/a101 스크린샷, 슬롯 DOM display:none 접힘 확인, 댓글 API·조회수 정상.
- 복구 참조: 배포 전 라이브 워커 스냅샷을 운영 백업 위치에 보관(2026-10-25, contact/adslot 반영 전 상태).

## 2026-10-25 (2) 일일 발행: 6개 언어 기사 2일차
- 브랜치 daily/2026-10-25. 신규 기사: a103(김정은 중국방문, 한국) — 원래 a102로 작성했으나 다른 작성자 라인이 08:51 main에 a102(저스틴 비버 내한, 블랙키위/네이버 기반 트렌드 근거)를 선반영해 충돌. 상대 콘텐츠 보존 원칙에 따라 내 기사를 a103으로 리번호해 공존. 상대 a102의 트렌드 근거(블랙키위·네이버 급상승)는 09:10 승인 매핑(한국=시그널)과 불일치 → 별도 보고, 내 범위 밖 수정 안 함., en002(월드시리즈 국가, 미국), ja002(日向灘 M5.3 지진, 일본), zh002(Flagg 어깨 부상·독신자 vs 스퍼스, 대만), es002(Cruz Azul Femenil vs Toluca, 멕시코), ar002(내슈빌 서포터스 실드·메시, 사우디).
- 소스: 한국=시그널 실시간 검색어 1위(명시적 제3자 소스), 나머지 5개=Google 일일 트렌드 RSS 해당 국가 1위(사용자 승인 매핑 EN=US, JA=JP, ZH=TW, ES=MX, AR=SA).
- 홈(한국어 index) 오늘의 트렌드/최신 글 그리드 오늘 카드 6장으로 교체, topic-news에 a103 추가(뉴스·사회). 최신 글 그리드에는 상대 a102 카드도 함께 유지(7장), 각 언어 index 최신 글 + 해당 카테고리 페이지에 x002 카드 추가 및 카운트 갱신(en cat-c 1→2, ja cat-a 0→1, zh/es/ar cat-c 0→1).
- 검증: node --check ads.js OK, scripts/verify-ads.mjs OK. 내 변경 범위 내 금지 패턴 0건. (단, main 선행 커밋 2ddce89의 a102에 블랙키위/네이버 근거 2건, tc.js 로그인 문구 nuvystra 7건 존재 — 둘 다 다른 작성자 기존 콘텐츠). tc.js 로그인 모달 문구의 trend@nuvystra.com 7건은 다른 작성자의 기존 기능 코드로 이번 변경 범위 밖(별도 보고).
- 라이브 배포는 리디자인 보류 방침에 따라 선택적(additive) 경로: 신규 기사 6건 + 언어 index/cat 페이지 + 구 마크업 ko 페이지 수동 카드 추가만.

## 2026-10-25 (3) 라이브 상태 정합성 기록 — 일일 2일차 + 다른 라인 재배포 회귀 복구
- 09:20 경 다른 작성자 라인이 main에 2ddce89(a102 저스틴 비버 내한)를 푸시하고 라이브도 재배포한 사실 확인. 그 재배포는 오래된 템플릿 기반으로, 오늘 아침 승인·배포된 상태(연락처 분리 support@/hello@, ads.js 슬롯 접힘, a101 네이버 표현 삭제, canonical/ads 스크립트)를 라이브에서 46개 파일 분량 되돌림(footer trend@nuvystra.com 부활 등).
- 라이브 복구 방식: 현재 라이브 워커를 그대로 가져와 BLOB만 최소 델타로 교체(기존 승인 경로). 신규 기사 6건 추가(a103, en002, ja002, zh002, es002, ar002) + 승인 상태였던 44개 파일을 main 기준으로 복원 + ko index(구 마크업 유지) 오늘의 트렌드/최신 글 그리드 갱신 + topic-news에 a103 카드 + sitemap a103 추가. 상대 콘텐츠 보존: a102 기사 본문·topic-ent 카드·최신 글 내 a102 카드 그대로. style.css/리디자인은 계속 보류(라이브 미반영).
- 사전 델타 검증: 추가 6·변경 47·삭제 0, style.css/topic-ent/a102 무 변경 확인 후 업로드. 배포 후 공개 URL 7개 기사 200·제목 확인, 홈 카드·nuvystra 0건·구 마크업 유지 확인.
- 잔여 이슈: (1) 상대 a102의 트렌드 근거가 블랙키위/네이버 급상승 기반 — 09:10 승인 매핑(한국=시그널)과 불일치, 내 권한 밖이라 보존·보고. (2) PR #9는 head==main 도달 후 GitHub가 merged 아닌 closed로 표시(PAT로 reopen 불가). (3) tc.js 로그인 모달 문구의 trend@nuvystra.com 7건은 별도 기능 코드로 이번 범위 밖.

## 2026-10-25 (4) 라이브 광고 공백·a102 출처·tc.js 문의처 수정
- 광고 접힘: 애드센스 응답 전/노필 확정 전 구간에 슬롯이 보여 280px 공백이 수초간 노출되던 문제(라이브 스크린샷 지적)를 수정. 이제 로드 즉시 모든 슬롯을 접힌 상태로 시작하고, data-ad-status='filled' 또는 실제 iframe 렌더 시 MutationObserver가 즉시 다시 표시. 응답 전 대기 구간에서도 display none 유지. 충전 동작은 유지.
- a102(다른 작성자, 저스틴 비버 내한): 기사 본문의 블랙키위/네이버 급상승 근거 문장 2곳 제거·재작성(검증 불가 랭킹 주장). 스토리 자체는 뉴시스(10-22)·한국경제·코리아헤럴드·코스모폴리탄(10-23) 확인으로 유지. 시그널 소급 주장 없음.
- rebase 실수 정정: 직전 리베이스에서 articles/a102.html을 내 기사로 잘못 덮어 main에서 상대 비버 기사가 소실됐던 것을 2ddce89 버전으로 복원 후 위 수정 적용. (라이브 a102는 상대 원본이 그대로라 영향 없었음.)
- tc.js: 비밀번호 찾기 안내 문구의 trend@nuvystra.com 7건(6개 언어+기본)을 support@trendcheck.today로 교체. 문의처 표기만 변경, 인증 로직·식별자 무 변경.

## 2026-10-25 (5) 발행 기록 — 2일차 6개 언어 기사 최종 URL·트렌드 캡처
- KO a103 https://trendcheck.today/articles/a103.html — 시그널(signal.bz) 실시간 검색어 2026-10-25 09:00 KST 캡처 1위 '김정은 중국방문'. 출처: 연합뉴스 AKR20261024035153504·AKR20261024050552083, 동아일보 134901396, BBC코리아 cq0ld9y8yp2jo, AP 2459fe49.
- EN en002 https://trendcheck.today/en/articles/en002.html — Google Trends 일일 RSS US pubDate 2026-10-24 17:00 -0700 1위 "who is singing the national anthem tonight". 출처: MLB 공식 보도자료, AP(Game1 3-2).
- JA ja002 https://trendcheck.today/ja/articles/ja002.html — Google Trends JP 동일 pubDate 1위 宮崎 地震(2위 鹿児島 地震). 출처: 기상청 공식 list.json+상세 20261025085944(日向灘 M5.3, 25일 08:59, 최대 진도3, 쓰나미 우려 없음), 에히메신문 09:01 속보.
- ZH zh002 https://trendcheck.today/zh/articles/zh002.html — Google Trends TW 1위 獨行俠 對 馬刺. 출처: NBA.com, AP, Yahoo TW.
- ES es002 https://trendcheck.today/es/articles/es002.html — Google Trends MX 1위 "liga mx femenil". 출처: 24morelos, morelos.gob.mx(10-24 19:00 Estadio Centenario Cuernavaca).
- AR ar002 https://trendcheck.today/ar/articles/ar002.html — Google Trends SA 1위 "ليونيل ميسي". 출처: MLSSoccer.com 공식, AP, eremnews(70점/31경기, 마이애미 74점 기록, 메시 교체 출전).
- 공존 기사: a102(다른 작성자, 저스틴 비버 내한) https://trendcheck.today/articles/a102.html — 근거 미검증 랭킹 주장 제거·보도 기반 화제 근거로 교정(2026-10-25 (4) 항목). 스토리는 뉴시스·한국경제·코리아헤럴드·코스모폴리탄으로 교차 확인.
- PR 상태: #10·#11 merged=true(API 확인). #9는 리뷰된 트리가 main에 통합됐으나 GitHub 상 closed-unmerged로 남음(head==main ff 도달, 재열 권한 없음) — merged로 주장하지 않음.

## 2026-10-25 (6) 검색엔진 노출 진단 + 기술 수정
- 진단: robots.txt 정상(Allow /)이나 Sitemap 지시어가 상대경로 → 절대 URL로 수정. sitemap.xml 유효(52→57 URL), 오늘자 en002/ja002/zh002/es002/ar002 누락 추가. ko 페이지·a101·a102에 canonical 부재 → 추가(www/에이펙스 중복 신호 정리). noindex·X-Robots-Tag 없음, 전 페이지 200.
- Google: 도메인 속성 DNS 인증 유지, site: 쿼리에 topic-news.html 1건만 색인(10-24, 스니펫은 구버전). 차단 설정이 아니라 신규 도메인의 크롤/색인 대기 상태. sitemap 갱신으로 신규 기사 발견 경로 확보.
- Naver: 현재 라이브·main 어디에도 소유확인 meta/file이 없음(10-24 18:47 사용자 확인 당시 태그가 있었다면 이후 스테일 템플릿 재배포로 소실 가능). 콘솔 재로그인은 antibot으로 불가 — 소유확인 meta 값 또는 Search Advisor 상태 스크린샷이 최소 필요 입력.
- 배포: 선택적 BLOB 교체(12파일: robots/sitemap/canonical 대상만), 라우터 보존, post-verify 통과. PR #14는 트리 통합됐으나 GitHub closed-unmerged(#9와 동일 quirk, merged 주장 안 함).

## 2026-10-25 (7) Naver 소유확인 태그 복원
- 태그(사용자 제공 10-24 18:39, 18:45 소유확인 완료)가 현재 main/live index.html 어디에도 없음을 확인. 원인: apply-site-verify.mjs는 존재하나 재생성 후 수동 실행에 의존(문서 수준 강제) — 다른 라인이 10-25 08:51 태그 없는 템플릿으로 index.html 재생성하면서 소실. AdSense 메타는 그들 템플릿에 포함돼 생존, Naver 태그는 미포함으로 탈락.
- 조치: main index.html에 태그 복원(apply-site-verify.mjs 실행), 라이브 구 마크업 index.html에도 동일 태그 수동 삽입. 내 drift-guard 웨이크 트리거에 naver 태그 부재 감시 추가(2시간 주기 자동 탐지). 근본 내구성은 공유 템플릿 소스에 태그를 포함하는 것 — 다른 라인 환경의 템플릿은 내 통제 밖이라, 감지+복원 경로가 현재 최선.

## 2026-10-25 (9) 덮어쓰기 금지 deploy guard 구현 (사용자 10:10:09 "덮어쓰기하지마")
- scripts/deploy_guard.py: 배포 후보 트리를 CURRENT 라이브 워커 BLOB + CURRENT origin/main과 해시 비교. 기사 파일(articles/**, <locale>/articles/**)의 수정·삭제 시 FAIL-CLOSED, 비기사 파일은 오퍼레이션 allowlist 외 변경 시 차단, main/live 간 기사 내용 충돌 감지 시 조정 전 중단.
- 테스트 증거: (음) 09:50 스테이지 스냅샷을 후보로 검사 → ARTICLE MODIFIED x002 5종 + a103 등 정확히 차단(09:58 스냅샷 리플레이를 막았을 게이트). (양) 현재 라이브 + 신규 기사 1건 추가 후보 → PASS (additive deploy safe).
- 적용: 빈 카테고리 보강·저녁 에디션 등 모든 배포 전 필수 게이트. 다른 라인 환경의 강제는 불가 — 우리 쪽 덮어쓰기 방지 게이트이며, 그쪽 drift는 감지·보고만.
- 저녁 에디션 확정(사용자 10:09:51 "아침저녁으로 너 저녁이랑 그쪽 아침이랑 각각"): 그쪽=아침, 이 라인=저녁 각각 신규 6개. 네임스페이스 분리(로케일 max+1), 아침 콘텐츠 보존.
