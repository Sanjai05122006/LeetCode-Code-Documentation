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
    background: "#111",
    color: "#fff",
    borderRadius: "8px",
    zIndex: "999999",
    fontSize: "12px",
    boxShadow: "0 0 10px rgba(0,0,0,0.6)"
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
