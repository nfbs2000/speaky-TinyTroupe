# 10장: transaction cache, checkpoint와 재현

LLM simulation은 비용이 들고 출력이 달라질 수 있다. TinyTroupe의 `control` 계층은
transactional function call, 반환값과 simulation 전체 상태를 chain으로 저장해 앞부분을
재실행하지 않고 이어 갈 수 있게 한다.

## simulation state cache

`control.begin(cache_path, auto_checkpoint)`은 현재 simulation scope를 시작한다. 이때 agent,
world, factory registry와 자동 ID를 초기화하고 기존 cache trace를 읽는다.

`@transactional` 함수가 호출되면 다음 일이 일어난다.

1. 함수 이름과 argument로 event identity를 만든다.
2. 현재 execution position의 cached event와 비교한다.
3. 일치하면 저장된 output과 전체 state를 복원한다.
4. 불일치하면 실제 함수를 실행하고 output/state를 trace에 추가한다.
5. execution이 기존 cache에서 갈라지면 뒤쪽 cache suffix를 버린다.
6. checkpoint 시 JSON을 임시 파일에 쓴 뒤 원래 cache를 교체한다.

<div class="mermaid">
flowchart TD
  F["transactional call"] --> H["event identity"]
  H --> Q{"같은 위치 cache와 일치?"}
  Q -->|예| R["output + full state 복원"]
  Q -->|아니오| E["실제 LLM/simulation 실행"]
  E --> D["기존 suffix 제거"]
  D --> S["새 output + state 저장"]
</div>

parallel segment는 한 위치에 event별 output map을 저장하고, segment가 끝난 후 전체 상태를
별도 transaction으로 남긴다.

## LLM API cache와 다르다

OpenAI client의 API cache는 동일한 message/parameter 요청을 response에 매핑한다.
simulation cache는 function call과 agent/world/factory 전체 상태를 연결한다. 하나는
모델 호출, 다른 하나는 simulation trajectory를 재사용한다.

## checkpoint가 보장하지 않는 것

- 다른 source revision에서도 동일한 state를 해석할 수 있다는 보장
- external file/web content가 변하지 않았다는 보장
- cache 밖에서 발생한 side effect의 복구
- 병렬 thread scheduling의 완전한 결정성
- persona나 prompt가 바뀌었는데 같은 실험이라고 볼 수 있다는 보장

또한 현재 control module은 동시에 하나의 active simulation만 허용한다. cache는 과거를
재생하는 유용한 도구지만, provenance와 version 없이 실험 재현성 전체를 대신하지 않는다.

<div class="source-note">
<strong>소스에서 확인</strong>
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/control.py">simulation control</a>,
<a href="https://github.com/microsoft/TinyTroupe/blob/a6244b358a1fe1c71bf751f7ba0f8dfa368ec5a4/tinytroupe/clients/openai_client.py#L28-L80">LLM cache base</a>
</div>
