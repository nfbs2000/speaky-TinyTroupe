export const meta = {
  name: 'tt-focus-group',
  description: 'TinyWorld 포커스 그룹을 Claude 서브에이전트로 재현: 캐스트 생성 → 페르소나별 턴 시뮬레이션 → 구조화 추출',
  whenToUse: 'TinyTroupe 방식의 포커스 그룹/브레인스토밍/제품 평가 시뮬레이션이 필요할 때. Python 실행이나 API 키 없이 Claude 서브에이전트가 페르소나를 연기한다. args: {stimulus: "논의할 대상/질문(필수)", audience: "독자층 힌트(선택)", num_personas: 3, phases: ["단계별 진행자 자극", ...], steps_per_phase: 1, objective: "추출 목표(선택)", fields: ["추출 필드(선택)"]}',
  phases: [
    { title: 'Cast', detail: 'persona-architect가 참가자 시트 생성' },
    { title: 'Simulate', detail: 'tiny-person-actor가 페르소나별 턴 연기 (순차)' },
    { title: 'Extract', detail: '트레이스 → 페르소나별 기록 + 월드 요약' },
  ],
}

// ---------------------------------------------------------------------------
// 입력 정규화
// ---------------------------------------------------------------------------
const input = typeof args === 'string' ? { stimulus: args } : (args || {})
if (!input.stimulus) {
  throw new Error('tt-focus-group에는 논의 대상이 필요하다. args: {stimulus: "논의할 대상/질문"}')
}

const NUM_PERSONAS = Math.min(input.num_personas || 3, 5)
const PHASES = input.phases || [
  `다음에 대해 각자 자신의 경험과 첫인상을 솔직하게 공유해 주세요: ${input.stimulus}`,
  '방금 나온 이야기들을 듣고, 서로의 의견에 자유롭게 반박하거나 덧붙여 주세요. 아이디어를 발산하는 단계입니다.',
  '이제 논의를 정리할 시간입니다. 각자 최종 입장과 그 이유를 분명히 밝혀 주세요.',
]
const STEPS = Math.min(input.steps_per_phase || 1, 2)

const totalTurns = NUM_PERSONAS * PHASES.length * STEPS
log(`포커스 그룹: 페르소나 ${NUM_PERSONAS}명 × ${PHASES.length}단계 × ${STEPS}스텝 = 턴 ${totalTurns}회`)

// ---------------------------------------------------------------------------
// 스키마
// ---------------------------------------------------------------------------
const CAST_SCHEMA = {
  type: 'object',
  required: ['personas'],
  properties: {
    personas: {
      type: 'array',
      description: '참가자 캐릭터 시트 목록',
      items: {
        type: 'object',
        required: ['name', 'sheet'],
        properties: {
          name: { type: 'string', description: '유일한 이름' },
          sheet: { type: 'string', description: 'tinytroupe-personas 형식의 전체 캐릭터 시트 (나이/직업/성격 Big-Five/선호/말투 포함)' },
          validation_note: { type: 'string', description: '기대치 대비 자체 검증 노트' },
        },
      },
    },
  },
}

const TURN_SCHEMA = {
  type: 'object',
  required: ['actions'],
  properties: {
    actions: {
      type: 'array',
      description: '이번 턴의 행동 순서. 마지막은 반드시 DONE.',
      items: {
        type: 'object',
        required: ['type', 'content'],
        properties: {
          type: { type: 'string', enum: ['THINK', 'TALK', 'REACH_OUT', 'DONE'] },
          content: { type: 'string', description: 'DONE이면 빈 문자열 또는 짧은 이유' },
          target: { type: 'string', description: '대상 인물 이름, 전원/불특정이면 빈 문자열' },
        },
      },
    },
  },
}

