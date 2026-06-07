<div align="center">

<img src="https://img.shields.io/badge/LeetCode-Git%20Sync-FFA116?style=for-the-badge&logo=leetcode&logoColor=white" alt="LeetCode Git Sync" />

# LeetCode Git Sync

**A browser extension that automatically syncs your accepted LeetCode solutions to GitHub.**

No copy-pasting. No manual commits. Just solve and push.

[![Firefox](https://img.shields.io/badge/Firefox-Extension-FF7139?style=flat-square&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/en-US/firefox/addon/cp-code-manager/)
![Edge](https://img.shields.io/badge/Edge-Coming%20Soon-lightgrey?style=flat-square&logo=microsoft-edge&logoColor=white)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Supported Browsers](#supported-browsers)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**LeetCode Git Sync** is a browser extension that bridges your LeetCode workflow and GitHub. Once you get an accepted submission on LeetCode, the extension automatically detects it, extracts the solution code, and pushes it to your configured GitHub repository — all without leaving the browser.

It's built for developers who want to maintain a clean, organized record of their problem-solving journey without the overhead of manual version control.

---

## Features

- **Auto-detection** — Listens for accepted submissions on LeetCode and triggers sync automatically
- **Manual sync** — Push solutions on demand using the extension popup
- **Auto-sync mode** — Toggle auto-push so every accepted solution is committed without any clicks
- **Multi-language support** — Works with Python, Java, C++, JavaScript, and any other language supported on LeetCode
- **SPA-compatible** — Correctly handles LeetCode's single-page application routing
- **GraphQL-powered** — Fetches rich problem metadata (title, difficulty, tags) via LeetCode's GraphQL API
- **Organized commits** — Solutions are stored in a structured format for easy navigation

---

## Supported Browsers

| Browser | Status |
|---------|--------|
| [![Firefox](https://img.shields.io/badge/-Firefox-FF7139?logo=firefox-browser&logoColor=white&style=flat-square)](https://addons.mozilla.org/en-US/firefox/addon/cp-code-manager/) Firefox | ✅ [Install from Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cp-code-manager/) |
| ![Edge](https://img.shields.io/badge/-Edge-lightgrey?logo=microsoft-edge&logoColor=white&style=flat-square) Microsoft Edge | 🔜 Coming Soon |
| Chrome | 🔜 Planned |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Extension logic | JavaScript (ES6+), WebExtension APIs |
| Problem data | LeetCode GraphQL API |
| Version control | GitHub REST API |
| UI | HTML, CSS |

---

## Installation

### Firefox

The extension is live on Mozilla Add-ons — no manual setup required.

**[→ Install from Mozilla Add-ons](https://addons.mozilla.org/en-US/firefox/addon/cp-code-manager/)**

Alternatively, to load it manually for development:

1. Clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click **This Firefox** → **Load Temporary Add-on**
4. Select the `manifest.json` file inside the `firefox/` folder

### Edge *(Coming Soon)*

Edge support is actively in development and will be available in an upcoming release.

---

## Configuration

Before syncing, you need to link the extension to your GitHub account.

1. Navigate to any LeetCode submission page
2. Open the extension popup
3. Fill in the following fields:

| Field | Description |
|-------|-------------|
| **GitHub Username** | Your GitHub username |
| **Repository Name** | The repo where solutions will be saved |
| **Branch** | Target branch (e.g., `main`) |
| **Personal Access Token** | A GitHub PAT with `repo` scope |

4. Click **Save**

> **Generating a GitHub Personal Access Token:**  
> Go to **GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)** → Generate a new token with the `repo` scope.

---

## Usage

### Auto-Sync

1. Enable **Auto-Sync** in the extension popup
2. Submit a solution on LeetCode
3. Once the submission status shows **Accepted**, the extension automatically pushes it to your repository

### Manual Sync

1. Submit a solution and wait for the **Accepted** status
2. Open the submission details page
3. Open the extension popup
4. Click **Push to GitHub**

### Viewing Synced Solutions

Solutions are committed to your GitHub repository under an organized folder structure:

```
<your-repo>/
└── problems/
    ├── two-sum/
    │   └── solution.py
    ├── reverse-linked-list/
    │   └── solution.java
    └── ...
```

---

## Project Structure

```
LeetCode-Code-Documentation/
├── firefox/              # Firefox extension source
├── edge/                 # Edge extension source
├── leetcode/             # LeetCode interaction scripts
├── problems/             # Synced solutions (example output)
├── problems.json         # Problem metadata index
├── query.txt             # LeetCode GraphQL queries
├── .gitignore
└── README.md
```

---

## Security

Your credentials stay with you. Here's how the extension handles sensitive data:

- **Local storage only** — The GitHub Personal Access Token and all configuration are stored in your browser's local extension storage
- **No third-party servers** — The extension communicates exclusively with LeetCode (to fetch submission data) and GitHub (to push files). No data ever passes through an external server
- **You control the token** — Use a fine-grained PAT scoped only to the target repository for minimal permissions

> ⚠️ Treat your PAT like a password. Do not share it or commit it to any public repository.

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "feat: add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature-name`
5. **Open** a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and describe your changes clearly in the PR.

### Reporting Issues

Found a bug or have a feature request? [Open an issue](https://github.com/Sanjai05122006/LeetCode-Code-Documentation/issues) with a clear description and steps to reproduce.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

---

### Built by a developer, for developers

If LeetCode Git Sync saved you even one copy-paste, it did its job.  
Give it a ⭐ — it helps others find the project and keeps the motivation going.

[![GitHub stars](https://img.shields.io/github/stars/Sanjai05122006/LeetCode-Code-Documentation?style=social)](https://github.com/Sanjai05122006/LeetCode-Code-Documentation/stargazers)

<br/>

Made with ❤️ 
</div>
