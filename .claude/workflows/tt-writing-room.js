export const meta = {
  name: 'tt-writing-room',
  description: '라이팅룸 파이프라인: 브리프 → 문체·근거 → 캐스트 → 비트+개입 → 원장 → 초안 → 병렬 검증 → 재생성 루프 → 문체 이식',
  whenToUse: '글 한 편(1급: 픽션 단편·장면 / 2급 미검증: 대화·모의 인터뷰·에세이·평가문)을 라이팅룸 팀의 결정적 파이프라인으로 제작할 때. 리드의 단계별 판단이 필요하면 대신 tinytroupe-writing-room 스킬을 쓸 것. args: {topic: "주제(선택)", form: "형식(선택)", audience: "독자(선택)", length: "분량(선택)", constraints: "제약(선택)"}',
  phases: [
    { title: 'Brief', detail: '목적/독자/형식/제약 확정' },
    { title: 'Prep', detail: 'style-director 문체 사양 + fact-grounder 근거 3분류 (병렬)' },
    { title: 'Cast', detail: 'persona-architect → 시트 + 관계도 + 검증' },
    { title: 'Plan', detail: 'scene-orchestrator → 비트 플랜 + 개입 규칙' },
    { title: 'Ledger', detail: 'continuity-ledger → 설정 원장 개설' },
    { title: 'Draft', detail: 'narrative-synthesist → 초안' },
    { title: 'Review', detail: '채점 + 독자 반응 + 원장 대조 (병렬)' },
    { title: 'Regen', detail: '임계 7 미달 항목 표적 재생성 (최대 2회)' },
    { title: 'Style', detail: 'style-director → 정보 보존 문체 이식' },
  ],
}

// args가 JSON "문자열"로 도착하는 경우 방어 (tt-focus-group 런 wf_2e7d5d8b-d85 교훈)
let raw = args
if (typeof raw === 'string') {
  const s = raw.trim()
  if (s.startsWith('{')) {
    try { raw = JSON.parse(s) } catch (e) { raw = { topic: raw } }
  } else {
    raw = { topic: raw }
  }
}
const input = raw || {}

// 품질 파라미터 — 소스 기본값 (agent/action_generator.py)
const QUALITY_THRESHOLD = 7   // 0~9 척도
const MAX_ATTEMPTS = 2

// ---------------------------------------------------------------------------
// 스키마
// ---------------------------------------------------------------------------
const BRIEF_SCHEMA = {
  type: 'object',
  required: ['purpose', 'audience', 'form', 'length'],
  properties: {
    purpose: { type: 'string', description: '이 글이 달성해야 하는 것' },
    audience: { type: 'string', description: '누구를 위한 글인가' },
    form: { type: 'string', description: '단편/장면(1급) 또는 대화/모의 인터뷰/에세이/평가문(2급 미검증)' },
    length: { type: 'string', description: '목표 분량 (상한 포함)' },
    constraints: { type: 'array', items: { type: 'string' }, description: '어조, 금지 사항 등' },
    cast_requirements: { type: 'string', description: '몇 명이 필요하고 각자 어떤 기능을 하는지' },
    grounding_items: { type: 'array', items: { type: 'string' }, description: '현실 근거가 필요한 항목 후보' },
  },
}

const STYLE_SCHEMA = {
  type: 'object',
  required: ['spec', 'forbidden'],
  properties: {
    spec: { type: 'string', description: '시점·거리·문장 기조·시제·감정 노출 수위·대화 비율' },
    forbidden: { type: 'array', items: { type: 'string' }, description: '금지 목록 (상투구, 감상 과잉 등)' },
    sample: { type: 'string', description: '이 문체로 쓴 참조 표본 2~3줄' },
  },
}

const GROUNDING_SCHEMA = {
  type: 'object',
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'classification'],
        properties: {
          claim: { type: 'string' },
          classification: { type: 'string', enum: ['근거 있음', '근거 없음', '확인 불가'] },
          evidence: { type: 'string', description: '인용 위치 또는 사유' },
        },
      },
    },
    boundary_declarations: { type: 'array', items: { type: 'string' }, description: '경계 선언에 올릴 확인 불가 항목' },
  },
}

