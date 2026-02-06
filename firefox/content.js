function handleSubmissionPage() {
  const match = location.pathname.match(/submissions\/(\d+)/);
  if (!match) return;

  const submissionId = Number(match[1]);

  browser.runtime.sendMessage({
    type: "FETCH_SUBMISSION_DETAILS",
    submissionId,
    pageUrl: location.href
  });
}

(function () {
  let lastUrl = location.href;

  const _pushState = history.pushState;
  const _replaceState = history.replaceState;

  history.pushState = function () {
    _pushState.apply(this, arguments);
    onUrlChange();
  };

  history.replaceState = function () {
    _replaceState.apply(this, arguments);
    onUrlChange();
  };

  window.addEventListener("popstate", onUrlChange);

  function onUrlChange() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(handleSubmissionPage, 0);
    }
  }

  handleSubmissionPage();
})();
