# 2장: 한 번의 시뮬레이션이 지나가는 길

TinyTroupe의 최소 실행은 “사람을 정의하고, 자극을 넣고, 행동시킨다”다. 여러 사람이
있다면 환경이 이 과정을 step 단위로 반복한다.

```python
person.listen("새 제품 설명을 읽고 첫인상을 말해 주세요.")
actions = person.act(return_actions=True)

world = TinyWorld("focus group", agents=[person_a, person_b])
trajectory = world.run(steps=3, return_actions=True)
```

## 단일 TinyPerson의 한 turn

1. `listen`, `see`, `think`, `internalize_goal`이 외부 사건을 stimulus로 episodic memory에 쓴다.
2. `act()`가 persona, mental state, 최근 memory를 이용해 system prompt를 다시 만든다.
3. `ActionGenerator`가 구조화된 action sequence를 요청한다.
4. 각 action을 memory와 action buffer에 기록한다.
5. mental faculty가 자신이 처리할 action의 side effect를 수행한다.
6. `DONE`에서 turn이 끝나고 episode consolidation을 시도한다.

<div class="mermaid">
sequenceDiagram
  participant X as Experimenter
  participant P as TinyPerson
  participant M as Episodic Memory
  participant L as LLM Client
  X->>P: listen / see / think
  P->>M: stimulus 저장
  X->>P: act()
  P->>M: 최근 경험 조회
  P->>L: persona + state + memory + stimulus
  L-->>P: actions[] + cognitive_state
  loop DONE 전까지
    P->>M: action 저장
    P->>P: faculty side effect
  end
  P->>M: episode commit / consolidation
</div>

## TinyWorld의 한 step

`TinyWorld._step()`은 먼저 simulation 시간을 전진시키고 intervention을 검사한다. 그 다음
참여자를 순차 또는 thread pool 병렬로 `act()`시킨다. 모든 participant가 낸 action은
환경의 `_handle_actions()`로 들어간다.

- `REACH_OUT`: 두 사람을 서로 접근 가능한 관계로 만든다.
- `TALK`: 대상의 `listen()`으로 발화를 전달한다.
- `SHOW`: source의 image registry에서 실제 참조를 찾아 대상의 `see()`로 전달한다.
- target을 찾지 못하고 `broadcast_if_no_target=True`면 발화나 이미지를 다른 사람에게 방송한다.

여기서 중요한 점은 LLM이 직접 다른 LLM 세션을 호출하지 않는다는 것이다. 각 사람이
action JSON을 내고, **환경 코드가 그 action을 다음 사람의 stimulus로 변환**한다.

## 병렬 실행의 의미

`parallel_agent_actions=True`이면 한 step의 사람들은 동시에 행동을 생성한다. 결과는 모든
future가 끝난 뒤 환경이 처리한다. 따라서 병렬화는 속도를 높이지만, 같은 step 안에서
누가 먼저 말했는지에 따른 순차적 반응을 자동으로 모델링하지 않는다. 그런 인과 순서가
필요하면 sequential mode와 agent ordering을 명시해야 한다.

<div class="truth-note">
<strong>실행 단위</strong>
TinyPerson의 turn은 action sequence가 DONE에 도달하는 단위다. TinyWorld의 step은 여러
TinyPerson turn을 모아 환경 효과를 적용하는 단위다. 이 둘을 Claude/OpenCode의 chat
turn이나 child-agent task와 동일시하면 안 된다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/tiny_person.py#L647-L910">TinyPerson.act</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_world.py#L100-L258">TinyWorld step/run</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_world.py#L522-L642">action handlers</a>
</div>
