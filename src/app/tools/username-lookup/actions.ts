'use server';

import * as cheerio from 'cheerio';
import { URL, URLSearchParams } from 'url';

const PLATFORMS = {
    "GitHub": {
        "domain": "github.com",
        "profile_url": "https://github.com/{username}",
        "username_pattern": /^[A-Za-z0-9-]{1,39}$/,
        "profile_path_prefix": "/"
    },
    "Twitter": {
        "domain": "x.com",
        "profile_url": "https://x.com/{username}",
        "username_pattern": /^[A-Za-z0-9_]{1,15}$/,
        "profile_path_prefix": "/"
    },
    "Reddit": {
        "domain": "reddit.com",
        "profile_url": "https://www.reddit.com/user/{username}/",
        "username_pattern": /^[A-Za-z0-9-_]{3,20}$/,
        "profile_path_prefix": "/user/"
    },
    "Instagram": {
        "domain": "instagram.com",
        "profile_url": "https://www.instagram.com/{username}/",
        "username_pattern": /^[a-zA-Z0-9._]{1,30}$/,
        "profile_path_prefix": "/"
    },
    "Facebook": {
        "domain": "facebook.com",
        "profile_url": "https://www.facebook.com/{username}",
        "username_pattern": /^[A-Za-z0-9.-]{1,50}$/,
        "profile_path_prefix": "/"
    },
    "LinkedIn": {
        "domain": "linkedin.com",
        "profile_url": "https://www.linkedin.com/in/{username}/",
        "username_pattern": /^[A-Za-z0-9-]+$/,
        "profile_path_prefix": "/in/"
    },
    "Pinterest": {
        "domain": "pinterest.com",
        "profile_url": "https://www.pinterest.com/{username}/",
        "username_pattern": /^[A-Za-z0-9_]{3,30}$/,
        "profile_path_prefix": "/"
    },
    "Medium": {
        "domain": "medium.com",
        "profile_url": "https://medium.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{1,60}$/,
        "profile_path_prefix": "/@"
    },
    "YouTube": {
        "domain": "youtube.com",
        "profile_url": "https://www.youtube.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{3,60}$/,
        "profile_path_prefix": "/@"
    },
    "Quora": {
        "domain": "quora.com",
        "profile_url": "https://www.quora.com/profile/{username}",
        "username_pattern": /^[A-Za-z0-9\-._ ]{1,60}$/,
        "profile_path_prefix": "/profile/"
    }
} as const;

type PlatformKey = keyof typeof PLATFORMS;

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function generateVariations(seed: string, max_count = 120): string[] {
    seed = seed.trim();
    const variants = new Set<string>();

    const prefixes = ["", "real", "the", "its", "iam", "official", "mr", "mrs"];
    const suffixes = ["", "", ".", "_", "_x", "_dev", "_cyber", "007", "123", "01"];
    const pads = ["", "_", ".", "-"];

    for (const p of prefixes) {
        for (const pad of pads) {
            for (const s of suffixes) {
                const v = `${p}${pad}${seed}${s}`.replace(/^[_.-]+|[_.-]+$/g, "");
                if (v) variants.add(v.toLowerCase());
            }
        }
    }

    for (let n = 1; n <= 20; n++) {
        variants.add(`${seed}${n}`);
        variants.add(`${seed}_${n}`);
        variants.add(`${seed}.${n}`);
    }
    
    if (seed.includes(" ")) {
        const parts = seed.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) {
            const first = parts[0];
            const last = parts[parts.length - 1];
            variants.add(`${first}.${last}`);
            variants.add(`${first}_${last}`);
            variants.add(`${first}${last}`);
            variants.add(`${first[0]}${last}`);
            variants.add(`${first}${last[0]}`);
        }
    }

    return Array.from(variants).slice(0, max_count);
}


function validUsernameForPlatform(username: string, platformKey: PlatformKey): boolean {
    const pattern = PLATFORMS[platformKey].username_pattern;
    return new RegExp(pattern).test(username);
}

