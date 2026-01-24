

console.log("Background service worker started");

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
    });
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
  "Swift": "swift"
};

/* Topic → folder */
const TAG_TO_FOLDER = {
  "String": "strings",
  "Dynamic Programming": "dp",
  "Graph": "graph",
  "Tree": "tree",
  "Binary Tree": "tree",
  "Greedy": "greedy",
  "Backtracking": "backtracking",
  "Array": "array",
  "Hash Table": "hash-table",
  "Two Pointers": "two-pointers",
  "Stack": "stack",
  "Queue": "queue",
  "Heap (Priority Queue)": "heap",
  "Binary Search": "binary-search"
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
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== "PUSH_SOLUTION") return;

  chrome.storage.local.get("githubToken", async ({ githubToken }) => {
    if (!githubToken) {
      console.error("❌ GitHub token not found");
      return;
    }

    const { title, lang, code, tags } = msg.payload;

    const ext = LANG_EXT_MAP[lang] || "txt";
    const folder = resolveFolder(tags);

    const OWNER = "Sanjai05122006"; // 👈 your GitHub username
    const REPO = "LeetCode-Code-Documentation";

    const PATH = `leetcode/${folder}/${title}.${ext}`;
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

    try {
      let sha = null;

      // Check if file exists
      const check = await fetch(apiUrl, {
        headers: { Authorization: `token ${githubToken}` }
      });

      if (check.ok) {
        const existing = await check.json();
        sha = existing.sha;
      }

      // Create or update file
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: `Add ${title} (${lang})`,
          content: btoa(code),
          ...(sha && { sha })
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ GitHub error:", data);
        return;
      }

      console.log(`✅ Saved: ${PATH}`);
    } catch (err) {
      console.error("❌ Network error:", err);
    }
  });
});
