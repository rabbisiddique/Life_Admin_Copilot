"use server";

export async function generateAIResponse(context: string, userMessage: string) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
          { role: "system", content: context },
          { role: "user", content: userMessage },
        ],
      }),
    }
  );

  const data = await response.json();
  return data?.choices?.[0]?.message?.content;
}
