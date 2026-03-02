'use server';

import dns from 'node:dns/promises';

/**
 * @fileOverview IP and Domain Geolocation Engine.
 * Uses a hybrid approach: DNS resolution followed by multi-API geolocation.
 */

export interface IpLookupResult {
  query: string;
  status: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  message?: string;
  resolvedIp?: string;
  source?: string;
}

export async function locateIp(ipOrDomain: string): Promise<IpLookupResult> {
  let target = ipOrDomain.trim();
  let resolvedIp = '';

  // 1. DNS Resolution if target is a domain
  const isDomain = /[a-zA-Z]/.test(target) && target.includes('.');
  if (isDomain) {
    try {
      const addresses = await dns.resolve4(target);
      if (addresses.length > 0) {
        resolvedIp = addresses[0];
        target = resolvedIp;
      }
    } catch (e) {
      // DNS resolution failed, let the API try its own resolution
    }
  }

  // 2. Primary Geolocation: ip-api.com (Reliable, fast, handles IPs/Domains)
  try {
    const response = await fetch(`http://ip-api.com/json/${target}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          ...data,
          resolvedIp: resolvedIp || data.query,
          source: 'IP-API'
        } as IpLookupResult;
      }
    }
  } catch (error) {
    // Primary failed, fall through to secondary
  }

  // 3. Secondary Geolocation Fallback: ipapi.co (HTTPS friendly)
  try {
    const response = await fetch(`https://ipapi.co/${target}/json/`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (!data.error) {
        return {
          query: data.ip,
          status: 'success',
          country: data.country_name,
          countryCode: data.country_code,
          region: data.region_code,
          regionName: data.region,
          city: data.city,
          zip: data.postal,
          lat: data.latitude,
          lon: data.longitude,
          timezone: data.timezone,
          isp: data.org,
          as: data.asn,
          resolvedIp: resolvedIp || data.ip,
          source: 'IPAPI.co'
        } as IpLookupResult;
      }
    }
  } catch (error) {
    // Secondary failed
  }

  return {
    query: ipOrDomain,
    status: 'fail',
    message: 'All geolocation providers failed or target unreachable.',
  };
}
