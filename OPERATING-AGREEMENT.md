# 공동 운영 규칙 / Shared Operating Rules

이 저장소는 여러 작성자(자동화 에이전트 포함)가 함께 쓴다. 아래 규칙은 서로의 작업을 덮어쓰지 않기 위한 약속이다.
This repo has multiple writers (including automation agents). These rules keep us from overwriting each other.

## 이미지 메타데이터 배포 필수 조건 / Image metadata release requirement (2026-10-29)
- 새 기사만 추가하는 배포도 오래된 전체 아카이브를 업로드하지 않는다. 10/29 외부 발행 배포가 정상화된 3개 이미지 고지와 검증 도구를 되돌린 회귀가 실제 확인됐다.
- 매 배포 직전 최신 origin/main의 `data/image-rights.json`, `scripts/image-metadata.mjs`, `scripts/article-shell.mjs`, `scripts/verify-image-metadata.mjs`, `scripts/apply-image-metadata.mjs`, `scripts/deploy_safe.py`를 사용한다. 저장소 밖의 배포 도구 사본을 사용하면 이 의존 파일도 함께 동기화한다.
- 현재 라이브 아카이브에서 후보를 구성하고, 기존 기사 ImageObject가 이전 상태라면 최신 `apply-image-metadata.mjs`로 head의 이미지 권리 정보만 동기화한다. 기사 본문·제목·기존 크레딧·새 발행 기사·이미지 파일은 보존한다. CC0/퍼블릭 도메인에 저작권자를 만들지 않는다.
- 후보에 권리 레지스트리와 검증 도구를 포함한 뒤 `node scripts/verify-image-metadata.mjs <candidate-dir> <candidate-dir>/data/image-rights.json`을 실행한다. 누락·불일치·이미지 해시 변경은 업로드 금지다. 실제 Worker 업로드 직전까지 검사한 후보와 바이트가 같은지 확인한다. 검증 없이 오래된 로컬 스냅샷을 배포하지 않는다.
- 배포 후 라이브 BLOB의 a106/en002/ja005 copyrightNotice 및 신규 생성기의 buildImageObject 연동을 확인한다. 도구 파일이 사라지거나 고지가 없으면 배포 성공으로 보고하지 않는다. 이 지침과 저장소 검증은 이를 사용하지 않는 외부 실행환경을 기술적으로 통제하지 못하므로, 외부 경로의 실행 여부를 확인하지 않고 재발 방지가 보장된다고 주장하지 않는다.

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

## 5. 도메인 메일 발신 / Domain mail sending
- hello@trendcheck.today 등 trendcheck.today 도메인에서의 모든 발신은 반드시 `node scripts/send-domain-mail.mjs` 를 통한다. CF Email Sending API 직접 호출 금지.
- 사용자 상시 규칙(2026-10-25): 모든 도메인 발신은 사용자 Gmail(ljw0721@gmail.com)에 `[발신 사본]` 표시 사본이 자동 발송된다. 스크립트가 이를 강제한다.
- 발신 토큰은 vault 에서만 읽고 로그·사본·저장소 어디에도 기록하지 않는다.
- All trendcheck.today domain sends go through scripts/send-domain-mail.mjs only (never the CF API directly). Every send is automatically copied to the user's Gmail as a marked "[발신 사본]" (standing user rule, 2026-10-25). Tokens come from the vault and are never logged.
