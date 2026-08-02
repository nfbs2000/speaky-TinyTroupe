const OWNER = "nfbs2000";
const REPO = "speaky-TinyTroupe";
const BRANCH = "main";
const TREE_API = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
const GITHUB_BLOB = `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/`;

const FALLBACK_PATHS = [
  ".claude/workflows/tt-focus-group.js",
  ".claude/workflows/tt-writing-room.js",
  ".claude/workflows/runs/2026-08-02-focus-group-subscription/00-run-config.md",
  ".claude/workflows/runs/2026-08-02-focus-group-subscription/01-cast.md",
  ".claude/workflows/runs/2026-08-02-focus-group-subscription/02-trace.md",
  ".claude/workflows/runs/2026-08-02-focus-group-subscription/03-results.md",
  ".claude/workflows/runs/2026-08-02-focus-group-subscription/EXECUTION-FLOW.md",
];

const state = {
  paths: [],
  activePath: "",
};

function isWorkflowFile(path) {
  return path.startsWith(".claude/workflows/")
    && !path.endsWith("/")
    && (path.endsWith(".md") || path.endsWith(".js"));
}

function classify(path) {
  if (path.startsWith(".claude/workflows/runs/")) return "run-docs";
  return "scripts";
}

function displayName(path) {
  return path.replace(".claude/workflows/", "");
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
      .filter(isWorkflowFile)
      .sort();
  } catch (error) {
    console.warn(error);
    return FALLBACK_PATHS.slice().sort();
  }
}

function setStats(paths) {
  const scripts = paths.filter((path) => classify(path) === "scripts").length;
  const runDocs = paths.filter((path) => classify(path) === "run-docs").length;
  const runs = new Set(paths
    .filter((path) => classify(path) === "run-docs")
    .map((path) => path.split("/").slice(3, 4).join(""))).size;

  const values = document.querySelectorAll("#stats .stat-value");
  values[0].textContent = scripts;
  values[1].textContent = runs;
  values[2].textContent = runDocs;
}

function renderGroups(paths) {
  const root = document.querySelector("#file-groups");
  const groups = [
    ["scripts", "워크플로 스크립트"],
    ["run-docs", "워크플로 런 문서"],
  ];

  root.innerHTML = groups.map(([key, label]) => {
    const files = paths.filter((path) => classify(path) === key);
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
  for (const path of paths.filter((item) => item.startsWith(".claude/workflows/runs/"))) {
    const [, , , runName] = path.split("/");
    if (!runs.has(runName)) runs.set(runName, []);
    runs.get(runName).push(path);
  }

  if (!runs.size) {
    runRoot.innerHTML = `<p class="loading">아직 커밋된 workflow run이 없습니다.</p>`;
    return;
  }

  runRoot.innerHTML = Array.from(runs.entries()).sort().reverse().map(([runName, files]) => {
    const flow = files.find((path) => path.endsWith("EXECUTION-FLOW.md"));
    const config = files.find((path) => path.endsWith("00-run-config.md"));
    const results = files.find((path) => path.endsWith("03-results.md"));
    return `
      <article class="run-card">
        <p class="eyebrow">WORKFLOW RUN</p>
        <h3>${escapeHtml(runName)}</h3>
        <ul>
          <li>문서 ${files.length}개</li>
          <li>${config ? `<button class="file-button inline" type="button" data-path="${escapeHtml(config)}">설정 열기</button>` : "설정 없음"}</li>
          <li>${flow ? `<button class="file-button inline" type="button" data-path="${escapeHtml(flow)}">실행 흐름 열기</button>` : "실행 흐름 없음"}</li>
          <li>${results ? `<button class="file-button inline" type="button" data-path="${escapeHtml(results)}">결과 열기</button>` : "결과 없음"}</li>
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
    paths.find((path) => path.endsWith("runs/2026-08-02-focus-group-subscription/EXECUTION-FLOW.md"))
    || paths.find((path) => path.endsWith("tt-focus-group.js"))
    || paths[0];
  if (preferred) await selectFile(preferred);
}

main().catch((error) => {
  document.querySelector("#file-groups").innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
});
