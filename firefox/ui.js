const UI_ID = "__cp_code_manager_ui__";

/* ---------- helpers ---------- */

function hasValidConfig(cfg) {
  return cfg &&
    cfg.OWNER &&
    cfg.REPO &&
    cfg.BRANCH &&
    cfg.PAT;
}

/* ---------- UI injection ---------- */

function injectUI() {
  if (document.getElementById(UI_ID)) return;

  const container = document.createElement("div");
  container.id = UI_ID;

  Object.assign(container.style, {
    position: "fixed",
    bottom: "40px",
    right: "40px",
    padding: "10px",
    width: "180px",
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    zIndex: "999999",
    fontSize: "12px",
    boxShadow: "0 0 12px rgba(0,0,0,0.7)",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  });

  const htmlUrl = browser.runtime.getURL("ui.html");

  fetch(htmlUrl)
    .then(r => r.text())
    .then(html => {
      container.innerHTML = html;
      document.body.appendChild(container);
      injectStyles();
      wireUI();
    });
}

function removeUI() {
  const el = document.getElementById(UI_ID);
  if (el) el.remove();
}

/* ---------- styles ---------- */

function injectStyles() {
  if (document.getElementById("__cp_ui_styles__")) return;

  const style = document.createElement("style");
  style.id = "__cp_ui_styles__";
  style.textContent = `
    #${UI_ID} label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    #${UI_ID} input[type="checkbox"] {
      accent-color: #4ade80;
      cursor: pointer;
    }

    #${UI_ID} input {
      width: 100%;
      padding: 5px;
      border-radius: 4px;
      border: none;
      font-size: 12px;
      box-sizing: border-box;
    }

    #${UI_ID} button {
      padding: 6px;
      border: none;
      border-radius: 6px;
      background: #4ade80;
      color: #000;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.05s ease;
    }

    #${UI_ID} button:hover {
      background: #22c55e;
    }

    #${UI_ID} button:active {
      transform: scale(0.97);
    }

    #${UI_ID} .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  `;
  document.head.appendChild(style);
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
