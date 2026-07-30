const DATA_ROOT = "./data";

const contributionLabels = {
  "persona-architect": "캐릭터 설계",
  "scene-orchestrator": "씬과 비트 플랜",
  "narrative-synthesist": "초안",
  "audience-reaction-analyst": "시뮬레이션 독자 반응",
  "consistency-editor": "일관성 편집 노트",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderStory(markdown) {
  const blocks = markdown.trim().split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const text = block.trim();
      if (!text) return "";
      if (/^---+$/.test(text)) return "<hr>";
      if (text.startsWith("# ")) return `<h1>${escapeHtml(text.slice(2))}</h1>`;
      if (text.startsWith("## ")) return `<h2>${escapeHtml(text.slice(3))}</h2>`;
      return `<p>${escapeHtml(text).replaceAll("\n", "<br>")}</p>`;
    })
    .join("");
}

async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.text();
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path}: HTTP ${response.status}`);
  }
  return response.json();
}

function renderRunSummary(manifest) {
  const summary = document.querySelector("#run-summary");
  summary.innerHTML = `
    <div><dt>Provider</dt><dd>${escapeHtml(manifest.runtime.provider)} / ${escapeHtml(manifest.runtime.model)}</dd></div>
    <div><dt>Observed workers</dt><dd>${manifest.observedWorkers.length} / ${manifest.configuredWorkers.length}</dd></div>
    <div><dt>Final artifact</dt><dd>${escapeHtml(manifest.finalArtifact)}</dd></div>
  `;
}

function renderTeam(team, manifest) {
  const observed = new Map(
    manifest.observedWorkers.map((worker) => [worker.role, worker]),
  );

  document.querySelector("#team-grid").innerHTML = team.roles
    .map((role) => {
      const run = observed.get(role.id);
      return `
        <article class="team-card">
          <p class="role-kind">${escapeHtml(role.kind)}</p>
          <h3>${escapeHtml(role.label)}</h3>
          <p>${escapeHtml(role.summary)}</p>
          <span class="status ${run ? "status-observed" : ""}">
            ${run ? "observed" : "configured"}
          </span>
          <p class="source-basis"><strong>Source basis</strong><br>${escapeHtml(role.sourceBasis)}</p>
        </article>
      `;
    })
    .join("");
}

function renderEvidence(manifest) {
  const cards = [
    {
      title: "Parent session",
      value: manifest.runtime.sdkSessionId,
      description: "Education Shell의 실제 Claude conversation",
    },
    {
      title: "Agent results",
      value: `${manifest.observedWorkers.length} completed`,
      description: "worker별 Agent tool result와 repository contribution",
    },
    {
      title: "Integration",
      value: manifest.status,
      description: "리드가 모든 반환을 읽고 최종 원고를 작성한 상태",
    },
  ];

  document.querySelector("#evidence-grid").innerHTML = cards
    .map(
      (card) => `
        <article class="evidence-card">
          <h3>${escapeHtml(card.title)}</h3>
          <code>${escapeHtml(card.value)}</code>
          <p>${escapeHtml(card.description)}</p>
        </article>
      `,
    )
    .join("");
}

async function renderContributions(manifest) {
  const list = document.querySelector("#contribution-list");
  const items = await Promise.all(
    manifest.observedWorkers.map(async (worker) => {
      const path = `${DATA_ROOT}/contributions/${worker.role}.md`;
      const source = await fetchText(path);
      return `
        <details class="contribution">
          <summary>
            <span>${escapeHtml(contributionLabels[worker.role] || worker.role)}</span>
            <span class="status status-observed">observed</span>
          </summary>
          <pre>${escapeHtml(source)}</pre>
        </details>
      `;
    }),
  );
  list.innerHTML = items.join("");
}

async function main() {
  const storyTarget = document.querySelector("#story-content");
  try {
    const [story, team, manifest] = await Promise.all([
      fetchText(`${DATA_ROOT}/story.md`),
      fetchJson(`${DATA_ROOT}/team.json`),
      fetchJson(`${DATA_ROOT}/run-manifest.json`),
    ]);

    storyTarget.innerHTML = renderStory(story);
    renderRunSummary(manifest);
    renderTeam(team, manifest);
    renderEvidence(manifest);
    await renderContributions(manifest);
  } catch (error) {
    storyTarget.innerHTML = `
      <p class="loading">공개 산출물을 불러오지 못했습니다: ${escapeHtml(error.message)}</p>
    `;
  }
}

main();
