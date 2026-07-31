# 8장: proposition, intervention과 story

TinyTroupe의 trajectory는 관찰 대상이면서 다음 simulation을 조정하는 입력이 된다.
`Proposition`, `Intervention`, `TinyStory`는 각각 판정, 조건부 변화, 서사화를 담당한다.

## Proposition

`Proposition`은 agent/world의 persona와 interaction context를 구성하고, textual claim이
참인지 또는 0~9 중 어느 정도인지 LLM에게 평가시킨다. justification, confidence와
follow-up chat도 보존한다.

이 값은 formal logic engine의 증명이나 사람이 labeling한 ground truth가 아니다. 동일
모델이 simulation과 평가 양쪽에 관여할 수 있으므로 evaluator bias도 고려해야 한다.
특히 현재 score prompt는 판단 자료가 없을 때 최고점을 주도록 지시한다. “관찰되지 않음”을
“잘 지켰음”으로 읽지 않도록 별도 evidence completeness가 필요하다.

## Intervention

intervention은 다음 세 종류의 precondition을 조합할 수 있다.

- text precondition: Proposition으로 LLM 판정
- functional precondition: Python boolean 함수
- propositional precondition: 기존 Proposition의 bool 또는 score

조건을 통과하면 user-defined effect function이 target person/world에 적용된다. TinyWorld는
매 step에서 agent를 행동시키기 전에 intervention을 검사한다.

## TinyStory

`TinyStory`는 agent 또는 world의 first/last interaction을 가져와 story start나 continuation
prompt를 만든다. simulation trace를 새 서사로 바꾸는 steering helper이지, raw trajectory
자체가 아니다.

<div class="mermaid">
flowchart LR
  T["simulation trajectory"] --> P["Proposition 판정"]
  P --> I["Intervention 조건"]
  I --> W["world/person 상태 변경"]
  T --> S["TinyStory 서사화"]
  W --> T2["다음 trajectory"]
</div>

## 코드에서 읽어야 할 현재 주의점

현재 `set_propositional_precondition()`의 threshold 경로는 score가 threshold 이상일 때
내부 check를 false로 바꾸는 구현이다. 일반적인 “이상일 때 실행” 의미와 반대로 보일 수
있으므로 실제 사용 전 기대 동작을 소스와 실행으로 확인해야 한다.

또한 effect function을 설정하지 않고 precondition만 통과하면 `None`을 호출하게 된다.
이 계층은 완성된 no-code rule engine이 아니라 실험자가 Python으로 구성하는 API다.

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/experimentation/proposition.py">Proposition</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/steering/intervention.py">Intervention</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/steering/tiny_story.py">TinyStory</a>
</div>
