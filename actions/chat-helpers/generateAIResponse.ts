"use server";

import { gemini } from "../../lib/ai/gemini";

export async function generateAIResponse(context: string, userMessage: string) {
  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash", // ✅ Free Gemini model
      contents: `${context}\n\nUser: ${userMessage}`,
    });

    const content = response.text;

    if (!content) {
      throw new Error("No content returned from Gemini");
    }

    console.log("✅ AI Response generated successfully");
    return content;
  } catch (error: any) {
    console.error("❌ generateAIResponse error:", error.message);
    throw error;
  }
}
