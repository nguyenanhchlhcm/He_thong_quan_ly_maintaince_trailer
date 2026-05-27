---
name: github-push
description: Guides and automates committing, formatting commit messages, and pushing code to GitHub. Use this skill when the user requests to push their code or sync changes with remote repositories.
---

# GitHub Push Skill

This skill helps stage workspace edits, format professional Conventional Commits messages, and push updates safely to your remote GitHub branch.

## 📦 Capabilities
1. **Change Discovery:** Detects dirty index statuses and prints modified/added items.
2. **Standardized Commit Messages:** Validates and formats commit messages in accordance with Conventional Commits specifications (e.g. `feat:`, `fix:`, `docs:`, `refactor:`).
3. **Automated Upload:** Triggers clean adds, commits, and pushes to remote branches.

---

## 🛠️ Usage Guide

### Method A: Automated CLI Helper (Recommended)
You can run the pre-configured automation script locally. Run this command inside the project root:

```powershell
python .agent/skills/github-push/scripts/push_code.py "feat: your descriptive commit message here"
```

### Method B: Manual Git Execution Sequence
If you prefer running git stages manually, execute the following commands sequentially:

1. **Verify status & branch name:**
   ```powershell
   git status
   git rev-parse --abbrev-ref HEAD
   ```
2. **Stage all changes:**
   ```powershell
   git add .
   ```
3. **Commit with standardized Conventional Commit messages:**
   - Features: `feat: add fallback VietQR name lookup`
   - Fixes: `fix: resolve mobile layout table overflow`
   - Enhancements/Refactoring: `refactor: optimize selected items card template`
   ```powershell
   git commit -m "feat: implement database fallback for VietQR and responsive mobile UI"
   ```
4. **Push commits safely:**
   ```powershell
   git push origin <current-branch>
   ```

---

## ⚠️ Troubleshooting & Edge Cases

* **Conflict Errors / Rejected Pushes:**
  If you see `error: failed to push some refs`, there are upstream updates. Fetch and pull first before executing the push sequence:
  ```powershell
  git pull origin <current-branch> --rebase
  ```
* **No Remote Configured:**
  Verify remotes list with `git remote -v`. If empty, add your target repo:
  ```powershell
  git remote add origin https://github.com/USER/REPONAME.git
  ```
