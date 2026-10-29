## 2026-10-29 22:00 KST — ko 주제별 그리드 중첩 버그 수정

- 증상: 주제별 보기 그리드에서 크립토·거래소/뮤직 카드가 뉴스·사회 카드 내부에 중첩(뉴스 카드 닫는 div 앞에 삽입됨). 메인 지적으로 발견.
- 원인: 수동 카드 삽입 시 카드 종료 태그 위치 미확인. grep 카운트로는 검출 불가 → 구조(태그 시퀀스) 검증 필요.
- 수정: ko/index.html + index.html에서 뉴스 카드 </div> 위치 교정. 배포 3차(allowlist 2파일, offline-live=21:56 fresh baseline, PASS+SMOKE+UPLOAD).
- 주의: 첫 배포 시도는 allowlist 파일이 && 체인 diff 종료코드로 미생성 → 가드 FAIL-CLOSED 정상 차단. 파이프라인 종료코드는 tail이 아니라 deploy 본체에서 확인.
- 검증: 라이브 구조 태그 시퀀스 확인(7 sibling) + 실브라우저 데스크톱/모바일/RTL(ar cat-f) 스크린샷.
