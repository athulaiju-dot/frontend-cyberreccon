'use server';

import { parsePhoneNumber, AsYouType, CountryCode } from 'libphonenumber-js';

// Note: Carrier information is not reliably available with libphonenumber-js.
// It has been removed to avoid providing inaccurate "Unknown" data.

export interface PhoneValidationResult {
  input: string;
  e164?: string;
  international?: string;
  national?: string;
  valid?: boolean;
  possible?: boolean;
  country?: string;
  type?: string;
  error?: string;
}

// A simple heuristic to guess the default country if not an international number
function guessCountry(phone: string): CountryCode | undefined {
    // This is a very basic implementation.
    // In a real-world app, you might use the user's IP/locale.
    // Defaulting to 'US' if no other pattern matches.
    if (phone.startsWith('+')) {
      // libphonenumber-js handles this automatically if a country code is present
      return undefined;
    }
    if (phone.startsWith('44')) return 'GB';
    if (phone.startsWith('91')) return 'IN';
    return 'US';
}


export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  if (!phone) {
    return { input: phone, error: "Phone number cannot be empty." };
  }

  try {
    // Let parsePhoneNumber handle country detection if possible (e.g. from + country code)
    const phoneNumber = parsePhoneNumber(phone, guessCountry(phone));
    
    if (!phoneNumber) {
         throw new Error("Could not parse phone number. Check format (e.g., +15551234567).");
    }
    
    return {
      input: phone,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: phoneNumber.isValid(),
      possible: phoneNumber.isPossible(),
      country: phoneNumber.country ? new Intl.DisplayNames(['en'], { type: 'region' }).of(phoneNumber.country) : "Unknown",
      type: phoneNumber.getType(),
    };
  } catch (error: any) {
    // The library throws an error for invalid numbers, which we can catch.
    return {
      input: phone,
      error: error.message === 'NOT_A_NUMBER' 
        ? "Invalid number. Please check the format (e.g., +15551234567)."
        : "Failed to validate phone number. Please check the format (e.g., +15551234567).",
    };
  }
}
