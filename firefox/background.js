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
console.log("GITHUB_CONFIG:", GITHUB_CONFIG);
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type !== "FETCH_SUBMISSION_DETAILS") return;

  console.log("msg received in background:");
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
            }
          }
        `
      })
    });

    const lcJson = await lcRes.json();
    const submission = lcJson?.data?.submissionDetails;

    if (!submission || submission.statusCode !== 10) {
      return;
    }

    const problemSlug = pageUrl.split("/problems/")[1].split("/")[0];
    const ext = submission.lang.verboseName.toLowerCase().includes("python")
      ? "py"
      : "txt";

    const filePath = `problems/${problemSlug}.${ext}`;

    const contentBase64 = btoa(unescape(encodeURIComponent(submission.code)));

    const ghUrl = `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${filePath}`;

    const ghRes = await fetch(ghUrl, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_CONFIG.PAT}`,
        "Accept": "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Add solution: ${problemSlug}`,
        content: contentBase64,
        branch: GITHUB_CONFIG.BRANCH
      })
    });

    const ghJson = await ghRes.json();

    if (!ghRes.ok) {
      return;
    }

    console.log("[CP-Code-Manager] Successfully pushed to GitHub:", ghJson.content.path);

  } catch (err) {
    console.error("[CP-Code-Manager] Error:", err);
  }
});
