---
name: tinytroupe-personas
description: TinyTroupe 방식의 페르소나가 필요할 때 사용 — 캐릭터 시트 작성, 프래그먼트 겹쳐 쓰기, 관계 정의, 목표 내면화, 기대치 대비 검증. Claude가 직접 수행하는 방법론이며 Python 실행이나 API 키가 필요 없다.
---

# TinyTroupe 페르소나 방법론 (Claude 재현)

## 근거 소스
`examples/agents/*.agent.json`, `examples/fragments/*.agent.fragment.json`,
`factory/tiny_person_factory.py`, `factory/prompts/generate_person.mustache`,
`agent/tiny_person.py`(`define`, `import_fragment`, `define_relationships`, `related_to`,
`internalize_goal`, `minibio`, `save/load_specification`),
`validation/tiny_person_validator.py`

## 개요
`TinyPerson`은 구조화된 시트로 정의된 시뮬레이션 인물이다. 절차는
**시트 작성 → 프래그먼트 겹쳐 쓰기 → 관계·목표 정의 → 검증**이다.
코드를 실행하지 않는다. 시트는 문서로 작성하고, 검증은 Claude가 심사한다.

---

## 1. 시트 작성

`examples/agents/Lisa.agent.json`의 구조를 따라 채운다. 모르는 값은 지어내지 말고 비워
둔다 — 시뮬레이션에서 "모른다"로 연기된다.

```
이름 / 나이 / 국적 / 거주지
직업: 직함, 소속, 하는 일 설명
학력, 장기 목표(long_term_goals)
성격: 서술형 특성 + Big-Five (openness/conscientiousness/extraversion/
      agreeableness/neuroticism 각각 high~low와 근거)
선호: 관심사, 좋아하는 것, 싫어하는 것
기술(skills), 신념(beliefs), 습관적 행동(behaviors)
말투(style): 이 인물의 말이 어떻게 들리는지 — 시뮬레이션에서 가장 많이 쓰이는 필드
```

**병합 규칙**: 시트에 값을 추가할 때 리스트 필드는 **추가**, 스칼라 필드는 **덮어쓰기**가
기본이다. 덮어쓰기를 원치 않으면 명시한다.

**minibio**: 시트에서 두세 문장짜리 소개문을 뽑아 둔다. 다른 워커에게 인물을 소개할 때
시트 전문 대신 이것을 쓴다.

---

## 2. 프래그먼트 겹쳐 쓰기

프래그먼트는 **정체성 필드가 없는 부분 시트**다 (`examples/fragments/` — 까다로운 고객,
여행 애호가, 권위주의자, 좌/우파 등). 기본 시트 위에 가산적으로 병합한다.

- 리스트 필드는 추가, 스칼라 필드는 프래그먼트가 덮어쓴다.
- 적용 순서: 기본 시트 → 프래그먼트. 여러 개면 나중 것이 우선.
- 같은 기본 시트에 다른 프래그먼트를 얹어 **변주 인물**을 만들 수 있다 — 표본 다양성을
  만드는 싼 방법이다 ([[tinytroupe-experiments]] §3).

---

## 3. 관계 정의

관계는 시트의 부속이 아니라 **상호작용 가능성을 결정하는 구조**다
([[tinytroupe-simulation]] §4).

- 관계마다 이름과 서술을 준다: `단골 — "3년째 매주 오는 손님"`.
- **비대칭을 명시할 수 있다.** A→B 서술과 B→A 서술을 따로 쓴다. "손님은 주인 이름을 알고,
  주인은 얼굴만 안다" 같은 비대칭 인지는 픽션의 주요 장치다.
- 관계를 정의하지 않은 상대에게는 접근이 성립하지 않는다 — 이것을 의도적으로 쓴다.

---

## 4. 목표 내면화

- **장기 목표**는 시트 필드다. 인물이 늘 품고 있는 것.
- **내면화된 목표**는 런 도중 인물이 스스로 품게 된 목표다. 외부 지시("이렇게 해라")와
  구분한다 — 지시는 자극이고, 내면화된 목표는 인물의 것이 된다.
- 내면화한 목표는 트레이스에 기록한다. 이후 행동의 근거가 되기 때문이다.

---

## 5. 검증 (TinyPersonValidator 재현)

사용 전에 시트를 기대치와 대조 심사한다.

1. 브리프에서 기대치를 문장으로 뽑는다 (예: "의료 전문가, 공감 능력, 바쁨").
2. 시트에 모의 인터뷰를 한다 — 기대치를 시험하는 질문 3~5개를 던지고, **시트만 근거로**
   이 인물이 뭐라 답할지 쓴다.
3. **0~1 점수와 근거**를 기록한다. **0.6 미만이면 시트를 고치고 재심사한다.**
4. 캐스트 전체에 대해서는 다양성도 함께 본다 — 전원이 같은 축에 몰려 있으면 사각지대다.

> 검증 점수(0~1)와 [[tinytroupe-quality]]의 명제 점수(0~9)는 다른 척도다. 섞지 않는다.

---

## 6. 시트 저장·로드

- 시트는 재사용 자산이다. `*.persona.md` 하나에 시트 + 검증 노트를 함께 둔다.
- 같은 시트에서 이름만 바꾼 인물을 만들 수 있다 — 단, **이름은 한 시뮬레이션 안에서
  유일해야 한다.**
- 저장된 시트를 다시 쓸 때는 검증을 다시 한다. 브리프가 다르면 기대치도 다르다.

---

## 경계
- 페르소나는 허구다. 실존·설문된 인물로 제시하지 않는다 (RESPONSIBLE_AI_FAQ.md).
- 페르소나를 실제 Claude 팀원인 것처럼 제시하지 않는다.
- 요구사항이 빠져 있으면 합리적 가정을 **명시하고** 진행한다.
- 인물이 무엇을 기억하고 잊는지는 [[tinytroupe-memory]]가, 연기 방법은
  [[tinytroupe-simulation]]과 `.claude/agents/tiny-person-actor.md`가 담당한다.
