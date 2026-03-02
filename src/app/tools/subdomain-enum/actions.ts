'use server';

export interface SubdomainResult {
  domain: string;
  found: number;
  subdomains: string[];
}

export async function enumerateSubdomains(domain: string): Promise<SubdomainResult> {
  if (!domain) throw new Error("Target domain is required.");

  try {
    // Using crt.sh public CT log API
    const response = await fetch(`https://crt.sh/?q=%.${domain}&output=json`, {
        headers: { 'User-Agent': 'CyberTrace-OSINT' }
    });
    
    if (!response.ok) throw new Error('External log server query failed.');
    
    const data = await response.json();
    const uniqueSubs = new Set<string>();
    
    data.forEach((entry: any) => {
      const names = entry.name_value.split('\n');
      names.forEach((name: string) => {
        const cleanName = name.trim().toLowerCase();
        // Filter out wildcards and non-related domains
        if (cleanName && !cleanName.includes('*') && cleanName.endsWith(`.${domain}`)) {
          uniqueSubs.add(cleanName);
        }
      });
    });

    const sortedSubs = Array.from(uniqueSubs).sort((a, b) => a.length - b.length || a.localeCompare(b));

    return {
      domain,
      found: sortedSubs.length,
      subdomains: sortedSubs,
    };
  } catch (error: any) {
    throw new Error(`Reconnaissance failed: ${error.message}`);
  }
}
