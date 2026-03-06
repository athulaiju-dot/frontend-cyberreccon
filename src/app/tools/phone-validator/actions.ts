
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
  warnings?: string[];
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
        error: "Invalid phone number structure for its region. Please include a country code if possible." 
      };
    }

    const e164 = phoneNumber.format('E.164');
    const countryCode = phoneNumber.country;
    const countryName = countryCode 
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) 
      : "Unknown";

    const warnings: string[] = [];

    // 1. Basic & AI Intelligence (Carrier/Location)
    // We wrap this in a separate try/catch so AI failure doesn't kill the whole request
    let aiData = null;
    try {
      const intelligence = await ai.generate({
        prompt: `Analyze this phone number for OSINT: ${e164} in ${countryName}. Identify Carrier, Specific City/Region, and Line Type.`,
        output: {
          schema: z.object({
            carrier: z.string(),
            location: z.string(),
            lineType: z.string()
          })
        },
        config: {
          // Add a safety timeout to the AI call
          maxOutputTokens: 200,
        }
      });
      aiData = intelligence.output;
    } catch (aiErr) {
      console.error("AI Intelligence failed:", aiErr);
      warnings.push("Carrier intelligence engine is currently unavailable.");
    }

    // 2. Fraud Intelligence (IPQualityScore)
    // Wrap in try/catch to handle API timeouts/errors gracefully
    let ipqsData = null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for external API

      const fraudResp = await fetch(`https://ipqualityscore.com/api/json/phone/${IPQS_KEY}/${e164}`, {
        next: { revalidate: 3600 },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (fraudResp.ok) {
        ipqsData = await fraudResp.json();
      }
    } catch (fraudErr) {
      console.error("Fraud Intelligence failed:", fraudErr);
      warnings.push("Fraud registry lookup timed out.");
    }

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
      carrier: aiData?.carrier || "Not Found (Registry Unavailable)",
      location: aiData?.location || "Not Found",
      lineType: aiData?.lineType || "Not Found",
      warnings: warnings.length > 0 ? warnings : undefined,
      fraudIntel: ipqsData && !ipqsData.errors ? {
        fraudScore: ipqsData.fraud_score || 0,
        isVoip: !!ipqsData.voip,
        recentAbuse: !!ipqsData.recent_abuse,
        isRisky: !!ipqsData.risky,
        isActive: !!ipqsData.active
      } : undefined
    };
  } catch (error: any) {
    console.error("Critical Validation Error:", error);
    return {
      input: phone,
      error: "System Error: The reconnaissance engine encountered a critical failure. Please check your network connection and try again.",
    };
  }
}
