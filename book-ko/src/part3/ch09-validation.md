# 9장: 실험과 경험 자료 검증

TinyTroupe는 simulation을 한 번 실행하고 인상적인 문장을 고르는 방식에서 벗어나려 한다.
`InPlaceExperimentRunner`는 여러 조건을 파일에 기록해 순서대로 실행하고, validation
계층은 simulation treatment를 empirical control과 비교한다.

## in-place experiment

runner의 JSON config는 experiment 목록, active experiment, 완료 상태와 result를 보존한다.
같은 notebook/script를 반복 실행하면서 다음 조건으로 이동할 수 있다.

1. experiment를 등록한다.
2. 다음 unfinished experiment를 활성화한다.
3. 해당 조건으로 simulation을 실행한다.
4. 결과를 active experiment에 기록한다.
5. 완료 표시 후 다음 조건을 실행한다.

이는 experiment scheduling과 result bookkeeping을 제공하지만, 무작위 배정이나 blind
evaluation을 자동으로 보장하지 않는다.

## empirical validation

`SimulationExperimentDataset`은 metric별 agent value, justification과 summary를 정규화한다.
`SimulationExperimentEmpiricalValidator`는 두 비교 경로를 제공한다.

- statistical: Welch t-test, KS test, Mann-Whitney 같은 검사와 effect size
- semantic: control과 treatment justification의 의미적 proximity

`overall_score`는 통계 effect size를 similarity로 바꾼 값과 semantic score를 조합한다.
이 수식은 프로젝트가 정의한 지표이지 보편적으로 합의된 simulation fidelity 척도는 아니다.

<div class="mermaid">
flowchart LR
  C["실제 control data"] --> V["Empirical Validator"]
  T["simulation treatment data"] --> V
  V --> ST["통계 비교"]
  V --> SE["의미 비교"]
  ST --> R["report + score"]
  SE --> R
</div>

## 검증 결과를 읽는 순서

1. control 자료가 실제로 어떤 모집단과 측정 과정을 대표하는지 확인한다.
2. treatment의 persona와 질문이 control의 조건과 비교 가능한지 확인한다.
3. metric data type과 결측치 처리 방식을 확인한다.
4. p-value뿐 아니라 effect size, sample size와 방향을 읽는다.
5. semantic score가 또 다른 LLM 판정임을 명시한다.
6. 실패·누락된 metric을 전체 score 하나로 숨기지 않는다.

현재 semantic summary 비교가 invalid value를 내면 내부에서 `0.5`를 대입하는 경로가 있다.
따라서 성공한 실제 평가와 중립 fallback을 같은 evidence로 제시하면 안 된다.

<div class="truth-note">
<strong>실제 사람과 비교하기</strong>
TinyTroupe가 제시하는 가장 강한 태도는 “simulation이 설득력 있다”가 아니라, 동일
질문에 대한 실제 자료를 control로 두고 차이를 측정하는 것이다. 그래도 비교 점수는
자료와 지표의 조건 안에서만 의미가 있다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/experimentation/in_place_experiment_runner.py">InPlaceExperimentRunner</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/validation/simulation_validator.py">empirical validator</a>,
<a href="https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/publications">paper artifacts</a>
</div>
