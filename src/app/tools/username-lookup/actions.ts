'use server';

/**
 * @fileOverview Username Reconnaissance Engine (Server-Side).
 * STRICTLY prioritizes Literal Matches using logic from user's Python script.
 */

const PLATFORMS = {
  "Instagram": "https://www.instagram.com/{}",
  "Twitter": "https://twitter.com/{}",
  "GitHub": "https://github.com/{}",
  "TikTok": "https://www.tiktok.com/@{}",
  "YouTube": "https://www.youtube.com/@{}",
  "Facebook": "https://www.facebook.com/{}",
  "Reddit": "https://www.reddit.com/user/{}",
  "Pinterest": "https://www.pinterest.com/{}",
  "Medium": "https://medium.com/@{}"
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
};

/**
 * Core validation logic exactly as defined in the User's Python script.
 * Runs on server to bypass CORS.
 */
async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      // Abort after 10 seconds to keep the scan snappy
      signal: AbortSignal.timeout(10000)
    });

    // Python logic: Status 200 AND "not found" not in body
    if (response.status === 200) {
      const text = await response.text();
      const lowerText = text.toLowerCase();
      
      // Strict "not found" check from your Python script
      if (lowerText.includes("not found")) return false;
      
      // Special check for platform login-walls (often a sign of an existing profile)
      // but if the text says "page not found" on the login page, we handle it above.
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Variation logic exactly as defined in the User's Python script.
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
  
  // Initialize results object
  platforms.forEach(p => {
    results[p] = { exactMatch: null, found: [] };
  });

  // STEP 1: LITERAL MATCH SCAN (ABSOLUTE HIGHEST PRIORITY)
  // We execute this first to ensure it is the primary focus.
  const exactTasks = platforms.map(async (platform) => {
    const pattern = PLATFORMS[platform];
    const url = pattern.replace('{}', username);
    
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username, url };
    }
  });

  // Await the literal matches first
  await Promise.allSettled(exactTasks);

  // STEP 2: VARIATION SCAN (SECONDARY RECON)
  const variations = generateVariations(username);
  const variantTasks = platforms.flatMap(platform => 
    variations
      .filter(v => v !== username)
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
