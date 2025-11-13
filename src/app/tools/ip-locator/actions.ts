'use server';

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
}

export async function locateIp(ipOrDomain: string): Promise<IpLookupResult> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ipOrDomain}`);
    if (!response.ok) {
      throw new Error('API request failed');
    }
    const data = await response.json();
    return data as IpLookupResult;
  } catch (error: any) {
    return {
      query: ipOrDomain,
      status: 'fail',
      message: error.message || 'Failed to fetch IP information.',
    };
  }
}
