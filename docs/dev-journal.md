# 개발 일지 (dev-journal) - moneycheck / 트렌드체크

규칙: 이 레포의 모든 변경은 푸시할 때 이 파일에 항목을 남긴다 (사용자 상시 규칙 2026-09-29: "깃허브 변경을 할때는 다른 모델이 빨리 파악할 수 있도록 변경 사항을 항상 일지를 써서 log를 남길것"). 새 항목을 위에 추가.
참고: 2026-10-24 이전 커밋들은 일지 없이 푸시됐다 (아래 2026-10-24 항목 중 일부도 사후 기록).

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
