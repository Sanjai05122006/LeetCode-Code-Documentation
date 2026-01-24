export async function testGitHubPush(token, owner, repo) {
  const path = "leetcode/test/working.txt";
  const content = "Hello from LeetCode extension";

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Test push from extension",
        content: btoa(content)
      })
    }
  );

  return res.json();
}
