export const meta = {
  name: 'tt-writing-room',
  description: '라이팅룸 파이프라인: 브리프 → 캐스트 → 비트 플랜 → 초안 → 병렬 검증(독자 반응 + 편집) → 조건부 수정',
  whenToUse: '글 한 편(단편, 대화, 모의 인터뷰, 에세이, 평가문)을 라이팅룸 팀의 결정적 파이프라인으로 제작할 때. 리드의 단계별 판단이 필요하면 대신 tinytroupe-writing-room 스킬을 쓸 것. args: {topic: "주제(선택)", form: "형식(선택)", audience: "독자(선택)", length: "분량(선택)", constraints: "제약(선택)"}',
  phases: [
    { title: 'Brief', detail: '목적/독자/형식/제약 확정' },
    { title: 'Cast', detail: 'persona-architect → 캐릭터 시트' },
    { title: 'Plan', detail: 'scene-orchestrator → 씬/비트 플랜' },
    { title: 'Draft', detail: 'narrative-synthesist → 초안' },
    { title: 'Review', detail: '독자 반응 + 편집 노트 (병렬)' },
    { title: 'Revise', detail: '필수 수정이 있으면 표적 수정 1회' },
  ],
}

const input = typeof args === 'string' ? { topic: args } : (args || {})

// ---------------------------------------------------------------------------
// 스키마
// ---------------------------------------------------------------------------
const BRIEF_SCHEMA = {
  type: 'object',
  required: ['purpose', 'audience', 'form', 'length'],
  properties: {
    purpose: { type: 'string', description: '이 글이 달성해야 하는 것' },
    audience: { type: 'string', description: '누구를 위한 글인가' },
    form: { type: 'string', description: '단편/대화/모의 인터뷰/에세이/평가문 중 하나' },
    length: { type: 'string', description: '목표 분량' },
    constraints: { type: 'array', items: { type: 'string' }, description: '어조, 금지 사항 등' },
    cast_requirements: { type: 'string', description: '몇 명이 필요하고 각자 어떤 기능을 하는지' },
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
        required: ['name', 'sheet'],
        properties: {
          name: { type: 'string' },
          sheet: { type: 'string', description: '전체 캐릭터 시트 (배경/Big-Five/목표/말투/호불호)' },
          validation_note: { type: 'string', description: '브리프 기대치 대비 자체 검증' },
        },
      },
    },
  },
}

const PLAN_SCHEMA = {
  type: 'object',
  required: ['setting', 'stimulus', 'beats'],
  properties: {
    setting: { type: 'string', description: '배경' },
    stimulus: { type: 'string', description: '촉발 상황' },
    beats: {
      type: 'array',
      items: {
        type: 'object',
        required: ['who', 'what', 'tension'],
        properties: {
          who: { type: 'string', description: '이 비트에서 상호작용하는 인물' },
          what: { type: 'string', description: '일어나는 일' },
          tension: { type: 'string', description: '진전되는 긴장' },
        },
      },
    },
    constraints: { type: 'array', items: { type: 'string' } },
  },
}

const DRAFT_SCHEMA = {
  type: 'object',
  required: ['draft'],
  properties: {
    draft: { type: 'string', description: '완결된 초안 전문' },
    notes: { type: 'string', description: '집필 중 내린 판단, 없으면 빈 문자열' },
  },
}

const REACTION_SCHEMA = {
  type: 'object',
  required: ['readers', 'themes', 'summary'],
  properties: {
    readers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'reaction'],
        properties: {
          name: { type: 'string', description: '시뮬레이션 독자 페르소나 이름' },
          reaction: { type: 'string', description: '와닿은 것 / 혼란스러운 것 / 정서적 반응' },
        },
      },
    },
    themes: { type: 'array', items: { type: 'string' }, description: '반복 주제' },
    summary: { type: 'string', description: '구조화 요약. 모든 내용은 SIMULATED.' },
  },
}

