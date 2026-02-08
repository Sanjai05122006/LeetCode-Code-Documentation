# LeetCode Git Sync

LeetCode Git Sync is a browser extension that automatically saves accepted LeetCode solutions to a GitHub repository.  
It removes the need to manually copy code and push it to GitHub.

---

## Project Overview

LeetCode Git Sync helps developers document their coding practice effortlessly.  
Once a solution is accepted on LeetCode, the extension extracts the code and syncs it to GitHub in an organized format with minimal user interaction.

---

## Supported Platforms

- Firefox
- Edge

---

## Features

- Automatic detection of accepted LeetCode submissions
- Manual and auto-sync support
- Multi-language solution support
- Works on SPA pages like leetcode

---

## Technology Stack

- JavaScript
- WebExtension APIs
- LeetCode GraphQL API
- GitHub REST API

---

### Configure GitHub

1. Open the extension UI on a LeetCode submission page
2. Enter:
   - GitHub username
   - Repository name
   - Branch
   - Personal Access Token
3. Save the configuration

---

### Sync a LeetCode Solution

1. Submit a solution on LeetCode
2. Ensure the submission status is Accepted
3. Open the submission details page
4. The extension UI appears automatically
5. Click Push to GitHub or enable auto-sync
6. The solution is uploaded to the configured repository

---

## Security Considerations

- GitHub Personal Access Token is provided by the user
- Credentials are stored locally in the browser
- No data is sent to any service other than GitHub

---
