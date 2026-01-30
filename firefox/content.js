(() => {
  const match = location.pathname.match(/submissions\/(\d+)/);
  if (!match) return;

  const submissionId = Number(match[1]);

  console.log("[CP-Code-Manager][content] submissionId:", submissionId);

  browser.runtime.sendMessage({
    type: "FETCH_SUBMISSION_DETAILS",
    submissionId,
    pageUrl: location.href
  });
  console.log("msg sent from content:");
})();
