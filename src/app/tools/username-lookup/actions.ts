'use server';

/**
 * @fileOverview Username Reconnaissance Engine (Server-Side).
 * Prioritizes Literal Matches and mimics Python script logic.
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
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Core validation logic mimicking the User's Python script.
 * Runs on the server to bypass CORS.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      // Abort after 8 seconds to keep the scan snappy
      signal: AbortSignal.timeout(8000)
    });

    // Python logic: Status 200 + Content Check
    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      
      // Common "Not Found" signatures
      const notFoundSignatures = [
        "not found", 
        "page not found", 
        "page unavailable", 
        "sorry, this page isn't available",
        "doesn't exist"
      ];

      const isNotFound = notFoundSignatures.some(sig => lowerText.includes(sig));
      
      if (!isNotFound) {
        // Special case: Login walls are not 404s but they aren't the profile either
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

  // STEP 1: LITERAL MATCH SCAN (HIGHEST PRIORITY)
  // We run this first and await it to ensure it's prioritized.
  const exactTasks = platforms.map(async (platform) => {
    const url = PLATFORMS[platform].replace('{}', username);
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  await Promise.allSettled(exactTasks);

  // STEP 2: VARIATION SCAN
  // Only proceed with variations after literal scan is complete.
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
