import { NextResponse } from "next/server";
import { openai } from "../../../../lib/ai/openai";

export const POST = async (req: Request) => {
  const { mediaType, base64 } = await req.json();
  if (!mediaType || !base64) {
    return NextResponse.json(
      { error: "mediaType and base64 are missing!" },
      { status: 400 }
    );
  }

  try {
    const prompt = `
Analyze this document and return ONLY valid JSON:
{
  "document_type": "passport/license/insurance/contract/other",
  "document_name": "suggested name",
  "document_number": "id or number",
  "expiry_date": "YYYY-MM-DD",
  "issue_date": "YYYY-MM-DD",
  "issuing_authority": "authority",
  "holder_name": "name",
  "additional_info": "other details",
  "confidence": 0.0-1.0
}`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b:free",
      messages: [
        {
          role: "system",
          content:
            "You extract structured data from documents. Return ONLY valid JSON.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "input_image",
              mime_type: mediaType,
              data: base64,
            },
          ],
        },
      ],
    });

    const result = completion.choices[0].message.content?.trim() || "{}";
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    const extractedData = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");

    // let extractedData;
    // try {
    //   extractedData = JSON.parse(result);
    // } catch (error) {
    //   extractedData = null;
    // }

    return NextResponse.json({
      message: "extracted text successfully.",
      extractedData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI extraction failed" },
      { status: 500 }
    );
  }
};
