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

browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== "FETCH_SUBMISSION_DETAILS") return;

  if (!GITHUB_CONFIG) {
    await initGithubConfig();
  }

  const { submissionId, pageUrl } = msg;

  try {
    const lcRes = await fetch("https://leetcode.com/graphql", {
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

    const lcJson = await lcRes.json();
    const submission = lcJson?.data?.submissionDetails;

    if (!submission || submission.statusCode !== 10) return;

    const q = submission.question;
    const problemId = q.questionId;
    const filename = `${problemId}-${submissionId}.txt`;
    const filePath = `problems/${filename}`;

    const contentBase64 = btoa(unescape(encodeURIComponent(submission.code)));

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

    const metaUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/problems.json`;

    let meta = {};
    let metaSha = null;

    const metaRes = await fetch(metaUrl, {
      headers: {
        "Authorization": `Bearer ${GITHUB_CONFIG.PAT}`,
        "Accept": "application/vnd.github+json"
      }
    });

    if (metaRes.ok) {
      const metaJson = await metaRes.json();
      metaSha = metaJson.sha;
      meta = JSON.parse(atob(metaJson.content));
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
      lang: submission.lang.verboseName,
      timestamp: Date.now()
    });

    const metaContent = btoa(unescape(encodeURIComponent(JSON.stringify(meta, null, 2))));

    await fetch(metaUrl, {
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

    console.log("[CP-Code-Manager] Submission stored:", filePath);

  } catch (err) {
    console.error("[CP-Code-Manager] Error:", err);
  }
});
