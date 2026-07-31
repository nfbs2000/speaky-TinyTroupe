# 6장: persona factory와 표본 설계

직접 만든 persona 몇 명만으로는 다양한 관점을 탐색하기 어렵다. `TinyPersonFactory`는
context, sampling space, demographic description을 받아 여러 persona specification을
생성한다.

## 생성 경로

1. sampling space를 설명하거나 demographic JSON을 제공한다.
2. LLM이 age, profession, country, trait 같은 sampling dimension을 구성한다.
3. 총 population size에 맞는 sampling directive와 quantity를 계획한다.
4. directive를 개별 characteristic sample로 펼치고 순서를 섞는다.
5. 각 sample과 context로 persona JSON을 생성한다.
6. 중복 이름과 minibio를 피하며 `TinyPerson`으로 만든다.

<div class="mermaid">
flowchart LR
  D["demography / context"] --> S["sampling dimensions"]
  S --> P["LLM sampling plan"]
  P --> F["flatten + shuffle"]
  F --> G["persona generation"]
  G --> V["TinyPerson population"]
</div>

generation은 병렬 또는 순차 실행이 가능하다. 병렬 mode는 API throttling을 고려해 worker
수와 global name registry를 조정한다.

## fragment는 factory와 다른 재사용 단위다

fragment JSON은 정치 성향, 행동 특성, 관심사 같은 persona 일부를 기존 사람에게 합친다.
factory가 사람 전체를 생성한다면 fragment는 여러 사람에게 같은 명세 조각을 재사용한다.
두 fragment를 더한다고 통계적으로 타당한 인구 segment가 만들어지는 것은 아니다.

## “대표 표본”이라는 말의 한계

sampling plan의 dimension, proportion과 세부 인물은 LLM의 built-in knowledge와 추정을
사용한다. demographic input이 있어도 실제 확률 표본 추출기가 아니며, prompt에는 드문
극단 사례를 실제 비율보다 더 넣을 수 있다는 지시도 있다.

따라서 factory population은 질문을 넓히고 빠뜨린 관점을 찾는 **설계 도구**다. 현실
인구의 분포를 주장하려면 sampling frame, 실제 자료와 비교 검증, 재실행 안정성 같은
별도 근거가 필요하다.

<div class="risk-note">
<strong>합계와 대표성은 다르다</strong>
sampling directive의 quantity 합이 요청한 N과 같아도 표본이 현실을 대표한다는 뜻은
아니다. N은 생성 개수 계약이고, representativeness는 외부 검증 문제다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/factory/tiny_person_factory.py">TinyPersonFactory</a>,
<a href="https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/examples/fragments">persona fragments</a>,
<a href="https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/examples/agents">persona examples</a>
</div>
