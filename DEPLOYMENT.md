# GitHub Deployment Guide

Follow these steps to host **CyberRecon** on your GitHub account.

### Step 1: Download the Project
Click the **Download** icon in the top toolbar of the Studio interface. This exports your current progress as a ZIP file.

### Step 2: Prepare for GitHub
Extract the ZIP file and open a terminal (like VS Code Terminal, Git Bash, or CMD) in that folder.

### Step 3: Connect to your Repository
Run these commands one by one:

1. `git init`
2. `git remote add origin https://github.com/niazahamed004-wq/cybertrace.git`
3. `git add .`
4. `git commit -m "Deployment of CyberRecon Toolkit"`
5. `git branch -M main`
6. `git push -u origin main`

### Step 4: Verification
Visit `https://github.com/niazahamed004-wq/cybertrace` in your browser to see your code live.

---

### Troubleshooting
- **Permission Denied**: Ensure you have SSH keys set up or use a Personal Access Token if prompted for a password.
- **Remote Already Exists**: If you get an error saying 'remote origin already exists', run `git remote remove origin` first.
