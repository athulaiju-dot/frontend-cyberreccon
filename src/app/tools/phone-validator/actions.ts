'use server';

import { parsePhoneNumberFromString, getCountries, type PhoneNumber } from 'libphonenumber-js';
import { ai } from "@/ai/genkit";
import { z } from "genkit";

const IPQS_KEY = "ejnzUUIslZkSC0JoiHC5apVa8OGcUVHE";

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
  fraudIntel?: {
    fraudScore: number;
    isVoip: boolean;
    recentAbuse: boolean;
    isRisky: boolean;
    isActive: boolean;
  };
  error?: string;
}

/**
 * Smart Detection Logic:
 * Iterates through all global countries to find a valid match for the input string.
 */
function attemptSmartParse(phone: string): PhoneNumber | null {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (phone.startsWith('+')) {
    const parsed = parsePhoneNumberFromString(phone);
    if (parsed) return parsed;
  }

  const parsedWithPlus = parsePhoneNumberFromString(`+${cleanPhone}`);
  if (parsedWithPlus?.isValid()) return parsedWithPlus;

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
        error: "Invalid phone number structure for its region." 
      };
    }

    const e164 = phoneNumber.format('E.164');
    const countryCode = phoneNumber.country;
    const countryName = countryCode 
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) 
      : "Unknown";

    // 1. Basic & AI Intelligence (Carrier/Location)
    const intelligencePromise = ai.generate({
      prompt: `Analyze this phone number for OSINT: ${e164} in ${countryName}. Identify Carrier, Specific City/Region, and Line Type.`,
      output: {
        schema: z.object({
          carrier: z.string(),
          location: z.string(),
          lineType: z.string()
        })
      }
    });

    // 2. Fraud Intelligence (IPQualityScore)
    const fraudPromise = fetch(`https://ipqualityscore.com/api/json/phone/${IPQS_KEY}/${e164}`, {
      next: { revalidate: 3600 }
    }).then(res => res.json()).catch(() => null);

    const [intelligence, ipqsData] = await Promise.all([intelligencePromise, fraudPromise]);
    const aiData = intelligence.output;

    return {
      input: phone,
      e164,
      international: phoneNumber.format('INTERNATIONAL'),
      national: phoneNumber.format('NATIONAL'),
      valid: true,
      possible: phoneNumber.isPossible(),
      country: countryName,
      countryCode: countryCode,
      type: phoneNumber.getType() || 'unknown',
      carrier: aiData?.carrier || "Not Found",
      location: aiData?.location || "Not Found",
      lineType: aiData?.lineType || "Not Found",
      fraudIntel: ipqsData && !ipqsData.errors ? {
        fraudScore: ipqsData.fraud_score || 0,
        isVoip: !!ipqsData.voip,
        recentAbuse: !!ipqsData.recent_abuse,
        isRisky: !!ipqsData.risky,
        isActive: !!ipqsData.active
      } : undefined
    };
  } catch (error: any) {
    return {
      input: phone,
      error: "Intelligence lookup failed. Connection to registry timed out.",
    };
  }
}
