# CyberRecon Toolkit

An advanced OSINT (Open Source Intelligence) platform built with Next.js, Tailwind CSS, and Genkit.

## 🚀 Features
- **Username Intelligence**: Multi-platform profile discovery with specialized validation (Steam, Pastebin, etc.).
- **Phone Reconnaissance**: Carrier identification and IPQS fraud analytics.
- **Visual Intelligence**: Image hashing and reverse search using Gemini Vision.
- **Network Discovery**: IP/Domain geolocation and subdomain enumeration.
- **Security Probes**: Clickjacking and Host Header vulnerability testing.

## 📦 How to get the code
1. **Download**: Click the **Download** icon in the Firebase Studio toolbar to get the project as a ZIP file.
2. **GitHub**: Follow the deployment steps below to host it on your own GitHub account.

## 🛠️ Deployment to GitHub

To push this project to your repository and share it with friends, run these commands in your local terminal:

```bash
# Initialize git
git init

# Add your remote repository
git remote add origin https://github.com/niazahamed004-wq/cybertrace.git

# Stage all files
git add .

# Create initial commit
git commit -m "Initial CyberRecon commit"

# Push to main branch
git push -u origin main
```

## 🤝 Sharing & Collaboration
When sharing this project with others:
1. **API Keys**: Do NOT share your `.env` file. Your friends will need to get their own API keys for **IPQualityScore** and **Google Gemini**.
2. **Setup**: Tell them to run `npm install` and then `npm run dev` to start the local server.
3. **Credentials**: The default access is `admin` / `admin`.

## ⚠️ Security Warning
The included `.gitignore` protects your sensitive API keys. Never remove it before pushing to a public repository.

---
*Proprietary OSINT Architecture for Educational & Authorized Security Testing Only.*
