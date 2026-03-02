'use server';

export interface HostHeaderResult {
  url: string;
  isVulnerable: boolean;
  status: number;
  reflectionDetails: string;
}

export async function testHostHeader(url: string): Promise<HostHeaderResult> {
  if (!url) throw new Error("Target URL is required.");
  
  const fakeHost = 'cybertrace-malicious-host.xyz';
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const response = await fetch(formattedUrl, {
      headers: {
        'Host': fakeHost,
        'X-Forwarded-Host': fakeHost,
        'User-Agent': 'CyberTrace-Security-Tool'
      },
      cache: 'no-store'
    });

    const body = await response.text();
    const headersStr = Array.from(response.headers.entries()).map(([k, v]) => `${k}: ${v}`).join('\n');
    
    const reflectedInBody = body.includes(fakeHost);
    const reflectedInHeaders = headersStr.includes(fakeHost);
    
    const isVulnerable = reflectedInBody || reflectedInHeaders;

    return {
      url: formattedUrl,
      isVulnerable,
      status: response.status,
      reflectionDetails: isVulnerable 
        ? `VULNERABILITY DETECTED: Target reflected the fake host '${fakeHost}' in the response. This may lead to cache poisoning or password reset poisoning.`
        : "No host header reflection detected in response body or headers."
    };
  } catch (error: any) {
     throw new Error(`Connection failed: ${error.message}`);
  }
}
