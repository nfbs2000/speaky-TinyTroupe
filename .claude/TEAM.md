# TinyTroupe 팀

에이전트 정의는 `.claude/agents/`, 그들이 따르는 지식은 `.claude/skills/`에 있다.
**스킬이 TinyTroupe 방법론의 단일 출처이고, 에이전트는 역할·범위·프로토콜만 가진다.**

이 팀은 TinyTroupe(Python 라이브러리)의 **방법을 Claude 서브에이전트로 재현**한다.
Python을 실행하지 않고, OpenAI API 키도 쓰지 않는다. `tinytroupe/` 소스와
`examples/`는 방법의 출처로서 읽기 전용 참조다.

## 로스터

```
리드 = 메인 세션 (tinytroupe-writing-room 스킬을 로드해 쇼러너 역할 수행)
│
├── 라이팅룸 워커 (글 한 편 제작)
│   ├── persona-architect        캐릭터 시트 + 자체 검증     → tinytroupe-personas
│   ├── scene-orchestrator       배경 + 씬/비트 플랜          → tinytroupe-simulation
│   ├── narrative-synthesist     비트 플랜 → 초안             → tinytroupe-story
│   ├── audience-reaction-analyst 시뮬레이션 독자 반응        → tinytroupe-extraction
│   └── consistency-editor       일관성/유창성 편집 노트
│
└── 시뮬레이션 배우
    └── tiny-person-actor        페르소나 1명의 1턴 연기      → tinytroupe-simulation 프로토콜
```

모두 `Read, Grep, Glob`만 가진 읽기 전용 워커다. 워커는 리드에게만 반환하고
사용자에게 질문하지 않는다.

## 방법론 스킬 (지식의 단일 출처)

| 스킬 | 재현하는 TinyTroupe 방법 | 소스 근거 |
|---|---|---|
| `tinytroupe-personas` | 시트 작성·프래그먼트·검증 | `examples/agents/*`, `factory/`, `validation/` |
| `tinytroupe-simulation` | TinyWorld 턴 루프·해석 프로토콜 | `environment/tiny_world.py`, `agent/prompts/tiny_person.mustache` |
| `tinytroupe-extraction` | 트레이스 → 구조화 결과 | `extraction/results_extractor.py` |
| `tinytroupe-story` | 목적 결부 스토리·조향 루프 | `steering/tiny_story.py`, `steering/prompts/story.*.mustache` |
| `tinytroupe-writing-room` | 쇼러너(리드) 오케스트레이션 | README 원칙 #6, `.claude/agents/` 팀 설계 |

## 사용법

```
# 글 한 편 (스킬 오케스트레이션 — 리드가 단계별 판단)
Skill(tinytroupe-writing-room)

# 글 한 편 (동적 워크플로 — 결정적 파이프라인 + 수정 루프)
Workflow(name: "tt-writing-room", args: {topic: "...", form: "단편", length: "1500자"})

# 포커스 그룹/브레인스토밍 시뮬레이션 (TinyWorld 재현)
Workflow(name: "tt-focus-group", args: {stimulus: "논의할 대상/질문", fields: ["preferred_option", "justification"]})

# 워커 직접 호출 (담당이 명확할 때)
Agent(subagent_type: "persona-architect", prompt: "캐스트 브리프: ...")
```

워크플로 스크립트는 `.claude/workflows/`에 있다. 실행 기록은 방식별로 분리한다:
- **팀 런** (리드가 지휘, Agent/SendMessage) → `.claude/team-runs/{날짜}-{주제}/`
- **워크플로 런** (코드가 지휘, Workflow 도구) → `.claude/workflows/runs/{날짜}-{주제}/`

두 형식 모두 단계별 산출물 + EXECUTION-FLOW.md(과정 분석)를 남긴다 — 결과만으로는
과정의 결함이 보이지 않는다 (workflows/runs/2026-08-02-focus-group-subscription의
args 문자열화 결함 사례 참조).

## 증거 경계 (전원 필수)

- 페르소나와 그 반응은 **시뮬레이션**이다. SIMULATED 표기를 유지하고, 실제 인간
  조사·설문·통계로 제시하지 않는다 (README "Assistants vs. Simulators", RESPONSIBLE_AI_FAQ.md).
- 구성(이 파일, 에이전트 정의)은 실행 기록이 아니다. "실행됨"은 실제 관찰된 Agent/
  Workflow 결과에 대해서만 말한다. 알 수 없는 런타임 ID는 null로 두고 유추하지 않는다.
- 추출 결과는 트레이스에 있는 발화만 근거로 한다.

## 경계 규칙

- 이 팀의 어떤 작업도 `tinytroupe/` 소스 수정, Python 실행, API 키를 요구하지 않는다.
  그런 요구가 생기면 팀 범위 밖이므로 사용자에게 보고한다.
- 기능 작업 중에 `.claude/skills/`를 고치지 않는다. 스킬이 소스와 어긋나면(드리프트)
  조용히 고치지 말고 사용자에게 보고한다 — 잘못된 스킬은 팀 전체를 오도한다.
- 커밋·푸시는 사용자가 요청할 때만.

## 유지보수

스킬은 `tinytroupe/` 소스의 특정 파일을 근거로 작성됐다(위 표). 업스트림 머지 등으로
해당 파일이 크게 바뀌면 스킬이 낡는다 — 근거 파일을 다시 읽고 스킬과 대조하는 것이
드리프트 점검이다.
