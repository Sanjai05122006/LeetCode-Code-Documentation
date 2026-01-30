console.log("🚀 LeetCode Git Sync content.js injected");

(function () {
  // Check if we're on a submission page
  const match = location.pathname.match(/submissions\/(\d+)/);
  if (!match) return;

  const submissionId = Number(match[1]);

  // Inject CSS styles
  injectStyles();

  // Fetch submission details
  fetchSubmissionDetails(submissionId);
})();

function injectStyles() {
  if (document.getElementById("leetcode-git-sync-styles")) return;

  const styleEl = document.createElement("style");
  styleEl.id = "leetcode-git-sync-styles";
  styleEl.textContent = `
    /* Floating Action Button */
    #git-fab {
      position: fixed;
      bottom: 88px;
      right: 48px;
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 99999;
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    #git-fab.show {
      opacity: 1;
      transform: scale(1);
    }

    #git-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 15px 35px rgba(0,0,0,0.3);
    }

    #git-fab span {
      font-size: 24px;
    }

    /* Overlay Card */
    #git-sync-card {
      position: fixed;
      bottom: 152px;
      right: 48px;
      width: 280px;
      background: #ffffff;
      border: 2px solid #10b981;
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      z-index: 99999;
      display: none;
      animation: fadeUp 0.3s ease-out;
    }

    #git-sync-card.show {
      display: block;
    }

    /* Header */
    #git-sync-card h4 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      color: #10b981;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Row */
    .git-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      margin-bottom: 14px;
      font-weight: 500;
      color: #374151;
    }

    .git-row input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    /* Duplicate Options */
    .git-dup {
      margin-bottom: 14px;
    }

    .git-dup label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      margin-bottom: 8px;
      cursor: pointer;
      color: #4b5563;
      padding: 4px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .git-dup label:hover {
      background: #f3f4f6;
    }

    .git-dup input[type="radio"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }

    /* Button */
    .push-btn {
      width: 100%;
      margin-top: 12px;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .push-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .push-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    /* Status */
    .git-status {
      display: block;
      margin-top: 12px;
      font-size: 12px;
      text-align: center;
      color: #6b7280;
      font-weight: 500;
    }

    .git-status.success {
      color: #10b981;
    }

    .git-status.error {
      color: #ef4444;
    }

    /* Animation */
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(styleEl);
}

function createUI() {
  // Remove existing UI if any
  document.getElementById("git-fab")?.remove();
  document.getElementById("git-sync-card")?.remove();

  // Create floating button
  const fab = document.createElement("div");
  fab.id = "git-fab";
  fab.title = "GitHub Sync";
  fab.innerHTML = '<span>🔗</span>';
  document.body.appendChild(fab);

  // Create sync card
  const card = document.createElement("div");
  card.id = "git-sync-card";
  card.innerHTML = `
    <h4>✅ Accepted</h4>
    <div class="git-row">
      <span>Auto Sync</span>
      <input type="checkbox" id="autoSync"/>
    </div>
    <div class="git-dup">
      <label>
        <input type="radio" name="dup" value="override" checked />
        Override solution
      </label>
      <label>
        <input type="radio" name="dup" value="new" />
        New approach file
      </label>
    </div>
    <button id="pushBtn" class="push-btn">
      Push to GitHub 🚀
    </button>
    <small id="status" class="git-status">Status: Ready</small>
  `;
  document.body.appendChild(card);

  // Show FAB with animation
  setTimeout(() => fab.classList.add("show"), 100);

  // Toggle card on FAB click
  fab.addEventListener("click", () => {
    card.classList.toggle("show");
  });

  return { fab, card };
}

function fetchSubmissionDetails(submissionId) {
  fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      operationName: "submissionDetails",
      variables: { submissionId },
      query: `
        query submissionDetails($submissionId: Int!) {
          submissionDetails(submissionId: $submissionId) {
            code
            lang { verboseName }
            statusCode
            question {
              titleSlug
              title
              topicTags {
                name
              }
            }
          }
        }
      `
    })
  })
    .then((r) => r.json())
    .then((d) => {
      const details = d.data.submissionDetails;
      
      // Only show UI if submission was accepted (statusCode 10)
      if (!details || details.statusCode !== 10) {
        console.log("❌ Submission not accepted or invalid");
        return;
      }

      console.log("✅ Accepted submission detected!");
      
      // Create UI
      const ui = createUI();
      
      // Store submission data
      const submissionData = {
        title: details.question.titleSlug,
        displayTitle: details.question.title,
        lang: details.lang.verboseName,
        code: details.code,
        tags: details.question.topicTags.map((t) => t.name)
      };

      // Handle push button click
      const pushBtn = document.getElementById("pushBtn");
      const statusEl = document.getElementById("status");
      const autoSyncCheckbox = document.getElementById("autoSync");

      pushBtn.addEventListener("click", async () => {
        pushBtn.disabled = true;
        statusEl.textContent = "⏳ Pushing to GitHub...";
        statusEl.className = "git-status";

        try {
          // Send to background script
          chrome.runtime.sendMessage({
            type: "PUSH_SOLUTION",
            payload: submissionData
          });

          // Wait a bit for the background script to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          statusEl.textContent = "✅ Successfully pushed!";
          statusEl.className = "git-status success";
          
          setTimeout(() => {
            statusEl.textContent = "Status: Ready";
            statusEl.className = "git-status";
            pushBtn.disabled = false;
          }, 3000);

        } catch (err) {
          console.error("❌ Push error:", err);
          statusEl.textContent = "❌ Push failed!";
          statusEl.className = "git-status error";
          pushBtn.disabled = false;
        }
      });

      // Auto sync if enabled
      if (autoSyncCheckbox.checked) {
        console.log("🤖 Auto-sync enabled, pushing automatically...");
        setTimeout(() => pushBtn.click(), 1500);
      }
    })
    .catch((err) => {
      console.error("❌ Failed to fetch submission details:", err);
    });
}