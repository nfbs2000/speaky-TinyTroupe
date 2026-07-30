# TinyTroupe 글쓰기 팀 공개 실험 설계

## 목적

이 실험은 TinyTroupe의 persona simulation 철학과 Claude Agent SDK의 실제 작업
위임을 같은 것으로 취급하지 않는다. 대신 두 체계를 순서대로 연결한다.

1. Education Shell의 Claude 주 세션이 TinyTroupe 원전과 예제를 읽는다.
2. Claude가 그 철학을 바탕으로 글쓰기 팀을 이 공개 repository에 정의한다.
3. Education Shell이 새 팀 명세를 다시 읽는다.
4. 후속 `/agents` 턴에서 Claude가 실제 Agent 도구로 팀원을 스폰한다.
5. 팀 리드가 팀원 결과를 수집해 하나의 글을 완성한다.
6. 팀 명세, 실제 실행에서 확인된 역할과 최종 글을 GitHub Pages에 공개한다.
7. Claude Agent SDK 강좌 20장과 20b장에서 이 실험을 연결한다.

## 소유권

| 항목 | 소유 repository |
| --- | --- |
| TinyTroupe 소개와 글쓰기 가능성 | `nfbs2000/speaky-TinyTroupe` |
| Claude가 만든 팀 명세 | `nfbs2000/speaky-TinyTroupe` |
| 실제 팀 실행 결과와 최종 글 | `nfbs2000/speaky-TinyTroupe` |
| 공개 GitHub Pages | `nfbs2000/speaky-TinyTroupe` |
| Education Shell 실행·관찰 | `nfbs2000/vibe-with-claude-code-education` |
| Book SDK의 학습 링크 | `nfbs2000/vibe-with-claude-code-education` |

Education repository에 TinyTroupe 팀이나 글의 복제본을 두지 않는다. Education
Shell은 Claude provider를 실행하고 실제 SDK event를 관찰하는 도구다.

## 진실 경계

### TinyTroupe가 제공하는 것

- `TinyPerson`: 구체적인 성격, 이력, 목표와 선호를 가진 simulated persona
- `TinyWorld`: persona가 상호작용하는 실험 환경
- `TinyStory`: simulation interaction을 목적에 맞는 서사로 연결하는 도구
- fragments: 여러 persona에서 재사용하는 성향과 관심사
- experiment loop: simulation을 실행하고 결과를 분석·수정하는 반복

TinyTroupe agent는 사람 관점과 반응을 시뮬레이션한다. 작업을 끝내기 위한 Claude
subagent나 팀원이라고 주장하지 않는다.

### Claude Agent SDK가 제공하는 것

- 주 세션의 팀 리드 판단
- Agent tool을 통한 실제 worker 실행
- worker에게 전달된 작업
- worker 결과와 리더의 종합
- SDK task, tool use/result와 nested transcript evidence

설정 파일에 역할 이름이 존재하거나 assistant가 여러 사람처럼 말하는 것만으로
실제 팀 실행을 주장하지 않는다. 공개 페이지에서 `실제로 실행된 팀`이라고 쓰려면
Education Shell raw evidence에 Agent tool use와 worker 결과가 있어야 한다.

## Claude가 팀을 만드는 1차 실행

Education Shell의 active project를 이 repository로 설정하고 Claude provider를
선택한다. 일반 Chat에서 Claude에게 다음 원전을 직접 읽게 한다.

- `README.md`의 Principles와 Assistants vs. Simulators
- `tinytroupe/agent/`
- `tinytroupe/environment/`
- `tinytroupe/steering/tiny_story.py`
- `tinytroupe/steering/prompts/story.*.mustache`
- persona, fragment, storytelling과 brainstorming examples

Claude는 읽은 근거를 바탕으로 다음 파일을 작성한다.