const EXTRACT_SCHEMA = {
  type: 'object',
  required: ['per_persona', 'world'],
  properties: {
    per_persona: {
      type: 'array',
      items: {
        type: 'object',
        required: ['persona', 'record'],
        properties: {
          persona: { type: 'string' },
          record: { type: 'object', description: '요청된 필드를 키로 갖는 기록. 발화 근거가 없는 값은 null.' },
        },
      },
    },
    world: {
      type: 'object',
      required: ['themes', 'summary'],
      properties: {
        themes: { type: 'array', items: { type: 'string' }, description: '반복 주제' },
        consensus: { type: 'string', description: '합의점, 없으면 빈 문자열' },
        disagreements: { type: 'string', description: '이견, 없으면 빈 문자열' },
        summary: { type: 'string', description: '토론 통합 요약' },
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Phase 1 — Cast: 참가자 시트 생성
// ---------------------------------------------------------------------------
phase('Cast')
const cast = await agent(
  `캐스트 브리프: "${input.stimulus}"에 대한 포커스 그룹 참가자 ${NUM_PERSONAS}명의 캐릭터 시트를 작성하라.
${input.audience ? `독자층/인구통계 힌트: ${input.audience}` : '서로 관점이 충돌할 만큼 배경·성격·이해관계가 다양하게 구성할 것.'}
각 시트에는 이름(전원 유일), 나이, 직업, Big-Five 성격, 이 주제와 관련된 선호/이해관계, 그리고 말투(style)를 반드시 포함하라.
말투는 시뮬레이션에서 가장 많이 쓰이므로 구체적으로 쓸 것.`,
  { label: 'cast', phase: 'Cast', agentType: 'persona-architect', schema: CAST_SCHEMA }
)
if (!cast || !cast.personas.length) throw new Error('캐스트 생성 실패 — 진행할 참가자가 없다.')
const personas = cast.personas.slice(0, NUM_PERSONAS)
log(`캐스트: ${personas.map(p => p.name).join(', ')}`)

// ---------------------------------------------------------------------------
// Phase 2 — Simulate: TinyWorld 턴 루프 재현 (순차 — 발화 순서가 곧 지각 순서)
// ---------------------------------------------------------------------------
phase('Simulate')
let trace = `# 시뮬레이션 트레이스 (SIMULATED)\n월드: "${input.stimulus}" 포커스 그룹\n참가자: ${personas.map(p => p.name).join(', ')} (상호 인지 가능)\n`

const fmt = (name, actions) =>
  actions.map(a => `  ${name}: ${a.type}${a.target ? `→${a.target}` : ''}${a.content ? ` 「${a.content}」` : ''}`).join('\n')

for (const [pi, stimulus] of PHASES.entries()) {
  trace += `\n[단계 ${pi + 1}] 진행자 → 전원 (CONVERSATION): "${stimulus}"\n`
  for (let step = 1; step <= STEPS; step++) {
    for (const p of personas) {
      const turn = await agent(
        `당신이 이번 턴에 연기할 캐릭터 시트:\n${p.sheet}\n
지금까지의 시뮬레이션 트레이스(당신이 지각한 전부):\n${trace}\n
이번 턴의 자극: 진행자의 위 마지막 broadcast${step > 1 ? '와 직전 턴에 나온 다른 참가자들의 발언' : ''}.
당신(${p.name})의 이번 턴 행동을 연기 프로토콜대로 반환하라. THINK로 시작해 DONE으로 끝낼 것.`,
        { label: `턴:${p.name}(${pi + 1}-${step})`, phase: 'Simulate', agentType: 'tiny-person-actor', schema: TURN_SCHEMA }
      )
      if (turn) trace += fmt(p.name, turn.actions) + '\n'
      else {
        trace += `  ${p.name}: DONE 「(응답 없음 — 이번 턴 건너뜀)」\n`
        log(`경고: ${p.name}의 턴이 비어 있음 — 건너뜀`)
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — Extract: 트레이스 → 구조화 결과
// ---------------------------------------------------------------------------
phase('Extract')
const objective = input.objective || `"${input.stimulus}"에 대한 각 참가자의 최종 입장과 그 이유를 추출하라.`
const fields = input.fields || ['final_position', 'justification']

const results = await agent(
  `당신은 TinyTroupe의 ResultsExtractor 방법을 재현한다 (.claude/skills/tinytroupe-extraction 참조).
아래 시뮬레이션 트레이스만 근거로 추출하라. 트레이스 밖 추론으로 값을 채우지 말 것. 근거 없는 값은 null.

추출 목표: ${objective}
상황: "${input.stimulus}"에 대한 ${PHASES.length}단계 포커스 그룹
페르소나별 필드: ${fields.join(', ')}

트레이스:
${trace}

참가자(${personas.map(p => p.name).join(', ')}) 각각의 기록과, 토론 전체의 월드 요약(반복 주제, 합의, 이견)을 반환하라.`,
  { label: 'extract', phase: 'Extract', schema: EXTRACT_SCHEMA }
)
if (!results) throw new Error('추출 실패 — 트레이스는 결과에 포함되어 있으니 수동 추출 가능.')

log(`추출 완료: 기록 ${results.per_persona.length}건, 주제 ${results.world.themes.length}개`)

return {
  label: 'SIMULATED — 시뮬레이션 탐색 결과이며 실제 설문/인간 데이터가 아님',
  cast: personas.map(p => ({ name: p.name, validation_note: p.validation_note || '' })),
  phases_run: PHASES,
  trace,
  results,
  note: '실행 기록을 남기려면 .claude/team-runs/{날짜}-{주제}/에 트레이스와 결과를 저장할 것.',
}
