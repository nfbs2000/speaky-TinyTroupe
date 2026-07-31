# 11장: 모델, 비용과 실행 표면

TinyTroupe의 core는 provider-neutral agent protocol이 아니다. client registry를 통해
OpenAI, Azure OpenAI, 실험적 Ollama 경로를 선택하지만, prompt와 parameter 처리는
OpenAI chat completion 계열에 강하게 맞춰져 있다.

## 기본 runtime

release `0.7.0`의 package config는 다음 기본을 사용한다.

- text model: `gpt-5-mini`
- reasoning model: `o3-mini`
- embedding model: `text-embedding-3-small`
- API type: `openai`
- 최대 동시 model call: 4
- agent action과 persona generation 병렬화: enabled
- action quality checks: disabled
- RAI harmful/copyright prompt component: enabled

사용자 project의 `config.ini`와 dynamic config가 이 값을 바꿀 수 있다. 따라서 실행 report에는
“TinyTroupe를 사용했다”만 적지 말고 실제 api type, model, config와 source version을
남겨야 한다.

## 모델 호출의 종류

| 호출 | 목적 |
| --- | --- |
| text completion | persona action, extraction, report, story |
| reasoning model | 정교한 proposition 평가 옵션 |
| embedding | semantic memory와 grounding 검색 |
| vision model | `see()`에 전달된 이미지 설명 |

OpenAI client는 timeout, retry와 exponential backoff를 직접 구현하고, cache와 thread별
invalid entry 제거, 동시성 semaphore, token usage 통계를 관리한다.

## 비용 통계

client는 input/output/total token, 실제 model call과 cached call을 센다. TinyPerson과
TinyWorld도 agent별·환경별 통계를 합산해 보여 줄 수 있다. 그러나 일부 image token은
local 추정에서 제외하고 server billing이 권위 있다고 명시한다.

비용을 해석할 때는 simulation action 외에도 다음 숨은 호출을 포함해야 한다.

- persona generation과 sampling plan
- action quality proposition과 regeneration
- memory consolidation과 full scan
- result extraction과 report formatting
- story generation
- empirical semantic validation

<div class="risk-note">
<strong>부분 지원을 동일 지원으로 쓰지 않는다</strong>
README도 Ollama를 experimental/limited support로 표현한다. client registry에 이름이
있다는 이유만으로 OpenAI/Azure와 같은 feature·quality·parameter 호환성을 주장할 수 없다.
</div>

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/clients/__init__.py">client registry</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/clients/openai_client.py">OpenAI client</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/config.ini">default config</a>
</div>