const CAST_SCHEMA = {
  type: 'object',
  required: ['cast'],
  properties: {
    cast: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'sheet', 'validation_score'],
        properties: {
          name: { type: 'string' },
          sheet: { type: 'string', description: '전체 캐릭터 시트 (배경/Big-Five/목표/말투/호불호)' },
          validation_score: { type: 'number', minimum: 0, maximum: 1, description: '0.6 미만이면 스스로 고쳐 재심사한 뒤 반환할 것' },
          validation_note: { type: 'string' },
          knows: { type: 'string', description: '이 인물이 아는 것 / 모르는 것' },
        },
      },
    },
    relationships: { type: 'array', items: { type: 'string' }, description: '관계 서술 (비대칭이면 양방향 따로)' },
    diversity_note: { type: 'string' },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['setting', 'stimulus', 'beats', 'interventions'],
  properties: {
    setting: { type: 'string' },
    stimulus: { type: 'string', description: '촉발 상황' },
    beats: {
      type: 'array',
      items: {
        type: 'object',
        required: ['who', 'what', 'tension'],
        properties: {
          who: { type: 'string' },
          what: { type: 'string' },
          tension: { type: 'string' },
          stimulus_kind: { type: 'string', enum: ['발화', '생각', '내면 목표', '맥락 변경'] },
          elapsed: { type: 'string', description: '이 비트까지의 시간 경과 (건너뜀 포함)' },
        },
      },
    },
    interventions: {
      type: 'array',
      description: '실패 모드마다 전제→효과. 초안 전에 선언해야 개입이다',
      items: {
        type: 'object',
        required: ['precondition', 'effect', 'rationale'],
        properties: {
          precondition: { type: 'string' },
          effect: { type: 'string' },
          rationale: { type: 'string' },
        },
      },
    },
    access_constraints: { type: 'array', items: { type: 'string' } },
  },
}

const LEDGER_SCHEMA = {
  type: 'object',
  required: ['arithmetic', 'objects', 'knowledge'],
  properties: {
    arithmetic: { type: 'string', description: '산술 층 — 초기값·변동·최종값' },
    objects: { type: 'string', description: '사물 층 — 등장 물건의 위치와 상태' },
    knowledge: { type: 'string', description: '기억 층 — 인물별 아는 것/모르는 것/독자만 아는 것' },
  },
}

const DRAFT_SCHEMA = {
  type: 'object',
  required: ['draft', 'char_count'],
  properties: {
    draft: { type: 'string', description: '완결된 초안 전문' },
    char_count: { type: 'integer', description: '실측 자수 (공백 포함)' },
    notes: { type: 'string', description: '비트 플랜을 벗어난 판단, 없으면 빈 문자열' },
  },
}

const REACTION_SCHEMA = {
  type: 'object',
  required: ['readers', 'themes', 'summary'],
  properties: {
    roster_diversity: { type: 'string', description: '로스터 다양성 점검 결과' },
    protocol: { type: 'string', description: '초안을 읽기 전에 고정한 판정 프로토콜' },
    readers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'reaction'],
        properties: {
          name: { type: 'string' },
          reaction: { type: 'string', description: '와닿은 것 / 혼란스러운 것 / 정서적 반응 / 완독 의사' },
        },
      },
    },
    themes: { type: 'array', items: { type: 'string' }, description: '정규화된 대표 주제' },
    mapping: { type: 'string', description: '원본 반응 → 대표 주제 매핑' },
    summary: { type: 'string', description: '구조화 요약. 전부 SIMULATED.' },
    claimable: { type: 'string', description: '이 표본으로 말할 수 있는 것 / 없는 것' },
  },
}

