# TinyTroupe Writing Lab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** TinyTroupe를 설명하고, Education Shell의 Claude가 TinyTroupe 철학에서 직접 만든 팀을 실제로 스폰해 작성한 글을 공개하는 GitHub Pages 실험을 완성한다.

**Architecture:** `speaky-TinyTroupe`가 팀 명세, 글과 공개 사이트를 소유한다. Education Shell은 이 repository를 active project로 열어 Claude Agent SDK 실행과 evidence를 제공한다. TinyTroupe simulation과 Claude 작업 팀은 공개 사이트에서 서로 다른 계층으로 표시한다.

**Tech Stack:** TinyTroupe Python source, Education Shell Electron/Claude Agent SDK, repo-local `.codex` agent metadata, static HTML/CSS/JavaScript, GitHub Pages `main:/docs`, Playwright browser verification

---

### Task 1: 실제 실행 prompt를 공개 repository에 고정

**Files:**
- Create: `education/prompts/01-create-writing-team.md`
- Create: `education/prompts/02-run-writing-room.md`
- Create: `education/README.md`

**Step 1: 팀 생성 prompt 작성**

첫 prompt는 Claude가 `README.md`, `TinyPerson`, `TinyWorld`, `TinyStory`, persona
fragment와 writing example을 직접 읽게 한다. 팀 이름, 역할 수와 역할 이름은 미리
지정하지 않는다.

**Step 2: 팀 계약만 제한**

다음 계약만 prompt에 명시한다.

- 팀 리드가 worker 결과를 수집한다.
- child agent는 사용자에게 직접 질문하지 않는다.
- TinyTroupe simulator와 Claude worker를 같은 것으로 표현하지 않는다.
- 팀 명세는 `.codex/agents`와 `.codex/team`에 저장한다.
- 팀을 실제로 실행했다고 주장하지 않는다.

**Step 3: 실제 실행 prompt 작성**

두 번째 prompt는 `/agents tinytroupe-writing-room` 명령 뒤에 사용한다. 팀이 글의
주제와 형식을 제안하고 실제 worker 결과를 모아 `education/writing/` 아래에
brief, contributions, final story와 manifest를 저장하게 한다.

**Step 4: prompt 자체 검토**

Run:

```bash
rg -n "TinyPerson|TinyWorld|TinyStory|Agent tool|사용자에게 직접 질문" education/prompts
```

Expected: 필요한 원전과 실행 경계가 두 prompt에 명시된다.

**Step 5: Commit**

```bash
git add education
git commit -m "docs(education): add Claude writing lab prompts"
git push origin main
```

### Task 2: Education Shell에서 Claude에게 팀 생성을 맡김

**Files:**
- Claude creates: `.codex/agents/*.toml`
- Claude creates: `.codex/team/tinytroupe-writing-room.md`
- Claude creates: `education/team/README.md`

**Step 1: 실제 앱 실행**

Run from the Education repository:

```bash
cd /Users/realpio/Documents/vibe-with-claude-code-education/desktop
npm run dev
```

Expected: 실제 Electron Education Shell이 열린다.

**Step 2: active project와 provider 설정**

- project: `/Users/realpio/Documents/speaky-TinyTroupe`
- provider: `Claude`
- 새 conversation 생성

**Step 3: 1차 prompt 제출**

`education/prompts/01-create-writing-team.md`의 내용을 일반 Chat으로 제출한다.
`/agents`는 아직 사용하지 않는다.

**Step 4: Claude의 실제 작업 확인**

- Claude가 지정된 TinyTroupe 파일을 읽었는지 tool use로 확인한다.
- 새 팀 파일이 `speaky-TinyTroupe`에 생성됐는지 확인한다.
- assistant 텍스트만 있고 파일이 없다면 실패로 기록한다.

**Step 5: 팀 명세 리뷰**

