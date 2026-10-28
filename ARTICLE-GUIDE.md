# 일일 트렌드 기사 작성 기준 / Daily Trend Article Standard

사용자 지시(2026-10-24): "매일 글 올릴때는 그 트렌드 주제 리써치해서 구조화한 팩트근거 가치있는글을 쓸 것"
This file is the writing workflow every writer in this repo (including automation agents) must follow for daily trend articles.

## 1. 리서치 / Research
- 트렌드 주제를 고른 뒤 바로 쓰지 말고 먼저 조사한다.
- 공식 출처(정부·기관·기업 공식 발표, 당사자 계정)를 우선 확인하고, 독립 보도 2건 이상을 대조한다.
- 확인된 사실과 아직 확인되지 않은 주장을 분리한다. 확인 안 된 내용은 "~라는 주장이 나왔다"처럼 출처 있는 주장으로만 표기한다.
- 지어낸 사실, 기억에 의존한 수치·날짜·인용 금지. 기사 안 모든 구체 사실은 방금 확인한 출처에서 온다.

## 2. 구조 / Structure
각 기사는 이 틀을 따른다 (순서는 주제에 맞게 조정 가능):
1. **무슨 일인가** - 한두 문단으로 핵심부터.
2. **왜 지금 화제인가** - 트렌드가 된 배경·계기.
3. **확인된 사실 정리** - 시간 순 또는 쟁점 순, 각 사실에 출처 표기.
4. **독자가 알아둘 것** - 이 이슈가 독자에게 갖는 의미·다음에 볼 것.
5. **출처** - 기사 하단에 실제 확인한 출처 링크 목록.


## 2-1. HTML head·공유 버튼 (사용자 지시 2026-10-25)
모든 신규 기사는 head에 아래를 기본 포함한다: NewsArticle JSON-LD(제목·발행일·언어·저자/발행인 TrendCheck·canonical), <meta name="robots" content="max-image-preview:large">, OG 태그(og:title·og:description·og:type=article·og:url·og:image=og-default.png·og:site_name=TrendCheck·article:published_time). 본문 하단에 공유 버튼(X/Threads/Facebook/링크복사). 생성은 `node scripts/article-shell.mjs`(로케일별 기존 기사를 --ref로 사용)을 쓴다. 이미지는 라이선스 안전 소스(Unsplash/Pexels/Wikimedia)+출처 표기(라이선스 면제와 무관하게 필수), 없으면 og-default 폴백, 무단 전재 금지. 편집 규칙(2026-10-25): 실제 사건과 일치하는 검증된 이미지이거나, 특정 사건을 사칭할 수 없는 명백히 비특정 일러스트만 사용한다. 다른 경기·다른 태풍 등 타 사건 사진을 사건 기사에 쓰지 않는다.

### 이미지 권리 메타데이터 / Image rights metadata (2026-10-29)
- 커스텀 이미지는 먼저 `data/image-rights.json`에 이미지 URL별 검증 기록을 추가한다: 원본 파일 페이지, 확인일, 권리 근거, 저작자, 기존 크레딧, 실제 이용 조건 URL. 단순히 Wikimedia/NASA에 있다는 사실만으로 권리를 추정하지 않는다.
- `rightsStatus`: `cc0`, `public-domain`, `copyrighted`. CC0는 CC0 문서와 저작권 없음 고지, 퍼블릭 도메인은 공개 근거·적용 국가/범위와 상태 고지를 기록한다. 두 경우 `copyrightHolder`, 임의의 © 표시, 가상의 저작권자는 금지한다. 저작자와 크레딧은 그대로 유지한다.
- 저작권이 유지되는 사진은 출처로 확인된 `copyrightHolder`와 그 권리자를 명시하는 정확한 `copyrightNotice`가 필요하다. 사이트 발행인·업로더를 저작권자로 자동 대입하지 않는다. 확인 불가 시 커스텀 이미지를 사용하지 않고 기존 og-default 폴백을 사용한다.
- `license`는 해당 이미지의 실제 이용 조건 문서다. `acquireLicensePage`는 실제 취득/허락 안내가 확인된 경우에만 추가한다. 일반 CC0/퍼블릭 도메인 마크 페이지를 취득 페이지로 복사하지 않는다. 크롭 등 수정 내역도 기록한다.
- 신규 생성: `node scripts/article-shell.mjs ... --image-url https://trendcheck.today/images/og-a106.jpg --image-alt '...'`. 출처/이용 조건 링크와 검증된 크레딧, ImageObject의 `contentUrl`·`copyrightNotice` 등이 함께 생성된다. `--image-credit`를 제공하면 검증 기록과 일치해야 한다. 별도 검증 기록은 `--image-rights-file`로 선택 가능하다.
- 발행 전 `node scripts/verify-image-metadata.mjs` 필수. 권리 기록 누락, JSON-LD 문법 오류, 크레딧/권리 불일치, contentUrl 누락, 커스텀 이미지의 ImageObject 누락을 실패 처리한다. `deploy_safe.py`에도 업로드 전 검사가 내장된다. 기록 입력은 사람/작성자의 원본 검증을 대신하지 않는다.

## 3. 언어·품질 / Language & quality
- 해당 언어로 직접 쓴 오리지널 글. 다른 언어판 기사의 번역 금지.
- 클릭을 위한 과장·낚시 제목 금지. 제목은 확인된 사실만 담는다.
- 돈·수익 각도를 억지로 넣지 않는다. 주제는 트렌드 그대로.
- 독자 질문에 답하지 못하는 패딩 문단 금지. 짧아도 사실이 충실한 글이 낫다.
- 개인정보(사적인 주소·연락처 등)는 담지 않는다.

## 4. 발행 전 체크 / Pre-publish checklist
- [ ] 오늘 해당 국가/소스의 실제 트렌드에서 고른 주제인가
- [ ] 기사 안 구체 사실마다 오늘 확인한 출처가 있는가
- [ ] 확인 안 된 주장을 사실처럼 쓰지 않았는가
- [ ] 하단 출처 링크가 실제 열리는 페이지인가
- [ ] 다른 작성자 파일을 건드리지 않았는가 (로케일 max+1 번호 규칙 준수)
