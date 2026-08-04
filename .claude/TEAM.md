# TinyTroupe 팀

에이전트 정의는 `.claude/agents/`, 그들이 따르는 지식은 `.claude/skills/`에 있다.
**스킬이 TinyTroupe 방법론의 단일 출처이고, 에이전트는 역할·범위·프로토콜만 가진다.**

이 팀은 TinyTroupe(Python 라이브러리)의 **방법을 Claude 서브에이전트로 재현**한다.
Python을 실행하지 않고, OpenAI API 키도 쓰지 않는다. `tinytroupe/` 소스와 `examples/`는
방법의 출처로서 읽기 전용 참조다.

## 로스터

```
리드 = 메인 세션 (tinytroupe-writing-room 스킬을 로드해 쇼러너 역할 수행)
│
├── 준비            style-director        문체 사양 + 정보 보존 이식
│                   fact-grounder         근거 3분류 (확인 불가를 숨기지 않음)
├── 설계            persona-architect     시트 + 관계도 + 인지 범위 + 검증(0~1)
│                   scene-orchestrator    비트 플랜 + 접근 제약 + 개입 규칙
│                   continuity-ledger     설정 원장 3층 (산술·사물·기억)
├── 집필            narrative-synthesist  초안 + 표적 재생성
├── 검증            consistency-editor    명제 채점(0~9) + 교정 규칙
│                   audience-reaction-analyst  SIMULATED 독자 + 정규화
│                   experiment-runner     블라인드 배정 + 집계 + 주장 범위
└── 시뮬레이션      tiny-person-actor     페르소나 1명의 1턴 연기
```

전원 `Read, Grep, Glob` 읽기 전용. 파일 저장은 리드가 한다. 워커는 리드에게만 반환하고
사용자에게 질문하지 않는다.

**단 하나의 예외**: `fact-grounder`의 웹 모드(`WebFetch`/`WebSearch`)는 사용자의 명시적
허가가 이번 런에 있을 때만 활성화되며, 사용 시 런 기록에 예외 사용을 명시한다.

## 방법론 스킬 (지식의 단일 출처)

| 스킬 | 재현하는 TinyTroupe 방법 | 근거 소스 |
|---|---|---|
| `tinytroupe-personas` | 시트·프래그먼트·관계·목표·검증 | `examples/agents`, `examples/fragments`, `factory/`, `agent/tiny_person.py`, `validation/tiny_person_validator.py` |
| `tinytroupe-memory` | 에피소드·의미 기억, 통합·반추, 설정 원장 | `agent/memory.py`, `agent/mental_faculty.py` |
| `tinytroupe-grounding` | 근거 커넥터, 3분류, 도구·문서 계약 | `agent/grounding.py`, `agent/mental_faculty.py`, `tools/`, `extraction/artifact_exporter.py` |
| `tinytroupe-simulation` | 해석 프로토콜, 턴 루프, 자극 4종, 시간, 관계망 | `environment/tiny_world.py`, `environment/tiny_social_network.py`, `agent/prompts/tiny_person.mustache` |
| `tinytroupe-steering` | 목적 결부 스토리 + 조건부 개입 | `steering/tiny_story.py`, `steering/intervention.py`, `steering/prompts/story.*.mustache` |
| `tinytroupe-quality` | 명제 채점, 표준 명제 세트, 재생성 루프, 반복 차단, 교정 규칙 | `experimentation/proposition.py`, `validation/propositions.py`, `agent/action_generator.py`, `utils/semantics.py`, `utils/behavior.py` |
| `tinytroupe-enrichment` | 정보 보존 문체 이식, 요구사항 기반 확장 | `enrichment/` 전체 |
| `tinytroupe-extraction` | 추출·정규화·축약·보고·저장 | `extraction/` 전체 |
| `tinytroupe-experiments` | A/B 무작위화, 주장 범위, 표본 다양성, 체크포인트 | `experimentation/`, `validation/simulation_validator.py`, `profiling.py`, `control.py` |
| `tinytroupe-writing-room` | 쇼러너(리드) 오케스트레이션 | README 원칙 #6, `.claude/agents/`, 두 런의 EXECUTION-FLOW |

**커버리지**: 재현 대상 13개 모듈(`agent/`, `enrichment/`, `environment/`, `examples/`,
`experimentation/`, `extraction/`, `factory/`, `steering/`, `tools/`, `utils/`, `validation/`,
`control.py`, `profiling.py`)이 전부 위 표에 걸린다. `clients/`(LLM 클라이언트)와
`ui/`(Jupyter 위젯)는 Python 실행 전용이라 재현 대상이 아니다.

