'use server';

/**
 * @fileOverview High-Performance Username Reconnaissance Engine.
 * Strictly implements the user-provided logic:
 * 1. Exact username check via DuckDuckGo scraping.
 * 2. Variation generation (suffixes, delimiter removal).
 * 3. Multi-platform discovery via search engine indexing.
 */

import * as cheerio from 'cheerio';

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
};

const PLATFORMS = [
  "instagram.com",
  "twitter.com",
  "github.com",
  "reddit.com",
  "tiktok.com",
  "pinterest.com",
  "youtube.com",
  "facebook.com",
  "linkedin.com"
];

export interface UsernameAccount {
  username_checked: string;
  url: string;
  platform?: string;
}

export interface UsernameLookupResponse {
  total_found: number;
  accounts: UsernameAccount[];
}

/**
 * Generates common variations of a username for broader discovery.
 */
function generateVariations(username: string): string[] {
  return [...new Set([
    username,
    username.toLowerCase(),
    username + "1",
    username + "123",
    username.replace(/\./g, ""),
    username.replace(/_/g, ""),
    username + "_official"
  ])];
}

/**
 * Scrapes DuckDuckGo HTML results for profile links matching target platforms and username.
 */
async function searchDuckDuckGo(username: string): Promise<string[]> {
  const results: string[] = [];

  try {
    const platformQuery = PLATFORMS.map(p => `site:${p}`).join(" OR ");
    const query = `"${username}" ${platformQuery}`;
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

    const response = await fetch(url, { 
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    $("a.result__a").each((_, el) => {
      const link = $(el).attr("href");

      if (!link) return;

      // Check if the link belongs to one of our target platforms 
      // AND contains the username (case-insensitive)
      const isTargetPlatform = PLATFORMS.some(platform => link.includes(platform));
      const containsUsername = link.toLowerCase().includes(username.toLowerCase());

      if (isTargetPlatform && containsUsername) {
        results.push(link);
      }
    });

  } catch (err: any) {
    console.error("Search error:", err.message);
  }

  return [...new Set(results)];
}

/**
 * Main reconnaissance action.
 * Executes exact match search followed by variations discovery.
 */
export async function searchUsernames(username: string): Promise<UsernameLookupResponse> {
  if (!username) {
    throw new Error("Username is required.");
  }

  const allAccounts: UsernameAccount[] = [];
  const cleanUsername = username.trim();

  // 1️⃣ Exact username first (Highest Priority)
  const exactResults = await searchDuckDuckGo(cleanUsername);
  exactResults.forEach(link => {
    allAccounts.push({
      username_checked: cleanUsername,
      url: link,
      platform: PLATFORMS.find(p => link.includes(p)) || "Unknown"
    });
  });

  // 2️⃣ Variations Discovery
  const variations = generateVariations(cleanUsername);

  // Process variations in parallel batches to maintain performance
  const variantTasks = variations
    .filter(v => v !== cleanUsername)
    .map(async (variation) => {
      const varResults = await searchDuckDuckGo(variation);
      return varResults.map(link => ({
        username_checked: variation,
        url: link,
        platform: PLATFORMS.find(p => link.includes(p)) || "Unknown"
      }));
    });

  const resolvedVariants = await Promise.allSettled(variantTasks);
  
  resolvedVariants.forEach(result => {
    if (result.status === 'fulfilled') {
      allAccounts.push(...result.value);
    }
  });

  // Deduplicate results based on URL
  const uniqueAccountsMap = new Map<string, UsernameAccount>();
  allAccounts.forEach(acc => {
    if (!uniqueAccountsMap.has(acc.url)) {
      uniqueAccountsMap.set(acc.url, acc);
    }
  });

  const uniqueAccounts = Array.from(uniqueAccountsMap.values());

  return {
    total_found: uniqueAccounts.length,
    accounts: uniqueAccounts
  };
}