// 소스의 표준 명제 세트 (validation/propositions.py), 0~9 채점
const SCORE_SCHEMA = {
  type: 'object',
  required: ['scores', 'findings'],
  properties: {
    proposition_list: { type: 'array', items: { type: 'string' }, description: '초안을 읽기 전에 고정한 채점 명제 목록' },
    scores: {
      type: 'object',
      required: ['persona_adherence', 'self_consistency', 'fluency', 'suitability', 'task_completion', 'divergence'],
      properties: {
        persona_adherence: { type: 'integer', minimum: 0, maximum: 9 },
        self_consistency: { type: 'integer', minimum: 0, maximum: 9 },
        fluency: { type: 'integer', minimum: 0, maximum: 9 },
        suitability: { type: 'integer', minimum: 0, maximum: 9 },
        task_completion: { type: 'integer', minimum: 0, maximum: 9 },
        divergence: { type: 'integer', minimum: 0, maximum: 9, description: '인물들이 서로 갈라지는가 — 목소리 분화' },
      },
    },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['proposition', 'location', 'justification', 'confidence', 'recommendation'],
        properties: {
          proposition: { type: 'string' },
          location: { type: 'string', description: '원고 내 위치' },
          justification: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          recommendation: { type: 'string' },
          budget: { type: 'string', description: '수정의 순증/순감 자수 예산' },
        },
      },
    },
    repetition: { type: 'array', items: { type: 'string' }, description: '유사도 0.6 초과 반복 (위치 명시)' },
    corrective_rules: { type: 'array', items: { type: 'string' }, description: '관찰 대 기대 → 규칙 한 문장' },
  },
}

