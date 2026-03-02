'use server';

import { parsePhoneNumberFromString, getCountries } from 'libphonenumber-js';

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
 * Smart Detection Logic based on your Python script requirements:
 * If no '+' prefix is found, we iterate through all known countries 
 * to find a valid match, simulating the automatic country discovery.
 */
function attemptSmartParse(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // 1. Try parsing as international (requires +)
  if (phone.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(phone);
    if (parsed) return parsed;
  }

  // 2. Try parsing with a forced + if it looks like an international number
  const parsedWithPlus = parsePhoneNumberFromString(`+${cleanPhone}`);
  if (parsedWithPlus?.isValid()) return parsedWithPlus;

  // 3. Iterate through all countries to see if it's a valid national number anywhere
  const countries = getCountries();
  for (const country of countries) {
    const p = parsePhoneNumberFromString(cleanPhone, country);
    if (p?.isValid()) return p;
  }

  // 4. Fallback: try parsing as-is to get partial info
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
    
    const type = phoneNumber.getType();
    const countryName = phoneNumber.country 
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(phoneNumber.country) 
      : "Not Found";

    // Carrier names are usually the Service Type (Mobile, Fixed Line, etc.)
    const serviceType = type ? type.replace(/_/g, ' ') : "Not Found";

    return {
      input: phone,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: phoneNumber.isValid(),
      possible: phoneNumber.isPossible(),
      country: countryName,
      countryCode: phoneNumber.country,
      type: serviceType,
      carrier: serviceType !== "Not Found" ? `${serviceType} Network` : "Not Found",
    };
  } catch (error: any) {
    return {
      input: phone,
      error: "Validation failed. Ensure the number is correct.",
    };
  }
}
