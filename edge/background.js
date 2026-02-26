const browser = globalThis.chrome;

const LANG_EXT_MAP = {
  "Python3": "py", "Python": "py", "Java": "java", "C++": "cpp",
  "C": "c", "JavaScript": "js", "TypeScript": "ts", "Go": "go",
  "Rust": "rs", "Kotlin": "kt", "Swift": "swift", "C#": "cs",
  "Ruby": "rb", "PHP": "php", "Scala": "scala"
};

let problemsJsonLock = Promise.resolve();

/* ── Config ── */
async function getGithubConfig() {
  const stored = await browser.storage.local.get(["githubConfig"]);
  if (stored.githubConfig && stored.githubConfig.PAT) return stored.githubConfig;

  try {
    const url = browser.runtime.getURL("env.json");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`env.json ${res.status}`);
    const defaults = await res.json();
    if (defaults.PAT) await browser.storage.local.set({ githubConfig: defaults });
    return defaults;
  } catch (e) {
    console.warn("[CP-Code-Manager] Could not load env.json:", e.message);
    return null;
  }
}

/* ── URL helper ── */
function extractSubmissionIdFromUrl(url) {
  const match = url?.match(/submissions\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/* ── LeetCode GraphQL fetch ── */
async function fetchSubmissionWithRetry(submissionId) {
  let retries = 6;
  while (retries--) {
    const res = await fetch("https://leetcode.com/graphql", {
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
                questionId title titleSlug
                topicTags { name }
              }
            }
          }
        `
      })
    });
    const json = await res.json();
    const submission = json?.data?.submissionDetails;
    if (submission && submission.statusCode === 10) return submission;
    await new Promise(r => setTimeout(r, 800));
  }
  return null;
}

/* ── problems.json update ── */
async function updateProblemsJson(cfg, problemId, q, submissionId, filePath, lang) {
  problemsJsonLock = problemsJsonLock.then(async () => {
    const metaUrl = `https://api.github.com/repos/${cfg.OWNER}/${cfg.REPO}/contents/problems.json`;
    let attempts = 3;

    while (attempts--) {
      let meta = {}, metaSha = null;
      const res = await fetch(metaUrl, {
        headers: { "Authorization": `Bearer ${cfg.PAT}`, "Accept": "application/vnd.github+json" }
      });
      if (res.ok) {
        const json = await res.json();
        metaSha = json.sha;
        meta = JSON.parse(atob(json.content));
      }

      if (!meta[problemId]) {
        meta[problemId] = {
          questionId: problemId, title: q.title,
          titleSlug: q.titleSlug, topics: q.topicTags.map(t => t.name),
          submissions: []
        };
      }
      meta[problemId].submissions.push({ submissionId, path: filePath, lang, timestamp: Date.now() });

      const putRes = await fetch(metaUrl, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${cfg.PAT}`, "Accept": "application/vnd.github+json" },
        body: JSON.stringify({
          message: `Update problems.json for ${q.titleSlug}`,
          content: btoa(unescape(encodeURIComponent(JSON.stringify(meta, null, 2)))),
          sha: metaSha, branch: cfg.BRANCH
        })
      });

      if (putRes.ok) return;
      if (putRes.status !== 409) throw await putRes.json();
      await new Promise(r => setTimeout(r, 300));
    }
    throw new Error("Failed to update problems.json after retries");
  }).catch(err => console.error("[CP-Code-Manager] problems.json failed:", err));

  return problemsJsonLock;
}

/* ── Core submit ── */
async function submitToGithub(submissionId) {
  try {
    const cfg = await getGithubConfig();
    if (!cfg || !cfg.PAT) {
      console.warn("[CP-Code-Manager] No GitHub config. Please set it via the extension UI.");
      return;
    }

    const submission = await fetchSubmissionWithRetry(submissionId);
    if (!submission) { console.warn("[CP-Code-Manager] Submission not found or not accepted."); return; }

    const q = submission.question;
    const langName = submission.lang.verboseName;
    const ext = LANG_EXT_MAP[langName] || "txt";
    const filePath = `problems/${q.questionId}-${submissionId}.${ext}`;

    const uploadRes = await fetch(
      `https://api.github.com/repos/${cfg.OWNER}/${cfg.REPO}/contents/${filePath}`,
      {
        method: "PUT",
        headers: { "Authorization": `Bearer ${cfg.PAT}`, "Accept": "application/vnd.github+json" },
        body: JSON.stringify({
          message: `Add submission ${submissionId} for ${q.titleSlug}`,
          content: btoa(unescape(encodeURIComponent(submission.code))),
          branch: cfg.BRANCH
        })
      }
    );

    if (!uploadRes.ok) {
      console.error("[CP-Code-Manager] Upload failed:", await uploadRes.json());
      return;
    }

    await updateProblemsJson(cfg, q.questionId, q, submissionId, filePath, langName);
    console.log("[CP-Code-Manager] ✅ Stored:", filePath);

  } catch (err) {
    console.error("[CP-Code-Manager] submitToGithub error:", err);
  }
}

/* ── Control ── */
async function controlSubmission(submissionId) {
  const stored = await browser.storage.local.get(["lastSubmissionId", "autoSubmitEnabled"]);
  if (stored.lastSubmissionId === submissionId) return;
  await browser.storage.local.set({ lastSubmissionId: submissionId });

  if (stored.autoSubmitEnabled !== false) {
    await submitToGithub(submissionId);
  } else {
    await browser.storage.local.set({ pendingSubmissionId: submissionId });
    console.log("[CP-Code-Manager] Manual mode. Pending:", submissionId);
  }
}

/* ── Messages ── */
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "GITHUB_CONFIG_UPDATED") {
    console.log("[CP-Code-Manager] Config updated.");
  }
  if (msg.type === "MANUAL_SUBMIT") {
    const { pendingSubmissionId } = await browser.storage.local.get("pendingSubmissionId");
    if (pendingSubmissionId) {
      await submitToGithub(pendingSubmissionId);
      await browser.storage.local.remove("pendingSubmissionId");
    }
  }
  if (msg.type === "SET_AUTO_SUBMIT") {
    await browser.storage.local.set({ autoSubmitEnabled: !!msg.value });
  }
});

/* ── Tab hooks ── */
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (!changeInfo.url) return;
  const id = extractSubmissionIdFromUrl(changeInfo.url);
  if (id) controlSubmission(id);
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await browser.tabs.get(tabId);
  if (!tab.url) return;
  const id = extractSubmissionIdFromUrl(tab.url);
  if (id) controlSubmission(id);
});

browser.runtime.onStartup.addListener(async () => {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;
  const id = extractSubmissionIdFromUrl(tab.url);
  if (id) controlSubmission(id);
});
