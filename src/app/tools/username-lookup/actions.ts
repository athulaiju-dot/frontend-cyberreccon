'use server';

import * as cheerio from 'cheerio';

const PLATFORMS = {
    "GitHub": {
        "domain": "github.com",
        "profile_url": "https://github.com/{username}",
        "username_pattern": /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
    },
    "Twitter": {
        "domain": "x.com",
        "profile_url": "https://x.com/{username}",
        "username_pattern": /^[A-Za-z0-9_]{1,15}$/,
    },
    "Reddit": {
        "domain": "reddit.com",
        "profile_url": "https://www.reddit.com/user/{username}/",
        "username_pattern": /^[A-Za-z0-9-_]{3,20}$/,
    },
    "Instagram": {
        "domain": "instagram.com",
        "profile_url": "https://www.instagram.com/{username}/",
        "username_pattern": /^[a-zA-Z0-9._]{1,30}$/,
    },
    "Facebook": {
        "domain": "facebook.com",
        "profile_url": "https://www.facebook.com/{username}",
        "username_pattern": /^[A-Za-z0-9.-]{1,50}$/,
    },
    "LinkedIn": {
        "domain": "linkedin.com",
        "profile_url": "https://www.linkedin.com/in/{username}/",
        "username_pattern": /^[A-Za-z0-9-]+$/,
    },
    "Pinterest": {
        "domain": "pinterest.com",
        "profile_url": "https://www.pinterest.com/{username}/",
        "username_pattern": /^[A-Za-z0-9_]{3,30}$/,
    },
    "Medium": {
        "domain": "medium.com",
        "profile_url": "https://medium.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{1,60}$/,
    },
    "YouTube": {
        "domain": "youtube.com",
        "profile_url": "https://www.youtube.com/@{username}",
        "username_pattern": /^[@A-Za-z0-9_\-.]{3,60}$/,
    },
    "Quora": {
        "domain": "quora.com",
        "profile_url": "https://www.quora.com/profile/{username}",
        "username_pattern": /^[A-Za-z0-9\-._ ]{1,60}$/,
    }
};

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
                variants.add(v.toLowerCase());
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


async function headExists(url: string, timeout = 12000): Promise<boolean> {
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(timeout),
        });
        return [200, 301, 302, 401, 403, 404].includes(response.status); // 404 for some platforms indicates username taken but profile is private
    } catch (error) {
        return false;
    }
}


async function checkExactUsername(platformKey: keyof typeof PLATFORMS, username: string): Promise<{ username: string; url: string } | null> {
    const platform = PLATFORMS[platformKey];
    if (!platform.username_pattern.test(username)) {
        return null;
    }
    const url = platform.profile_url.replace('{username}', username);
    const exists = await headExists(url);
    return exists ? { username, url } : null;
}


async function ddgSearchUsernames(platformKey: keyof typeof PLATFORMS, seed: string, maxHits = 20): Promise<string[]> {
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
                try {
                    const decodedUrl = decodeURIComponent(href);
                    const urlParams = new URLSearchParams(decodedUrl.substring(decodedUrl.indexOf('?')));
                    const uddg = urlParams.get('uddg');
                    if (uddg) {
                        const path = new URL(uddg).pathname.replace(/\/$/, '');
                        const username = path.split('/').pop()?.replace(/^@/, '');
                        if (username && PLATFORMS[platformKey].username_pattern.test(username)) {
                            candidates.add(username);
                        }
                    }
                } catch {
                    // Ignore parsing errors
                }
            }
        });
        return Array.from(candidates).slice(0, maxHits);
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
    platforms: (keyof typeof PLATFORMS)[],
): Promise<UsernameSearchResults> {

    const results: UsernameSearchResults = {};
    platforms.forEach(p => {
        results[p] = { found: [], discovered: [] };
    });

    const variations = [seed, ...generateVariations(seed, 80).filter(v => v !== seed)];

    const discoveryPromises = platforms.map(p =>
        ddgSearchUsernames(p, seed, 25).then(discovered => {
            results[p].discovered = discovered;
        })
    );

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

    // De-duplicate found results
    for (const p of platforms) {
        const foundUsernames = new Set<string>();
        results[p].found = results[p].found.filter(item => {
            if (foundUsernames.has(item.username.toLowerCase())) {
                return false;
            }
            foundUsernames.add(item.username.toLowerCase());
            return true;
        });

        // Sort exact match to the top
        results[p].found.sort((a, b) => {
            if (a.username.toLowerCase() === seed.toLowerCase()) return -1;
            if (b.username.toLowerCase() === seed.toLowerCase()) return 1;
            return a.username.localeCompare(b.username);
        });

        // Filter discovered that are already found
        const foundSet = new Set(results[p].found.map(f => f.username));
        results[p].discovered = results[p].discovered.filter(d => !foundSet.has(d));
    }

    return results;
}
