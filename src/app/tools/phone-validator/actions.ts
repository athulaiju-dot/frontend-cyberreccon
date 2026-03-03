'use server';

import { parsePhoneNumberFromString, getCountries, type PhoneNumber } from 'libphonenumber-js';
import { ai } from "@/ai/genkit";
import { z } from "genkit";

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
  location?: string;
  lineType?: string;
  error?: string;
}

/**
 * Smart Detection Logic:
 * Iterates through all global countries to find a valid match for the input string.
 * This removes the requirement for a '+' prefix or manual country code.
 */
function attemptSmartParse(phone: string): PhoneNumber | null {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // 1. Try parsing as international (requires +)
  if (phone.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(phone);
    if (parsed) return parsed;
  }

  // 2. Try parsing with a forced +
  const parsedWithPlus = parsePhoneNumberFromString(`+${cleanPhone}`);
  if (parsedWithPlus?.isValid()) return parsedWithPlus;

  // 3. Iterate through all countries
  const countries = getCountries();
  for (const country of countries) {
    const p = parsePhoneNumberFromString(cleanPhone, country);
    if (p?.isValid()) return p;
  }

  return null;
}

export async function validatePhone(phone: string): Promise<PhoneValidationResult> {
  if (!phone) {
    return { input: phone, error: "Phone number cannot be empty." };
  }

  try {
    const phoneNumber = attemptSmartParse(phone);
    
    if (!phoneNumber || !phoneNumber.isValid()) {
      return { 
        input: phone, 
        valid: false,
        error: "Invalid phone number. Ensure it contains a valid numbering plan for its region." 
      };
    }

    const countryCode = phoneNumber.country;
    const countryName = countryCode 
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) 
      : "Unknown";

    // Perform AI-powered OSINT lookup for carrier and location details
    const intelligence = await ai.generate({
      prompt: `Analyze this phone number for OSINT purposes:
      Number: ${phoneNumber.format('E.164')}
      Detected Country: ${countryName} (${countryCode})
      
      Identify the following:
      1. Carrier/Service Provider Name (e.g., Vodafone, Verizon, Reliance Jio).
      2. Specific Location/Region/City if identifiable from the area code.
      3. Line Type (Mobile, Landline, VoIP, Pager).`,
      output: {
        schema: z.object({
          carrier: z.string().describe("The name of the service provider"),
          location: z.string().describe("The specific geographic region or city"),
          lineType: z.string().describe("Mobile, Landline, etc.")
        })
      }
    });

    const data = intelligence.output;

    return {
      input: phone,
      e164: phoneNumber.format('E.164'),
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: true,
      possible: phoneNumber.isPossible(),
      country: countryName,
      countryCode: countryCode,
      type: phoneNumber.getType() || 'unknown',
      carrier: data?.carrier || "Not Found",
      location: data?.location || "Not Found",
      lineType: data?.lineType || "Not Found",
    };
  } catch (error: any) {
    return {
      input: phone,
      error: "Intelligence lookup failed. Connection to registry timed out.",
    };
  }
}
