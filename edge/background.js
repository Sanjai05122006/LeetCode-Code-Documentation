console.log("🚀 Background service worker started");

/* Inject content.js on submission pages */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  if (
    tab.url.startsWith("https://leetcode.com/problems/") &&
    tab.url.includes("/submissions/")
  ) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    }).catch(err => console.error("Failed to inject content script:", err));
  }
});

/* Language → file extension */
const LANG_EXT_MAP = {
  "Python3": "py",
  "Python": "py",
  "Java": "java",
  "C++": "cpp",
  "C": "c",
  "JavaScript": "js",
  "TypeScript": "ts",
  "Go": "go",
  "Rust": "rs",
  "Kotlin": "kt",
  "Swift": "swift",
  "C#": "cs",
  "Ruby": "rb",
  "PHP": "php",
  "Scala": "scala"
};

/* Topic → folder */
const TAG_TO_FOLDER = {
  "String": "strings",
  "Dynamic Programming": "dp",
  "Graph": "graph",
  "Tree": "tree",
  "Binary Tree": "tree",
  "Binary Search Tree": "tree",
  "Greedy": "greedy",
  "Backtracking": "backtracking",
  "Array": "array",
  "Hash Table": "hash-table",
  "Two Pointers": "two-pointers",
  "Stack": "stack",
  "Queue": "queue",
  "Heap (Priority Queue)": "heap",
  "Binary Search": "binary-search",
  "Linked List": "linked-list",
  "Sorting": "sorting",
  "Math": "math",
  "Bit Manipulation": "bit-manipulation",
  "Depth-First Search": "dfs",
  "Breadth-First Search": "bfs",
  "Union Find": "union-find",
  "Sliding Window": "sliding-window",
  "Trie": "trie",
  "Design": "design"
};

const DEFAULT_FOLDER = "misc";

function resolveFolder(tags = []) {
  for (const tag of tags) {
    if (TAG_TO_FOLDER[tag]) {
      return TAG_TO_FOLDER[tag];
    }
  }
  return DEFAULT_FOLDER;
}

/* Receive solution and push to GitHub */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "PUSH_SOLUTION") return;

  (async () => {
    try {
      const data = await chrome.storage.local.get(["githubUsername", "githubRepo", "githubToken"]);
      
      const { githubUsername, githubRepo, githubToken } = data;

      if (!githubToken || !githubUsername || !githubRepo) {
        console.error("❌ GitHub credentials not configured");
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "LeetCode Git Sync",
          message: "⚠️ Please configure GitHub credentials in extension settings"
        });
        return;
      }

      const { title, displayTitle, lang, code, tags } = msg.payload;

      const ext = LANG_EXT_MAP[lang] || "txt";
      const folder = resolveFolder(tags);

      const PATH = `leetcode/${folder}/${title}.${ext}`;
      const apiUrl = `https://api.github.com/repos/${githubUsername}/${githubRepo}/contents/${PATH}`;

      console.log(`📤 Pushing to: ${PATH}`);

      let sha = null;

      // Check if file exists
      try {
        const check = await fetch(apiUrl, {
          headers: { 
            Authorization: `token ${githubToken}`,
            "User-Agent": "LeetCode-Git-Sync"
          }
        });

        if (check.ok) {
          const existing = await check.json();
          sha = existing.sha;
          console.log("📝 File exists, will update");
        }
      } catch (err) {
        console.log("📄 File doesn't exist, will create new");
      }

      // Create README header
      const problemUrl = `https://leetcode.com/problems/${title}/`;
      const readme = `# ${displayTitle}

**Problem Link:** ${problemUrl}

**Language:** ${lang}

**Topics:** ${tags.join(", ")}

---

\`\`\`${ext}
${code}
\`\`\`
`;

      // Create or update file
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          "User-Agent": "LeetCode-Git-Sync"
        },
        body: JSON.stringify({
          message: sha 
            ? `Update: ${displayTitle} (${lang})` 
            : `Add: ${displayTitle} (${lang})`,
          content: btoa(unescape(encodeURIComponent(readme))),
          ...(sha && { sha })
        })
      });

      const result = await res.json();

      if (!res.ok) {
        console.error("❌ GitHub API error:", result);
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "LeetCode Git Sync",
          message: `❌ Failed to push: ${result.message || "Unknown error"}`
        });
        return;
      }

      console.log(`✅ Successfully saved: ${PATH}`);
      
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "LeetCode Git Sync",
        message: `✅ Successfully pushed ${displayTitle}!`
      });

    } catch (err) {
      console.error("❌ Network error:", err);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "LeetCode Git Sync",
        message: `❌ Network error: ${err.message}`
      });
    }
  })();

  return true; // Keep message channel open for async response
});