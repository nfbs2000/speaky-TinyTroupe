# 12장: 무엇을 증명하고 무엇을 증명하지 못하는가

TinyTroupe의 강점은 사람처럼 말하는 여러 persona가 아니다. persona, environment,
trajectory, extraction과 validation을 분리해 **어떤 조건에서 어떤 가능한 반응이
나왔는지 실험 가능한 형태로 만드는 것**이다.

## 코드가 실제로 제공하는 것

- persona와 mutable mental state를 분리한 simulated person
- 구조화 action과 환경 기반 message/image 전달
- 시간, 관계, intervention이 있는 multi-person world
- episodic event와 semantic consolidation
- local/web grounding과 explicit consult action
- LLM 기반 extraction·report와 rule 기반 reduction
- experiment condition bookkeeping
- empirical control과의 통계·semantic 비교
- simulation transaction cache와 checkpoint
- token/call cost 관찰

## 자동으로 증명하지 않는 것

- 실제 사람이 같은 반응을 한다는 사실
- factory가 현실 인구를 대표한다는 사실
- simulation에서 관찰된 상관이 현실의 인과라는 주장
- LLM evaluator 점수가 객관적인 ground truth라는 주장
- cache replay가 모든 외부 조건까지 재현한다는 주장
- 자연스러운 persona 대화가 편향과 stereotype에서 자유롭다는 주장
- TinyPerson 여러 명이 Claude/OpenCode의 task-routing team이라는 주장

## 실험 결과를 공개할 때 최소 표기

```text
목적과 가설
TinyTroupe source version
model / api type / config
persona 생성 방식과 sampling input
world, step, time, ordering과 intervention
raw interaction 범위
extraction 또는 reduction 방법
실제 control data의 출처
실패, 누락, fallback과 비용
결론이 적용되는 범위
```

## 다른 agent 시스템과 섞지 않는 방법

TinyTroupe는 persona simulation library이고, Claude/OpenCode/Codex의 task-routing team이
아니다. 다른 agent 시스템 위에 TinyTroupe 개념을 올릴 수는 있지만, 그 경우에도 실행
증거와 simulation 결과를 분리해야 한다.

- TinyTroupe는 character, simulated reader, world와 possible reaction이라는 설계 관점을 준다.
- Claude/OpenCode/Codex worker 실행은 별도의 runtime evidence가 있어야 말할 수 있다.
- 공개 manifest가 있다면 그것은 worker 실행의 근거이지 TinyPerson이 현실 사람처럼
  검증됐다는 근거가 아니다.
- 생성된 글과 simulated reader 반응은 creative artifact이며 실제 인간 독자 연구 결과가 아니다.

이 구분을 유지하면 TinyTroupe는 “가짜 사람에게 물어보고 사실처럼 말하는 도구”가 아니라,
질문과 관점을 넓히고 실제 검증이 어디 필요한지 드러내는 실험 도구가 된다.

<div class="truth-note">
<strong>최종 판단</strong>
TinyTroupe를 잘 사용한다는 것은 simulation을 현실로 착각하지 않는 것이다. 관찰된
trajectory, 모델이 추출한 해석, 실제 경험 자료를 서로 다른 층으로 남길 때 프로젝트의
실험 지향 철학이 살아난다.
</div>

## 다음 읽기

- [upstream README](https://github.com/microsoft/TinyTroupe)
- [TinyTroupe paper](https://arxiv.org/abs/2507.09788)
- [소스 지도와 출처](../source-map.md)
