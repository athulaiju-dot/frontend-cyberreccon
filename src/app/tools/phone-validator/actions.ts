'use server';

import { parsePhoneNumber, AsYouType, CountryCode } from 'libphonenumber-js';

// Note: Carrier information is not reliably available with this library, unlike the python `phonenumbers` one.
// We will return 'Unknown' as a placeholder, which aligns with the fallback in the provided Python script.

export interface PhoneValidationResult {
  input: string;
  e164?: string;
  international?: string;
  national?: string;
  valid?: boolean;
  possible?: boolean;
  country?: string;
  carrier?: string;
  type?: string;
  error?: string;
}

// A simple heuristic to guess the default country if not an international number
function guessCountry(phone: string): CountryCode | undefined {
    // This is a very basic implementation.
    // In a real-world app, you might use the user's IP/locale.
    if (phone.startsWith('1') && !phone.startsWith('+')) return 'US';
    if (phone.startsWith('44') && !phone.startsWith('+')) return 'GB';
    if (phone.startsWith('91') && !phone.startsWith('+')) return 'IN';
    return 'US'; // Default fallback
}


export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  if (!phone) {
    return { input: phone, error: "Phone number cannot be empty." };
  }

  try {
    const phoneNumber = parsePhoneNumber(phone, guessCountry(phone));

    if (!phoneNumber) {
         throw new Error("Could not parse phone number.");
    }
    
    return {
      input: phone,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: phoneNumber.isValid(),
      possible: phoneNumber.isPossible(),
      country: phoneNumber.country ? new Intl.DisplayNames(['en'], { type: 'region' }).of(phoneNumber.country) : "Unknown",
      carrier: "Unknown", // Carrier lookup is not supported by libphonenumber-js, matching the Python script's fallback.
      type: phoneNumber.getType(),
    };
  } catch (error: any) {
    return {
      input: phone,
      error: error.message || "Failed to validate phone number. Please check the format (e.g., +15551234567).",
    };
  }
}
