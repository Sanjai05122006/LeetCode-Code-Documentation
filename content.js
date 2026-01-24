

console.log("content.js injected");

(function () {
  const match = location.pathname.match(/submissions\/(\d+)/);
  if (!match) return;

  const submissionId = Number(match[1]);

  fetch("https://leetcode.com/graphql", {
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
              titleSlug
              topicTags {
                name
              }
            }
          }
        }
      `
    })
  })
    .then(r => r.json())
    .then(d => {
      const details = d.data.submissionDetails;
      if (!details || details.statusCode !== 10) return;

      chrome.runtime.sendMessage({
        type: "PUSH_SOLUTION",
        payload: {
          title: details.question.titleSlug,
          lang: details.lang.verboseName,
          code: details.code,
          tags: details.question.topicTags.map(t => t.name)
        }
      });
    })
    .catch(console.error);
})();
