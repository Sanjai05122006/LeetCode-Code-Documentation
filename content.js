(function () {
  const match = location.pathname.match(/submissions\/(\d+)/);
  if (!match) {
    console.error("Submission ID not found");
    return;
  }

  const submissionId = Number(match[1]);
  console.log("Submission ID:", submissionId);

  fetch("https://leetcode.com/graphql", {
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
            lang { verboseName }
            runtimeDisplay
            memoryDisplay
            statusCode
            question { titleSlug }
          }
        }
      `
    })
  })
    .then(r => r.json())
    .then(d => {
      console.log("Submission details:", d.data.submissionDetails);
      console.log("Code:\n", d.data.submissionDetails.code);
    })
    .catch(console.error);
})();
