# CyberRecon Toolkit

An advanced OSINT (Open Source Intelligence) platform built with Next.js, Tailwind CSS, and Genkit.

## Features
- **Username Intelligence**: Multi-platform profile discovery.
- **Phone Reconnaissance**: Carrier identification and IPQS fraud analytics.
- **Visual Intelligence**: Image hashing and reverse search.
- **Network Discovery**: IP/Domain geolocation and subdomain enumeration.
- **Security Probes**: Clickjacking and Host Header vulnerability testing.

## Deployment to GitHub

To push this project to your repository, run the following commands in your terminal:

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

## Security Warning
Ensure you do not commit your `.env` file publicly. The included `.gitignore` already protects your sensitive API keys (IPQualityScore and Gemini).