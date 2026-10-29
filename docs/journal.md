## 2026-10-29 22:00 KST — ko 주제별 그리드 중첩 버그 수정

- 증상: 주제별 보기 그리드에서 크립토·거래소/뮤직 카드가 뉴스·사회 카드 내부에 중첩(뉴스 카드 닫는 div 앞에 삽입됨). 메인 지적으로 발견.
- 원인: 수동 카드 삽입 시 카드 종료 태그 위치 미확인. grep 카운트로는 검출 불가 → 구조(태그 시퀀스) 검증 필요.
- 수정: ko/index.html + index.html에서 뉴스 카드 </div> 위치 교정. 배포 3차(allowlist 2파일, offline-live=21:56 fresh baseline, PASS+SMOKE+UPLOAD).
- 주의: 첫 배포 시도는 allowlist 파일이 && 체인 diff 종료코드로 미생성 → 가드 FAIL-CLOSED 정상 차단. 파이프라인 종료코드는 tail이 아니라 deploy 본체에서 확인.
- 검증: 라이브 구조 태그 시퀀스 확인(7 sibling) + 실브라우저 데스크톱/모바일/RTL(ar cat-f) 스크린샷.
## 2026-10-29 22:15 KST — ko 전 페이지 내비 섹션 탭 누락 수정 (유저 제보)

- 증상: 유저 스크린샷 제보 — topic-crypto 등 ko 페이지 헤더 탭에 크립토·거래소/뮤직 없음(홈만 확장되어 있었음).
- 원인: 섹션 확장 시 ko 홈 내비만 패치, topic 페이지 6개 중 5개+기사/기타 페이지는 미적용. article-shell.mjs는 --ref 기사의 셸을 복제하므로 내비는 참조 기사를 따름.
- 수정: nav 내 생활 앵커 뒤에 2개 탭 삽입 — topic-crypto, about, privacy, cat-a~e, a101~a117 (25파일). 관리자 페이지는 nav 없음.
- 같은 결함이 5개 언어 기사 페이지에도 있어 별도 배포로 수정 진행.
- 배포: 4차(25파일, PASS+SMOKE+UPLOAD), 라이브 16페이지 클래스 전수 nav 확인 + 실브라우저 데스크톱/모바일.
- 로케일 기사 내비: en/ja/zh/es/ar 기사 80개에 현지화 라벨로 cat-f/cat-g 탭 추가(각 언어 cat-a 내비 앵커 복제). 배포 시 MAIN/LIVE CONFLICT — 원인은 자기 수정을 배포 전 푸시한 것(충돌 집합=본인 후보 diff 임을 diff -rq로 확인 후 offline-main=라이브트리로 1회 배포). 절차 교정: 기사 수정은 배포→푸시 순서 유지.
