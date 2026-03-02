'use server';

import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * @fileOverview Advanced Username Reconnaissance Engine.
 * Combined logic from CyberTrace TS and User Python Script.
 * Prioritizes literal matches and uses multi-stage verification.
 */

const PLATFORMS = {
    "GitHub": {
        "domain": "github.com",
        "profile_url": "https://github.com/{username}",
        "username_pattern": /^[A-Za-z0-9-]{1,39}$/,
        "profile_path_prefix": "/",
        "error_text": ["Not Found", "404", "This is not the user you're looking for", "does not exist"]
    },
    "Twitter": {
        "domain": "x.com",
        "profile_url": "https://x.com/{username}",
        "username_pattern": /^[A-Za-z0-9_]{1,15}$/,
        "profile_path_prefix": "/",
        "error_text": ["this account doesn't exist", "page doesn't exist", "Account suspended"]
    },
    "Reddit": {
        "domain": "reddit.com",
        "profile_url": "https://www.reddit.com/user/{username}/",
        "username_pattern": /^[A-Za-z0-9-_]{3,20}$/,
        "profile_path_prefix": "/user/",
        "error_text": ["user not found", "page not found", "nobody on reddit goes by that name"]
    },
    "Instagram": {
        "domain": "instagram.com",
        "profile_url": "https://www.instagram.com/{username}/",
        "username_pattern": /^[a-zA-Z0-9._]{1,30}$/,
        "profile_path_prefix": "/",
        "error_text": ["Sorry, this page isn't available", "Page Not Found", "content isn't available", "broken link"]
    },
    "TikTok": {
        "domain": "tiktok.com",
        "profile_url": "https://www.tiktok.com/@{username}",
        "username_pattern": /^[a-zA-Z0-9._]{2,24}$/,
        "profile_path_prefix": "/@",
        "error_text": ["Couldn't find this account", "This account is private"]
    },
    "Twitch": {
        "domain": "twitch.tv",
        "profile_url": "https://www.twitch.tv/{username}",
        "username_pattern": /^[a-zA-Z0-9_]{4,25}$/,
        "profile_path_prefix": "/",
        "error_text": ["content is unavailable", "not found", "unless you've got a time machine"]
    },
    "Facebook": {
        "domain": "facebook.com",
        "profile_url": "https://www.facebook.com/{username}",
        "username_pattern": /^[A-Za-z0-9.-]{1,50}$/,
        "profile_path_prefix": "/",
        "error_text": ["This content isn't available", "page not found", "The link you followed may be broken"]
    },
    "LinkedIn": {
        "domain": "linkedin.com",
        "profile_url": "https://www.linkedin.com/in/{username}/",
        "username_pattern": /^[A-Za-z0-9-]+$/,
        "profile_path_prefix": "/in/",
        "error_text": ["Page not found", "404", "Profile Not Found"]
    },
    "YouTube": {
        "domain": "youtube.com",
        "profile_url": "https://www.youtube.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{3,60}$/,
        "profile_path_prefix": "/@",
        "error_text": ["404 Not Found", "This page isn't available", "This channel does not exist"]
    },
    "Steam": {
        "domain": "steamcommunity.com",
        "profile_url": "https://steamcommunity.com/id/{username}",
        "username_pattern": /^[A-Za-z0-9_-]{2,32}$/,
        "profile_path_prefix": "/id/",
        "error_text": ["The specified profile could not be found"]
    },
    "Medium": {
        "domain": "medium.com",
        "profile_url": "https://medium.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{1,60}$/,
        "profile_path_prefix": "/@",
        "error_text": ["404", "not found", "out of order"]
    },
    "Pinterest": {
        "domain": "pinterest.com",
        "profile_url": "https://www.pinterest.com/{username}/",
        "username_pattern": /^[A-Za-z0-9_]{3,30}$/,
        "profile_path_prefix": "/",
        "error_text": ["404", "not found"]
    }
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Generates smart variations of a seed username.
 * Integrated patterns from user Python script.
 */
function generateVariations(seed: string, max_count = 150): string[] {
    seed = seed.trim().replace(/\s+/g, '');
    const variants = new Set<string>();

    // 1. Core variations from User Script
    variants.add(seed);
    variants.add(seed.toLowerCase());
    variants.add(seed.toUpperCase());
    variants.add(seed + "1");
    variants.add(seed + "123");
    variants.add(seed + "_");
    
    // 2. Complex combinations
    const prefixes = ["", "real", "the", "its", "iam", "official", "mr", "mrs", "dev", "cyber"];
    const suffixes = ["", "hq", "official", "dev", "cyber", "x", "pro", "app", "me", "live"];
    const separators = ["", "_", ".", "-"];

    for (const p of prefixes) {
        for (const sep of separators) {
            for (const s of suffixes) {
                const v = `${p}${sep}${seed}${s}`.replace(/^[_.-]+|[_.-]+$/g, "");
                if (v && v.length >= 2) variants.add(v.toLowerCase());
            }
        }
    }

    // 3. Numeric endings
    for (let i = 2; i <= 20; i++) {
        variants.add(`${seed}${i}`);
        variants.add(`${seed}_${i}`);
    }

    return Array.from(variants).slice(0, max_count);
}

/**
 * Verifies if a username exists on a specific platform using deep inspection.
 * Integrated 'soft 404' logic from user Python script.
 */
async function verifyAccountExistence(platformKey: PlatformKey, username: string): Promise<{ username: string; url: string } | null> {
    const platform = PLATFORMS[platformKey];
    if (!platform.username_pattern.test(username)) return null;

    const url = platform.profile_url.replace('{username}', username);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(10000)
        });

        // 404 is definitive
        if (response.status === 404) return null;

        if (response.ok || response.status === 401 || response.status === 403) {
            const body = await response.text();
            const lowerBody = body.toLowerCase();
            
            // Check for platform-specific error markers (Better than generic "not found")
            const hasErrorText = platform.error_text.some(text => lowerBody.includes(text.toLowerCase()));
            if (hasErrorText) return null;

            // Simple "not found" check from User Script as a fallback
            if (lowerBody.includes("page not found") || lowerBody.includes("not found")) {
                // Double check if it's a false positive (some sites have "not found" in footer)
                // If it's a small page or the title contains not found, it's likely a miss
                if (lowerBody.length < 5000 || lowerBody.includes("<title>page not found")) {
                    return null;
                }
            }

            return { username, url };
        }

        return null;
    } catch (error) {
        return null;
    }
}

