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

async function initGithubConfig() {
  const stored = await browser.storage.local.get("githubConfig");

  if (!stored.githubConfig) {
    let url = browser.runtime.getURL("./env.json");
    let res = await fetch(url);
    let defaults = await res.json();

    await browser.storage.local.set({
      githubConfig: defaults
    });

    GITHUB_CONFIG = defaults;
  } else {
    GITHUB_CONFIG = stored.githubConfig;
  }
}

initGithubConfig();

async function fetchSubmissionWithRetry(submissionId) {
  let retries = 6;
  let submission = null;

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
    submission = json?.data?.submissionDetails;

    if (submission && submission.statusCode === 10) {
      return submission;
    }

    await new Promise(r => setTimeout(r, 800));
  }

  return null;
}

async function updateProblemsJson(problemId, q, submissionId, filePath, lang) {
  const metaUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/problems.json`;

  let meta = {};
  let metaSha = null;

  const fetchMeta = async () => {
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
  };

  await fetchMeta();

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

  const put = async () => {
    return fetch(metaUrl, {
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
  };

  let res = await put();

  if (res.status === 409) {
    await fetchMeta();
    res = await put();
  }

  if (!res.ok) {
    throw await res.json();
  }
}

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== "FETCH_SUBMISSION_DETAILS") return;

  if (!GITHUB_CONFIG) {
    await initGithubConfig();
  }

  const { submissionId } = msg;

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
});
