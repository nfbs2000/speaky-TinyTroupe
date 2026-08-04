# TinyTroupe 팀 재설계 설계서 — 리포 전체 반영 + 글쓰기 품질 루프

작성일: 2026-08-04
대상: `.claude/skills/`, `.claude/agents/`, `.claude/TEAM.md`, `.claude/workflows/`

---

## 1. 배경

`.claude/`의 TinyTroupe 팀은 TinyTroupe(Python 라이브러리)의 **방법**을 Claude 서브에이전트로
재현한다. Python을 실행하지 않고 API 키도 쓰지 않는다. 현재 구성은 스킬 5개, 에이전트 6명,
워크플로 2개이며, 실행 기록 2건(팀 런 1, 워크플로 런 1)이 있다.

### 1.1 진단 — 무엇이 문제가 **아닌가**

재설계의 동기가 "현재 팀이 부실해서"는 아니다. 관찰된 기록은 그 반대를 가리킨다:

- 팀 런 «은성제과»: 에디터 채점 must_fix 0건, 자기일관성 10점, SIMULATED 독자 3/3 완독,
  리드의 문장 개입 0건. 워커의 자기 정정 4건(시트 오독 정정, 초안 자기 폐기 3회,
  에디터 판정 번복 2회, 검증 점수 0.55→0.82 자체 수정).
- 워크플로 런의 유일한 실질 결함(args 문자열화)은 팀이 아니라 워크플로 **코드** 문제였고
  이미 수정됐다.

따라서 이 문서는 **로스터를 뒤엎는 재작성이 아니라, 소스 커버리지 확장과 품질 기구 도입**을
설계한다. 기존 6명의 역할 정의는 유지·강화된다.

### 1.2 진단 — 무엇이 실제 부채인가

**(A) 소스 커버리지 공백.** 재현 대상 모듈은 13개다 — `agent/`, `enrichment/`, `environment/`,
`examples/`, `experimentation/`, `extraction/`, `factory/`, `steering/`, `tools/`, `utils/`,
`validation/`, `control.py`, `profiling.py`. (`clients/`와 `ui/`는 제외한다: 전자는 OpenAI·Azure·
Ollama 클라이언트, 후자는 Jupyter 위젯으로, 둘 다 Python 실행에만 의미가 있고 재현할 *방법*이
없다.) 스킬 5개가 덮는 것은 이 중 5개, 대략 1/4이다.

| 미커버 소스 | 규모 | 글쓰기 품질과의 관계 |
|---|---|---|
| `enrichment/`(styler, enricher + 프롬프트 4) | — | 정보 보존 문체 이식·초안 확장. **팀에 문체 담당 자체가 없음** |
| `experimentation/proposition.py` | 576줄 | 0~9 채점 + 근거 + 확신도 + 개선권고의 채점 규약 |
| `validation/propositions.py` | 310줄 | 표준 명제 세트(persona_adherence, self_consistency, fluency, suitability, task_completion, divergence/convergence, quiet_recently) |
| `agent/action_generator.py` | 855줄 | 재생성 루프(임계 7, 최대 2회) + Jaccard 유사도 반복 차단 |
| `utils/semantics.py`·`behavior.py` | — | 관찰 대 기대 재구조화 → 교정 규칙 정식화 → 규칙 적용 |
| `agent/grounding.py`·`mental_faculty.py`·`tools/` | 422+430+ | 자료 근거, 도구 사용, WRITE_DOCUMENT |
| `agent/memory.py` | 1007줄 | 에피소드/의미 기억, 통합, 반추 |
| `steering/intervention.py` | 267줄 | 조건부 개입(precondition → effect) |
| `extraction/` 나머지(normalizer, reducer, reporter, exporter) | — | 유사 항목 병합, 축약, 보고서 |
| `experimentation/randomization.py`·`statistical_tests.py`·`in_place_experiment_runner.py` | 989줄 | A/B 판본 비교와 검정 |
| `validation/simulation_validator.py` | 2060줄 | 실증 데이터 대비 검증 |
| `profiling.py` | 1819줄 | 표본 설계·다양성 지수 |
| `control.py` | 840줄 | 캐시·체크포인트(재현성) |
| `environment/tiny_social_network.py` | 131줄 | 관계 그래프 기반 접근 제한 |

**(B) 공백이 런에서 실제로 드러난 자리 4곳.** 신규 역할의 근거는 추측이 아니라 기록이다.

