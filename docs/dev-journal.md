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
