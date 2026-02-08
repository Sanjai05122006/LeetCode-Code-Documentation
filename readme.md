# 📌 LeetCode Git Sync

LeetCode Git Sync is a browser extension that automates saving accepted LeetCode solutions directly into a GitHub repository using the GitHub REST API.  
It streamlines the workflow of competitive programmers by eliminating manual copying and pushing of solutions.

---

## 🧾 Project Overview

LeetCode Git Sync is designed to help developers automatically document their coding practice.  
Once a solution is accepted on LeetCode, the extension extracts the code and syncs it to GitHub in an organized format with minimal user interaction.

---

## 🔧 Version & Platform

- **Browser Extension**
- **Manifest Version:** 3
- **Supported Browsers:** Edge,Firefox

---

## 📸 Screenshots

- Extension Settings Popup  
- Accepted Submission Page with Sync UI  
- GitHub Repository with Synced Solutions  


---

## 📑 Table of Contents

- Features and Capabilities
- Technology Stack  
- Installation  
- Manual Usage  
- GitHub Output Format  
- Security Considerations  
- Contributors  

---

## ✨ Features

### Core Functionality
- Automatic detection of **Accepted** LeetCode submissions
- Direct syncing of solutions to GitHub
- Manual and auto-sync support
- Clean and organized solution storage

### Advanced Capabilities
- Multi-language solution support
- GitHub Personal Access Token authentication
- Seamless operation with LeetCode SPA navigation
- Minimal UI interaction required

---

## 🧠 Business Logic

- Detects LeetCode submission pages dynamically
- Fetches submission details using LeetCode GraphQL
- Extracts:
  - Source code
  - Programming language
  - Problem metadata
- Pushes solutions to GitHub using REST API
- Prevents duplicate uploads and handles updates cleanly

---

## 🛠️ Technology Stack

### Extension Technologies
- JavaScript (ES6+)
- WebExtension APIs
- HTML5 / CSS3

### APIs Used
- LeetCode GraphQL API
- GitHub REST API

### Storage
- Browser Local Storage (for configuration)

---

## ⚙️ Installation

### Prerequisites
- Chromium-based browser (Edge / Chrome)
- GitHub account
- GitHub Personal Access Token with `repo` permission

### Steps
1. Open `edge://extensions` or `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the extension folder
5. The extension is now installed

---

## ▶️ Manual Usage

### Configure GitHub
1. Click the extension icon
2. Enter:
   - GitHub username
   - Repository name
   - Personal Access Token
3. Save configuration

---

### Sync a LeetCode Solution
1. Open any LeetCode problem
2. Submit your solution
3. Ensure the submission status is **Accepted**
4. Navigate to the submission details page
5. The extension UI appears automatically
6. Click **“Push to GitHub”**
7. Solution is uploaded to the configured repository

---

## 📂 GitHub Output Format

Solutions are stored in the repository as:

```text
leetcode/
├── array/
│   └── two-sum.js
├── dp/
│   └── climbing-stairs.py
└── graph/
    └── number-of-islands.java
