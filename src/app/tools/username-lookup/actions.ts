'use server';

/**
 * @fileOverview High-Performance Username Reconnaissance Engine.
 * STRICTLY PRIORITIZES literal matches using your Python script logic.
 * Bypasses CORS by executing on the server.
 */

const PLATFORMS = {
  "Instagram": "https://www.instagram.com/{}/",
  "Twitter": "https://twitter.com/{}/",
  "GitHub": "https://github.com/{}/",
  "TikTok": "https://www.tiktok.com/@{}/",
  "YouTube": "https://www.youtube.com/@{}/",
  "Facebook": "https://www.facebook.com/{}/",
  "Reddit": "https://www.reddit.com/user/{}/",
  "Pinterest": "https://www.pinterest.com/{}/",
  "Medium": "https://medium.com/@{}/"
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Core validation logic based on your Python script.
 * Returns true if status is 200 and 'not found' is absent from text.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });

    // 1. Check for 404 status (standard)
    if (response.status === 404) return false;

    // 2. Logic from your script: Status 200 AND "not found" not in body
    if (response.status === 200) {
      const lowerText = (await response.text()).toLowerCase();
      
      if (lowerText.includes("not found")) return false;
      if (lowerText.includes("page not found")) return false;
      if (lowerText.includes("doesn't exist")) return false;
      
      // If we got a 200 and didn't find "not found" text, it's a match!
      return true;
    }
    
    // Redirects (301, 302) often indicate a profile exists (e.g. redirecting to login wall)
    if (response.status === 301 || response.status === 302) return true;

    return false;
  } catch (e) {
    // If request fails (timeout/block), assume it doesn't exist to prevent false positives
    return false;
  }
}

/**
 * Variation logic exactly as defined in your Python script.
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
  
  // Initialize results
  platforms.forEach(p => {
    results[p] = { exactMatch: null, found: [] };
  });

  const cleanUsername = username.trim();

  // STEP 1: LITERAL MATCH SCAN (ABSOLUTE HIGHEST PRIORITY)
  const exactTasks = platforms.map(async (platform) => {
    const pattern = PLATFORMS[platform];
    const url = pattern.replace('{}', cleanUsername);
    
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username: cleanUsername, url };
    }
  });

  // Await Literal Matches first to ensure they are found
  await Promise.allSettled(exactTasks);

  // STEP 2: VARIATION SCAN (SECONDARY RECON)
  const variations = generateVariations(cleanUsername);
  const variantTasks = platforms.flatMap(platform => 
    variations
      .filter(v => v !== cleanUsername)
      .map(async (variant) => {
        const pattern = PLATFORMS[platform];
        const url = pattern.replace('{}', variant);
        
        const exists = await profileExists(url);
        if (exists) {
          results[platform].found.push({ username: variant, url });
        }
      })
  );

  await Promise.allSettled(variantTasks);

  return results;
}