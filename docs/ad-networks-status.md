# 광고 네트워크 신청 상태 (2026-10-25 13:17 KST 기준, durable)

재개 규칙: 각 항목의 "재개 신호"가 발생할 때만 진행. 로그인 재시도 타이머·폴링 없음.
(연락처 실수치 — 전화번호 등 — 는 이 파일에 기록하지 않음. 승인된 신청서 원문만 보유.)

| 네트워크 | 상태 | 재개 신호 |
|---|---|---|
| Google AdSense | 심사 중 (pub-3867118796714043, 소유권✓·리뷰요청✓, 정책위반 없음). ads.txt 라이브 200 vs 콘솔 "찾을 수 없음" 불일치 원인 미확정 → 10/27 GSC 체크 때 재확인 | gmail 구독: AdSense 결과 메일 |
| Adsterra | OFF 유지. 카테고리 제외 요청 메일 발송(10/25 12:51, queued). 제외 확인 전 재활성화 금지 | gmail 구독: adsterra.com 회신 → 제외 확인 시 재활성 여부 사용자 결정 |
| Kakao AdFit | 제휴제안 등록 완료(10/25 13:14, proposition/complete 확인). 제안등록 번호 메일 → hello@ → Gmail 경로. 카카오 검토 중 | gmail 구독: Kakao 메일 → 등록번호 원문 보존, 제안현황 조회로 추적 |
| Monetag (=PropellerAds, 301 통합) | 차단됨. 이메일 로그인 = Monetag 자체 reCAPTCHA quota 결함(사이트 측 오류). Google SSO는 클라우드 브라우저 세션 2회 교체로 미성립 | 사용자가 재시도 지시, 또는 변경된 경로(다른 브라우저 config/사용자 기기), 또는 Monetag 측 captcha 복구 확인. 임의 재시도 금지 |
| Coupang Partners | 차단됨. login.coupang.com Akamai Access Denied (config-c/h 모두). 제안된 경로: 사용자 본인 기기에서 가입 | 사용자가 가입 결과 공유 또는 다른 경로 지시. 차단 중 자격증명 요청 금지 |
| Dable | 자격 미달: 공식 가이드 100+ 기사 요구, 현재 31 (ko6/en5/ja5/zh4/es6/ar5) | 라이브 기사 수 ≥100 → 가이드 재확인 후 신청 |
| Naver AdPost | 해당 없음: 외부 독립 사이트용 셀프서비스 프로그램 없음(공식 유의사항) | (정책 변경 시에만) |

감시: gmail 구독 waketrigger-01M5RMA4TWVNT1694TDGGE48SD (AdSense/Adsterra/Kakao/bounce), 10/27 10:00 GSC follow-up wake.
