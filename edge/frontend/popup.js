document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("settingsForm");
  const usernameInput = document.getElementById("username");
  const repoInput = document.getElementById("repo");
  const tokenInput = document.getElementById("token");
  const statusEl = document.getElementById("status");

  // Load existing settings
  chrome.storage.local.get(
    ["githubUsername", "githubRepo", "githubToken"],
    (data) => {
      if (data.githubUsername) usernameInput.value = data.githubUsername;
      if (data.githubRepo) repoInput.value = data.githubRepo;
      if (data.githubToken) tokenInput.value = data.githubToken;
    }
  );

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const repo = repoInput.value.trim();
    const token = tokenInput.value.trim();

    if (!username || !repo || !token) {
      showStatus("❌ Please fill all fields", "error");
      return;
    }

    // Validate token format
    if (!token.startsWith("ghp_") && !token.startsWith("github_pat_")) {
      showStatus("⚠️ Invalid token format", "error");
      return;
    }

    // Test GitHub API connection
    showStatus("⏳ Validating credentials...", "");

    try {
      const response = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
        headers: {
          Authorization: `token ${token}`,
          "User-Agent": "LeetCode-Git-Sync"
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          showStatus("❌ Repository not found", "error");
        } else if (response.status === 401) {
          showStatus("❌ Invalid token", "error");
        } else {
          showStatus("❌ GitHub API error", "error");
        }
        return;
      }

      // Save settings
      chrome.storage.local.set(
        {
          githubUsername: username,
          githubRepo: repo,
          githubToken: token
        },
        () => {
          showStatus("✅ Settings saved successfully!", "success");
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            statusEl.classList.remove("show");
          }, 3000);
        }
      );

    } catch (err) {
      console.error("Validation error:", err);
      showStatus("❌ Failed to validate credentials", "error");
    }
  });

  function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status show ${type}`;
  }
});