const EDIT_SCHEMA = {
  type: 'object',
  required: ['notes', 'scores'],
  properties: {
    notes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['dimension', 'location', 'issue', 'fix', 'must_fix'],
        properties: {
          dimension: { type: 'string', enum: ['persona_adherence', 'self_consistency', 'fluency'] },
          location: { type: 'string', description: '초안 내 위치' },
          issue: { type: 'string' },
          fix: { type: 'string', description: '제안 수정' },
          must_fix: { type: 'boolean', description: '통합 전 반드시 고쳐야 하면 true' },
        },
      },
    },
    scores: {
      type: 'object',
      required: ['persona_adherence', 'self_consistency', 'fluency'],
      properties: {
        persona_adherence: { type: 'integer', minimum: 1, maximum: 10 },
        self_consistency: { type: 'integer', minimum: 1, maximum: 10 },
        fluency: { type: 'integer', minimum: 1, maximum: 10 },
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Phase 1 — Brief
// ---------------------------------------------------------------------------
phase('Brief')
const brief = await agent(
  `TinyTroupe 라이팅룸의 브리프를 작성하라 (.claude/skills/tinytroupe-writing-room 참조).
${input.topic ? `주제: ${input.topic}` : '주제가 없다. TinyTroupe가 보여주는 형식(단편, 대화, 모의 인터뷰, 에세이, 평가문) 중 첫 공개 실험으로 적합한 것 하나를 골라 주제를 제안하라.'}
${input.form ? `형식: ${input.form}` : ''}
${input.audience ? `독자: ${input.audience}` : ''}
${input.length ? `분량: ${input.length}` : ''}
${input.constraints ? `제약: ${input.constraints}` : ''}
목적/독자/형식/분량/제약과, 필요한 캐스트 요구사항(몇 명, 각자의 기능)을 확정하라.`,
  { label: 'brief', phase: 'Brief', schema: BRIEF_SCHEMA }
)
if (!brief) throw new Error('브리프 작성 실패.')
log(`브리프: ${brief.form} — ${brief.purpose}`)

const briefText = `목적: ${brief.purpose}\n독자: ${brief.audience}\n형식: ${brief.form}\n분량: ${brief.length}\n제약: ${(brief.constraints || []).join('; ') || '없음'}`

// ---------------------------------------------------------------------------
// Phase 2 — Cast (캐스트가 플랜의 입력이므로 순차)
// ---------------------------------------------------------------------------
phase('Cast')
const castRes = await agent(
  `캐스트 브리프:\n${briefText}\n요구사항: ${brief.cast_requirements || '이 글에 필요한 인물들을 판단해 구성하라.'}\n각 시트에 이름/배경/Big-Five/목표/말투/호불호와 자체 검증 노트를 포함하라.`,
  { label: 'cast', phase: 'Cast', agentType: 'persona-architect', schema: CAST_SCHEMA }
)
if (!castRes || !castRes.cast.length) throw new Error('캐스트 생성 실패.')
const castText = castRes.cast.map(c => `## ${c.name}\n${c.sheet}`).join('\n\n')
log(`캐스트: ${castRes.cast.map(c => c.name).join(', ')}`)

// ---------------------------------------------------------------------------
// Phase 3 — Plan
// ---------------------------------------------------------------------------
phase('Plan')
const plan = await agent(
  `브리프:\n${briefText}\n\n캐스트:\n${castText}\n\n이 캐스트로 브리프를 달성하는 배경, 촉발 상황, 순서화된 비트 플랜을 설계하라. 비트마다 누가 상호작용하고 어떤 긴장이 진전되는지 명시할 것.`,
  { label: 'plan', phase: 'Plan', agentType: 'scene-orchestrator', schema: PLAN_SCHEMA }
)
if (!plan) throw new Error('씬 플랜 생성 실패.')
const planText = `배경: ${plan.setting}\n촉발: ${plan.stimulus}\n비트:\n${plan.beats.map((b, i) => `${i + 1}. [${b.who}] ${b.what} — 긴장: ${b.tension}`).join('\n')}`
log(`플랜: 비트 ${plan.beats.length}개`)

// ---------------------------------------------------------------------------
// Phase 4 — Draft
// ---------------------------------------------------------------------------
phase('Draft')
const draftPrompt = (extra) =>
  `브리프:\n${briefText}\n\n캐스트:\n${castText}\n\n비트 플랜:\n${planText}\n${extra}\n비트를 따르고, 각 인물의 목소리를 시트와 일관되게 유지하고, 진짜 긴장을 도입하고, 목적과 분량을 지키는 완결된 초안을 써라.`

let draftRes = await agent(draftPrompt(''), {
  label: 'draft', phase: 'Draft', agentType: 'narrative-synthesist', schema: DRAFT_SCHEMA,
})
if (!draftRes) throw new Error('초안 생성 실패.')

// ---------------------------------------------------------------------------
// Phase 5 — Review (병렬: 서로 독립)
// ---------------------------------------------------------------------------
phase('Review')
const [reactions, edits] = await parallel([
  () => agent(
    `다음 초안에 대한 시뮬레이션 독자 반응을 수집하라. 브리프의 독자: ${brief.audience}\n\n초안:\n${draftRes.draft}\n\n독자 페르소나 3명 내외를 정의하고 각자의 반응(와닿은 것/혼란/정서)과 구조화 요약을 반환하라. 전부 SIMULATED 표기.`,
    { label: 'reactions', phase: 'Review', agentType: 'audience-reaction-analyst', schema: REACTION_SCHEMA }
  ),
  () => agent(
    `다음 초안을 검토하라.\n브리프:\n${briefText}\n\n캐스트 시트:\n${castText}\n\n초안:\n${draftRes.draft}\n\n페르소나 일관성/자기 일관성/유창성 차원별로 위치와 제안 수정이 달린 편집 노트, 차원별 1-10 점수, 통합 전 필수 수정 여부(must_fix)를 반환하라.`,
    { label: 'edits', phase: 'Review', agentType: 'consistency-editor', schema: EDIT_SCHEMA }
  ),
])

// ---------------------------------------------------------------------------
// Phase 6 — Revise (필수 수정 또는 7점 미만 차원이 있으면 표적 수정 1회)
// ---------------------------------------------------------------------------
const mustFix = edits ? edits.notes.filter(n => n.must_fix) : []
const weakDims = edits ? Object.entries(edits.scores).filter(([, v]) => v < 7).map(([k]) => k) : []
let revised = null

if (mustFix.length || weakDims.length) {
  phase('Revise')
  log(`수정 필요: 필수 노트 ${mustFix.length}건, 취약 차원 [${weakDims.join(', ')}]`)
  revised = await agent(
    draftPrompt(`\n직전 초안:\n${draftRes.draft}\n\n표적 수정 요청 — 아래만 고치고 나머지는 유지하라:\n${mustFix.map(n => `- [${n.dimension}] ${n.location}: ${n.issue} → ${n.fix}`).join('\n')}\n${weakDims.length ? `취약 차원 보강: ${weakDims.join(', ')}` : ''}\n${reactions ? `참고용 시뮬레이션 독자 반응 요약: ${reactions.summary}` : ''}`),
    { label: 'revise', phase: 'Revise', agentType: 'narrative-synthesist', schema: DRAFT_SCHEMA }
  )
  if (revised) log('표적 수정 완료')
} else {
  log('필수 수정 없음 — 초안 그대로 통합 단계로')
}

// ---------------------------------------------------------------------------
// 결과 — 최종 통합 원고는 리드(메인 세션)가 이 재료를 전부 읽고 직접 쓴다
// ---------------------------------------------------------------------------
return {
  brief,
  cast: castRes.cast,
  plan,
  draft: draftRes.draft,
  reactions: reactions ? { ...reactions, label: 'SIMULATED — 실제 설문 아님' } : null,
  edit_notes: edits,
  revised_draft: revised ? revised.draft : null,
  next_step: '리드(메인 세션)가 모든 반환물을 읽고 최종 통합 원고를 직접 쓸 것 (tinytroupe-writing-room 스킬의 통합 단계). 실행 기록은 .claude/team-runs/{날짜}-{주제}/에 저장.',
}