## 사용법

```
# 글 한 편 (스킬 오케스트레이션 — 리드가 단계별 판단)
Skill(tinytroupe-writing-room)

# 글 한 편 (동적 워크플로 — 결정적 파이프라인 + 재생성 루프)
Workflow(name: "tt-writing-room", args: {topic: "...", form: "단편", length: "1500자"})

# 포커스 그룹/브레인스토밍 시뮬레이션 (TinyWorld 재현)
Workflow(name: "tt-focus-group", args: {stimulus: "논의할 대상/질문", fields: ["preferred_option", "justification"]})

# 워커 직접 호출 (담당이 명확할 때)
Agent(subagent_type: "persona-architect", prompt: "캐스트 브리프: ...")
```

워크플로 스크립트는 `.claude/workflows/`에 있다. 실행 기록은 방식별로 분리한다:
- **팀 런** (리드가 지휘, Agent/SendMessage) → `.claude/team-runs/{날짜}-{주제}/`
- **워크플로 런** (코드가 지휘, Workflow 도구) → `.claude/workflows/runs/{날짜}-{주제}/`

두 형식 모두 단계별 산출물 + EXECUTION-FLOW.md(과정 분석)를 남긴다 — 결과만으로는 과정의
결함이 보이지 않는다 (`workflows/runs/2026-08-02-focus-group-subscription`의 args 문자열화
결함 사례 참조).

## 검증된 범위

**1급(팀 런으로 검증됨)**: 픽션 서사 — 단편·장면.
**2급(미검증)**: 에세이·칼럼, 대화, 모의 인터뷰, 평가문. 같은 파이프라인으로 처리하되
비트 플랜 단계를 형식에 맞게 대체하고, **미검증임을 브리프와 런 기록에 명시**한다.

## 증거 경계 (전원 필수)

- 페르소나와 그 반응은 **시뮬레이션**이다. SIMULATED 표기를 유지하고, 실제 인간 조사·설문·
  통계로 제시하지 않는다 (README "Assistants vs. Simulators", RESPONSIBLE_AI_FAQ.md).
- 구성(이 파일, 에이전트 정의)은 실행 기록이 아니다. "실행됨"은 실제 관찰된 Agent/Workflow
  결과에 대해서만 말한다. **수행된 실행을 누락하는 것도 위반이다.** 알 수 없는 런타임 ID는
  null로 두고 유추하지 않는다.
- 추출 결과는 트레이스에 있는 발화만 근거로 한다.
- 확인 불가 사실 항목은 은폐하지 않고 경계 선언에 올린다.

## 운영 규율 (두 런의 교훈)

- **판본 신호**: 파일 교체 시 리드가 전체 브로드캐스트, 워커는 작업 전 헤더의 판본 표기 확인.
  현재 저장본이 유일 기준.
- **잠정 표시**: 확정 전 산출물에 근거한 판단에는 "잠정"을 붙인다.
- **자수 예산**: 분량 상한 근처의 수정 지시에는 순증/순감 예산을 명기한다.
- **루프를 닫는다**: 채점만 하고 재생성하지 않으면 품질 기구가 아니다. 임계 7 미달은
  최대 2회 재생성하고, 끝내 미달이면 마지막 판본을 채택하되 미달 항목을 기록에 남긴다.

## 경계 규칙

- 이 팀의 어떤 작업도 `tinytroupe/` 소스 수정, Python 실행, API 키를 요구하지 않는다.
  그런 요구가 생기면 팀 범위 밖이므로 사용자에게 보고한다.
- 기능 작업 중에 `.claude/skills/`를 고치지 않는다. 스킬이 소스와 어긋나면(드리프트) 조용히
  고치지 말고 사용자에게 보고한다 — 잘못된 스킬은 팀 전체를 오도한다.
- 커밋·푸시는 사용자가 요청할 때만.

## 유지보수

스킬은 위 표의 근거 소스에 기반해 작성됐다. 업스트림 머지 등으로 해당 파일이 크게 바뀌면
스킬이 낡는다 — **근거 파일을 다시 읽고 스킬과 대조하는 것이 드리프트 점검**이다.
설계 근거: `docs/superpowers/specs/2026-08-04-tinytroupe-team-redesign-design.md`
