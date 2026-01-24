browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  if (
    tab.url.startsWith("https://leetcode.com/problems/") &&
    tab.url.includes("/submissions/")
  ) {
    await browser.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  }
});
