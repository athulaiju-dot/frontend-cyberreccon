'use server';

/**
 * @fileOverview Username Reconnaissance Engine (Best of Both).
 * Merges user Python logic (literal-first, simple string detection)
 * with robust TypeScript execution and variation generation.
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
  "GitHub-Gist": "https://gist.github.com/{}",
  "Medium": "https://medium.com/@{}"
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Implementation of user's profile_exists logic from Python.
 * Simplified to reduce false negatives while maintaining security.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    // logic from user script: status 200 AND absence of "not found" text
    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      
      // Basic check from user script
      if (!lowerText.includes("not found")) {
        // Platform specific guard for Instagram/Twitter redirects
        if (url.includes("instagram.com") && lowerText.includes("login - instagram")) {
            return false;
        }
        return true;
      }
    }
    
    // Status 401/403 often indicates a private profile tht DOES exist
    if (response.status === 401 || response.status === 403) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Generates variations from user script.
 */
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

  // Initialize results
  platforms.forEach(p => {
    results[p] = { exactMatch: null, found: [] };
  });

  // STEP 1: CHECK EXACT USERNAME FIRST (HIGHEST PRIORITY)
  // Logic from user script: check exact input first pass
  const exactTasks = platforms.map(async (platform) => {
    const url = PLATFORMS[platform].replace('{}', username);
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  // Wait for the literal match scan to finish first
  await Promise.allSettled(exactTasks);

  // STEP 2: CHECK VARIATIONS (Logic from user script)
  const variantTasks = platforms.flatMap(platform => 
    variations
      .filter(v => v !== username) // Skip literal match since checked above
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