| 런에서 관찰된 일 | 무엇의 부재였나 |
|---|---|
| 워커가 대기 중 `process/01-style-foundation.md`(문체 기조)를 자발 제작 | 문체 담당 부재 → `style-director` |
| "제빵 공정 시간, 적립 관행, 폐업 신고 기한·가산세 미검증" 경계 선언으로 종료 | 자료 근거 담당 부재 → `fact-grounder` |
| 분석가가 블라인드 복원율 0.84 테스트를 즉흥 설계 | 실험 담당 부재 → `experiment-runner` |
| 리드가 재고·현금·도장 칸 산술을 손으로 관리(런 기록: B차원 10점의 원인) | 원장 담당 부재 → `continuity-ledger` |

**(C) 구조적 불일치 3건.**
1. 에이전트 6명이 전부 "`tinytroupe-writing-room`의 워커"라고 선언하는데, `tt-focus-group`
   워크플로가 `persona-architect`·`tiny-person-actor`를 이미 재사용 중 — 문서와 실제 불일치.
2. TEAM.md는 "스킬이 지식의 단일 출처"라고 선언하는데, 에이전트 정의마다 "소스 근거" 섹션이
   중복돼 있다.
3. `tinytroupe-writing-room`이 5개 형식(단편·대화·모의 인터뷰·에세이·평가문)을 지원한다고
   적었으나 검증된 것은 픽션 단편 1편뿐이다.

**(D) 런 교훈 3건 미반영.** 팀 런 EXECUTION-FLOW §7의 "다음 런 개선"이 문서에만 남아 있다 —
잠정 표시, 판본 신호, 자수 예산.

---

## 2. 목표와 비목표

### 목표
1. §1.2(A)의 재현 대상 모듈 **13개 전부**를 스킬 10개에 반영한다. 스킬↔소스 대응을 명시해
   드리프트 점검이 기계적으로 가능하게 한다.
2. **글쓰기 품질**을 올린다. 구체적으로는 검증을 "노트를 주고 끝"에서
   **채점 → 교정 규칙 정식화 → 재생성 → 재채점**의 닫힌 루프로 바꾼다 (`ActionGenerator` 재현).
3. 1급 형식은 **픽션 서사(단편·장면)** 하나로 명시한다. 나머지 형식은 2급(공통 경로, 미검증
   명시)으로 강등해 §1.2(C)-3의 과잉 주장을 정정한다.
4. 부채 (C), (D)를 해소한다.

### 비목표
- 시장조사·광고평가·합성데이터 등 비(非)글쓰기 시나리오를 1급으로 만들지 않는다. 해당 모듈의
  **방법론은 스킬에 담되**, 파이프라인은 픽션 트랙만 설계한다.
- `tinytroupe/` 소스 수정, Python 실행, API 키 사용은 여전히 팀 범위 밖이다.
- 기존 실행 기록(`team-runs/`, `workflows/runs/`)은 수정하지 않는다. 과거 기록은 그 시점의
  사실이다.

---

## 3. 설계 원칙

1. **스킬 = 지식의 단일 출처, 에이전트 = 역할·범위·프로토콜.** 기존 TEAM.md 원칙을 유지하고,
   이번에 실제로 강제한다 — 에이전트 정의에서 "소스 근거" 서술을 제거하고 스킬 참조로 대체한다.
2. **스킬 하나 = 소스 클러스터 하나.** 각 스킬 첫머리에 근거 파일 목록을 둔다. 업스트림 머지 후
   그 파일들만 다시 읽으면 드리프트 점검이 끝난다.
3. **Python을 실행하지 않는다.** 모든 모듈은 "Claude가 문서로 수행하는 절차"로 번역한다.
   수치 파라미터(임계 7, 유사도 0.6, 점수 0~9 등)는 소스 기본값을 그대로 가져와 판단 기준으로 쓴다.
4. **읽기 전용이 기본.** 파일 저장은 리드가 한다. 예외는 §7의 fact-grounder 웹 모드뿐이며
   사용자 명시 허가를 요구한다.
5. **증거 경계 유지.** SIMULATED 표기, "실행됨"은 관찰된 것에만, 알 수 없는 런타임 ID는 null.

---

## 4. 스킬 지도 (5 → 10)

접두어는 기존 `tinytroupe-*`를 유지한다(워크플로의 `tt-*`와 구분).

### 4.1 `tinytroupe-personas` — 확장
- **근거**: `examples/agents/*.agent.json`, `examples/fragments/*`, `factory/tiny_person_factory.py`,
  `factory/prompts/generate_person.mustache`, `agent/tiny_person.py`(`define`, `import_fragment`,
  `define_relationships`, `related_to`, `internalize_goal`, `minibio`, `save/load_specification`),
  `validation/tiny_person_validator.py`