- `.codex/agents/*.toml`: 실제 글쓰기 worker 역할
- `.codex/team/tinytroupe-writing-room.md`: 팀 리드, 팀원, 미션과 협업 계약
- `education/team/README.md`: TinyTroupe 개념을 Claude 팀 역할로 번역한 이유

역할 수와 이름은 미리 고정하지 않는다. 단, 팀 리드 한 명이 worker 결과를 읽고
하나의 원고로 종합하며, worker는 직접 사용자에게 질문하지 않는 계약은 지킨다.

## 실제 글쓰기 2차 실행

팀 파일 작성 후 Education Shell의 project metadata를 다시 읽는다. 필요하면 새
conversation을 만든다. 그 뒤 `/agents tinytroupe-writing-room`으로 팀 작업을
명시적으로 요청한다.

Claude 팀은 다음 산출물을 이 repository에 저장한다.

- `education/writing/brief.md`: 주제, 독자, 글의 목적과 제약
- `education/writing/contributions/*.md`: 실제 worker가 리더에게 준 기여
- `education/writing/story.md`: 리더가 종합한 최종 글
- `education/writing/run-manifest.json`: conversation, task, tool과 source artifact ID

첫 글의 주제와 형식은 팀 리드가 TinyTroupe 원전을 읽은 뒤 제안한다. 재미를 위한
글이지만, simulated persona의 발화를 실제 인간 조사 결과로 표현하지 않는다.

## 공개 사이트

기존 `docs/` 정적 사이트와 API 문서를 보존하면서 첫 화면을 다음 네 영역으로
재구성한다.

1. **TinyTroupe 이해하기**
   - simulator와 assistant의 차이
   - TinyPerson, TinyWorld, TinyStory와 experiment loop
   - persona simulation으로 가능한 글쓰기 유형
2. **Claude가 만든 글쓰기 팀**
   - 팀 리드와 worker 역할
   - 각 역할이 어떤 TinyTroupe 개념에서 파생됐는지
   - configured와 observed 상태의 구분
3. **팀이 쓴 글 읽기**
   - 최종 글
   - worker 기여와 리더 종합을 읽는 선택형 제작 노트
4. **실험 근거와 출처**
   - upstream repository, paper와 MIT license
   - 공개 가능한 실행 manifest
   - Claude Agent SDK 팀 실행과 TinyTroupe simulation의 차이

사이트는 정적 HTML, CSS와 작은 JavaScript만 사용한다. 별도 frontend framework와
CI build를 추가하지 않는다. GitHub Pages는 `main` branch의 `/docs`를 직접
배포한다.

## Book SDK 연결

실제 Pages URL이 HTTP 200이고 팀 실행 manifest와 최종 글이 배포된 뒤에만 Book
SDK에 링크를 넣는다.

- `part6/ch20.md`: 실제 Agent 생성과 worker 결과 사례
- `part6/ch20b.md`: 팀 리드가 worker 기여를 종합한 공개 사례
- `public-resources.json`: verified public resource와 source/deployment commit

링크는 관찰 증거 자체가 아니다. 각 장은 공개 실험을 보조 학습 자료로 안내하고,
SDK evidence의 configured, observed, inferred 경계를 그대로 유지한다.

## 완료 조건

- Claude가 TinyTroupe 원전을 읽고 공개 repository 안에 팀 명세를 작성했다.
- Education Shell이 그 명세를 다시 읽어 Agents 표면에 표시했다.
- 후속 `/agents` 턴에서 실제 Agent tool use와 worker result가 관찰됐다.
- 최종 글과 공개 가능한 run manifest가 같은 실행을 가리킨다.
- GitHub Pages에서 TinyTroupe 소개, 팀, 글과 출처를 읽을 수 있다.
- Pages는 모바일과 데스크톱에서 레이아웃이 깨지지 않고 브라우저 오류가 없다.
- Book SDK 20장과 20b장의 링크가 실제 공개 URL을 연다.
- 실행되지 않은 역할, 누락된 worker 결과와 추정한 대화를 만들어 내지 않는다.
