import { GoogleGenAI } from "@google/genai";
import {} from "@google/generative-ai";
export const gemini = new GoogleGenAI({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
});
