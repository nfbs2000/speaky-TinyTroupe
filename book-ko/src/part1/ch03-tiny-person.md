# 3장: TinyPerson과 행동 문법

`TinyPerson`은 단순히 system prompt 하나를 가진 chat wrapper가 아니다. persona 정의,
현재 인지 상태, 접근 가능한 사람, episodic/semantic memory, action generator와 mental
faculty를 묶은 simulation entity다.

## persona와 현재 상태

persona에는 이름, 나이, 국적, 직업뿐 아니라 성격, 선호, 믿음, 행동 습관, 관계를 넣을 수
있다. `define()`은 nested 값을 넣고, `import_fragment()`는 재사용 가능한 persona 조각을
합친다. 반면 mental state는 simulation 중 바뀌는 위치, 맥락, 관심, 목표와 감정을 담는다.

| 비교 | persona | mental state |
| --- | --- | --- |
| 의미 | 비교적 지속적인 인물 명세 | 지금 이 순간의 인지 조건 |
| 예 | 직업, 성향, 선호, 관계 설명 | 위치, 접근 가능한 사람, 목표, 감정 |
| 변경 경로 | `define`, fragment, specification load | stimulus와 action의 cognitive state |

## action은 자유 텍스트가 아니다

`ActionGenerator`는 모델 출력에서 action 또는 action sequence를 구조화한다. 기본 행동에는
생각, 대화, 관계 접근과 종료가 있고, mental faculty와 `TinyTool`이 추가 action 정의와
제약을 prompt에 보탠다.

```json
[
  {"type": "THINK", "content": "무엇을 확인할지 정리한다", "target": ""},
  {"type": "TALK", "content": "첫인상을 설명한다", "target": "Alex"},
  {"type": "DONE", "content": "", "target": ""}
]
```

`DONE`이 빠지면 multi-action mode가 방어적으로 추가한다. 한 turn의 최대 action 수는 15다.
연속 action의 Jaccard similarity가 임계치를 넘으면 반복 행동을 버리고 인위적인 `DONE`으로
교체하며, 그 사실을 feedback memory에 남긴다.

## 생성 뒤 품질 검사가 한 번 더 있을 수 있다

ActionGenerator는 persona adherence, self-consistency, fluency, suitability 같은
`Proposition`을 이용해 후보 action을 평가하고 재생성할 수 있다. 그러나 현재 기본
`config.ini`에서는 `ENABLE_QUALITY_CHECKS=False`다. 코드에 검사기가 존재한다는 사실과
기본 실행에서 실제 사용된다는 주장은 다르다.

품질 검사에 모두 실패해도 `continue_on_failure=True`면 가장 높은 점수의 후보를 반환한다.
따라서 “검사 기능이 있다”는 말은 “항상 임계치를 통과한 행동만 나온다”는 보장이 아니다.

## mental faculty와 도구

mental faculty는 두 가지를 제공한다.

1. 모델이 사용할 수 있는 action 설명과 제약
2. 해당 action이 나왔을 때 실행할 코드 side effect

`RecallFaculty`는 `RECALL`과 full scan을 semantic memory 조회로 연결한다.
`FilesAndWebGroundingFaculty`는 문서 목록과 `CONSULT`를 grounding connector로 연결한다.
`TinyWordProcessor` 같은 `TinyTool`은 simulated agent의 행동이 문서 artifact로 이어지는
방식을 추가한다.

<div class="risk-note">
<strong>도구 호출과 현실 효과</strong>
TinyTool에는 owner와 `real_world_side_effects` 경계가 있다. simulated person이 행동을
생성했다는 이유로 현실 side effect를 무조건 허용하지 않는다. 실제 효과는 tool 코드가
명시적으로 구현하고 보호해야 한다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/tiny_person.py#L307-L647">persona와 faculty</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/action_generator.py#L12-L306">ActionGenerator</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/tools/tiny_tool.py">TinyTool</a>
</div>
