# 4장: TinyWorld와 관계 네트워크

`TinyWorld`는 participant를 담는 배열 이상의 역할을 한다. simulation clock을 움직이고,
누가 누구에게 접근할 수 있는지 유지하며, agent action을 환경 효과로 해석한다.

## 환경이 소유하는 상태

- `current_datetime`: 각 action과 memory에 붙는 simulation 시간
- `agents`와 `name_to_agent`: 참여자 registry
- `interventions`: step마다 조건을 검사할 환경 변화
- communication buffer: notebook/console 표시와 cache 재생에 쓰이는 출력
- simulation step과 cost 통계

시간은 실제 wall clock과 다르다. `run_minutes`, `run_days` 같은 helper는 step마다
`timedelta`를 넘겨 simulation clock을 전진시킨다. `skip_*`은 행동 없이 시간만 보낸다.

## 관계는 prompt의 접근 가능성을 바꾼다

TinyPerson system prompt에는 현재 접근 가능한 agent 목록이 들어간다. `REACH_OUT`이
성공하거나 환경이 `make_everyone_accessible()`을 호출하면 이 목록이 바뀐다. 따라서
사회적 연결은 단순 시각화가 아니라 다음 행동 생성의 입력이다.

`TinySocialNetwork`는 relation graph를 가진 `TinyWorld`다. 매 step 전에 모든 접근성을
지우고 relation에 포함된 쌍만 다시 연결한다. 같은 relation에 없는 상대에게는
`REACH_OUT`할 수 없다는 환경 규칙도 추가한다.

<div class="mermaid">
flowchart TB
  W["TinyWorld step"]
  I["Intervention 검사"]
  A["각 TinyPerson.act()"]
  H["환경 action handler"]
  S["다른 사람의 stimulus"]
  C["다음 step의 context"]
  W --> I --> A --> H --> S --> C --> W
</div>

## 시각 자극도 같은 경로를 따른다

`TinyPerson.see()`는 이미지 path, URL 또는 data URI를 짧은 image ID로 등록하고 vision
model로 설명을 만든다. `SHOW` action이 나오면 TinyWorld는 source agent의 registry에서
ID를 실제 참조로 풀어 대상의 `see()`에 전달한다.

이미지 설명은 즉시 semantic memory에 넣지 않고 episodic stimulus에 보존한 뒤 consolidation
경로에서 처리한다. 이 설계는 “봤다”는 사건과 “그 경험에서 장기적으로 무엇을 배웠다”를
분리한다.

## 병렬성에서 읽어야 할 한계

한 step에서 병렬 실행한 사람들은 서로의 **그 step 결과를 생성 중에는 보지 못한다**.
환경은 모든 future가 끝난 뒤 action을 전달한다. 실시간 대화처럼 보이더라도 실제 실행
인과는 step boundary를 따른다. 순서 민감한 대화를 모델링하려면 여러 step이나 sequential
실행을 설계해야 한다.

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_world.py">TinyWorld 전체</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_social_network.py">TinySocialNetwork</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/tiny_person.py#L966-L1148">visual stimulus</a>
</div>