- **추가할 것**: 관계 정의(`define_relationships`, 대칭/비대칭 서술), 목표 내면화
  (`internalize_goal` — 인물이 스스로 품는 목표와 외부 지시의 구분), 시트 저장·로드 규약,
  minibio(짧은 소개문) 생성.
- 기존 내용(시트 필드, 프래그먼트 가산 병합, 0~1 검증)은 유지.

### 4.2 `tinytroupe-memory` — 신규
- **근거**: `agent/memory.py`(TinyMemory / EpisodicMemory / SemanticMemory / MemoryProcessor /
  EpisodicConsolidator / ReflectionConsolidator), `agent/mental_faculty.py`(RecallFaculty),
  `agent/tiny_person.py`(`consolidate_episode_memories`, `optimize_memory`,
  `retrieve_relevant_memories_for_current_context`, `summarize_relevant_memories_via_full_scan`)
- **담을 것**:
  - 에피소드 기억(시간순 버퍼 + 커밋된 에피소드)과 의미 기억(주제별 검색 가능한 지식)의 분리.
  - 에피소드 통합: 긴 트레이스를 에피소드 단위로 압축하되 **행동 근거는 보존**.
  - 반추(reflection): 통합된 기억에서 인물이 스스로 끌어내는 일반화.
  - 회상 규약: 최근 회상 / 관련성 회상(top_k) / 전체 스캔 요약의 사용 구분.
- **글쓰기에서의 쓰임**: 장면이 늘 때 "이 인물이 지금 기억하는 것 / 잊은 것"을 명시적으로 관리.
  픽션의 복선·회상 장면의 근거.

### 4.3 `tinytroupe-grounding` — 신규
- **근거**: `agent/grounding.py`(GroundingConnector, BaseSemanticGroundingConnector,
  LocalFilesGroundingConnector, WebPagesGroundingConnector), `agent/mental_faculty.py`
  (FilesAndWebGroundingFaculty, RecallFaculty, TinyToolUse), `agent/tiny_person.py`
  (`read_documents_from_folder/file/web`), `tools/tiny_tool.py`, `tools/tiny_word_processor.py`,
  `tools/tiny_calendar.py`, `extraction/artifact_exporter.py`
- **담을 것**:
  - 근거 소스 등록(로컬 폴더 / 웹 URL) → 관련성 검색 → 인용 규약.
  - "근거 있음 / 근거 없음 / 확인 불가" 3분류. 확인 불가 항목은 원고에 남기되 경계 선언에 올린다.
  - 도구 계약: 도구는 액션 정의(`actions_definitions_prompt`)와 제약
    (`actions_constraints_prompt`)을 함께 선언한다. `real_world_side_effects` 플래그의 의미.
  - WRITE_DOCUMENT: title/content(Markdown)/author, 한 번에 전부 쓰기, enricher 연결 시
    "원본의 5배 이상" 확장 요구가 붙는다는 점.

### 4.4 `tinytroupe-simulation` — 확장
- **근거**: `environment/tiny_world.py`, `environment/tiny_social_network.py`,
  `agent/prompts/tiny_person.mustache`
- **추가할 것**:
  - 시간 진행 단위: `run/skip` × minutes/hours/days/weeks/months/years — "건너뛰기"는 상호작용
    없이 시간만 흐르게 하는 도구(장면 사이 시간 경과).
  - broadcast 변종 4종: 발화 / 생각(`broadcast_thought`) / 내면 목표
    (`broadcast_internal_goal`) / 맥락 변경(`broadcast_context_change`).
  - 접근성 제어: `make_everyone_accessible` vs 관계 기반 제한.
  - **TinySocialNetwork**: 관계가 있는 상대에게만 REACH_OUT이 성립한다. 인물 관계도가
    상호작용 가능성을 물리적으로 제약하는 장치.
- 기존 내용(해석 프로토콜, 턴 루프, 트레이스 기록)은 유지.

### 4.5 `tinytroupe-steering` — 확장(구 `tinytroupe-story`)
- **근거**: `steering/tiny_story.py`, `steering/prompts/story.*.mustache`,
  `steering/intervention.py`
