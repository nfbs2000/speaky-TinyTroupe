const OWNER = "nfbs2000";
const REPO = "speaky-TinyTroupe";
const BRANCH = "main";
const TREE_API = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
const GITHUB_BLOB = `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/`;

const FALLBACK_PATHS = [
  ".claude/TEAM.md",
  ".claude/agents/audience-reaction-analyst.md",
  ".claude/agents/consistency-editor.md",
  ".claude/agents/narrative-synthesist.md",
  ".claude/agents/persona-architect.md",
  ".claude/agents/scene-orchestrator.md",
  ".claude/agents/tiny-person-actor.md",
  ".claude/skills/tinytroupe-extraction/SKILL.md",
  ".claude/skills/tinytroupe-personas/SKILL.md",
  ".claude/skills/tinytroupe-simulation/SKILL.md",
  ".claude/skills/tinytroupe-story/SKILL.md",
  ".claude/skills/tinytroupe-writing-room/SKILL.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/00-brief.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/01-cast.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/02-scene-plan.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/03-draft.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/04a-audience-reactions.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/04b-edit-notes.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/05-final-manuscript.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/EXECUTION-FLOW.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/01-style-foundation.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/02-scene-candidates.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/03-reader-roster.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/04-review-checklist.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/05-draft-v1.md",
  ".claude/team-runs/2026-08-02-bakery-last-day/process/06-draft-deltas.md",
  ".claude/workflows/tt-focus-group.js",
  ".claude/workflows/tt-writing-room.js",
];

const groupOrder = [
  ["team", "팀 정의"],
  ["skills", "스킬"],
  ["agents", "에이전트"],
  ["workflows", "워크플로"],
  ["runs", "팀 런"],
];

const state = {
  paths: [],
  activePath: "",
};

function displayName(path) {
  return path
    .replace(".claude/", "")
    .replace("/SKILL.md", "")
    .replace("team-runs/", "");
}

function classify(path) {
  if (path === ".claude/TEAM.md") return "team";
  if (path.startsWith(".claude/skills/")) return "skills";
  if (path.startsWith(".claude/agents/")) return "agents";
  if (path.startsWith(".claude/workflows/")) return "workflows";
  if (path.startsWith(".claude/team-runs/")) return "runs";
  return "other";
}

function isPublicClaudeFile(path) {
  return path.startsWith(".claude/")
    && path !== ".claude/scheduled_tasks.lock"
    && !path.endsWith("/")
    && (path.endsWith(".md") || path.endsWith(".js"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadTree() {
  try {
    const response = await fetch(TREE_API, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub tree API HTTP ${response.status}`);
    const data = await response.json();
    return data.tree
      .filter((item) => item.type === "blob")
      .map((item) => item.path)
      .filter(isPublicClaudeFile)
      .sort();
  } catch (error) {
    console.warn(error);
    return FALLBACK_PATHS.slice().sort();
  }
}

function setStats(paths) {
  const stats = {
    skills: paths.filter((path) => classify(path) === "skills").length,
    agents: paths.filter((path) => classify(path) === "agents").length,
    workflows: paths.filter((path) => classify(path) === "workflows").length,
    runs: new Set(paths
      .filter((path) => classify(path) === "runs")
      .map((path) => path.split("/").slice(2, 3).join(""))).size,
  };

  const values = document.querySelectorAll("#stats .stat-value");
  values[0].textContent = stats.skills;
  values[1].textContent = stats.agents;
  values[2].textContent = stats.workflows;
  values[3].textContent = stats.runs;
}

function renderGroups(paths) {
  const root = document.querySelector("#file-groups");
  const grouped = new Map(groupOrder.map(([key]) => [key, []]));
  for (const path of paths) {
    const group = classify(path);
    if (grouped.has(group)) grouped.get(group).push(path);
  }

  root.innerHTML = groupOrder.map(([key, label]) => {
    const files = grouped.get(key);
    if (!files.length) return "";
    const buttons = files.map((path) => `
      <button class="file-button" type="button" data-path="${escapeHtml(path)}">
        ${escapeHtml(displayName(path))}
      </button>
    `).join("");
    return `
      <section class="group">
        <h3>${label} <span class="status-note">${files.length}</span></h3>
        <div class="file-list">${buttons}</div>
      </section>
    `;
  }).join("");

  root.querySelectorAll(".file-button").forEach((button) => {
    button.addEventListener("click", () => selectFile(button.dataset.path));
  });
}

function renderRuns(paths) {
  const runRoot = document.querySelector("#run-map");
  const runs = new Map();
  for (const path of paths.filter((item) => item.startsWith(".claude/team-runs/"))) {
    const [, , runName] = path.split("/");
    if (!runs.has(runName)) runs.set(runName, []);
    runs.get(runName).push(path);
  }

  if (!runs.size) {
    runRoot.innerHTML = `<p class="loading">아직 커밋된 팀 런이 없습니다.</p>`;
    return;
  }

  runRoot.innerHTML = Array.from(runs.entries()).sort().reverse().map(([runName, files]) => {
    const final = files.find((path) => path.endsWith("05-final-manuscript.md"));
    const flow = files.find((path) => path.endsWith("EXECUTION-FLOW.md"));
    const processCount = files.filter((path) => path.includes("/process/")).length;
    return `
      <article class="run-card">
        <p class="eyebrow">RUN</p>
        <h3>${escapeHtml(runName)}</h3>
        <ul>
          <li>산출물 ${files.length}개, process 기록 ${processCount}개</li>
          <li>${final ? `<button class="file-button inline" type="button" data-path="${escapeHtml(final)}">최종 원고 열기</button>` : "최종 원고 없음"}</li>
          <li>${flow ? `<button class="file-button inline" type="button" data-path="${escapeHtml(flow)}">실행 흐름 열기</button>` : "실행 흐름 없음"}</li>
        </ul>
      </article>
    `;
  }).join("");

  runRoot.querySelectorAll(".file-button").forEach((button) => {
    button.addEventListener("click", () => selectFile(button.dataset.path));
  });
}

async function selectFile(path) {
  state.activePath = path;
  document.querySelectorAll(".file-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.path === path);
  });

  const title = document.querySelector("#viewer-title");
  const content = document.querySelector("#file-content");
  const link = document.querySelector("#github-link");
  title.textContent = displayName(path);
  link.href = `${GITHUB_BLOB}${path}`;
  content.textContent = "파일을 불러오는 중입니다.";

  try {
    const response = await fetch(`${RAW_BASE}${path}`);
    if (!response.ok) throw new Error(`raw fetch HTTP ${response.status}`);
    content.textContent = await response.text();
  } catch (error) {
    content.textContent = `파일을 불러오지 못했습니다.\n${error.message}\n\nGitHub에서 직접 열어 확인하세요:\n${link.href}`;
  }
}

async function main() {
  const paths = await loadTree();
  state.paths = paths;
  setStats(paths);
  renderGroups(paths);
  renderRuns(paths);

  const preferred =
    paths.find((path) => path.endsWith("team-runs/2026-08-02-bakery-last-day/05-final-manuscript.md"))
    || paths.find((path) => path === ".claude/TEAM.md")
    || paths[0];
  if (preferred) await selectFile(preferred);
}

main().catch((error) => {
  document.querySelector("#file-groups").innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
});
