'use server';

/**
 * @fileOverview Username Reconnaissance Engine.
 * Strictly prioritizes literal matches and implements logic from user script.
 */

const PLATFORMS = {
  "Instagram": "https://www.instagram.com/{}/",
  "Twitter": "https://twitter.com/{}",
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
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
};

/**
 * Checks if a profile exists using logic:
 * Status 200 AND absence of common "not found" strings.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      // Social media sites can be slow to respond to cloud IPs
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      
      // List of strings that indicate the profile does NOT exist even if 200 OK is returned
      const notFoundIndicators = [
        "not found",
        "page not found",
        "couldn't find this account",
        "sorry, this page isn't available",
        "user not found",
        "profile_not_found",
        "doesn't exist",
        "account not found",
        "login - instagram", // Often indicates a redirect to login for a non-existent profile
        "redirected to login"
      ];

      const isNotFound = notFoundIndicators.some(indicator => lowerText.includes(indicator));
      
      if (!isNotFound) {
        return true;
      }
    }
    
    // Some platforms return 401/403 for private profiles, which we should treat as "exists"
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
  // We do this in a separate, dedicated pass to ensure it's not buried
  const exactTasks = platforms.map(async (platform) => {
    const url = PLATFORMS[platform].replace('{}', username);
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  // Wait for the exact matches to finish first
  await Promise.allSettled(exactTasks);

  // STEP 2: CHECK VARIATIONS
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