async function ddgSearchDiscovery(platformKey: PlatformKey, seed: string): Promise<string[]> {
    const domain = PLATFORMS[platformKey].domain;
    const q = `site:${domain} "${seed}"`;
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

    try {
        const response = await fetch(url, { headers: { 'User-Agent': UA } });
        if (!response.ok) return [];

        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates = new Set<string>();

        // Ported from User Script: search for platform links in DuckDuckGo results
        $('a.result__a').each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                const uname = extractUsernameFromUrl(href, platformKey);
                if (uname) candidates.add(uname);
            }
        });
        return Array.from(candidates);
    } catch {
        return [];
    }
}

function extractUsernameFromUrl(url: string, platformKey: PlatformKey): string | null {
    try {
        let cleanUrl = url;
        if (url.includes("duckduckgo.com/l/?")) {
            const urlObj = new URL(url, "https://duckduckgo.com");
            const uddg = urlObj.searchParams.get("uddg");
            if (uddg) cleanUrl = decodeURIComponent(uddg);
        }
        
        const parsed = new URL(cleanUrl);
        const platform = PLATFORMS[platformKey];
        if (!parsed.hostname.includes(platform.domain)) return null;

        let path = parsed.pathname.replace(/\/$/, '');
        const prefix = platform.profile_path_prefix;
        
        if (path.startsWith(prefix)) {
            path = path.substring(prefix.length);
        }
        
        const username = path.split('/').pop()?.replace(/^@/, '') || '';
        if (platform.username_pattern.test(username)) return username;
    } catch {
        return null;
    }
    return null;
}

export type UsernameSearchResults = {
    [platform: string]: {
        exactMatch: { username: string; url: string } | null;
        found: { username: string; url: string }[];
        discovered: string[];
    };
};

export async function searchUsernames(
    seed: string,
    platforms: PlatformKey[],
    includeDiscovery: boolean = true
): Promise<UsernameSearchResults> {
    const results: UsernameSearchResults = {};
    const variations = generateVariations(seed);

    platforms.forEach(p => {
        results[p] = { exactMatch: null, found: [], discovered: [] };
    });

    // Integrated logic from User Script:
    // 1. Literal input first across all platforms
    // 2. Variations across all platforms
    // 3. Search Engine Discovery

    const tasks = platforms.flatMap(platform => [
        // 1. HIGH PRIORITY: Exact Seed Check
        verifyAccountExistence(platform, seed).then(res => {
            if (res) results[platform].exactMatch = { username: res.username, url: res.url };
        }),
        // 2. VARIATIONS CHECK
        ...variations.map(u => {
            if (u.toLowerCase() === seed.toLowerCase()) return Promise.resolve();
            return verifyAccountExistence(platform, u).then(res => {
                if (res) results[platform].found.push({ username: res.username, url: res.url });
            });
        }),
        // 3. DISCOVERY CHECK
        ...(includeDiscovery ? [ddgSearchDiscovery(platform, seed).then(res => {
            results[platform].discovered = res.filter(d => d.toLowerCase() !== seed.toLowerCase());
        })] : [])
    ]);

    await Promise.allSettled(tasks);

    // Final cleanup: remove duplicates and ensure literal matches aren't in variations
    platforms.forEach(p => {
        const seen = new Set<string>();
        if (results[p].exactMatch) seen.add(results[p].exactMatch!.username.toLowerCase());

        results[p].found = results[p].found.filter(item => {
            const lower = item.username.toLowerCase();
            if (seen.has(lower)) return false;
            seen.add(lower);
            return true;
        });

        results[p].discovered = results[p].discovered.filter(d => !seen.has(d.toLowerCase()));
    });

    return results;
}
