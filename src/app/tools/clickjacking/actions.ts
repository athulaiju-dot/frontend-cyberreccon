'use server';

/**
 * @fileOverview Clickjacking Vulnerability Scanner.
 * Refined using user's Python logic for header inspection.
 */

export interface ClickjackingResult {
  url: string;
  vulnerable: boolean;
  headers: {
    'X-Frame-Options': string;
    'Content-Security-Policy': string;
  };
  details: string;
  checks: {
    xFrameFound: boolean;
    cspFrameAncestorsFound: boolean;
  };
}

export async function checkClickjacking(url: string): Promise<ClickjackingResult> {
  if (!url) throw new Error("URL is required.");

  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(formattedUrl, { 
      method: 'GET', 
      cache: 'no-store',
      headers: { 'User-Agent': 'CyberTrace-Security-Scanner' },
      // Increase timeout for security scans
      signal: AbortSignal.timeout(10000)
    });
    
    const xfo = response.headers.get('x-frame-options') || 'Not Found';
    const csp = response.headers.get('content-security-policy') || 'Not Found';
    
    // Logic from user Python script: Look for frame-ancestors
    const hasXFO = xfo !== 'Not Found';
    const hasCSPFrameAncestors = csp.toLowerCase().includes('frame-ancestors');
    // Additional modern check
    const hasCSPDefaultNone = csp.toLowerCase().includes("default-src 'none'");

    const isProtected = hasXFO || hasCSPFrameAncestors || hasCSPDefaultNone;
    const vulnerable = !isProtected;

    let details = vulnerable 
      ? "CRITICAL: Potential Clickjacking Risk Detected. The site does not provide frame protection headers and can likely be embedded in an iframe."
      : "SAFE: Website appears PROTECTED against clickjacking using security headers.";

    return {
      url: formattedUrl,
      vulnerable,
      headers: {
        'X-Frame-Options': xfo,
        'Content-Security-Policy': csp,
      },
      details,
      checks: {
        xFrameFound: hasXFO,
        cspFrameAncestorsFound: hasCSPFrameAncestors
      }
    };
  } catch (error: any) {
    throw new Error(`Target scan failed: ${error.message}`);
  }
}
