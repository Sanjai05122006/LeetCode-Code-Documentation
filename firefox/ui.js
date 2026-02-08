const UI_ID = "__cp_code_manager_ui__";
const CSS_ID = "__cp_code_manager_ui_css__";

/* ---------- helpers ---------- */

function hasValidConfig(cfg) {
  return cfg &&
    cfg.OWNER &&
    cfg.REPO &&
    cfg.BRANCH &&
    cfg.PAT;
}

/* ---------- CSS injection ---------- */

function injectCSS() {
  if (document.getElementById(CSS_ID)) return;

  const link = document.createElement("link");
  link.id = CSS_ID;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = browser.runtime.getURL("ui.css");

  document.head.appendChild(link);
}

/* ---------- UI injection ---------- */

function injectUI() {
  if (document.getElementById(UI_ID)) return;

  injectCSS();

  const container = document.createElement("div");
  container.id = UI_ID;

  Object.assign(container.style, {
    position: "fixed",
    bottom: "40px",
    right: "40px",
    padding: "16px",
    width: "320px",
    minHeight: "auto",
    maxHeight: "600px",
    background: "#111",
    color: "#fff",
    borderRadius: "12px",
    zIndex: "999999",
    fontSize: "12px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "auto"
  });

  const htmlUrl = browser.runtime.getURL("ui.html");

  fetch(htmlUrl)
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;
      document.body.appendChild(container);
      wireUI();
    });
}

function removeUI() {
  const el = document.getElementById(UI_ID);
  if (el) el.remove();
}

/* ---------- wiring ---------- */

function wireUI() {
  const configForm = document.getElementById("configForm");
  const mainControls = document.getElementById("mainControls");

  browser.storage.local.get(["githubConfig", "autoSubmitEnabled"]).then(res => {
    if (!hasValidConfig(res.githubConfig)) {
      configForm.style.display = "flex";
      mainControls.style.display = "none";
      wireConfigForm();
    } else {
      configForm.style.display = "none";
      mainControls.style.display = "flex";
      wireMainControls(res.autoSubmitEnabled);
    }
  });
}

function wireConfigForm() {
  const saveBtn = document.getElementById("saveConfigBtn");

  saveBtn.addEventListener("click", async () => {
    const config = {
      OWNER: document.getElementById("cfgOwner").value.trim(),
      REPO: document.getElementById("cfgRepo").value.trim(),
      BRANCH: document.getElementById("cfgBranch").value.trim() || "main",
      PAT: document.getElementById("cfgPat").value.trim()
    };

    if (!hasValidConfig(config)) {
      alert("Please fill all fields");
      return;
    }

    await browser.storage.local.set({
      githubConfig: config
    });
    
    browser.runtime.sendMessage({
    type: "GITHUB_CONFIG_UPDATED"
    });

    console.log("submited",config);   

    const stored_check = await browser.storage.local.get([
    "githubConfig",
    "autoSubmitEnabled"
  ]);
  console.log("check result",stored_check);

    wireUI();
  });
}

function wireMainControls(autoEnabled) {
  const toggle = document.getElementById("autoSubmitToggle");
  const btn = document.getElementById("manualSubmitBtn");

  toggle.checked = autoEnabled !== false;

  toggle.addEventListener("change", () => {
    browser.runtime.sendMessage({
      type: "SET_AUTO_SUBMIT",
      value: toggle.checked
    });
  });

  btn.addEventListener("click", () => {
    browser.runtime.sendMessage({
      type: "MANUAL_SUBMIT"
    });
  });
}

/* ---------- URL detection (SPA-safe) ---------- */

function checkUrl() {
  if (location.pathname.includes("/submissions/")) {
    injectUI();
  } else {
    removeUI();
  }
}

/* initial */
checkUrl();

/* SPA navigation watcher */
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkUrl();
  }
}).observe(document, { subtree: true, childList: true });