const LEDGER_CHECK_SCHEMA = {
  type: 'object',
  required: ['mismatches'],
  properties: {
    mismatches: {
      type: 'array',
      items: {
        type: 'object',
        required: ['location', 'ledger_value', 'draft_value'],
        properties: {
          location: { type: 'string' },
          ledger_value: { type: 'string' },
          draft_value: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    ledger_corrections: { type: 'array', items: { type: 'string' }, description: '원고가 더 나아 원장을 고친 경우' },
  },
}

const STYLED_SCHEMA = {
  type: 'object',
  required: ['styled', 'preservation_check'],
  properties: {
    styled: { type: 'string', description: '문체 이식본 전문' },
    preservation_check: { type: 'string', description: '고유명사/수치/정보 추가 0/삭제 0/구조 유지/변환 언급 0' },
    failed: { type: 'boolean', description: '보존 검사 실패 시 true' },
  },
}

// ---------------------------------------------------------------------------
// Phase 1 — Brief
// ---------------------------------------------------------------------------
phase('Brief')
const brief = await agent(
  `TinyTroupe 라이팅룸의 브리프를 작성하라 (.claude/skills/tinytroupe-writing-room 참조).
${input.topic ? `주제: ${input.topic}` : '주제가 없다. 1급 형식인 픽션 서사(단편·장면)로 주제를 제안하라.'}
${input.form ? `형식: ${input.form}` : ''}
${input.audience ? `독자: ${input.audience}` : ''}
${input.length ? `분량: ${input.length}` : ''}
${input.constraints ? `제약: ${input.constraints}` : ''}
목적/독자/형식/분량(상한 포함)/제약, 캐스트 요구사항, 현실 근거가 필요한 항목 후보를 확정하라.
1급 형식은 픽션 서사뿐이다. 다른 형식이면 브리프에 "이 형식은 팀 런으로 검증된 바 없음"을 적어라.`,
  { label: 'brief', phase: 'Brief', schema: BRIEF_SCHEMA }
)
if (!brief) throw new Error('브리프 작성 실패.')
log(`브리프: ${brief.form} — ${brief.purpose}`)

const briefText = `목적: ${brief.purpose}\n독자: ${brief.audience}\n형식: ${brief.form}\n분량: ${brief.length}\n제약: ${(brief.constraints || []).join('; ') || '없음'}`

// ---------------------------------------------------------------------------
// Phase 2 — Prep (문체·근거를 초안보다 먼저 고정: 실험 지향 원칙)
// ---------------------------------------------------------------------------
phase('Prep')
const [style, grounding] = await parallel([
  () => agent(
    `브리프:\n${briefText}\n\n이 글의 문체 사양서를 작성하라. 작가가 초안 단계에서부터 지킬 수 있을 만큼 구체적으로 — "담백하게"는 사양이 아니고 "감정을 서술하지 않고 동작으로만 드러낸다"가 사양이다. 금지 목록과 참조 표본 2~3줄을 포함하라.`,
    { label: 'style-spec', phase: 'Prep', agentType: 'style-director', schema: STYLE_SCHEMA }
  ),
  () => agent(
    `브리프:\n${briefText}\n근거 필요 항목 후보: ${(brief.grounding_items || []).join(', ') || '브리프에서 직접 판단하라'}\n\n저장소 모드로 동작하라 (웹 조회 금지). 현실 근거가 필요한 항목을 뽑아 근거 있음/근거 없음/확인 불가로 3분류하라. 확인 불가를 숨기지 말고 경계 선언 목록에 올려라.`,
    { label: 'grounding', phase: 'Prep', agentType: 'fact-grounder', schema: GROUNDING_SCHEMA }
  ),
])
const styleText = style ? `사양: ${style.spec}\n금지: ${(style.forbidden || []).join('; ')}\n표본: ${style.sample || ''}` : '(문체 사양 없음)'
const groundText = grounding
  ? grounding.items.map(i => `- [${i.classification}] ${i.claim}${i.evidence ? ` (${i.evidence})` : ''}`).join('\n')
  : '(근거 목록 없음)'
log(`문체 사양 확정 · 근거 항목 ${grounding ? grounding.items.length : 0}건`)

// ---------------------------------------------------------------------------
// Phase 3 — Cast
// ---------------------------------------------------------------------------
phase('Cast')
const castRes = await agent(
  `캐스트 브리프:\n${briefText}\n요구사항: ${brief.cast_requirements || '이 글에 필요한 인물들을 판단해 구성하라.'}\n\n각 시트에 이름/배경/Big-Five/목표/말투/호불호, 인물별 아는 것·모르는 것, 그리고 0~1 검증 점수를 포함하라. 0.6 미만이면 스스로 고쳐 재심사한 뒤 반환하라. 관계도(비대칭이면 양방향 따로)와 캐스트 전체 다양성 점검도 함께.`,
  { label: 'cast', phase: 'Cast', agentType: 'persona-architect', schema: CAST_SCHEMA }
)
if (!castRes || !castRes.cast.length) throw new Error('캐스트 생성 실패.')
const castText = castRes.cast.map(c => `## ${c.name} (검증 ${c.validation_score})\n${c.sheet}\n인지: ${c.knows || '미기재'}`).join('\n\n')
const relText = (castRes.relationships || []).join('\n')
log(`캐스트: ${castRes.cast.map(c => `${c.name}(${c.validation_score})`).join(', ')}`)

// ---------------------------------------------------------------------------
// Phase 4 — Plan
// ---------------------------------------------------------------------------
phase('Plan')
const plan = await agent(
  `브리프:\n${briefText}\n\n캐스트:\n${castText}\n\n관계도:\n${relText}\n\n배경·촉발 상황·순서화된 비트 플랜을 설계하라. 비트마다 누가/무엇이/어떤 긴장이/자극 종류(발화·생각·내면 목표·맥락 변경)/시간 경과를 명시할 것. 이 원고의 알려진 실패 모드마다 개입 규칙(전제→효과→근거)을 최소 2건 선언하라 — 초안 전에 선언해야 개입이다.`,
  { label: 'plan', phase: 'Plan', agentType: 'scene-orchestrator', schema: PLAN_SCHEMA }
)
if (!plan) throw new Error('씬 플랜 생성 실패.')
const planText = `배경: ${plan.setting}\n촉발: ${plan.stimulus}\n비트:\n${plan.beats.map((b, i) => `${i + 1}. [${b.who}] ${b.what} — 긴장: ${b.tension}${b.elapsed ? ` (경과 ${b.elapsed})` : ''}`).join('\n')}\n개입 규칙:\n${plan.interventions.map(x => `- ${x.precondition} → ${x.effect}`).join('\n')}`
log(`플랜: 비트 ${plan.beats.length}개 · 개입 규칙 ${plan.interventions.length}건`)

// ---------------------------------------------------------------------------
// Phase 5 — Ledger
// ---------------------------------------------------------------------------
phase('Ledger')
const ledger = await agent(
  `캐스트:\n${castText}\n\n비트 플랜:\n${planText}\n\n설정 원장을 개설하라 — 산술 층(세는 것: 초기값·변동·최종값을 실제로 계산), 사물 층(등장 물건의 위치와 상태), 기억 층(인물별 아는 것/모르는 것/독자만 아는 것). 원장이 비트 플랜과 어긋나면 어긋난 지점을 보고하라.`,
  { label: 'ledger', phase: 'Ledger', agentType: 'continuity-ledger', schema: LEDGER_SCHEMA }
)
const ledgerText = ledger ? `산술: ${ledger.arithmetic}\n사물: ${ledger.objects}\n기억: ${ledger.knowledge}` : '(원장 없음)'

// ---------------------------------------------------------------------------
// Phase 6 — Draft
// ---------------------------------------------------------------------------
phase('Draft')
const draftPrompt = (extra) =>
  `브리프:\n${briefText}\n\n문체 사양(초안 단계부터 지킬 것):\n${styleText}\n\n근거 목록:\n${groundText}\n\n캐스트:\n${castText}\n\n비트 플랜:\n${planText}\n\n설정 원장:\n${ledgerText}\n${extra}\n비트를 따르고, 각 인물의 목소리를 시트와 일관되게 유지하고, 진짜 긴장을 도입하고, 목적과 분량 상한을 지키는 완결된 초안을 써라. 실측 자수를 함께 반환하라.`

let draftRes = await agent(draftPrompt(''), {
  label: 'draft-v1', phase: 'Draft', agentType: 'narrative-synthesist', schema: DRAFT_SCHEMA,
})
if (!draftRes) throw new Error('초안 생성 실패.')
log(`초안 v1: ${draftRes.char_count}자`)

// ---------------------------------------------------------------------------
// Phase 7~8 — Review + 재생성 루프 (임계 7, 최대 2회)
// ---------------------------------------------------------------------------
const loopLog = []
let scoreRes = null
let reactions = null
let ledgerCheck = null
let attempt = 0
let version = 1

while (true) {
  phase('Review')
  const results = await parallel([
    () => agent(
      `채점 대상 초안 (판본 v${version}):\n${draftRes.draft}\n\n브리프:\n${briefText}\n\n캐스트 시트:\n${castText}\n\n표준 명제로 0~9 채점하라: 페르소나 준수 / 자기 일관성 / 유창성 / 적합성 / 과제 완수 / 분화(인물들이 서로 갈라지는가). 채점할 명제 목록을 먼저 고정해 함께 반환하라. 항목마다 근거(원고 위치 인용)·확신도·개선 권고·자수 예산을 붙이고, 어휘가 절반 이상 겹치는 반복(유사도 0.6)을 위치와 함께 보고하라. 미달 항목은 "관찰된 것 / 기대된 것 → 규칙 한 문장"으로 교정 규칙을 만들어라.`,
      { label: `score-v${version}`, phase: 'Review', agentType: 'consistency-editor', schema: SCORE_SCHEMA }
    ),
    () => agent(
      `초안 (판본 v${version}):\n${draftRes.draft}\n\n브리프의 독자: ${brief.audience}\n\n독자 로스터 3~5인을 다양성 점검과 함께 설계하고, 판정 프로토콜을 초안을 읽기 전에 고정했음을 명시하라. 독자별 반응과 정규화된 대표 주제(원본→대표 매핑 포함), 이 표본으로 말할 수 있는 것과 없는 것을 반환하라. 전부 SIMULATED 표기.`,
      { label: `readers-v${version}`, phase: 'Review', agentType: 'audience-reaction-analyst', schema: REACTION_SCHEMA }
    ),
    () => agent(
      `설정 원장:\n${ledgerText}\n\n초안 (판본 v${version}):\n${draftRes.draft}\n\n원장과 원고를 한 줄씩 대조하라. 산술은 실제로 계산할 것. 불일치마다 위치/원장 값/원고 값/확신도를 반환하고, 불일치가 없으면 없음을 명시하라.`,
      { label: `ledger-check-v${version}`, phase: 'Review', agentType: 'continuity-ledger', schema: LEDGER_CHECK_SCHEMA }
    ),
  ])
  scoreRes = results[0] || scoreRes
  reactions = results[1] || reactions
  ledgerCheck = results[2] || ledgerCheck

  const failing = scoreRes
    ? Object.entries(scoreRes.scores).filter(([, v]) => v < QUALITY_THRESHOLD)
    : []
  const mismatches = ledgerCheck ? ledgerCheck.mismatches : []
  const repetition = scoreRes ? (scoreRes.repetition || []) : []

  loopLog.push({
    version,
    scores: scoreRes ? scoreRes.scores : null,
    failing: failing.map(([k, v]) => `${k} ${v}/9`),
    mismatches: mismatches.length,
    repetition: repetition.length,
  })

  if (!failing.length && !mismatches.length && !repetition.length) {
    log(`v${version} 전 항목 임계(${QUALITY_THRESHOLD}) 통과 — 루프 종료`)
    break
  }
  if (attempt >= MAX_ATTEMPTS) {
    log(`재생성 ${MAX_ATTEMPTS}회 소진 — 마지막 판본 채택. 잔여 미달: ${failing.map(([k, v]) => `${k} ${v}/9`).join(', ') || '없음'}`)
    break
  }

  attempt += 1
  version += 1
  phase('Regen')
  log(`재생성 ${attempt}회차 → v${version} (미달 ${failing.length} · 원장 불일치 ${mismatches.length} · 반복 ${repetition.length})`)

  const fixes = [
    ...(scoreRes ? scoreRes.findings.filter(f => f.confidence >= 0.5) : []).map(
      f => `- [${f.proposition}] ${f.location}: ${f.justification} → ${f.recommendation}${f.budget ? ` (예산 ${f.budget})` : ''}`
    ),
    ...mismatches.map(m => `- [설정 불일치] ${m.location}: 원장 "${m.ledger_value}" vs 원고 "${m.draft_value}"`),
    ...repetition.map(r => `- [반복] ${r}`),
  ].join('\n')

  const next = await agent(
    draftPrompt(
      `\n직전 초안 (v${version - 1}):\n${draftRes.draft}\n\n표적 수정 — 아래만 고치고 나머지는 유지하라:\n${fixes}\n\n누적 교정 규칙:\n${(scoreRes && scoreRes.corrective_rules || []).join('\n')}\n${reactions ? `\n참고용 SIMULATED 독자 요약: ${reactions.summary}` : ''}\n분량 상한(${brief.length})을 넘기지 말 것. 지시가 서로 충돌하거나 시트와 어긋나면 임의 절충하지 말고 충돌을 보고하라.`
    ),
    { label: `draft-v${version}`, phase: 'Regen', agentType: 'narrative-synthesist', schema: DRAFT_SCHEMA }
  )
  if (!next) { log('재생성 실패 — 직전 판본 유지'); break }
  draftRes = next
  log(`v${version}: ${draftRes.char_count}자`)
}

// ---------------------------------------------------------------------------
// Phase 9 — Style (정보 보존 문체 이식)
// ---------------------------------------------------------------------------
phase('Style')
const styled = await agent(
  `문체 사양서:\n${styleText}\n\n최종 초안 (판본 v${version}):\n${draftRes.draft}\n\n정보를 하나도 잃지 않고 문체만 이식하라. 고유명사·수치·날짜·구체적 세부 전부 보존, 정보 추가 0·삭제 0, 구조 유지, 변환 언급 0, 패러디 금지. 보존 검사 결과를 함께 반환하고, 하나라도 실패면 failed=true로 보고하라.`,
  { label: 'style-transplant', phase: 'Style', agentType: 'style-director', schema: STYLED_SCHEMA }
)

// ---------------------------------------------------------------------------
// 결과 — 최종 통합 원고는 리드(메인 세션)가 이 재료를 전부 읽고 직접 쓴다
// ---------------------------------------------------------------------------
return {
  brief,
  style_spec: style,
  grounding,
  cast: castRes.cast,
  relationships: castRes.relationships,
  plan,
  ledger,
  final_draft: draftRes.draft,
  final_version: `v${version}`,
  char_count: draftRes.char_count,
  scores: scoreRes ? scoreRes.scores : null,
  corrective_rules: scoreRes ? scoreRes.corrective_rules : null,
  quality_loop: { threshold: QUALITY_THRESHOLD, max_attempts: MAX_ATTEMPTS, attempts_used: attempt, log: loopLog },
  ledger_check: ledgerCheck,
  reactions: reactions ? { ...reactions, label: 'SIMULATED — 실제 설문 아님' } : null,
  styled: styled ? { text: styled.styled, preservation_check: styled.preservation_check, failed: !!styled.failed } : null,
  next_step: '리드(메인 세션)가 모든 반환물을 읽고 최종 통합 원고를 직접 쓸 것. 잔여 미달 항목과 확인 불가 사실 항목을 런 기록의 경계 선언에 옮길 것. 실행 기록은 .claude/workflows/runs/{날짜}-{주제}/에 저장 (팀 런 기록 team-runs/와 구분).',
}
