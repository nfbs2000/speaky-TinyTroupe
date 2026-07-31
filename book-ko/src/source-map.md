# 소스 지도와 출처

이 가이드는 Microsoft TinyTroupe release `0.7.0`, upstream commit
[`a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4)를
기준으로 작성했다.

## 핵심 구현 지도

| 주제 | 실제 source |
| --- | --- |
| 프로젝트 목적·원칙·책임 경계 | [`README.md`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/README.md) |
| simulated person | [`tiny_person.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/tiny_person.py) |
| action 생성·품질 검사 | [`action_generator.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/action_generator.py) |
| episodic·semantic memory | [`memory.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/memory.py) |
| file/web grounding | [`grounding.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/agent/grounding.py) |
| world·시간·action 전달 | [`tiny_world.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_world.py) |
| relation graph | [`tiny_social_network.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/environment/tiny_social_network.py) |
| persona population 생성 | [`tiny_person_factory.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/factory/tiny_person_factory.py) |
| result extraction | [`results_extractor.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_extractor.py) |
| deterministic reduction | [`results_reducer.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_reducer.py) |
| report와 artifact | [`results_reporter.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/results_reporter.py), [`artifact_exporter.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/extraction/artifact_exporter.py) |
| proposition·intervention·story | [`experimentation/`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/experimentation), [`steering/`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/steering) |
| empirical validation | [`simulation_validator.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/validation/simulation_validator.py) |
| transaction cache·checkpoint | [`control.py`](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/control.py) |
| provider client·cost | [`clients/`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/clients) |
| 실제 예제 notebooks | [`examples/`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/examples) |
| 검증용 공개 자료 | [`publications/`](https://github.com/microsoft/TinyTroupe/tree/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/publications) |

## 1차 자료

- [Microsoft/TinyTroupe](https://github.com/microsoft/TinyTroupe)
- [TinyTroupe paper, arXiv:2507.09788](https://arxiv.org/abs/2507.09788)
- [RESPONSIBLE_AI_FAQ.md](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/RESPONSIBLE_AI_FAQ.md)
- [MIT License](https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/LICENSE)

## 이 fork의 교육 계층

- [공개 첫 화면](../)
- [TinyTroupe Writing Lab](../education/)
- [Writing Lab 설계 문서](https://github.com/nfbs2000/speaky-TinyTroupe/blob/main/education/docs/tinytroupe-writing-lab-design.md)
- [한국어 가이드 source](https://github.com/nfbs2000/speaky-TinyTroupe/tree/main/book-ko)

교육 계층의 Claude worker, run manifest와 생성 글은 upstream TinyTroupe 기능으로
오해하지 않는다. upstream code 해설과 fork 실험을 이 페이지에서 명시적으로 분리한다.
