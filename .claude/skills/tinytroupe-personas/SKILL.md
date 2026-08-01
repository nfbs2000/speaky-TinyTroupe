---
name: tinytroupe-personas
description: TinyTroupe 방식의 페르소나가 필요할 때 사용 — 캐릭터 시트 작성, 프래그먼트 겹쳐 쓰기, 기대치 대비 검증. Claude가 직접 수행하는 방법론이며 Python 실행이나 API 키가 필요 없다.
---

# TinyTroupe 페르소나 방법론 (Claude 재현)

## 개요
TinyTroupe의 `TinyPerson`은 구조화된 시트로 정의된 시뮬레이션 인물이다. 이 스킬은 그
방법을 Claude가 직접 재현하는 절차다: **시트 작성 → 프래그먼트 겹쳐 쓰기 → 검증**.
코드를 실행하지 않는다. 시트는 문서로 작성하고, 검증은 Claude가 심사한다.

## 1. 시트 작성 (TinyPerson 명세 재현)
`examples/agents/Lisa.agent.json`의 구조를 따라 아래 필드를 채운다. 모르는 값은
지어내지 말고 비워 둔다(시뮬레이션 때 "모른다"로 연기된다).

```
이름 / 나이 / 국적 / 거주지
직업: 직함, 소속, 하는 일 설명
학력, 장기 목표(long_term_goals)
성격: 서술형 특성 + Big-Five (openness/conscientiousness/extraversion/agreeableness/neuroticism 각각 high~low와 근거)
선호: 관심사, 좋아하는 것, 싫어하는 것
기술(skills), 신념(beliefs), 습관적 행동(behaviors), 관계(relationships)
말투(style): 이 인물의 말이 어떻게 들리는지 — 시뮬레이션에서 가장 많이 쓰이는 필드
```

## 2. 프래그먼트 겹쳐 쓰기
프래그먼트는 정체성 필드가 없는 부분 시트다(`examples/fragments/` — 까다로운 고객,
여행 애호가, 공격적 토론자 등). 기본 시트 위에 **가산적으로 병합**한다: 리스트 필드는
추가, 스칼라 필드는 프래그먼트가 덮어쓴다. 적용 순서: 기본 시트 → 프래그먼트.

## 3. 검증 (TinyPersonValidator 재현)
사용 전에 시트를 기대치와 대조 심사한다:
1. 브리프에서 기대치를 문장으로 뽑는다 (예: "의료 전문가, 공감 능력, 바쁨").
2. 시트에 모의 인터뷰를 한다 — 기대치를 시험하는 질문 3-5개를 던지고, 시트만 근거로
   이 인물이 뭐라 답할지 쓴다.
3. 0-1 점수와 근거를 기록한다. 0.6 미만이면 시트를 고치고 재심사한다.

## 산출 형식
페르소나당 시트 1개 + 검증 노트(점수, 근거, 남은 가정). 파일로 저장할 때는
`*.persona.md` 하나에 시트와 검증 노트를 함께 둔다.

## 경계
- 페르소나는 허구다. 실존·설문 인물로 제시하지 않는다 (RESPONSIBLE_AI_FAQ.md).
- 이름은 한 시뮬레이션 안에서 유일해야 한다.
- 시뮬레이션에서 연기하는 방법은 [[tinytroupe-simulation]] 스킬과
  `.claude/agents/tiny-person-actor.md`가 담당한다.
