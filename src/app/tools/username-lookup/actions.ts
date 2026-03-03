'use server';

/**
 * @fileOverview High-Performance Username Reconnaissance Engine.
 * Implements user-provided logic for content inspection and external discovery.
 */

import * as cheerio from 'cheerio';

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
};

const PLATFORMS: Record<string, string> = {
  Instagram: "https://www.instagram.com/",
  Twitter: "https://twitter.com/",
  GitHub: "https://github.com/",
  Reddit: "https://www.reddit.com/user/",
  TikTok: "https://www.tiktok.com/@",
  Pinterest: "https://www.pinterest.com/",
  YouTube: "https://www.youtube.com/@",
  Facebook: "https://www.facebook.com/",
  Medium: "https://medium.com/@/"
};

const FALSE_PATTERNS = [
  "not found",
  "page not found",
  "doesn’t exist",
  "doesn't exist",
  "user not found",
  "error",
  "login",
  "sign up"
];

function isFalsePositive(html: string): boolean {
  const lower = html.toLowerCase();
  return FALSE_PATTERNS.some(pattern => lower.includes(pattern));
}

function generateVariations(username: string): string[] {
  return [...new Set([
    username,
    username.toLowerCase(),
    username + "1",
    username + "123",
    username.replace(".", ""),
    username.replace("_", ""),
    username + "_official"
  ])];
}

async function checkProfile(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    if (response.status === 200) {
      const html = await response.text();
      return !isFalsePositive(html);
    }
    
    // Some platforms redirect to login if profile exists but user isn't logged in
    if (response.status === 301 || response.status === 302) return true;

    return false;
  } catch {
    return false;
  }
}

async function duckduckgoDiscovery(username: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const query = `"${username}" site:instagram.com OR site:twitter.com OR site:github.com OR site:reddit.com`;
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, { headers: HEADERS });
    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    $("a").each((_, el) => {
      const link = $(el).attr("href");
      if (link && link.toLowerCase().includes(username.toLowerCase()) && link.startsWith('http')) {
        results.push(link);
      }
    });
  } catch (e) {
    console.error("DDG Discovery failed:", e);
  }

  return [...new Set(results)].slice(0, 10); // Dedupe and limit
}

export type UsernameSearchResults = {
  [platform: string]: {
    exactMatch: { username: string; url: string } | null;
    found: { username: string; url: string }[];
  };
} & {
  "External Discovery"?: { found: { username: string; url: string }[] };
};

export async function searchUsernames(
  username: string,
  selectedPlatforms: (keyof typeof PLATFORMS)[]
): Promise<UsernameSearchResults> {
  const results: UsernameSearchResults = {};
  const cleanUsername = username.trim();

  // 1. Exact username check
  const exactTasks = selectedPlatforms.map(async (platform) => {
    const baseUrl = PLATFORMS[platform];
    const profileUrl = baseUrl + cleanUsername;
    const exists = await checkProfile(profileUrl);

    if (!results[platform]) results[platform] = { exactMatch: null, found: [] };
    if (exists) {
      results[platform].exactMatch = { username: cleanUsername, url: profileUrl };
    }
  });

  await Promise.allSettled(exactTasks);

  // 2. Variations
  const variations = generateVariations(cleanUsername);
  const variantTasks = selectedPlatforms.flatMap(platform => 
    variations
      .filter(v => v !== cleanUsername)
      .map(async (variation) => {
        const baseUrl = PLATFORMS[platform];
        const profileUrl = baseUrl + variation;
        const exists = await checkProfile(profileUrl);

        if (!results[platform]) results[platform] = { exactMatch: null, found: [] };
        if (exists) {
          results[platform].found.push({ username: variation, url: profileUrl });
        }
      })
  );

  await Promise.allSettled(variantTasks);

  // 3. DuckDuckGo discovery
  const ddgLinks = await duckduckgoDiscovery(cleanUsername);
  if (ddgLinks.length > 0) {
    results["External Discovery"] = {
      found: ddgLinks.map(link => ({ username: cleanUsername, url: link }))
    };
  }

  return results;
}
