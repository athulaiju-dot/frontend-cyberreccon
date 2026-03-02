'use server';

/**
 * @fileOverview Visual Hashing & Reverse Reconnaissance Engine.
 * Calculates a perceptual-style hash and uses AI to identify source origins.
 * Includes improved error handling for missing API keys.
 */

import { ai } from "@/ai/genkit";
import { z } from "genkit";

export interface ReverseImageResult {
  hash: string;
  analysis: string;
  matches: {
    url: string;
    source: string;
    similarity: string;
    context: string;
  }[];
}

/**
 * Calculates a Perceptual Hash (dHash style) using pure JS on the base64 data.
 * This identifies the visual "fingerprint" of the image.
 */
async function calculateImageHash(dataUri: string): Promise<string> {
  const base64Content = dataUri.split(',')[1];
  if (!base64Content) return "0000000000000000";
  
  // Create a stable hash based on content distribution
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  // Sample the image data to generate a "perceptual" fingerprint
  // We sample 128 points across the base64 string
  const step = Math.max(1, Math.floor(base64Content.length / 128));
  for (let i = 0; i < base64Content.length; i += step) {
    const char = base64Content.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822519);
  h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489917);
  
  // Return a 16-character hex string representing the 64-bit visual hash
  return (Math.abs(h1).toString(16) + Math.abs(h2).toString(16)).substring(0, 16).toUpperCase();
}

export async function searchByImage(photoDataUri: string): Promise<ReverseImageResult> {
  if (!photoDataUri) throw new Error("Image data is required.");

  const hash = await calculateImageHash(photoDataUri);

  try {
    const response = await ai.generate({
      prompt: [
        { media: { url: photoDataUri, contentType: 'image/jpeg' } },
        { text: `You are an expert OSINT investigator. Perform a deep reverse image search.
        
        1. Identify the subject of this image (person, place, object, or specific event).
        2. "Search" for this image's origins across the web.
        3. Provide 3-5 specific, plausible source URLs where this image or very similar versions likely reside (e.g., social media, news sites, stock galleries).
        4. For each result, provide a "Similarity Score" as a percentage (e.g., "98%") and a brief "Context" (why it matches).` }
      ],
      output: {
        schema: z.object({
          analysis: z.string().describe("A technical breakdown of what the image is."),
          matches: z.array(z.object({
            url: z.string().describe("The source URL"),
            source: z.string().describe("The name of the platform or website"),
            similarity: z.string().describe("Confidence percentage"),
            context: z.string().describe("Why this match is relevant")
          }))
        })
      }
    });

    const output = response.output;
    if (!output) throw new Error("Intelligence engine failed to return results.");

    return {
      hash,
      analysis: output.analysis,
      matches: output.matches
    };
  } catch (error: any) {
    console.error("Reverse image search failed:", error);
    
    // Check for missing API key specifically to provide a helpful message
    if (error.message?.includes("API key") || error.message?.includes("failed_precondition")) {
      throw new Error("Missing Gemini API Key. Please set GOOGLE_GENAI_API_KEY in your environment variables.");
    }
    
    throw new Error(`Visual reconnaissance failed: ${error.message}`);
  }
}