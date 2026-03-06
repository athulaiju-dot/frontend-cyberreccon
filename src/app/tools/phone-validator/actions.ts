
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
        error: "Invalid phone number structure. Please include a country code (e.g. 91 for India)." 
      };
    }

    const e164 = phoneNumber.format('E.164');
    const countryCode = phoneNumber.country;
    const countryName = countryCode 
      ? new Intl.DisplayNames(['en'], { type: 'region' }).of(countryCode) 
      : "Unknown";

    const warnings: string[] = [];
    const lineType = phoneNumber.getType() || 'unknown';

    // 1. AI Reconnaissance (Carrier & Specific Location)
    let aiData = { carrier: "Scanning...", location: "Scanning..." };
    try {
      const response = await ai.generate({
        prompt: `You are an OSINT expert. Analyze this phone number: ${e164} (Country: ${countryName}, Registry Type: ${lineType}). 
        Task: 
        1. Identify the specific Carrier/Service Provider (e.g. Reliance Jio, Verizon, Vodafone).
        2. Identify the likely city or administrative region based on the prefix.
        
        Return the data in a clear JSON format.`,
        output: {
          schema: z.object({
            carrier: z.string().describe("Full name of the mobile/landline carrier"),
            location: z.string().describe("Likely city or region name")
          })
        },
        config: {
          maxOutputTokens: 250,
          // Set a reasonably short timeout for the AI call
          // @ts-ignore - Genkit config types can be strict
          timeoutMillis: 10000 
        }
      });
      
      if (response.output) {
        aiData = response.output;
      }
    } catch (aiErr) {
      console.error("AI Intelligence failed:", aiErr);
      warnings.push("Carrier intelligence engine is busy. Basic registry data shown.");
      aiData = { carrier: "Registry Locked", location: countryName };
    }

    // 2. Fraud Intelligence (IPQualityScore)
    let ipqsData = null;
    try {
      const fraudResp = await fetch(`https://ipqualityscore.com/api/json/phone/${IPQS_KEY}/${e164}`, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000)
      });
      
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
      type: lineType,
      carrier: aiData.carrier,
      location: aiData.location,
      lineType: lineType,
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
      error: "System Error: The reconnaissance engine encountered a critical failure. Please check your network connection.",
    };
  }
}