- 역할이 TinyTroupe source와 연결되는지 확인한다.
- TinyTroupe persona를 Claude worker라고 오인하지 않는지 확인한다.
- team member 이름과 `.codex/agents` 파일이 일치하는지 확인한다.

**Step 6: Commit**

```bash
git add .codex education/team
git commit -m "feat(education): add Claude-designed TinyTroupe writing team"
git push origin main
```

### Task 3: 프로젝트 metadata를 다시 읽고 실제 팀 스폰

**Files:**
- Create: `education/writing/brief.md`
- Create: `education/writing/contributions/*.md`
- Create: `education/writing/story.md`
- Create: `education/writing/run-manifest.json`

**Step 1: 팀 metadata 새로고침**

Education Shell에서 project를 다시 선택하거나 앱을 새로 열고 Agents 표면에서
`tinytroupe-writing-room`과 구성원을 확인한다.

**Step 2: 새 conversation 생성**

팀 생성 턴과 실제 팀 실행 턴을 분리한다. 새 conversation의 provider가 Claude인지
다시 확인한다.

**Step 3: `/agents` 실행**

`education/prompts/02-run-writing-room.md`의 `/agents` prompt를 Chat command
resolver를 통해 제출한다.

**Step 4: 실제 evidence 확인**

다음을 모두 확인한다.

- Agent tool use 또는 SDK task started event
- worker별 task와 result
- 리더가 worker 결과를 읽은 흔적
- 최종 글과 repository artifact

역할극 텍스트만 있으면 실행 실패로 기록하고 공개하지 않는다.

**Step 5: 공개 manifest 정리**

`run-manifest.json`에는 provider, conversation ID, parent task/tool ID, worker
artifact, source event count와 terminal status만 기록한다. credential, private
prompt, chain-of-thought와 로컬 사용자 경로는 공개하지 않는다.

**Step 6: Commit**

```bash
git add education/writing
git commit -m "feat(education): publish observed writing team result"
git push origin main
```

### Task 4: TinyTroupe GitHub Pages 재작성

**Files:**
- Modify: `docs/index.html`
- Create: `docs/education/styles.css`
- Create: `docs/education/app.js`
- Create: `docs/education/index.html`
- Create: `docs/education/story.html`
- Create: `docs/education/team.html`
- Create: `docs/education/data/team.json`
- Create: `docs/education/data/run-manifest.json`
- Create: `docs/education/data/story.json`

**Step 1: root page 책임 정리**

기존 API 문서와 upstream 링크를 보존하면서 첫 화면에서 TinyTroupe의 simulator
정체성, 핵심 추상화와 Education Writing Lab을 바로 이해할 수 있게 한다.

**Step 2: 글쓰기 가능성 표시**

다음 유형을 source 근거와 함께 보여준다.

- simulation trace 기반 이야기
- persona 대화극과 인터뷰
- audience focus group을 거친 글
- 광고·제품 설명 비평
- 교육 사례와 scenario essay
- team-produced story with leader synthesis

**Step 3: 팀 페이지 작성**

`.codex` 팀 파일을 사람이 읽는 구조로 투영한다. `configured`와 실제 run manifest의
`observed`를 분리해서 표시한다.

**Step 4: 글 페이지 작성**

최종 글을 기본 읽기 표면으로 놓고, worker contribution과 execution evidence는
선택해서 열 수 있는 제작 노트로 둔다. raw JSON을 본문에 그대로 출력하지 않는다.

**Step 5: 정적 data 동기화**

실제 팀 명세와 writing artifact에서 필요한 공개 필드만 JSON으로 복사한다.
없는 evidence를 기본값이나 fake success로 만들지 않는다.

**Step 6: 로컬 서빙**

Run:

```bash
python3 -m http.server 5189 --directory docs
```

Expected: `http://127.0.0.1:5189/`와 `/education/`이 열린다.

**Step 7: Playwright 검증**

desktop과 mobile viewport에서 다음을 확인한다.