- **추가할 것 — Intervention**:
  - 전제조건 3종: 텍스트(LLM이 판단), 함수(코드가 판단 → Claude 재현에서는 "기계적으로
    확인 가능한 조건"), 명제(Proposition + 선택적 임계값).
  - 효과(effect)와 정당화(`precondition_justification`) 기록 의무.
  - `create_for_each`: 인물마다 같은 규칙을 개별 적용.
  - **글쓰기에서의 쓰임**: "긴장이 N비트 동안 오르지 않으면 X를 투입" 같은 조향 규칙을
    비트 플랜에 미리 박아 둔다. 조향이 즉흥이 아니라 사전 선언이 된다.
- 기존 story 규칙(purpose 결부, 그럴듯함, 흥미, 열린 결말, 일반 산문, requirements 우선)은 유지.
- 스킬 이름 변경에 따라 `[[tinytroupe-story]]` 참조를 전부 갱신한다.

### 4.6 `tinytroupe-quality` — 신규 (이번 재설계의 핵심)
- **근거**: `experimentation/proposition.py`, `validation/propositions.py`,
  `agent/action_generator.py`, `utils/semantics.py`, `utils/behavior.py`,
  `validation/validation_chamber.py`
- **담을 것**:

  **(a) 채점 규약 (Proposition).** 명제는 대상(트레이스/인물)에 대한 주장이다.
  - 점수 범위 **0~9**. 불리언 판정과 점수 판정을 구분해 쓴다.
  - 산출 4종 동반 필수: 값, **근거(justification)**, **확신도(confidence)**, **개선 권고**
    (`recommendations_for_improvement`).
  - 창(window): `first_n`/`last_n`으로 판단 범위를 제한한다(기본 5/10). 전체를 보면 흐려진다.
  - `double_check`: 다시 묻게 하면 더 엄격해진다 — 느리고 비싸므로 고위험 판정에만.
  - 전제조건 함수: 적용 대상이 아닌 경우 명제는 **자동 참**으로 처리(`전제 → P`).
  - `include_personas`: 시트를 맥락에 넣을지 여부. 페르소나 준수 판정에만 켠다.

  **(b) 표준 명제 세트.** 소스의 명제를 그대로 가져온다.
  | 명제 | 무엇을 재나 | 비고 |
  |---|---|---|
  | `persona_adherence` | 시트 준수(성격·스타일·신념·행동·기술 5기준 평균) | hard 변형은 **결함 1건당 −20%** |
  | `self_consistency` | 자기모순 — **행동만** 대상, 시트·자극 무시 | |
  | `fluency` | 반복·상투·기계적 어투 없음 | |
  | `suitability` | 상황·과제·목표에 적합 — 3조건 중 **하나만** 충족해도 만점 | 소스 기본값은 꺼짐 |
  | `task_completion` | 주어진 과제를 끝냈는가 | `{{task_description}}` 변수 |
  | `divergence` / `convergence` | 인물들이 서로 **갈라지는가 / 닮아가는가** | 환경 속성. **픽션 목소리 분화의 척도** |
  | `quiet_recently` | 연속 DONE으로 침묵 중인가 | 개입 트리거로 쓰임 |

  **(c) 재생성 루프 (ActionGenerator).**
  - 임계 **7**(0~9 기준), 최대 시도 **2회**.
  - 실패 시 우선순위: **재생성**(기본 켜짐) > 직접 교정(소스에서 기본 꺼짐 — "아직 잘 안 됨"으로
    표시돼 있음). 이 순서를 그대로 따른다.
  - `continue_on_failure`: 끝내 임계에 못 미치면 **마지막 시도본을 채택**한다(가장 많이 다듬어진
    판본이므로). 무한 루프 금지.
  - 통계 기록: 시도 수, 재생성 실패 수, 원본 통과율. 런 기록에 남긴다.

  **(d) 반복 차단 (Jaccard 유사도).**
  - 직전 행동과 타입·대상이 다르면 유사도 0. 같으면 내용의 Jaccard 유사도.
  - 임계 **0.6 초과면 반복으로 간주**하고 재생성. 픽션에서는 대사·묘사의 자기 표절 차단에 쓴다.

  **(e) 교정 규칙 정식화 (semantics).** 편집 피드백을 다음 판본의 규칙으로 바꾸는 3단계:
  1. `restructure_as_observed_vs_expected` — 피드백을 "관찰된 것 / 기대된 것"으로 재구조화.
  2. `formulate_corrective_rule` — 그 격차에서 **일반 규칙 한 문장**을 뽑는다.
  3. `correct_according_to_rule` — 다음 산출을 그 규칙에 비추어 교정한다.
  - 이 절차가 Gazpacho "with behavior correction" 노트북의 실체다. 노트를 규칙으로 승격시키면
    같은 지적이 반복되지 않는다.

### 4.7 `tinytroupe-enrichment` — 신규
- **근거**: `enrichment/tiny_styler.py`, `enrichment/tiny_enricher.py`,
  `enrichment/prompts/styler.system.mustache`, `enricher.system.mustache`
- **담을 것**:

  **(a) 문체 이식 (TinyStyler).** 규약이 엄격하다:
  - **모든 사실 정보를 보존한다** — 전문 용어, 이름, 날짜, 수치, 세부.
  - 의미·논점·정보량을 유지한다. 명시 요청 없이 추가·삭제하지 않는다.
  - 형식을 유지한다(Markdown → Markdown 등). 문단·목록·구조를 보존한다.
  - **변환했다는 사실을 절대 언급하지 않는다.** 원래 그 문체로 쓰인 것처럼 보여야 한다.
  - **패러디·과장 금지.** 자연스럽고 진짜처럼.
  - 보존 요구가 애매하면 보존 쪽으로 기운다.
  - 맥락 캐시: 과거 변환 결과를 참조해 일관된 문체를 유지한다.

  **(b) 확장 (TinyEnricher).**
  - 요구사항을 최대한 따르되, 별도 지시가 없으면 **더 많이** 쓴다(덜이 아니라).
  - 콘텐츠 유형을 유지한다.
  - 맥락 정보가 있으면 거기에 근거를 두고 모순을 피한다. 없으면 상상하되 내부 일관성을 지킨다.
  - 맥락 캐시로 **자기 반복을 피하고 앞선 확장 위에 쌓는다** — 개별 확장이 아니라 일관된 확장
    집합을 만드는 것이 목표.
  - 확장했다는 사실을 언급하지 않는다.
- **주의**: 확장은 분량을 늘린다. 분량 상한이 있는 원고에서는 §8의 자수 예산과 충돌하므로,
  확장은 "초안이 얇을 때"만 쓰고 상한 근처에서는 금지한다.

### 4.8 `tinytroupe-extraction` — 확장
- **근거**: `extraction/results_extractor.py`, `extraction/normalizer.py`,
  `extraction/results_reducer.py`, `extraction/results_reporter.py`,
  `extraction/artifact_exporter.py`, `extraction/prompts/*.mustache`
- **추가할 것**:
  - **Normalizer**: 자유 텍스트 항목 다수를 n개 대표 항목으로 병합하고 원본→대표 매핑을
    남긴다. 독자 반응 10건을 주제 3개로 묶을 때 쓴다. 매핑을 버리지 않는 것이 규약.
  - **ResultsReducer**: 트리거(자극/행동 유형)마다 축약 규칙을 등록해 트레이스를 표로 만든다.
  - **ResultsReporter**: 세 경로 — 에이전트에게 **직접 질문해** 보고서를 만드는 방식
    (`report_from_agents`), 상호작용에서 만드는 방식, 원자료에서 만드는 방식.
  - **ArtifactExporter**: 산출물 저장 규약(이름·형식). 팀에서는 리드가 파일을 쓰므로
    "무엇을 어떤 이름으로 남길지"의 규약으로만 번역한다.
- 기존 내용(objective/situation/fields 고정, 트레이스 근거만, SIMULATED)은 유지.

### 4.9 `tinytroupe-experiments` — 신규
- **근거**: `experimentation/randomization.py`(ABRandomizer),
  `experimentation/statistical_tests.py`(607줄),
  `experimentation/in_place_experiment_runner.py`, `validation/simulation_validator.py`(2060줄),
  `profiling.py`(1819줄), `control.py`(840줄)
- **담을 것**:
  - **A/B 무작위화**: 두 판본을 무작위 배정해 심사자에게 제시하고, 판정 후 되돌려
    (derandomize) 집계한다. 통과 이름(passthrough)은 섞지 않는다. — 제과점 런의 블라인드
    복원율 테스트를 정식 절차로.
  - **검정**: 표본이 작을 때(독자 3인) 무엇을 주장할 수 있고 없는지. 데이터 유형 판별
    (범주형/순서형/순위/비율/이진/개수)과 유형별 처리.
  - **실증 대비 검증**: 시뮬레이션 결과를 실제 데이터와 대조할 때의 통계·의미 이중 검증 구조와
    보고 형식. **이 팀에는 실제 데이터가 없으므로, 주로 "무엇을 주장하면 안 되는지"의 근거**로 쓴다.
  - **프로파일링**: 캐스트·독자 표본의 분포와 다양성 지수. "독자 3인이 서로 얼마나 다른가"를
    사전에 점검하는 도구.
  - **캐시·체크포인트**: 단계마다 산출물을 확정 저장하고, 재실행 시 확정분을 재사용한다.
    Claude 재현에서는 런 디렉터리의 번호 붙은 파일이 곧 체크포인트다. 파일이 교체되면
    이후 단계는 무효 — 워크플로 런 기록이 관찰한 "캐시가 왜 필요한가"의 답.

### 4.10 `tinytroupe-writing-room` — 재작성
- **근거**: README 원칙 #6(실험 지향), `.claude/agents/`, 두 런의 EXECUTION-FLOW
- **바뀌는 것**: §5 로스터, §6 파이프라인, §8 운영 규칙을 담는다. 1급 형식은 픽션 서사
  하나임을 명시하고, 나머지 형식은 "공통 경로로 처리하되 미검증"이라고 정직하게 적는다.

---

## 5. 에이전트 로스터 (6 → 10)

에이전트 정의에서 **"소스 근거" 서술을 제거**하고 "로드할 스킬" 한 줄로 대체한다(부채 C-2).
소속 선언도 `tinytroupe-writing-room의 워커` → **`TinyTroupe 팀의 워커`**로 바꾼다(부채 C-1) —
포커스 그룹 워크플로가 이미 일부를 재사용하고 있기 때문이다.

| 에이전트 | 상태 | 로드 스킬 | 과제 | 반환물 |
|---|---|---|---|---|
| `persona-architect` | 기존·강화 | personas, memory | 캐스트 브리프 | 시트 + 관계도 + 검증 노트(0~1) |
| `scene-orchestrator` | 기존·강화 | simulation, steering | 전제 + 캐스트 | 씬/비트 플랜 + **개입 규칙**(전제→효과) |
| `narrative-synthesist` | 기존·강화 | steering, enrichment | 시트 + 비트 + 목적/분량 | 초안 (얇으면 확장 규약 적용) |
| `audience-reaction-analyst` | 기존·강화 | simulation, extraction, experiments | 초안 | SIMULATED 독자 반응 + 정규화 요약 + 표본 다양성 점검 |
| `consistency-editor` | 기존·강화 | quality | 초안 + 시트 + 브리프 | **명제별 0~9 채점 + 근거·확신도·개선권고 + 교정 규칙** |
| `tiny-person-actor` | 기존·유지 | simulation | 시트 + 트레이스 + 자극 | 이번 턴 행동만 |
| `style-director` | **신규** | enrichment | 브리프 (+ 참조 문체 표본) | ① 초안 전: 문체 사양서 ② 최종: 정보 보존 문체 이식본 |
| `fact-grounder` | **신규** | grounding | 브리프 + 초안 | 근거 목록(근거 있음/없음/확인 불가 3분류) + 인용 위치 |
| `continuity-ledger` | **신규** | memory, quality | 시트 + 비트 + 초안 | 설정 원장(산술·시간·사물·기억) + 대조 결과 |
| `experiment-runner` | **신규** | experiments | 판본 2개 + 판정 기준 | 블라인드 배정표 + 판정 집계 + 주장 가능 범위 |

전원 `Read, Grep, Glob` 읽기 전용 유지. 예외는 §7의 fact-grounder 웹 모드.

### 5.1 신규 에이전트의 경계

- **style-director**: 문체를 *정하고 이식*한다. 내용을 바꾸지 않는다 — 사실·수치·구조를 하나도
  건드리지 않는 것이 TinyStyler 규약의 핵심이다. 이식 후 정보 손실이 있으면 그 자체가 실패다.
- **fact-grounder**: 사실을 *확인*하지 별도로 *창작하지 않는다*. 픽션의 허구 요소와 현실 근거가
  필요한 요소를 구분해 후자만 다룬다. 확인 불가 항목을 숨기지 않는다.
- **continuity-ledger**: 원장을 *관리*하지 원고를 고치지 않는다. 불일치를 위치와 함께 보고한다.
- **experiment-runner**: 배정과 집계를 하지 *판정하지 않는다*. 판정은 심사자(에디터·독자)의 일.
  표본이 작을 때 "통계적으로 유효"라고 말하지 않는다.

---

## 6. 픽션 파이프라인 (1급)

```
0. 브리프 (리드)  — 목적 / 독자 / 제약 + 분량 상한
   │
   ├─ 1a. style-director   문체 사양서            ─┐ 병렬
   └─ 1b. fact-grounder    근거 목록 + 확인 불가   ─┘  (초안보다 먼저 고정 — 실험 지향)
   │
2. persona-architect   시트 + 관계도 + 검증(0~1, <0.6이면 재작성)
   │
3. scene-orchestrator  비트 플랜 + 개입 규칙(전제→효과)
   │
4. continuity-ledger   원장 개설 (산술·시간·사물·기억의 초기값)
   │
5. narrative-synthesist  초안 v1
   │
6. 병렬 검증 ──────────────────────────────────────────────
   │  consistency-editor      명제 7종 채점(0~9) + 근거·확신도·개선권고
   │  audience-reaction-analyst  SIMULATED 독자 (표본 다양성 사전 점검)
   │  continuity-ledger       원장 대조
   │  experiment-runner       (판본이 2개일 때만) 블라인드 A/B
   └──────────────────────────────────────────────────────
   │
7. 리드: 교정 규칙 정식화  관찰 대 기대 → 규칙 한 문장씩
   │
8. 재생성 루프  임계 7 미달 항목만 표적 수정 · 최대 2회 · 유사도 0.6 초과 시 반복으로 반려
   │            └ 끝내 미달이면 마지막 판본 채택 + 미달 항목을 런 기록에 명시
   │
9. style-director   최종 문체 이식 (정보 보존 검사 동반)
   │
10. 리드: 최종 통합 + 실측(자수) + 런 기록 작성
```

### 6.1 2급 형식 처리
에세이·대화·모의 인터뷰·평가문은 같은 파이프라인에서 3번(비트 플랜)을 형식에 맞게 대체하고
진행하되, **"이 형식은 팀 런으로 검증된 바 없음"을 브리프와 런 기록에 명시**한다. 검증되면
그때 1급으로 승격한다.

---

## 7. fact-grounder 두 모드

| | 저장소 모드 (기본) | 웹 모드 |
|---|---|---|
| 도구 | `Read, Grep, Glob` | + `WebFetch`, `WebSearch` |
| 재현 대상 | `LocalFilesGroundingConnector` | + `WebPagesGroundingConnector` |
| 근거 범위 | 저장소 내 파일, 사용자가 지정한 폴더 | 외부 문서 |
| 활성 조건 | 기본값 | **사용자의 명시적 허가가 이번 런에 있을 때만** |
| 경계 | 외부 전송 없음 | 워커가 외부로 질의를 보낸다 — "전원 읽기 전용" 원칙의 예외임을 런 기록에 남긴다 |

웹 모드가 꺼져 있으면 확인 불가 항목은 **확인 불가로 남긴다.** 추측으로 메우지 않는다.

---

## 8. 런에서 나온 교훈 3건의 반영 위치 (부채 D)

| 교훈 | 반영 위치 | 규칙 |
|---|---|---|
| **잠정 표시** | 전 에이전트 정의 공통 조항 | 확정 전 산출물에 근거해 낸 판단에는 "잠정"을 붙인다. 판정 번복 2회의 원인이 시트만 보고 낸 조기 판단이었다 |
| **판본 신호** | `tinytroupe-writing-room` 운영 규칙 + 전 에이전트 | 파일 교체 시 리드가 전체 브로드캐스트, 워커는 채점 전 헤더의 판본 표기를 확인. **현재 저장본 = 유일 기준** |
| **자수 예산** | `tinytroupe-writing-room` + `tinytroupe-enrichment` | 분량 상한 근처의 수정 지시에는 항상 순증/순감 예산을 명기. 상한 근처에서 enricher 확장 금지 |

---

## 9. 워크플로 반영

- `tt-writing-room.js`: §6 파이프라인으로 갱신 — 1a/1b 병렬 선행 단계, 6번 병렬 검증에
  원장 대조 추가, 7~8번 교정 규칙 + 재생성 루프(임계 7·최대 2회), 9번 문체 이식 단계 추가.
- `tt-focus-group.js`: 로직 변경 없음. 재사용하는 에이전트의 소속 표기 변경(§5)에 맞춰
  주석·라벨만 정정.
- 두 스크립트의 args 정규화 방어(JSON 문자열 파싱)는 이미 반영돼 있다 — 유지.

---

## 10. 마이그레이션 순서

각 단계는 독립적으로 되돌릴 수 있어야 한다.

1. **부채 정리 (구조)** — 에이전트 6개에서 "소스 근거" 섹션 제거, 소속을 "TinyTroupe 팀"으로
   변경, TEAM.md 로스터·형식 주장 정정. 기능 변화 없음.
2. **품질 스킬** — `tinytroupe-quality` 신설. `consistency-editor`를 여기에 연결.
   이 단계만으로 검증 루프가 닫힌다(가장 큰 품질 효과).
3. **문체·근거** — `tinytroupe-enrichment`, `tinytroupe-grounding` 신설 +
   `style-director`, `fact-grounder` 추가.
4. **지속성** — `tinytroupe-memory` 신설 + `continuity-ledger` 추가,
   `tinytroupe-simulation`·`tinytroupe-steering` 확장(관계망·개입).
5. **실험·집계** — `tinytroupe-experiments` 신설 + `experiment-runner` 추가,
   `tinytroupe-extraction`·`tinytroupe-personas` 확장.
6. **오케스트레이션** — `tinytroupe-writing-room` 재작성, 워크플로 갱신, TEAM.md 최종 갱신.
7. **검증 런** — 새 파이프라인으로 픽션 단편 1편을 처음부터 끝까지 돌리고
   `.claude/team-runs/`에 전 과정을 기록한다.

---

## 11. 성공 기준

재설계가 성공했는지는 7단계 검증 런으로 판정한다.

1. **커버리지**: 스킬 10개의 근거 파일 목록이 §1.2(A)의 재현 대상 13개 모듈을 빠짐없이
   가리킨다 — 모듈마다 최소 1개 스킬이 참조. (`clients/`, `ui/`는 제외 대상이므로 미참조가 정상)
2. **품질 루프 작동**: 검증 런에서 임계 7 미달 항목이 최소 1건 발생하고, 교정 규칙으로
   정식화되어 재생성 후 통과한다. 루프가 한 번도 돌지 않으면 기구가 있는지 알 수 없다.
3. **반복 차단 작동**: 유사도 판정이 실제로 한 번 이상 적용된 기록이 남는다.
4. **문체 이식의 정보 보존**: 이식 전후로 사실·수치·고유명사 손실 0건.
5. **정직성**: 확인 불가 사실 항목이 은폐되지 않고 경계 선언에 오른다.
6. **부채 해소**: §1.2 (C) 3건, (D) 3건이 전부 반영됐음을 파일에서 확인할 수 있다.

품질 비교(«은성제과» 대비 더 나은 원고인가)는 **성공 기준에 넣지 않는다** — 다른 주제의
단발 비교로는 판정할 수 없다. 대신 위 6개는 전부 관찰 가능하다.

---

## 12. 리스크

| 리스크 | 완화 |
|---|---|
| 스킬 10개·에이전트 10명으로 커져 리드의 조율 부담이 증가 | 파이프라인이 단계를 고정하므로 리드는 순서를 따르기만 하면 된다. 워크플로 버전이 같은 절차를 자동화한다 |
| 확장(enricher)과 자수 예산의 충돌 | §8 규칙 — 상한 근처에서 확장 금지 |
| 채점 항목이 7종으로 늘어 검증이 느려짐 | 명제마다 `first_n/last_n` 창을 두고, `double_check`는 고위험 항목에만 |
| 웹 모드가 "전원 읽기 전용" 원칙을 깬다 | 기본 꺼짐 + 명시 허가 + 런 기록에 예외 표기 |
| 소스를 번역하는 과정에서 스킬이 원본과 어긋남(드리프트) | 스킬마다 근거 파일 목록 고정 — 업스트림 머지 후 그 파일만 재확인 |
| 신규 역할 4명이 실제로는 놀게 될 가능성 | 검증 런에서 각 역할의 산출물이 최종 원고에 실제로 반영됐는지 기록으로 확인. 반영 0건인 역할은 다음 개정에서 통합·삭제 |

---

## 13. 미해결 가정

- 2급 형식(에세이·대화·모의 인터뷰·평가문)의 파이프라인 대체 단계는 실제로 그 형식을 쓸 때
  결정한다. 지금 설계하면 미검증 추측이 하나 더 늘 뿐이다.
- `simulation_validator.py`의 실증 대비 검증은 이 팀에 실제 데이터가 없어 "주장 금지 근거"로만
  쓴다. 실제 독자 데이터가 생기면 그때 절차를 확장한다.
- `ValidationChamber`는 소스에서 docstring만 있는 스텁이다. 스킬에는 개념만 적고 절차는 만들지
  않는다 — 없는 것을 있는 것처럼 재현하지 않는다.

---

## 14. 증거 경계 (변경 없음)

- 페르소나와 그 반응은 **SIMULATED**다. 실제 인간 조사·설문·통계로 제시하지 않는다.
- 구성(스킬·에이전트 정의)은 실행 기록이 아니다. "실행됨"은 실제 관찰된 Agent/Workflow
  결과에 대해서만 말한다. 알 수 없는 런타임 ID는 null로 둔다.
- 추출 결과는 트레이스에 있는 발화만 근거로 한다.
- 이 문서 §1.1·§1.2의 런 관찰은 `.claude/team-runs/2026-08-02-bakery-last-day/EXECUTION-FLOW.md`와
  `.claude/workflows/runs/2026-08-02-focus-group-subscription/EXECUTION-FLOW.md`에 기록된 사실이다.
