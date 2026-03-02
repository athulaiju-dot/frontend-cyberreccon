'use server';

import * as cheerio from 'cheerio';
import { URL } from 'url';

/**
 * @fileOverview Advanced Username Reconnaissance Engine.
 * Optimized for accuracy and high-yield discovery.
 */

const PLATFORMS = {
    "GitHub": {
        "domain": "github.com",
        "profile_url": "https://github.com/{username}",
        "username_pattern": /^[A-Za-z0-9-]{1,39}$/,
        "profile_path_prefix": "/",
        "error_text": ["Not Found", "404"]
    },
    "Twitter": {
        "domain": "x.com",
        "profile_url": "https://x.com/{username}",
        "username_pattern": /^[A-Za-z0-9_]{1,15}$/,
        "profile_path_prefix": "/",
        "error_text": ["this account doesn't exist", "page doesn't exist"]
    },
    "Reddit": {
        "domain": "reddit.com",
        "profile_url": "https://www.reddit.com/user/{username}/",
        "username_pattern": /^[A-Za-z0-9-_]{3,20}$/,
        "profile_path_prefix": "/user/",
        "error_text": ["user not found", "page not found"]
    },
    "Instagram": {
        "domain": "instagram.com",
        "profile_url": "https://www.instagram.com/{username}/",
        "username_pattern": /^[a-zA-Z0-9._]{1,30}$/,
        "profile_path_prefix": "/",
        "error_text": ["Sorry, this page isn't available", "Page Not Found"]
    },
    "TikTok": {
        "domain": "tiktok.com",
        "profile_url": "https://www.tiktok.com/@{username}",
        "username_pattern": /^[a-zA-Z0-9._]{2,24}$/,
        "profile_path_prefix": "/@",
        "error_text": ["Couldn't find this account"]
    },
    "Twitch": {
        "domain": "twitch.tv",
        "profile_url": "https://www.twitch.tv/{username}",
        "username_pattern": /^[a-zA-Z0-9_]{4,25}$/,
        "profile_path_prefix": "/",
        "error_text": ["content is unavailable", "not found"]
    },
    "Facebook": {
        "domain": "facebook.com",
        "profile_url": "https://www.facebook.com/{username}",
        "username_pattern": /^[A-Za-z0-9.-]{1,50}$/,
        "profile_path_prefix": "/",
        "error_text": ["This content isn't available", "page not found"]
    },
    "LinkedIn": {
        "domain": "linkedin.com",
        "profile_url": "https://www.linkedin.com/in/{username}/",
        "username_pattern": /^[A-Za-z0-9-]+$/,
        "profile_path_prefix": "/in/",
        "error_text": ["Page not found", "404"]
    },
    "YouTube": {
        "domain": "youtube.com",
        "profile_url": "https://www.youtube.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{3,60}$/,
        "profile_path_prefix": "/@",
        "error_text": ["404 Not Found", "This page isn't available"]
    },
    "Steam": {
        "domain": "steamcommunity.com",
        "profile_url": "https://steamcommunity.com/id/{username}",
        "username_pattern": /^[A-Za-z0-9_-]{2,32}$/,
        "profile_path_prefix": "/id/",
        "error_text": ["The specified profile could not be found"]
    }
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function generateVariations(seed: string, max_count = 150): string[] {
    seed = seed.trim().toLowerCase();
    const variants = new Set<string>();

    const prefixes = ["", "real", "the", "its", "iam", "official", "mr", "mrs", "dev", "cyber", "orig", "true"];
    const suffixes = ["", "hq", "official", "dev", "cyber", "x", "pro", "007", "123", "01", "99", "me", "live"];
    const separators = ["", "_", ".", "-"];

    for (const p of prefixes) {
        for (const sep of separators) {
            for (const s of suffixes) {
                const v = `${p}${sep}${seed}${s}`.replace(/^[_.-]+|[_.-]+$/g, "");
                if (v && v.length >= 2) variants.add(v);
                
                // Also try with suffix-only
                if (s) {
                    const v2 = `${seed}${sep}${s}`.replace(/^[_.-]+|[_.-]+$/g, "");
                    if (v2 && v2.length >= 2) variants.add(v2);
                }
            }
        }
    }

    // Space separation handling
    if (seed.includes(" ")) {
        const parts = seed.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const f = parts[0];
            const l = parts[parts.length - 1];
            variants.add(`${f}${l}`);
            variants.add(`${f}.${l}`);
            variants.add(`${f}_${l}`);
            variants.add(`${f[0]}${l}`);
            variants.add(`${f}${l[0]}`);
            variants.add(`${f[0]}.${l[0]}`);
        }
    }

    return Array.from(variants).slice(0, max_count);
}

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
            signal: AbortSignal.timeout(8000)
        });

        // If explicitly 404, it's definitely gone
        if (response.status === 404) return null;

        // If status is 200, we must check the body for "soft 404" text
        if (response.ok) {
            const body = await response.text();
            const lowerBody = body.toLowerCase();
            
            // Check platform specific error strings
            const hasErrorText = platform.error_text.some(text => lowerBody.includes(text.toLowerCase()));
            if (hasErrorText) return null;

            // Basic check for generic "Page not found" or "Login required" patterns that might trigger false positives
            if (lowerBody.includes("login") && (platformKey === 'Instagram' || platformKey === 'Twitter')) {
                // If we hit a login wall, it's ambiguous, but usually implies the profile exists (or the site is blocking us)
                // For a "clean" experience, we'll count it but flag as a match if the URL doesn't look like a generic redirect
                return { username, url };
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

        $('a.result__a').each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                const uname = extractUsernameFromUrl(href, platformKey);
                if (uname && uname.toLowerCase().includes(seed.toLowerCase().replace(/\s+/g, ''))) {
                    candidates.add(uname);
                }
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
        } else if (prefix !== '/' && !path.includes(prefix)) {
            return null;
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
    const variations = [seed, ...generateVariations(seed)];

    // Initialize results object
    platforms.forEach(p => {
        results[p] = { found: [], discovered: [] };
    });

    const tasks = platforms.flatMap(platform => [
        // Exact checks
        ...variations.map(u => verifyAccountExistence(platform, u).then(res => {
            if (res) results[platform].found.push(res);
        })),
        // Discovery
        ...(includeDiscovery ? [ddgSearchDiscovery(platform, seed).then(res => {
            results[platform].discovered = res;
        })] : [])
    ]);

    await Promise.allSettled(tasks);

    // Post-processing: Deduplicate and Sort
    platforms.forEach(p => {
        const seen = new Set<string>();
        results[p].found = results[p].found.filter(item => {
            if (seen.has(item.username.toLowerCase())) return false;
            seen.add(item.username.toLowerCase());
            return true;
        }).sort((a, b) => a.username.length - b.username.length);

        const foundSet = new Set(results[p].found.map(f => f.username.toLowerCase()));
        results[p].discovered = results[p].discovered.filter(d => !foundSet.has(d.toLowerCase()));
    });

    return results;
}
