# 애드센스 연결 체크리스트 (이 순서대로)
1. 도메인 준비: 본인 도메인 1개 (예: moneycheck.kr) — 이 폴더를 Cloudflare Pages 등에 업로드하고 도메인 연결
2. 애드센스 신청: 구글 애드센스에서 본인 계정으로 사이트 추가·심사 신청 (1인 1계정)
3. pub ID 교체 3곳: ads.js 첫 줄, index 포함 전 페이지 head의 google-adsense-account 메타, ads.txt — pub-XXXXXXXXXXXXXXXX 를 본인 ca-pub 번호로 교체 (일괄 치환 가능)
4. 심사 대기: 승인 전까지 광고 슬롯은 점선 박스로 표시되고, 승인·ID 교체 후 자동 표시됨
5. 승인 후: 애드센스 콘솔에서 광고 단위 생성 시 data-ad-slot 도 자동 광고 사용 시 불필요. ads.txt가 루트에서 열리는지 확인
주의: 본인 클릭 금지, 클릭 유도 문구로 광고 클릭을 요구하지 말 것, 다계정 금지
