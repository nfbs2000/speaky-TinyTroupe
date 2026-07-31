# 7장: 추출, 축약, 보고서와 artifact

simulation console에 대화가 보인다고 분석이 끝나는 것은 아니다. TinyTroupe는 trajectory를
목적에 맞는 구조화 결과와 사람이 읽는 보고서로 바꾸는 여러 경로를 제공한다.

## 세 경로를 구분한다

| 구성 요소 | 입력 | 처리 | 출력 |
| --- | --- | --- | --- |
| `ResultsExtractor` | agent/world interaction history | LLM prompt | 목적별 JSON |
| `ResultsReducer` | raw episodic event | 사용자가 등록한 Python rule | row 목록/DataFrame |
| `ResultsReporter` | agent 응답, history 또는 data | LLM formatting | Markdown report |
| `ArtifactExporter` | dict 또는 text | 파일 형식 변환 | JSON, text, Markdown, DOCX |

`ResultsExtractor`는 extraction objective, situation, field와 hint를 prompt에 넣고,
전체 interaction history에서 JSON을 생성한다. 결과는 source event의 직접 projection이
아니라 **또 하나의 모델 호출로 만든 해석**이다.

`ResultsReducer`는 다르다. stimulus와 action event를 순회하고 event type별 Python
함수를 적용한다. 어떤 값을 뽑았는지 코드로 추적할 수 있어 deterministic extraction에
가깝지만, rule 자체의 타당성은 사용자가 책임진다.

## reporting은 새로운 simulation turn을 만들 수도 있다

`report_from_agents()`는 각 agent에게 reporting task를 다시 `listen()`시키고 `act()`시켜
응답을 모은다. 즉 기존 history를 읽기만 하는 report가 아니라 simulation에 새로운
stimulus와 action을 추가한다.

반면 `report_from_interactions()`는 저장된 history를 LLM formatter에 제공한다. 어느
경로를 사용했는지 기록하지 않으면 “원래 simulation에서 나온 결론”과 “사후 인터뷰에서
새로 말한 결론”을 구분할 수 없다.

## artifact는 결과의 전달 형식이다

`ArtifactExporter`는 text/Markdown/JSON을 파일로 쓰고, Markdown이나 text를 DOCX로
변환할 수 있다. 파일이 생성됐다는 사실은 content가 검증됐다는 뜻이 아니다. artifact에는
가능하면 다음 provenance를 함께 남기는 편이 좋다.

- simulation/config version
- persona와 world specification hash
- model과 seed에 해당하는 실행 설정
- extraction objective와 rule
- source interaction range
- validation 결과와 알려진 limitation

<div class="truth-note">
<strong>데이터 계보</strong>
raw interaction → deterministic reduction → LLM extraction → LLM report → exported file을
같은 단계로 취급하지 않는다. 뒤로 갈수록 읽기는 쉬워지지만 원전과의 변환 경로를 함께
남겨야 한다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_extractor.py">ResultsExtractor</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_reducer.py">ResultsReducer</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_reporter.py">ResultsReporter</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/artifact_exporter.py">ArtifactExporter</a>
</div>
