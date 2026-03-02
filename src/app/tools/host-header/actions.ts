'use server';

/**
 * @fileOverview Host Header Injection Analyzer.
 * Refined using user's Python logic for baseline comparison.
 */

export interface HostHeaderResult {
  url: string;
  isVulnerable: boolean;
  normalStatus: number;
  modifiedStatus: number;
  details: string;
  reflectionFound: boolean;
  behaviorChanged: boolean;
}

export async function testHostHeader(url: string): Promise<HostHeaderResult> {
  if (!url) throw new Error("Target URL is required.");
  
  const maliciousHost = 'cybertrace-evil-host.xyz';
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
  const commonHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  };

  try {
    // 1. Normal Request (Baseline)
    const normalResponse = await fetch(formattedUrl, {
      headers: commonHeaders,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    const normalBody = await normalResponse.text();

    // 2. Modified Request (Injection)
    const modifiedResponse = await fetch(formattedUrl, {
      headers: {
        ...commonHeaders,
        'Host': maliciousHost,
        'X-Forwarded-Host': maliciousHost,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    });
    const modifiedBody = await modifiedResponse.text();
    const modifiedHeadersStr = Array.from(modifiedResponse.headers.entries())
      .map(([k, v]) => `${k}: ${v}`).join('\n');

    // Analysis Logic from User's Script
    const reflectionInBody = modifiedBody.includes(maliciousHost);
    const reflectionInHeaders = modifiedHeadersStr.includes(maliciousHost);
    const behaviorChanged = normalBody !== modifiedBody || normalResponse.status !== modifiedResponse.status;
    
    const isVulnerable = reflectionInBody || reflectionInHeaders || (behaviorChanged && modifiedResponse.status < 400);

    let details = "";
    if (reflectionInBody || reflectionInHeaders) {
      details = `CRITICAL: Host reflection detected. The server included our malicious host '${maliciousHost}' in its response. This is a high-risk vulnerability for Cache Poisoning or Password Reset attacks.`;
    } else if (behaviorChanged) {
      details = `WARNING: Behavioral change detected. The server responded differently to the modified Host header. This suggests the server is processing the header, which could be exploited.`;
    } else {
      details = "SAFE: No host header reflection or suspicious behavioral changes observed. The server appears to handle the Host header securely.";
    }

    return {
      url: formattedUrl,
      isVulnerable,
      normalStatus: normalResponse.status,
      modifiedStatus: modifiedResponse.status,
      details,
      reflectionFound: reflectionInBody || reflectionInHeaders,
      behaviorChanged
    };
  } catch (error: any) {
     // Logic from user script: Rejection is often a sign of a secure configuration
     return {
        url: formattedUrl,
        isVulnerable: false,
        normalStatus: 0,
        modifiedStatus: 0,
        details: `SECURE: The server rejected or dropped the connection when a modified Host header was provided (${error.message}). This is typically a sign of a secure reverse proxy configuration.`,
        reflectionFound: false,
        behaviorChanged: false
     };
  }
}
