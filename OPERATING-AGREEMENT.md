# 공동 운영 규칙 / Shared Operating Rules

이 저장소는 여러 작성자(자동화 에이전트 포함)가 함께 쓴다. 아래 규칙은 서로의 작업을 덮어쓰지 않기 위한 약속이다.
This repo has multiple writers (including automation agents). These rules keep us from overwriting each other.

## 1. 광고 설정의 단일 원천 / Single source of truth for ad config
- 승인된 광고 설정은 **`ads.config.json`** 한 곳에만 있다. AdSense 게시자 ID `ca-pub-3867118796714043` 는 승인된 프로덕션 값이다.
- `ads.txt`, `ads.js` 의 ID, 각 홈페이지 `<head>` 의 애드센스 스니펫은 **생성물**이다. 손으로 고치거나 템플릿에서 다시 만들지 말 것.
- 템플릿/페이지를 재생성했다면 반드시 마지막에 실행: `node scripts/apply-ads.mjs` (멱등, placeholder 일괄 치환 + 스니펫 보장).
- 홈페이지를 재생성했다면 `node scripts/apply-site-verify.mjs` 도 함께 실행 — 애드센스/네이버 소유권 인증 메타 태그 복원 (If homepage was regenerated, also run apply-site-verify.mjs to restore the AdSense/Naver verification meta tags).
- 푸시·배포 전 필수 검사: `node scripts/verify-ads.mjs` — placeholder ID 나 실제 ID 누락이 하나라도 있으면 실패하며, 그 상태로 푸시/배포 금지. Before every push/deploy run `node scripts/verify-ads.mjs`; a FAIL means do not push or deploy.
- The approved ad config lives ONLY in `ads.config.json` (`ca-pub-3867118796714043`). `ads.txt`, the IDs in `ads.js`, and the homepage AdSense snippets are GENERATED. After any template/page regeneration, run `node scripts/apply-ads.mjs` (idempotent). Never blank or revert the publisher ID.

- 홈/목차(index) 페이지를 재생성했다면 `node scripts/apply-reader-discovery.mjs .` 도 마지막에 실행 — 홈의 미링크 기사 크롤 가능 링크와 카테고리 카드 카운트를 멱등 동기화 (기존 카드·토픽 보존, 추가만, 백필+향후 기사 자동 포함). deploy_safe.py 배포 진입점에도 내장돼 매 배포 시 자동 실행. If home/index pages were regenerated, also run apply-reader-discovery.mjs (idempotent, additive only; also runs automatically inside the deploy_safe.py entrypoint).

## 2. 기사 작성 기준 / Article standard
- 일일 트렌드 기사는 **`ARTICLE-GUIDE.md`** 의 리서치→구조→품질 체크 절차를 따른다. 리서치 없이 쓴 글, 출처 없는 사실, 번역문 업로드 금지.
- Daily trend articles must follow ARTICLE-GUIDE.md (research, structure, sources). No unresearched posts, no unsourced facts, no translations.

## 3. 일지·로그 / Journal & log
- 모든 푸시에 `docs/dev-journal.md` 항목 필수 (사용자 상시 규칙). 결정·상태 변화는 `docs/project-log.md` 도 갱신. Every push needs a dev-journal entry; update project-log for decisions/state changes.

## 4. 푸시 규칙 / Push rules
- 푸시 전 반드시 `git fetch && git rebase origin/main`. force-push 절대 금지. 상대 커밋(글 포함)은 항상 보존.
- Always `git fetch && git rebase origin/main` before pushing. Never force-push. Always preserve the other side's commits, including articles.

## 3. 글 번호 / Article numbering
- 로케일별 `articles/xxNNN.html` 번호는 해당 로케일 최대 번호 + 1. 기존 글 수정/삭제 금지.
- Per-locale `articles/xxNNN.html`: next number = locale max + 1. Never edit or delete existing articles.

## 4. 배포 / Deploy
- Worker 의 D1 바인딩(DB, id a33efe21-ca91-4f78-8feb-5b5e79b9057b)과 API 코드는 반드시 유지. 아카이브(정적) 부분만 교체.
- Keep the Worker's D1 binding and API code intact; replace only the static archive portion.
