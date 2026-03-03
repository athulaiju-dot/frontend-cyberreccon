'use server';

/**
 * @fileOverview High-Performance Username Reconnaissance Engine.
 * Strictly implements the logic from the user-provided Python script:
 * - Direct HTTP probing with custom User-Agent.
 * - HTTP 200 OK verification.
 * - Title-tag inspection for Steam, Pastebin, and others to filter false positives.
 * - Multi-platform category grouping.
 */

import * as cheerio from 'cheerio';

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// Exported for UI consumption
export const PLATFORM_GROUPS: Record<string, Record<string, string>> = {
  "Social": {
    "Instagram": "https://www.instagram.com/{{username}}/",
    "Twitter": "https://twitter.com/{{username}}",
    "Reddit": "https://www.reddit.com/user/{{username}}",
    "TikTok": "https://www.tiktok.com/@{{username}}",
    "Pinterest": "https://www.pinterest.com/{{username}}/",
    "Facebook": "https://www.facebook.com/{{username}}",
    "Snapchat": "https://www.snapchat.com/add/{{username}}",
    "Telegram": "https://t.me/{{username}}"
  },
  "Tech & Dev": {
    "GitHub": "https://github.com/{{username}}",
    "GitLab": "https://gitlab.com/{{username}}",
    "StackOverflow": "https://stackoverflow.com/users/{{username}}",
    "Dev.to": "https://dev.to/{{username}}",
    "DockerHub": "https://hub.docker.com/u/{{username}}",
    "NPM": "https://www.npmjs.com/~{{username}}",
    "PyPI": "https://pypi.org/user/{{username}}"
  },
  "Gaming": {
    "Steam": "https://steamcommunity.com/id/{{username}}",
    "Twitch": "https://www.twitch.tv/{{username}}",
    "Roblox": "https://www.roblox.com/user.aspx?username={{username}}",
    "Xbox": "https://www.xboxgamertag.com/search/{{username}}",
    "Playstation": "https://psnprofiles.com/{{username}}"
  },
  "Creative & Other": {
    "YouTube": "https://www.youtube.com/@{{username}}",
    "Behance": "https://www.behance.net/{{username}}",
    "Dribbble": "https://dribbble.com/{{username}}",
    "Medium": "https://medium.com/@{{username}}",
    "Patreon": "https://www.patreon.com/{{username}}",
    "Pastebin": "https://pastebin.com/u/{{username}}"
  }
};

export interface UsernameAccount {
  platform: string;
  url: string;
  category: string;
}

export interface UsernameLookupResponse {
  total_found: number;
  accounts: UsernameAccount[];
}

/**
 * Custom logic to verify if a 200 OK response is a real profile.
 * Implements the Python script's check_200_ok logic.
 */
function verifyProfileContent(html: string, url: string, siteName: string): boolean {
  const $ = cheerio.load(html);
  const title = $("title").text();
  const lowerSite = siteName.toLowerCase();

  // Python logic: Steam "Error" in title means not found
  if (lowerSite === 'steam' && title.includes('Error')) {
    return false;
  }

  // Python logic: Pastebin default title means not found
  if (lowerSite === 'pastebin' && title.includes('#1 paste tool since 2002')) {
    return false;
  }

  // Generic patterns found in many "Not Found" 200 OK pages
  const lowerTitle = title.toLowerCase();
  const falsePatterns = [
    "page not found",
    "doesn't exist",
    "user not found",
    "404",
    "not found on"
  ];

  if (falsePatterns.some(p => lowerTitle.includes(p))) {
    return false;
  }

  return true;
}

/**
 * Checks a single site for username existence.
 */
async function checkSite(site: string, urlTemplate: string, username: string, category: string): Promise<UsernameAccount | null> {
  const finalUrl = urlTemplate.replace(/{{username}}/g, username);

  try {
    const response = await fetch(finalUrl, {
      headers: HEADERS,
      method: 'GET',
      cache: 'no-store',
      // Python uses 10s timeout
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 200) {
      const html = await response.text();
      if (verifyProfileContent(html, finalUrl, site)) {
        return {
          platform: site,
          url: finalUrl,
          category
        };
      }
    }
  } catch (error) {
    // Timeout or connection error = Not Found
  }
  return null;
}

/**
 * Main reconnaissance action.
 * Filtered by selected platforms.
 */
export async function searchUsernames(username: string, selectedPlatforms: string[]): Promise<UsernameLookupResponse> {
  if (!username) {
    throw new Error("Username is required.");
  }

  const cleanUsername = username.trim();
  const tasks: Promise<UsernameAccount | null>[] = [];

  // Queue checks only for selected platforms
  for (const [category, sites] of Object.entries(PLATFORM_GROUPS)) {
    for (const [site, urlTemplate] of Object.entries(sites)) {
      if (selectedPlatforms.includes(site)) {
        tasks.push(checkSite(site, urlTemplate, cleanUsername, category));
      }
    }
  }

  // Execute all probes concurrently
  const results = await Promise.allSettled(tasks);
  
  const foundAccounts: UsernameAccount[] = [];
  results.forEach(res => {
    if (res.status === 'fulfilled' && res.value) {
      foundAccounts.push(res.value);
    }
  });

  return {
    total_found: foundAccounts.length,
    accounts: foundAccounts
  };
}
