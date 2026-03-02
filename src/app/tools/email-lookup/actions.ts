'use server';

import dns from 'node:dns/promises';

export interface EmailLookupResult {
  email: string;
  deliverable: boolean;
  domain: string;
  mxRecords: string[];
  isDisposable: boolean;
  message?: string;
}

export async function lookupEmail(email: string): Promise<EmailLookupResult> {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid email format.");
  }

  const [, domain] = email.split('@');
  
  try {
    // Check MX records for deliverability
    const mxRecords = await dns.resolveMx(domain);
    const hasMx = mxRecords.length > 0;

    // Simple list of disposable domains
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'mailinator.com', 'yopmail.com'];
    const isDisposable = disposableDomains.some(d => domain.includes(d));

    return {
      email,
      deliverable: hasMx,
      domain,
      mxRecords: mxRecords.map(r => `${r.exchange} (priority: ${r.priority})`),
      isDisposable,
    };
  } catch (error: any) {
    return {
      email,
      deliverable: false,
      domain,
      mxRecords: [],
      isDisposable: false,
      message: error.code === 'ENOTFOUND' ? "Domain not found." : "Could not verify MX records.",
    };
  }
}
