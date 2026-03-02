'use server';

/**
 * @fileOverview Hybrid Subdomain Enumeration Engine.
 * Combines Passive Recon (Certificate Transparency Logs) 
 * with Active Recon (User Wordlist-based verification).
 */

export interface SubdomainResult {
  domain: string;
  found: number;
  subdomains: string[];
}

// Wordlist integrated from user's Python script + common industry standards
const USER_WORDLIST = [
  "www",
  "mail",
  "ftp",
  "dev",
  "test",
  "admin",
  "api",
  "beta",
  "blog",
  "staging",
  "portal",
  "vpn",
  "support",
  "remote",
  "secure"
];

/**
 * Checks if a specific subdomain is active by performing a HEAD request.
 * Logic matches the 'Active Recon' pass from the user's script (status < 400).
 */
async function checkActiveSubdomain(sub: string, domain: string): Promise<string | null> {
  const url = `https://${sub}.${domain}`;
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'CyberTrace-Security-Scanner' },
      signal: AbortSignal.timeout(3000), // 3 second timeout for speed
      cache: 'no-store'
    });

    // Logic from user script: Status code < 400 means found
    if (response.status < 400) {
      return `${sub}.${domain}`;
    }
  } catch (e) {
    // DNS resolution failure, timeout, or SSL error
  }
  return null;
}

export async function enumerateSubdomains(domain: string): Promise<SubdomainResult> {
  if (!domain) throw new Error("Target domain is required.");

  const uniqueSubs = new Set<string>();

  try {
    // --- Method 1: Passive Recon (crt.sh Logs) ---
    // This finds subdomains from SSL certificate history
    const crtResponse = await fetch(`https://crt.sh/?q=%.${domain}&output=json`, {
      headers: { 'User-Agent': 'CyberTrace-OSINT' },
      signal: AbortSignal.timeout(10000)
    });

    if (crtResponse.ok) {
      const data = await crtResponse.json();
      data.forEach((entry: any) => {
        const names = entry.name_value.split('\n');
        names.forEach((name: string) => {
          const cleanName = name.trim().toLowerCase();
          // Filter out wildcards and ensure it's actually for this domain
          if (cleanName && !cleanName.includes('*') && cleanName.endsWith(`.${domain}`)) {
            uniqueSubs.add(cleanName);
          }
        });
      });
    }

    // --- Method 2: Active Recon (User's Wordlist) ---
    // This live-tests the common subdomains provided by the user
    const activeTasks = USER_WORDLIST.map(sub => checkActiveSubdomain(sub, domain));
    const activeResults = await Promise.allSettled(activeTasks);

    activeResults.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        uniqueSubs.add(res.value);
      }
    });

    // Sort: Shortest first (usually primary assets), then alphabetical
    const sortedSubs = Array.from(uniqueSubs).sort((a, b) => {
      return a.length - b.length || a.localeCompare(b);
    });

    return {
      domain,
      found: sortedSubs.length,
      subdomains: sortedSubs,
    };
  } catch (error: any) {
    console.error("Subdomain enumeration error:", error);
    // If crt.sh fails but we have wordlist matches, return those
    if (uniqueSubs.size > 0) {
        return {
            domain,
            found: uniqueSubs.size,
            subdomains: Array.from(uniqueSubs).sort()
        };
    }
    throw new Error(`Reconnaissance engine failure: ${error.message}`);
  }
}
