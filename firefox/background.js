browser.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.type !== "FETCH_SUBMISSION_DETAILS") return;

  console.log("msg received in bg:");
  const { submissionId, pageUrl } = msg;

  try {
    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        operationName: "submissionDetails",
        variables: { submissionId },
        query: `
          query submissionDetails($submissionId: Int!) {
            submissionDetails(submissionId: $submissionId) {
              code
              lang {
                verboseName
              }
              statusCode
            }
          }
        `
      })
    });

    const json = await response.json();
    const details = json?.data?.submissionDetails;

    console.log("[CP-Code-Manager][bg] Page URL:", pageUrl);
    console.log("[CP-Code-Manager][bg] Full submission details:", details);


  } catch (err) {
    console.error("[CP-Code-Manager][bg] GraphQL fetch failed:", err);
  }
});
