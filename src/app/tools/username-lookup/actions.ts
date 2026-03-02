'use server';

/**
 * @fileOverview High-Performance Username Reconnaissance Engine.
 * Refined to eliminate false positives caused by login walls.
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

const NOT_FOUND_INDICATORS = [
  "not found", 
  "page not found", 
  "doesn't exist", 
  "does not exist",
  "couldn't find", 
  "account has been deleted", 
  "suspended",
  "login", 
  "sign up", 
  "log in", 
  "create an account",
  "join instagram"
];

async function profileExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: HEADERS,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      redirect: 'follow'
    });

    if (response.status === 404) return false;

    if (response.status === 200) {
      const lowerText = (await response.text()).toLowerCase();
      
      // Strict Check: If the page contains any "Not Found" or "Login" indicators, it's a false positive
      const isFakeResult = NOT_FOUND_INDICATORS.some(indicator => lowerText.includes(indicator));
      
      if (isFakeResult) {
        // Exception: If it's a redirect to a login page, but the URL reflects the user, it MIGHT exist.
        // However, for OSINT accuracy, we prioritize public profiles.
        return false;
      }
      
      return true;
    }
    
    // Redirects usually mean the account exists but is hidden behind a wall.
    // We treat this as a positive to avoid missing private accounts.
    if (response.status === 301 || response.status === 302) return true;

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
  
  platforms.forEach(p => {
    results[p] = { exactMatch: null, found: [] };
  });

  const cleanUsername = username.trim();

  // PASS 1: ISOLATED LITERAL SCAN (HIGHEST PRIORITY)
  const exactTasks = platforms.map(async (platform) => {
    const pattern = PLATFORMS[platform];
    const url = pattern.replace('{}', cleanUsername);
    
    const exists = await profileExists(url);
    if (exists) {
      results[platform].exactMatch = { username: cleanUsername, url };
    }
  });

  await Promise.allSettled(exactTasks);

  // PASS 2: VARIATION SCAN
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
