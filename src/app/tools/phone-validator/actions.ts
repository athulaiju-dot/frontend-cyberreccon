'use server';

import { parsePhoneNumberFromString, type CountryCode, getCountries } from 'libphonenumber-js';

export interface PhoneValidationResult {
  input: string;
  e164?: string;
  international?: string;
  national?: string;
  valid?: boolean;
  possible?: boolean;
  country?: string;
  countryCode?: string;
  type?: string;
  carrier?: string;
  error?: string;
}

/**
 * Smart Guess Logic: 
 * If no '+' prefix is found, we try to match the number against all known countries 
 * to see where it fits as a valid international number or a valid national number.
 */
function attemptSmartParse(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // 1. Try parsing as-is (with + if present)
  let parsed = parsePhoneNumberFromString(phone.startsWith('+') ? phone : `+${cleanPhone}`);
  if (parsed?.isValid()) return parsed;

  // 2. Iterate through all countries to see if it's a valid national number in any of them
  const countries = getCountries();
  for (const country of countries) {
    const p = parsePhoneNumberFromString(cleanPhone, country);
    if (p?.isValid()) return p;
  }

  // 3. Fallback to a basic parse even if invalid to get partial info
  return parsePhoneNumberFromString(phone.startsWith('+') ? phone : `+${cleanPhone}`);
}

export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  if (!phone) {
    return { input: phone, error: "Phone number cannot be empty." };
  }

  try {
    const phoneNumber = attemptSmartParse(phone);
    
    if (!phoneNumber) {
      throw new Error("Could not parse phone number structure.");
    }
    
    // Carrier info in libphonenumber-js is limited to the 'type' (Mobile/Fixed)
    // Real carrier lookup usually requires a paid API.
    const type = phoneNumber.getType();
    const isMobile = type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE';

    return {
      input: phone,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: phoneNumber.isValid(),
      possible: phoneNumber.isPossible(),
      country: phoneNumber.country ? new Intl.DisplayNames(['en'], { type: 'region' }).of(phoneNumber.country) : "Unknown",
      countryCode: phoneNumber.country,
      type: type || "UNKNOWN",
      carrier: isMobile ? "Mobile Network Detected" : "Landline/Fixed Line Detected",
    };
  } catch (error: any) {
    return {
      input: phone,
      error: "Validation failed. Please ensure the number is correct.",
    };
  }
}
