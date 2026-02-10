'use server';

import { dns } from 'node:dns/promises';

export interface DomainLookupResult {
  domain: string;
  records: {
    A: string[];
    MX: string[];
    TXT: string[];
    NS: string[];
  };
  status: string;
  message?: string;
}

export async function lookupDomain(domain: string): Promise<DomainLookupResult> {
  if (!domain) {
    throw new Error("Domain name is required.");
  }

  const results: DomainLookupResult = {
    domain,
    records: {
      A: [],
      MX: [],
      TXT: [],
      NS: [],
    },
    status: 'success'
  };

  try {
    const [a, mx, txt, ns] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveMx(domain),
      dns.resolveTxt(domain),
      dns.resolveNs(domain)
    ]);

    if (a.status === 'fulfilled') results.records.A = a.value;
    if (mx.status === 'fulfilled') results.records.MX = mx.value.map(v => `${v.exchange} (${v.priority})`);
    if (txt.status === 'fulfilled') results.records.TXT = txt.value.map(v => v.join(' '));
    if (ns.status === 'fulfilled') results.records.NS = ns.value;

    return results;
  } catch (error: any) {
    return {
      ...results,
      status: 'fail',
      message: error.message || "Failed to retrieve DNS records."
    };
  }
}