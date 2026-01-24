const fab = document.getElementById("git-fab");
const card = document.getElementById("git-sync-card");
const pushBtn = document.getElementById("pushBtn");
const statusText = document.getElementById("status");
const autoSyncToggle = document.getElementById("autoSync");

/* Toggle card on FAB click (Manual mode) */
fab.addEventListener("click", () => {
  card.style.display =
    card.style.display === "block" ? "none" : "block";
});

/* Manual Push */
pushBtn.addEventListener("click", () => {
  pushBtn.disabled = true;
  statusText.textContent = "Status: Pushing...";

  // 🔗 Hook GitHub push logic here
  setTimeout(() => {
    statusText.textContent = "Status: Pushed ✅";
    pushBtn.disabled = false;

    // Optional auto-hide
    setTimeout(() => {
      card.style.display = "none";
    }, 1200);
  }, 1200);
});

/* Auto Sync Logic (called when Accepted detected) */
function onAcceptedSubmission() {
  if (autoSyncToggle.checked) {
    statusText.textContent = "Status: Auto syncing...";
    // 🔗 Trigger GitHub push automatically here
  }
}

/* Export for content-script usage */
window.onAcceptedSubmission = onAcceptedSubmission;
