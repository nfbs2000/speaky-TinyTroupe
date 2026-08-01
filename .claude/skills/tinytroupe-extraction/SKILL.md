---
name: tinytroupe-extraction
description: 시뮬레이션 트레이스에서 구조화 결과를 뽑을 때 사용 — 추출 목표·필드 정의, 페르소나별 기록과 월드 통합 요약, 선호 집계. Claude가 직접 수행하며 Python 실행이 필요 없다.
---

# TinyTroupe 결과 추출 방법론 (Claude 재현)

## 개요
`ResultsExtractor`의 방법을 Claude가 재현한다: 시뮬레이션 트레이스(자유 발화)를 **추출
목표에 따라 구조화된 기록**으로 바꾼다. 페르소나 단위 추출과 월드(전체 토론) 단위
추출 두 가지가 있다.

## 절차
1. **추출 목표(objective)를 문장으로 고정한다.** 모호하면 결과도 모호하다.
   예: "이 사람이 A/B 중 최종 선택한 안과 그 이유를 추출하라."
2. **상황(situation)을 명시한다.** 어떤 맥락의 발화였는지 — 판단 범위를 좁힌다.
3. **필드를 고정한다.** 집계할 거라면 필수. 필드마다 값 형식 힌트를 단다.
   예: `preferred_option`(값은 "A" 또는 "B"만), `justification`(한 문장).
4. **트레이스를 읽고 추출한다:**
   - 페르소나별: 그 인물의 THINK/TALK만 근거로 필드를 채운다. 발화에 없는 값은
     지어내지 말고 `null` + "발화 근거 없음"으로 남긴다.
   - 월드 단위: 토론 전체를 하나의 통합 기록(주요 아이디어, 합의점, 이견)으로 요약한다.
5. **집계한다.** 페르소나별 기록을 표나 tally로 모은다 (예: A 2표 / B 1표 + 근거).

## 산출 형식
```json
{
  "agent_extractions": {
    "Lisa":  {"preferred_option": "A", "justification": "..."},
    "Oscar": {"preferred_option": "B", "justification": "..."}
  },
  "world_extraction": {"주요_주제": ["..."], "합의": "...", "이견": "..."}
}
```
파일로 저장할 때는 트레이스 옆에 `*.results.json`으로 둔다.

## 경계
- 모든 결과에 **SIMULATED(시뮬레이션)** 표기를 유지한다. 실제 설문·통계로 제시 금지.
- 추출은 트레이스에 있는 발화만 근거로 한다. 트레이스 밖 추론으로 필드를 채우지 않는다.
- 소스 근거: `tinytroupe/extraction/results_extractor.py`, Advertisement/Brainstorming 노트북.
