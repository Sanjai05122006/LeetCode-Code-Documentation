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

let GITHUB_CONFIG = null;
let lastSubmissionId = null;
let pendingSubmissionId = null;
let problemsJsonLock = Promise.resolve();
let autoSubmitEnabled = true;

/* -------------------- CONFIG INIT -------------------- */

async function initGithubConfig() {
  const stored = await browser.storage.local.get([
    "githubConfig",
    "autoSubmitEnabled"
  ]);

  if (!stored.githubConfig) {
    const url = browser.runtime.getURL("./env.json");
    const res = await fetch(url);
    const defaults = await res.json();

    await browser.storage.local.set({
      githubConfig: defaults
    });

    GITHUB_CONFIG = defaults;
  } else {
    GITHUB_CONFIG = stored.githubConfig;
  }

  if (typeof stored.autoSubmitEnabled === "boolean") {
    autoSubmitEnabled = stored.autoSubmitEnabled;
  } else {
    await browser.storage.local.set({ autoSubmitEnabled: true });
    autoSubmitEnabled = true;
  }
}

initGithubConfig();

/* -------------------- URL HELPERS -------------------- */

function extractSubmissionIdFromUrl(url) {
  const match = url?.match(/submissions\/(\d+)/);
  return match ? Number(match[1]) : null;
}

/* -------------------- LEETCODE FETCH -------------------- */

async function fetchSubmissionWithRetry(submissionId) {
  let retries =    6;

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
                questionId
                title
                titleSlug
                topicTags { name }
              }
            }
          }
        `
      })
    });

    const json = await res.json();
    const submission = json?.data?.submissionDetails;

    if (submission && submission.statusCode === 10) {
      return submission;
    }

    await new Promise(r => setTimeout(r, 800));
  }

  return null;
}

/* -------------------- problems.json MUTEX UPDATE -------------------- */

async function updateProblemsJson(problemId, q, submissionId, filePath, lang) {
  problemsJsonLock = problemsJsonLock.then(async () => {
    const metaUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/problems.json`;

    let attempts = 3;

    while (attempts--) {
      let meta = {};
      let metaSha = null;

      const res = await fetch(metaUrl, {
        headers: {
          "Authorization": `Bearer ${GITHUB_CONFIG.PAT}`,
          "Accept": "application/vnd.github+json"
        }
      });

      if (res.ok) {
        const json = await res.json();
        metaSha = json.sha;
        meta = JSON.parse(atob(json.content));
      }

      if (!meta[problemId]) {
        meta[problemId] = {
          questionId: problemId,
          title: q.title,
          titleSlug: q.titleSlug,
          topics: q.topicTags.map(t => t.name),
          submissions: []
        };
      }

      meta[problemId].submissions.push({
        submissionId,
        path: filePath,
        lang,
        timestamp: Date.now()
      });

      const metaContent = btoa(
        unescape(encodeURIComponent(JSON.stringify(meta, null, 2)))
      );

      const putRes = await fetch(metaUrl, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${GITHUB_CONFIG.PAT}`,
          "Accept": "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: `Update problems.json for ${q.titleSlug}`,
          content: metaContent,
          sha: metaSha,
          branch: GITHUB_CONFIG.BRANCH
        })
      });

      if (putRes.ok) {
        return; // ✅ success
      }

      if (putRes.status !== 409) {
        throw await putRes.json(); // real error
      }

      // 409 → retry with fresh SHA
      await new Promise(r => setTimeout(r, 300));
    }

    throw new Error("Failed to update problems.json after retries");
  }).catch(err => {
    console.error("[CP-Code-Manager] problems.json update failed:", err);
  });

  return problemsJsonLock;
}


/* -------------------- CORE SUBMISSION LOGIC -------------------- */

async function submitToGithub(submissionId) {
  try {
    const submission = await fetchSubmissionWithRetry(submissionId);
    if (!submission) return;

    const q = submission.question;
    const problemId = q.questionId;

    const langName = submission.lang.verboseName;
    const ext = LANG_EXT_MAP[langName] || "txt";

    const filename = `${problemId}-${submissionId}.${ext}`;
    const filePath = `problems/${filename}`;

    const contentBase64 = btoa(
      unescape(encodeURIComponent(submission.code))
    );

    const fileUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${filePath}`;

    await fetch(fileUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_CONFIG.PAT}`,
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Add submission ${submissionId} for ${q.titleSlug}`,
        content: contentBase64,
        branch: GITHUB_CONFIG.BRANCH
      })
    });

    await updateProblemsJson(
      problemId,
      q,
      submissionId,
      filePath,
      submission.lang.verboseName
    );

    console.log("[CP-Code-Manager] Submission stored:", filePath);

  } catch (err) {
    console.error("[CP-Code-Manager] Error:", err);
  }
}

/* -------------------- CONTROL FUNCTION -------------------- */

async function controlSubmission(submissionId) {
  pendingSubmissionId = submissionId;

  if (autoSubmitEnabled) {
    await submitToGithub(submissionId);
    pendingSubmissionId = null;
  } else {
    console.log("[CP-Code-Manager] Manual mode. Submission pending:", submissionId);
  }
}

/* -------------------- MANUAL TRIGGER -------------------- */

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "GITHUB_CONFIG_UPDATED") {
    await initGithubConfig();
    console.log("[CP-Code-Manager] GitHub config reloaded");
  }
  
  if (msg.type === "MANUAL_SUBMIT" && pendingSubmissionId) {
    await submitToGithub(pendingSubmissionId);
    pendingSubmissionId = null;
  }

  if (msg.type === "SET_AUTO_SUBMIT") {
    autoSubmitEnabled = !!msg.value;
    await browser.storage.local.set({
      autoSubmitEnabled
    });
  }
});

/* -------------------- TAB / SPA HOOKS -------------------- */

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    const submissionId = extractSubmissionIdFromUrl(changeInfo.url);
    if (!submissionId) return;
    if (submissionId === lastSubmissionId) return;

    lastSubmissionId = submissionId;
    controlSubmission(submissionId);
  }
});

browser.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await browser.tabs.get(activeInfo.tabId);
  if (!tab.url) return;

  const submissionId = extractSubmissionIdFromUrl(tab.url);
  if (!submissionId) return;
  if (submissionId === lastSubmissionId) return;

  lastSubmissionId = submissionId;
  controlSubmission(submissionId);
});

browser.runtime.onStartup.addListener(async () => {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true
  });

  if (!tabs[0]?.url) return;

  const submissionId = extractSubmissionIdFromUrl(tabs[0].url);
  if (!submissionId) return;

  lastSubmissionId = submissionId;
  controlSubmission(submissionId);
});
