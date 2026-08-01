# 이 가이드를 읽는 법

TinyTroupe는 LLM에게 여러 역할 이름을 붙여 답을 합치는 일반적인 “멀티에이전트 팀”과
다르다. 이 프로젝트는 구체적인 persona를 가진 가상 인물, 이들이 놓이는 환경, 시간에
따른 상호작용, 기억과 결과 검증을 **실험자가 반복해서 설계하는 시뮬레이션 라이브러리**다.

![TinyTroupe의 가상 무대](../tinytroupe_stage.png)

이 가이드는 README를 번역해 줄이는 대신, 다음 질문을 실제 구현에 연결한다.

1. `TinyPerson`은 어떤 입력을 받고 어떤 형식의 행동을 만드는가?
2. `TinyWorld`는 사람들의 행동을 어떻게 다른 사람의 자극으로 전달하는가?
3. episodic memory와 semantic memory는 무엇이 다른가?
4. persona factory는 대표 인구를 “측정”하는가, 아니면 LLM으로 구성하는가?
5. 상호작용은 어떻게 표와 보고서, 문서 artifact로 바뀌는가?
6. LLM 평가와 실제 경험 자료를 이용한 통계 검증은 어떻게 구분되는가?
7. cache와 checkpoint는 모델을 결정론적으로 만드는가?

<div class="truth-note">
<strong>가장 중요한 경계</strong>
TinyTroupe의 출력은 simulated persona의 반응이다. 실제 사람의 발언, 실제 시장조사,
현실 인구의 대표 표본 또는 인과 효과가 아니다. 실제 자료와 비교하는 검증 절차를
거치기 전에는 그럴듯함을 진실로 승격할 수 없다.
</div>

## 읽기의 기준선

이 해설은 fork의 TinyTroupe 원본 기준점
[`a6244b3`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4),
release `0.7.0`을 읽었다. 한국어 문서는 그 위에 더해진 별도 해설 계층이다.

각 장의 “소스에서 확인” 링크는 가능한 한 이 고정 commit을 가리킨다. 이후 upstream이
바뀌더라도 이 글이 어떤 구현을 설명했는지 다시 확인하기 위해서다.