- TinyTroupe core concept가 첫 화면에서 보인다.
- Writing Lab, Team, Story 이동이 작동한다.
- 최종 글이 읽기 가능한 폭과 줄 간격으로 렌더링된다.
- API docs 링크가 유지된다.
- console error와 failed request가 없다.

**Step 8: Commit**

```bash
git add docs
git commit -m "feat(pages): publish TinyTroupe writing lab"
git push origin main
```

### Task 5: GitHub Pages를 CI 없이 배포

**Files:**
- No source file changes unless GitHub returns a required Pages marker.

**Step 1: Pages source 설정**

Run:

```bash
gh api --method POST repos/nfbs2000/speaky-TinyTroupe/pages \
  -f 'source[branch]=main' \
  -f 'source[path]=/docs'
```

If Pages already exists, use `PUT` with the same source. Do not add an Actions
workflow.

**Step 2: deployment 상태 조회**

Run:

```bash
gh api repos/nfbs2000/speaky-TinyTroupe/pages
```

Expected: `build_type=legacy`, source branch `main`, path `/docs`.

**Step 3: 공개 readback**

Verify:

- `https://nfbs2000.github.io/speaky-TinyTroupe/`
- `https://nfbs2000.github.io/speaky-TinyTroupe/education/`
- team and story pages

Do not report success before HTTP 200 and actual content readback.

### Task 6: Book SDK에서 공개 실험 연결

**Files:**
- Modify: `/Users/realpio/Documents/vibe-with-claude-code-education/docs/book-sdk-ko/src/part6/ch20.md`
- Modify: `/Users/realpio/Documents/vibe-with-claude-code-education/docs/book-sdk-ko/src/part6/ch20b.md`
- Modify: `/Users/realpio/Documents/vibe-with-claude-code-education/docs/book-sdk-ko/public-resources.json`

**Step 1: 20장 링크 추가**

실제 Agent 생성, worker task/result와 리더 종합을 읽는 공개 실험으로 연결한다.

**Step 2: 20b장 링크 추가**

TinyTroupe simulation team과 Claude execution team의 차이, team lead synthesis를
읽는 공개 사례로 연결한다.

**Step 3: public resource receipt 추가**

실제 Pages URL, source commit, deployment method, team member count, observed worker
count와 검증 시각을 기록한다.

**Step 4: Book build**

Run:

```bash
mdbook build docs/book-sdk-ko
```

Expected: success.

**Step 5: 링크 preflight**

Run:

```bash
node scripts/preflight-md-coursegraph-links.mjs --book sdk --chapter 20
node scripts/preflight-md-coursegraph-links.mjs --book sdk --chapter 20b
```

Expected: both public URLs resolve without invented local paths.

**Step 6: Commit**

```bash
git add docs/book-sdk-ko/src/part6/ch20.md \
  docs/book-sdk-ko/src/part6/ch20b.md \
  docs/book-sdk-ko/public-resources.json
git commit -m "docs(book): link TinyTroupe writing team experiment"
git push origin main
```

### Task 7: 최종 교차 검증과 보고

**Files:**
- Verify only.

**Step 1: 저장소 동기화 확인**

두 repository가 각각 `main...origin/main`인지 확인하고, 기존 사용자 변경은 별도로
남아 있는지 보고한다.

**Step 2: 교차 링크 확인**

Book SDK 20장과 20b장 → TinyTroupe Pages → upstream, team, story 링크를 실제
브라우저에서 순서대로 연다.

**Step 3: 실행 주장 검토**

다음 주장을 evidence와 대조한다.

- Claude가 팀 파일을 만들었다.
- Education Shell이 팀 파일을 다시 읽었다.
- 실제 Agent worker가 실행됐다.
- 최종 글은 리더가 worker 결과를 종합했다.

확인되지 않은 항목은 누락으로 보고하고 문구를 낮춘다.

**Step 4: 최종 보고**

각 repository commit, Pages URL, 실제 team/worker count, story title, Book SDK
link 위치와 남은 한계를 보고한다.
