// CP Code Manager ui.js
const _br = globalThis.chrome || globalThis.browser;
const HOST_ID = "__cp_mgr_host__";

function hasValidConfig(cfg) {
  return !!(cfg && cfg.OWNER && cfg.REPO && cfg.BRANCH && cfg.PAT);
}

function isOnSubmissionPage() {
  return !!location.pathname.match(/\/submissions\/\d+/);
}

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  #wrap {
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    background: #18181b;
    color: #f4f4f5;
    border-radius: 14px;
    padding: 18px;
    width: 320px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .title { font-size: 13px; font-weight: 700; color: #22c55e; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label { font-size: 11px; color: #a1a1aa; font-weight: 500; }
  input[type=text], input[type=password] {
    background: #27272a;
    border: 1px solid #3f3f46;
    border-radius: 7px;
    color: #f4f4f5;
    font-size: 13px;
    padding: 8px 10px;
    width: 100%;
    outline: none;
  }
  input:focus { border-color: #22c55e; }
  input::placeholder { color: #52525b; }
  .btn {
    width: 100%; padding: 9px; border: none;
    border-radius: 8px; font-size: 13px; font-weight: 700;
    cursor: pointer; background: #22c55e; color: #000;
  }
  .btn:hover { background: #16a34a; }
  .btn-gray { background: #3f3f46; color: #f4f4f5; font-weight: 500; }
  .btn-gray:hover { background: #52525b; }
  .row { display: flex; align-items: center; gap: 8px; cursor: pointer; color: #f4f4f5; }
  input[type=checkbox] { accent-color: #22c55e; width: 15px; height: 15px; cursor: pointer; }
  #configForm { display: flex; flex-direction: column; gap: 12px; }
  #mainControls { display: flex; flex-direction: column; gap: 10px; }
  .hint {
    font-size: 10.5px;
    color: #71717a;
    line-height: 1.5;
    border-top: 1px solid #27272a;
    padding-top: 10px;
  }
  .hint a { color: #22c55e; text-decoration: none; }
  .hint a:hover { text-decoration: underline; }
  .status {
    font-size: 11px;
    padding: 6px 10px;
    border-radius: 6px;
    background: #27272a;
    color: #a1a1aa;
    text-align: center;
  }
  .status.accepted { color: #22c55e; }
  .status.rejected  { color: #f87171; }
`;

const CONFIG_HTML = `
  <div id="configForm">
    <div class="title">⚙️ CP Code Manager</div>
    <div class="field">
      <label>GitHub Owner (username)</label>
      <input id="cfgOwner" type="text" placeholder="your-github-username" />
    </div>
    <div class="field">
      <label>Repository name</label>
      <input id="cfgRepo" type="text" placeholder="leetcode-solutions" />
    </div>
    <div class="field">
      <label>Branch</label>
      <input id="cfgBranch" type="text" placeholder="main" />
    </div>
    <div class="field">
      <label>Personal Access Token (PAT)</label>
      <input id="cfgPat" type="password" placeholder="ghp_..." />
    </div>
    <button class="btn" id="saveBtn">Save &amp; Connect</button>
    <div class="hint">
      🔑 <strong style="color:#d4d4d8">How to get a PAT:</strong><br/>
      GitHub → Settings → Developer settings →<br/>
      Personal access tokens → Tokens (classic)<br/>
      → Generate new token → tick <strong style="color:#d4d4d8">repo</strong> scope → copy.<br/><br/>
      <a href="https://github.com/settings/tokens/new?scopes=repo&description=CP-Code-Manager" target="_blank">
        → Create token directly ↗
      </a>
    </div>
  </div>
`;

const MAIN_HTML = `
  <div id="mainControls">
    <div class="title">✅ CP Code Manager</div>
    <div id="subStatus" class="status">Checking submission…</div>
    <label class="row">
      <input type="checkbox" id="autoToggle" />
      <span>Auto-push to GitHub</span>
    </label>
    <button class="btn" id="pushBtn">⬆ Push Now</button>
    <button class="btn btn-gray" id="resetBtn">Reset Config</button>
  </div>
`;

/* ── Single, clean waitForAccepted ── */
async function waitForAccepted(maxWaitMs = 6000) {
  const interval = 500;
  let elapsed = 0;
  const match = location.pathname.match(/\/submissions\/(\d+)/);
  if (!match) return false;
  const submissionId = Number(match[1]);

  while (elapsed <= maxWaitMs) {
    // 1. DOM selectors (fast path)
    const domSelectors = [
      '[data-e2e-locator="submission-result"]',
      'span.text-green-s',
      'span[class*="text-green"]',
      'div[class*="accepted" i]'
    ];
    for (const sel of domSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim().toLowerCase();
        if (text.includes("accepted")) return true;
        if (text.match(/wrong|error|limit|runtime|compile/)) return false;
      }
    }

    // 2. GraphQL (most reliable)
    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: "submissionDetails",
          variables: { submissionId },
          query: `query submissionDetails($submissionId: Int!) {
            submissionDetails(submissionId: $submissionId) { statusCode }
          }`
        })
      });
      const json = await res.json();
      const code = json?.data?.submissionDetails?.statusCode;
      if (code !== undefined && code !== null) return code === 10;
    } catch (_) { /* retry */ }

    await new Promise(r => setTimeout(r, interval));
    elapsed += interval;
  }
  return false;
}

/* ── Inject UI into shadow DOM ── */
function inject(configured) {
  const old = document.getElementById(HOST_ID);
  if (old) old.remove();

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.setAttribute("style",
    "position:fixed!important;bottom:40px!important;right:40px!important;" +
    "width:320px!important;z-index:2147483647!important;" +
    "pointer-events:auto!important;display:block!important"
  );

  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);
  shadow.innerHTML = `<style>${STYLES}</style><div id="wrap">${configured ? MAIN_HTML : CONFIG_HTML}</div>`;

  configured ? wireMainControls(shadow) : wireConfigForm(shadow);
}

function removeUI() {
  const h = document.getElementById(HOST_ID);
  if (h) h.remove();
}

/* ── Wire config form ── */
function wireConfigForm(shadow) {
  shadow.getElementById("saveBtn").onclick = async () => {
    const config = {
      OWNER:  shadow.getElementById("cfgOwner").value.trim(),
      REPO:   shadow.getElementById("cfgRepo").value.trim(),
      BRANCH: shadow.getElementById("cfgBranch").value.trim() || "main",
      PAT:    shadow.getElementById("cfgPat").value.trim()
    };
    if (!hasValidConfig(config)) { alert("Please fill in all fields."); return; }
    await _br.storage.local.set({ githubConfig: config });
    _br.runtime.sendMessage({ type: "GITHUB_CONFIG_UPDATED" });
    checkAndShow();
  };
}

/* ── Wire main controls ── */
function wireMainControls(shadow) {
  const toggle   = shadow.getElementById("autoToggle");
  const pushBtn  = shadow.getElementById("pushBtn");
  const resetBtn = shadow.getElementById("resetBtn");
  const statusEl = shadow.getElementById("subStatus");

  _br.storage.local.get("autoSubmitEnabled").then(res => {
    toggle.checked = res.autoSubmitEnabled !== false;
  });

  toggle.onchange = () => _br.runtime.sendMessage({ type: "SET_AUTO_SUBMIT", value: toggle.checked });
  pushBtn.onclick  = () => _br.runtime.sendMessage({ type: "MANUAL_SUBMIT" });
  resetBtn.onclick = async () => {
    await _br.storage.local.remove("githubConfig");
    checkAndShow();
  };

  // Update status label after acceptance check
  waitForAccepted().then(accepted => {
    if (!statusEl) return;
    if (accepted) {
      statusEl.textContent = "✅ Accepted — pushed to GitHub";
      statusEl.className = "status accepted";
    } else {
      statusEl.textContent = "❌ Not accepted — nothing pushed";
      statusEl.className = "status rejected";
    }
  });
}

/* ── Main decision logic ── */
async function checkAndShow() {
  const { githubConfig } = await _br.storage.local.get("githubConfig");
  const configured = hasValidConfig(githubConfig);

  if (!isOnSubmissionPage()) {
    removeUI();
    return;
  }

  // On submission page + not configured → show config form
  if (!configured) {
    inject(false);
    return;
  }

  // On submission page + configured → only show if accepted
  const accepted = await waitForAccepted();
  if (accepted) {
    inject(true);
  } else {
    removeUI();
  }
}

/* ── Boot ── */
checkAndShow();
document.addEventListener("DOMContentLoaded", checkAndShow);
window.addEventListener("load", checkAndShow);

// SPA navigation watcher
let _lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== _lastUrl) {
    _lastUrl = location.href;
    setTimeout(checkAndShow, 600);
  }
}).observe(document, { subtree: true, childList: true });

// Survival: re-inject config form if removed and still not configured
setInterval(() => {
  if (!isOnSubmissionPage()) return;
  _br.storage.local.get("githubConfig").then(({ githubConfig }) => {
    if (!hasValidConfig(githubConfig) && !document.getElementById(HOST_ID)) {
      inject(false);
    }
  });
}, 3000);
