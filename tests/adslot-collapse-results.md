# 빈 광고 슬롯 접힘 — 시나리오 테스트 결과 (2026-10-24, 브랜치 fix/adslot-collapse-sources, tip b4fe033)

실행: 로컬 `python3 -m http.server` + `google-chrome --headless --disable-gpu --virtual-time-budget=12000 --dump-dom /tests/adslot-collapse.html`
원시 덤프: tests/adslot-collapse-lastrun-dom.html (마지막 실행분)

| 시나리오 | 조작 | 기대 | 실제(덤프) | 판정 |
| --- | --- | --- | --- | --- |
| top: 지연 충전 (6s, 첫 스윕 이후) | status done + ad-status filled + iframe | 표시 | `style=""` | PASS |
| mid: 진짜 미충전 (실제 애드센스 노필 응답, 빈 aswift iframe 존재) | 네트워크 응답 그대로 | 숨김 | `style="display: none;"` | PASS |
| bottom: 미충전 후 9s 충전 (두 스윕 모두 경과) | 늦은 ad-status filled + iframe | observer 가 재표시 | `style=""` | PASS |
| blank: 빈 슬롯 동적 추가 | 자식 없음 | 숨김 | `style="display: none;"` | PASS |

핵심 근거: 미충전 슬롯에도 빈 aswift iframe 이 들어오므로(라이브 DOM 확인) iframe 존재만으로는 충전을 판별할 수 없고 data-ad-status 를 우선한다.
주의: virtual-time-budget 은 타이머를 가속한다. 실제 네트워크의 애드센스 응답 타이밍은 실행 환경에 따라 달라질 수 있다.