function extractUsernameFromUrl(url: string, platformKey: PlatformKey): string | null {
    try {
        let cleanUrl = url;
        if (url.includes("duckduckgo.com/l/?")) {
            const urlObj = new URL(url, "https://duckduckgo.com");
            const uddg = urlObj.searchParams.get("uddg");
            if (uddg) {
                cleanUrl = decodeURIComponent(uddg);
            }
        }
        
        const parsed = new URL(cleanUrl);

        if (!parsed.hostname.includes(PLATFORMS[platformKey].domain)) {
            return null;
        }

        let path = parsed.pathname.endsWith('/') ? parsed.pathname.slice(0, -1) : parsed.pathname;
        if (!path) return null;

        const prefix = PLATFORMS[platformKey].profile_path_prefix;
        
        if (path.startsWith(prefix)) {
            path = path.substring(prefix.length);
        } else if ((platformKey === 'YouTube' || platformKey === 'Medium') && path.startsWith('/@')) {
             // Already handled by prefix, but good to keep as a fallback
        } else if (prefix !== '/') {
            return null;
        }
        
        // The username is the remaining part of the path
        let username = path.split('/').pop() || '';
        if ((platformKey === 'YouTube' || platformKey === 'Medium') && username.startsWith('@')) {
            username = username.substring(1);
        }
        
        if (validUsernameForPlatform(username, platformKey)) {
            return username;
        }

        // Quora special case for spaces
        const decodedUsername = decodeURIComponent(username);
        if (validUsernameForPlatform(decodedUsername, platformKey)) {
            return decodedUsername;
        }

    } catch (error) {
        return null;
    }
    return null;
}

async function getRequest(url: string, timeout = 12000): Promise<Response | null> {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
            signal: AbortSignal.timeout(timeout),
            redirect: 'follow'
        });
        return response;
    } catch (error) {
        return null;
    }
}

async function headExists(url: string, timeout = 12000): Promise<boolean> {
    const response = await getRequest(url, timeout);
    return response ? [200, 301, 302, 401, 403].includes(response.status) : false;
}


async function checkExactUsername(platformKey: PlatformKey, username: string): Promise<{ username: string; url: string } | null> {
    if (!validUsernameForPlatform(username, platformKey)) {
        return null;
    }
    const url = PLATFORMS[platformKey].profile_url.replace('{username}', username);
    const exists = await headExists(url);
    return exists ? { username, url } : null;
}


async function ddgSearchUsernames(platformKey: PlatformKey, seed: string, maxHits = 20): Promise<string[]> {
    const domain = PLATFORMS[platformKey].domain;
    const q = `site:${domain} "${seed}"`;
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;

    try {
        const response = await getRequest(url);
        if (!response || !response.ok) return [];

        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates = new Set<string>();

        $('a.result__a').each((_, el) => {
            const href = $(el).attr('href');
            if (href && candidates.size < maxHits) {
                const username = extractUsernameFromUrl(href, platformKey);
                if (username) {
                    candidates.add(username);
                }
            }
        });
        return Array.from(candidates);
    } catch (error) {
        console.error(`DDG search failed for ${platformKey}:`, error);
        return [];
    }
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
    includeDiscovery: boolean = true,
    generateCount: number = 80,
    maxDiscoveryPerPlatform: number = 25
): Promise<UsernameSearchResults> {

    const results: UsernameSearchResults = {};
    platforms.forEach(p => {
        results[p] = { found: [], discovered: [] };
    });

    const variations = [seed, ...generateVariations(seed, generateCount).filter(v => v !== seed)];

    const discoveryPromises = includeDiscovery 
        ? platforms.map(p =>
            ddgSearchUsernames(p, seed, maxDiscoveryPerPlatform).then(discovered => {
                results[p].discovered = discovered;
            })
          )
        : [];

    const checkPromises = platforms.flatMap(platform =>
        variations.map(username =>
            checkExactUsername(platform, username).then(found => {
                if (found) {
                    results[platform].found.push(found);
                }
            })
        )
    );
    
    await Promise.allSettled([...discoveryPromises, ...checkPromises]);

    // De-duplicate and sort found results
    for (const p of platforms) {
        const foundUsernames = new Set<string>();
        results[p].found = results[p].found.filter(item => {
            const lowerUser = item.username.toLowerCase();
            if (foundUsernames.has(lowerUser)) {
                return false;
            }
            foundUsernames.add(lowerUser);
            return true;
        });

        results[p].found.sort((a, b) => {
            if (a.username.toLowerCase() === seed.toLowerCase()) return -1;
            if (b.username.toLowerCase() === seed.toLowerCase()) return 1;
            return a.username.localeCompare(b.username);
        });

        const foundSet = new Set(results[p].found.map(f => f.username));
        results[p].discovered = results[p].discovered.filter(d => !foundSet.has(d));
    }

    return results;
}
