'use server';

import { dns } from 'node:dns/promises';

/**
 * @fileOverview Domain Intelligence Engine.
 * Combines authoritative DNS resolution with RDAP (Modern WHOIS) data retrieval.
 */

export interface DomainLookupResult {
  domain: string;
  dns: {
    A: string[];
    MX: string[];
    TXT: string[];
    NS: string[];
  };
  whois?: {
    registrar?: string;
    status?: string[];
    created?: string;
    updated?: string;
    expires?: string;
    entities?: { name?: string; roles: string[] }[];
  };
  status: 'success' | 'fail';
  message?: string;
}

/**
 * Parses structured RDAP (JSON WHOIS) data into a cleaner format for the UI.
 */
function parseRdap(data: any) {
  if (!data) return undefined;

  const events = data.events || [];
  const findEvent = (action: string) => events.find((e: any) => e.eventAction === action)?.eventDate;

  // Extract entities (Registrar, Registrant, etc.)
  const entities = (data.entities || []).map((ent: any) => {
    // Attempt to extract name from vcard if present
    let name = ent.handle;
    if (ent.vcardArray && ent.vcardArray[1]) {
      const fn = ent.vcardArray[1].find((prop: any) => prop[0] === 'fn');
      if (fn) name = fn[3];
    }
    return { name, roles: ent.roles || [] };
  });

  const registrar = entities.find((e: any) => e.roles.includes('registrar'))?.name;

  return {
    registrar,
    status: data.status || [],
    created: findEvent('registration'),
    updated: findEvent('last changed'),
    expires: findEvent('expiration'),
    entities: entities.slice(0, 5), // Limit to top 5 entities for UI cleanliness
  };
}

export async function lookupDomain(domain: string): Promise<DomainLookupResult> {
  if (!domain) {
    throw new Error("Domain name is required.");
  }

  const results: DomainLookupResult = {
    domain,
    dns: {
      A: [],
      MX: [],
      TXT: [],
      NS: [],
    },
    status: 'success'
  };

  try {
    // 1. Parallel DNS Discovery
    const [a, mx, txt, ns] = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolveMx(domain),
      dns.resolveTxt(domain),
      dns.resolveNs(domain)
    ]);

    if (a.status === 'fulfilled') results.dns.A = a.value;
    if (mx.status === 'fulfilled') results.dns.MX = mx.value.map(v => `${v.exchange} (${v.priority})`);
    if (txt.status === 'fulfilled') results.dns.TXT = txt.value.map(v => v.join(' '));
    if (ns.status === 'fulfilled') results.dns.NS = ns.value;

    // 2. WHOIS/RDAP Intel Retrieval
    try {
      // rdap.org is a bootstrap redirector for RDAP queries
      const rdapResponse = await fetch(`https://rdap.org/domain/${domain}`, {
        headers: { 'Accept': 'application/rdap+json' },
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000)
      });
      
      if (rdapResponse.ok) {
        const rdapData = await rdapResponse.json();
        results.whois = parseRdap(rdapData);
      }
    } catch (e) {
      console.error("RDAP lookup failed:", e);
    }

    return results;
  } catch (error: any) {
    return {
      ...results,
      status: 'fail',
      message: error.message || "Primary DNS resolution failed."
    };
  }
}
