'use server';

/**
 * @fileOverview Active Subdomain Enumeration Engine.
 * Implements the exact logic from the user's Python script:
 * - Specific Wordlist
 * - User-Agent: CyberRecon-Scanner
 * - Status Code < 400 Verification
 * - 5 Second Timeout
 */

export interface SubdomainResult {
  domain: string;
  found: number;
  subdomains: string[];
}

// Exact wordlist from user's Python script
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
  "staging"
];

/**
 * Checks if a specific subdomain is active.
 * Matches Python script: GET request, CyberRecon-Scanner UA, status < 400.
 */
async function checkActiveSubdomain(sub: string, domain: string): Promise<string | null> {
  const url = `https://${sub}.${domain}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'CyberRecon-Scanner' },
      signal: AbortSignal.timeout(5000), // 5 second timeout from script
      cache: 'no-store'
    });

    // Logic from user script: Status code < 400 means found
    if (response.status < 400) {
      return `${sub}.${domain}`;
    }
  } catch (e) {
    // Connection failure or timeout
  }
  return null;
}

export async function enumerateSubdomains(domain: string): Promise<SubdomainResult> {
  if (!domain) throw new Error("Target domain is required.");

  const uniqueSubs = new Set<string>();

  try {
    // --- Active Recon (User's Wordlist) ---
    // Executing the primary logic provided in the script
    const activeTasks = USER_WORDLIST.map(sub => checkActiveSubdomain(sub, domain));
    const activeResults = await Promise.allSettled(activeTasks);

    activeResults.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        uniqueSubs.add(res.value);
      }
    });

    // --- Passive Recon (Deep Scan Fallback) ---
    // Querying certificate logs to find assets not in the common wordlist
    try {
      const crtResponse = await fetch(`https://crt.sh/?q=%.${domain}&output=json`, {
        headers: { 'User-Agent': 'CyberRecon-Scanner' },
        signal: AbortSignal.timeout(8000)
      });

      if (crtResponse.ok) {
        const data = await crtResponse.json();
        data.forEach((entry: any) => {
          const names = entry.name_value.split('\n');
          names.forEach((name: string) => {
            const cleanName = name.trim().toLowerCase();
            if (cleanName && !cleanName.includes('*') && cleanName.endsWith(`.${domain}`)) {
              uniqueSubs.add(cleanName);
            }
          });
        });
      }
    } catch (e) {
      // Passive scan failed, continue with active results
    }

    const sortedSubs = Array.from(uniqueSubs).sort((a, b) => {
      return a.length - b.length || a.localeCompare(b);
    });

    return {
      domain,
      found: sortedSubs.length,
      subdomains: sortedSubs,
    };
  } catch (error: any) {
    console.error("Enumeration error:", error);
    if (uniqueSubs.size > 0) {
        return {
            domain,
            found: uniqueSubs.size,
            subdomains: Array.from(uniqueSubs).sort()
        };
    }
    throw new Error(`Discovery failed: ${error.message}`);
  }
}
