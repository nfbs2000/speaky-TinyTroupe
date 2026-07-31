# 1장: TinyTroupe는 무엇인가

TinyTroupe가 시뮬레이션하는 대상은 “업무를 완료하는 assistant”가 아니라 **특정 배경,
성향, 목표와 맥락을 가진 사람의 가능한 반응**이다. 실험자는 질문을 던지고, 상황을
바꾸고, 가상 인물끼리 대화하게 한 뒤, 나온 궤적을 분석한다.

## 핵심 객체

| 객체 | 소유하는 것 | 소유하지 않는 것 |
| --- | --- | --- |
| `TinyPerson` | persona, 현재 정신 상태, 기억, 행동 생성 | 실제 인간의 정체성이나 실제 의견 |
| `TinyWorld` | 시간, 참여자, 접근 관계, 행동 전달, intervention | 현실 세계의 물리 법칙이나 사회적 진실 |
| `TinyPersonFactory` | persona 생성과 표본 계획 | 검증된 인구 표본 추출 |
| `ResultsExtractor` | 상호작용에서 목적별 JSON 추출 | 추출 결과의 사실성 보장 |
| `Proposition` | 궤적에 대한 LLM 판정·점수 | 독립적인 경험 자료 검증 |
| `SimulationExperimentEmpiricalValidator` | simulation과 control 자료의 통계·의미 비교 | 자동으로 수집된 현실 자료 |

원 README도 “helpful assistant”와 “human simulation”을 구분한다. 이 차이는 홍보 문구에만
있지 않다. 소스는 persona prompt, 환경 step, simulation timestamp, extraction objective,
control/treatment dataset을 각각 별도 객체로 둔다.

## 왜 multiagent인가

여러 `TinyPerson`이 같은 `TinyWorld`에 들어가면 각 사람은 자신의 기억과 persona로
행동하고, 환경은 `TALK`, `REACH_OUT`, `SHOW` 같은 행동을 다른 사람의 자극으로 전달한다.
따라서 집단 반응과 관계 변화는 볼 수 있지만, 중앙 orchestrator가 하위 작업을 나누고
결과를 합치는 팀 실행은 아니다.

<div class="mermaid">
flowchart LR
  E["실험자: 질문과 조건"] --> W["TinyWorld"]
  W --> P1["TinyPerson A"]
  W --> P2["TinyPerson B"]
  P1 -->|"TALK / SHOW"| W
  P2 -->|"TALK / SHOW"| W
  W --> T["상호작용 궤적"]
  T --> X["추출·보고·검증"]
</div>

## 프로젝트가 지향하는 사용법

- 광고나 제품 제안을 가상 독자 관점에서 탐색한다.
- 인터뷰나 focus group의 질문 설계를 미리 연습한다.
- 서로 다른 persona가 같은 장면을 어떻게 해석할지 비교한다.
- simulation 결과를 구조화 데이터로 추출해 후속 분석에 사용한다.
- 가능하면 실제 조사 자료와 simulation 결과를 비교한다.

<div class="risk-note">
<strong>그럴듯함은 대표성이 아니다</strong>
persona가 구체적이고 문장이 자연스럽다는 사실은 해당 반응이 실제 인구의 분포를
대표한다는 뜻이 아니다. TinyTroupe 자체도 연구·실험 기술이며 직접 의사결정보다
insight generation에 사용하라고 경고한다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/README.md#principles">README Principles</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/tiny_person.py#L29">TinyPerson</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_world.py#L20">TinyWorld</a>
</div>
