# 5장: episodic·semantic memory와 grounding

TinyTroupe는 대화 배열 하나를 “기억”이라고 부르지 않는다. 경험의 순서를 보존하는
episodic memory, 추상화된 정보를 검색하는 semantic memory, 외부 문서를 참조하는
grounding을 분리한다.

## episodic memory

stimulus, action, feedback은 다음과 같은 event로 저장된다.

```json
{
  "role": "user",
  "content": {"stimuli": []},
  "type": "stimulus",
  "simulation_timestamp": "..."
}
```

현재 episode는 buffer에 있다가 `commit_episode()`에서 definitive memory로 이동한다.
prompt에 모든 과거를 넣지 않고 fixed prefix와 최근 lookback을 조합하며, 중간이 생략되면
omission marker를 넣는다.

## semantic memory

episode가 충분히 길어지면 `EpisodicConsolidator`가 action, stimulus, fact, impression,
procedure 같은 더 조직된 기억으로 바꾼다. 이 과정 자체도 LLM 호출이다. 결과는 원본
event의 완전한 무손실 압축이나 검증된 사실 데이터베이스가 아니다.

semantic memory는 embedding index를 이용해 relevance query로 일부 정보를 찾는다.
`RECALL` action은 이 경로를 사용하고, `RECALL_WITH_FULL_SCAN`은 모든 memory batch를
훑으며 필요한 정보를 LLM으로 추출·누적한다. full scan은 더 비싸며, 찾았다는 정보도
모델 기반 추출 결과다.

## grounding

grounding connector는 agent 자신의 경험 기억과 외부 자료를 분리한다.

| 경로 | 의미 |
| --- | --- |
| `LocalFilesGroundingConnector` | 로컬 파일을 문서 index에 추가 |
| `WebPagesGroundingConnector` | 지정 URL을 읽어 문서 index에 추가 |
| `LIST_DOCUMENTS` | agent가 접근 가능한 source 이름 확인 |
| `CONSULT` | 특정 문서의 내용을 지정해 가져오기 |

`RECALL`은 여러 기억에서 관련 조각을 찾고, `CONSULT`는 명시한 source를 본다. agent prompt도
특정 문서를 확인해야 할 때 RECALL 대신 CONSULT를 사용하도록 구분한다.

<div class="truth-note">
<strong>세 종류의 근거</strong>
episode event는 simulation에서 관찰된 입력·출력, semantic memory는 LLM이 다시 조직한
기억, grounding document는 외부 source다. 세 값을 모두 “원문 증거”라고 부르면 정보가
어디서 변형됐는지 잃는다.
</div>

<div class="risk-note">
<strong>TODO도 계약의 일부다</strong>
`ReflectionConsolidator`의 reflection 구현은 현재 `pass`다. 이름이나 문서에 클래스가
존재한다는 이유만으로 독립적인 reflection memory가 동작한다고 설명하면 안 된다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/memory.py">memory 구현</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/grounding.py">grounding connector</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/mental_faculty.py#L165">RecallFaculty</a>
</div>
