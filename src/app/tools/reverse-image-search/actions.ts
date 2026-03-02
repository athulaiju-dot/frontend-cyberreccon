'use server';

/**
 * @fileOverview Visual Hashing & Reverse Reconnaissance Engine.
 * Refined to prevent URL hallucination and provide descriptive search keywords.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

export interface ReverseImageResult {
  hash: string;
  analysis: string;
  searchKeywords: string;
  matches: {
    platform: string;
    url: string;
    description: string;
  }[];
}

async function calculateImageHash(dataUri: string): Promise<string> {
  const base64Content = dataUri.split(',')[1];
  if (!base64Content) return "0000000000000000";
  
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  const step = Math.max(1, Math.floor(base64Content.length / 128));
  for (let i = 0; i < base64Content.length; i += step) {
    const char = base64Content.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822519);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489917);
  
  return (Math.abs(h1).toString(16) + Math.abs(h2).toString(16)).substring(0, 16).toUpperCase();
}

export async function searchByImage(photoDataUri: string): Promise<ReverseImageResult> {
  if (!photoDataUri) throw new Error("Image data is required.");

  const hash = await calculateImageHash(photoDataUri);

  try {
    const response = await ai.generate({
      prompt: [
        { media: { url: photoDataUri, contentType: 'image/jpeg' } },
        { text: `You are an expert OSINT investigator. Perform a technical analysis of this image.
        
        1. Identify the subject (person, location, object, or event).
        2. Generate 2-3 precise search keywords that could be used in a search engine to find the original image.
        3. Identify 3-4 likely PLATFORMS where this image or subject is commonly found (e.g. Pinterest, Instagram, LinkedIn, Stock Photo sites). 
        4. Provide the official homepage or search page URL for these platforms. Do NOT create specific profile or image deep-links as they may be invalid.
        5. Describe why the subject is relevant to these platforms.` }
      ],
      output: {
        schema: z.object({
          analysis: z.string().describe("A technical breakdown of the image subject."),
          searchKeywords: z.string().describe("Precise keywords for a manual search."),
          matches: z.array(z.object({
            platform: z.string().describe("The name of the platform"),
            url: z.string().describe("The verified platform URL (e.g. https://www.pinterest.com)"),
            description: z.string().describe("Context for this platform match")
          }))
        })
      }
    });

    const output = response.output;
    if (!output) throw new Error("Intelligence engine failed to return results.");

    return {
      hash,
      analysis: output.analysis,
      searchKeywords: output.searchKeywords,
      matches: output.matches
    };
  } catch (error: any) {
    console.error("Reverse image search failed:", error);
    if (error.message?.includes("API key")) {
      throw new Error("Missing Gemini API Key. Please ensure GOOGLE_GENAI_API_KEY is configured.");
    }
    throw new Error(`Visual reconnaissance failed: ${error.message}`);
  }
}
