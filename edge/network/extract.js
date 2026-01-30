const submissionId = location.pathname.match(/submissions\/(\d+)/)?.[1];
console.log(submissionId);

fetch("https://leetcode.com/graphql", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    operationName: "submissionDetails",
    variables: { submissionId: Number(submissionId) },
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
})
.then(r => r.json())
.then(d => console.log(d.data.submissionDetails));
