'use client';

/**
 * @fileOverview Username Reconnaissance Engine.
 * Final implementation prioritizing Literal Matches and using User's Python logic.
 */

const PLATFORMS = {
  "Instagram": "https://www.instagram.com/{}/",
  "Twitter": "https://twitter.com/{}/",
  "GitHub": "https://github.com/{}",
  "TikTok": "https://www.tiktok.com/@{}/",
  "YouTube": "https://www.youtube.com/@{}/",
  "Facebook": "https://www.facebook.com/{}/",
  "Reddit": "https://www.reddit.com/user/{}/",
  "Pinterest": "https://www.pinterest.com/{}/",
  "Medium": "https://medium.com/@{}"
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Core validation logic from User's Python script.
 * Simple but effective: Status 200 and no "not found" text.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    // Exact logic from user's script
    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      
      // Look for "not found" or "page not found" common strings
      if (!lowerText.includes("not found") && !lowerText.includes("page unavailable")) {
        // Special case for Instagram/Twitter login walls which are NOT 404s
        if (url.includes("instagram.com") && lowerText.includes("login")) return false;
        return true;
      }
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

function generateVariations(username: string): string[] {
  const variants = new Set<string>([
    username,
    username.toLowerCase(),
    username.toUpperCase(),
    username + "1",
    username + "123",
    username + "_",
    username.replace(/\s+/g, ""),
    username.replace(/\s+/g, "_")
  ]);
  return Array.from(variants);
}

export type UsernameSearchResults = {
  [platform: string]: {
    exactMatch: { username: string; url: string } | null;
    found: { username: string; url: string }[];
  };
};

export async function searchUsernames(
  username: string,
  platforms: PlatformKey[]
): Promise<UsernameSearchResults> {
  const results: UsernameSearchResults = {};
  const variations = generateVariations(username);

  platforms.forEach(p => {
    results[p] = { exactMatch: null, found: [] };
  });

  // STEP 1: LITERAL MATCH SCAN (EXACT INPUT FIRST)
  // This is the user's primary requirement.
  const exactTasks = platforms.map(async (platform) => {
    const url = PLATFORMS[platform].replace('{}', username);
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  await Promise.allSettled(exactTasks);

  // STEP 2: VARIATION SCAN
  const variantTasks = platforms.flatMap(platform => 
    variations
      .filter(v => v !== username)
      .map(async (variant) => {
        const url = PLATFORMS[platform].replace('{}', variant);
        const exists = await profileExists(url);
        if (exists) {
          results[platform].found.push({ username: variant, url });
        }
      })
  );

  await Promise.allSettled(variantTasks);

  return results;
}
