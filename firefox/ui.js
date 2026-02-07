const UI_ID = "__cp_code_manager_ui__";

function injectUI() {
  if (document.getElementById(UI_ID)) return;

  const container = document.createElement("div");
  container.id = UI_ID;

  Object.assign(container.style, {
  position: "fixed",
  bottom: "40px",
  right: "40px",
  padding: "10px",
  width: "150px",
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
      wireUI();
    });
}

function removeUI() {
  const el = document.getElementById(UI_ID);
  if (el) el.remove();
}

function wireUI() {
    const style = document.createElement("style");
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
    `;
    document.head.appendChild(style);


  const toggle = document.getElementById("autoSubmitToggle");
  const btn = document.getElementById("manualSubmitBtn");

  browser.storage.local.get("autoSubmitEnabled").then(res => {
    toggle.checked = res.autoSubmitEnabled !== false;
  });

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

function checkUrl() {
  if (location.pathname.includes("/submissions/")) {
    injectUI();
  } else {
    removeUI();
  }
}

/* initial */
checkUrl();

/* SPA watcher */
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    checkUrl();
  }
}).observe(document, { subtree: true, childList: true });
