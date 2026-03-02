'use server';

/**
 * @fileOverview Username Reconnaissance Engine.
 * Strictly prioritizes literal matches and implements logic from user script.
 */

const PLATFORMS = {
  "Instagram": "https://www.instagram.com/{}",
  "Twitter": "https://twitter.com/{}",
  "GitHub": "https://github.com/{}",
  "TikTok": "https://www.tiktok.com/@{}",
  "YouTube": "https://www.youtube.com/@{}",
  "Facebook": "https://www.facebook.com/{}",
  "Reddit": "https://www.reddit.com/user/{}",
  "Pinterest": "https://www.pinterest.com/{}"
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

/**
 * Checks if a profile exists using the logic from user script:
 * Status 200 and "not found" not in body.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      // Logic from user script: check for "not found" in lowercased body
      if (!lowerText.includes("not found") && !lowerText.includes("page not found") && !lowerText.includes("couldn't find this account")) {
        return true;
      }
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

  // STEP 1: Check Exact Username First (Highest Priority)
  const exactTasks = platforms.map(async (platform) => {
    const url = PLATFORMS[platform].replace('{}', username);
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  await Promise.allSettled(exactTasks);

  // STEP 2: Check Variations
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
