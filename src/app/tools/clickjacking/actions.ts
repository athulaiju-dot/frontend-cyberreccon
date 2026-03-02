'use server';

export interface ClickjackingResult {
  url: string;
  vulnerable: boolean;
  headers: {
    'X-Frame-Options'?: string;
    'Content-Security-Policy'?: string;
  };
  details: string;
}

export async function checkClickjacking(url: string): Promise<ClickjackingResult> {
  if (!url) throw new Error("URL is required.");

  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await fetch(formattedUrl, { 
      method: 'GET', 
      cache: 'no-store',
      headers: { 'User-Agent': 'CyberTrace-OSINT-Scanner' }
    });
    
    const xfo = response.headers.get('x-frame-options');
    const csp = response.headers.get('content-security-policy');
    
    let vulnerable = true;
    let details = "CRITICAL: The site does not provide frame protection headers and can likely be embedded in an iframe.";

    const hasXFO = !!xfo;
    const hasCSPFrame = csp && (csp.includes('frame-ancestors') || csp.includes("default-src 'none'"));

    if (hasXFO || hasCSPFrame) {
      vulnerable = false;
      details = "SAFE: The site provides security headers that restrict framing.";
    }

    return {
      url: formattedUrl,
      vulnerable,
      headers: {
        'X-Frame-Options': xfo || 'Not Set',
        'Content-Security-Policy': csp || 'Not Set',
      },
      details
    };
  } catch (error: any) {
    throw new Error(`Target scan failed: ${error.message}`);
  }
}
