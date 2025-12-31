"use server";

import { revalidatePath } from "next/cache";
import { gemini } from "../lib/ai/gemini";
import { createClient } from "../lib/supabase/client";

// ==================== AI EXTRACTION ====================

// Extract from URL instead of base64

// app/actions/extract.ts

export async function extractDocument(file: File) {
  try {
    // 1. Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // 2. Determine mime type
    const mimeType = file.type || "image/jpeg";

    // 3. Call Gemini API with vision
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash", // ✅ Free Gemini model
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64,
              },
            },
            {
              text: `
Extract the following fields from the document. Return ONLY valid JSON:

{
  "document_name": "",
  "document_type": "",
  "document_number": "",
  "expiry_date": "",
  "issue_date": "",
  "issuing_authority": "",
  "confidence": 0.85
}

Rules:
- Missing values -> empty string
- Dates must be YYYY-MM-DD
- No extra text. Only JSON.
              `,
            },
          ],
        },
      ],
    });

    const text = response.text;
    console.log("text", text);

    if (!text) throw new Error("No response from Gemini");

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return JSON");

    const extracted = JSON.parse(jsonMatch[0]);
    console.log(extracted);

    return { success: true, data: extracted, error: null };
  } catch (err) {
    console.error("❌ Document extraction error:", err);
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Extraction failed",
    };
  }
}

// ==================== FILE UPLOAD ====================

// ==================== DOCUMENT CRUD ====================

export async function fetchDocuments() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: "Not authenticated",
      };
    }

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("upload_date", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error("Fetch documents error:", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to fetch documents",
    };
  }
}

export async function uploadDocument(formData: {
  name: string;
  category: string;
  expiryDate?: string;
  filePath: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  extractionStatus?: string;
  aiExtractedData?: any;
  aiConfidenceScore?: number;
  documentNumber?: string;
  issuingAuthority?: string;
  issueDate?: string;
}) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: "Not authenticated",
      };
    }

    const documentData: any = {
      user_id: user.id,
      name: formData.name,
      category: formData.category,
      file_type: formData.fileType,
      file_path: formData.filePath,
      file_url: formData.fileUrl,
      file_size: formData.fileSize,
      extraction_status: formData.extractionStatus || "manual",
    };

    if (formData.expiryDate) {
      documentData.expiry_date = formData.expiryDate;
    }

    if (formData.issueDate) {
      documentData.issue_date = formData.issueDate;
    }

    if (formData.documentNumber) {
      documentData.document_number = formData.documentNumber;
    }

    if (formData.issuingAuthority) {
      documentData.issuing_authority = formData.issuingAuthority;
    }

    if (formData.aiExtractedData) {
      documentData.ai_extracted_data = formData.aiExtractedData;
    }

    if (formData.aiConfidenceScore) {
      documentData.ai_confidence_score = formData.aiConfidenceScore;
    }

    const { data, error } = await supabase
      .from("documents")
      .insert([documentData])
      .select()
      .single();

    if (error) throw error;

    // Log extraction if AI was used
    if (formData.extractionStatus === "completed" && data) {
      await logExtractionAttempt(
        data.id,
        "completed",
        formData.aiExtractedData,
        null
      );
    }

    revalidatePath("/documents");

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error("Upload document error:", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

export async function updateDocument(
  id: string,
  updates: {
    name?: string;
    category?: string;
    expiryDate?: string;
    status?: string;
  }
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: "Not authenticated",
      };
    }

    const updateData: any = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.category) updateData.category = updates.category;
    if (updates.expiryDate) updateData.expiry_date = updates.expiryDate;
    if (updates.status) updateData.status = updates.status;

    const { data, error } = await supabase
      .from("documents")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/documents");

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error("Update document error:", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to update document",
    };
  }
}

export async function deleteDocument(id: string) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { error } = await supabase
      .from("documents")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    revalidatePath("/documents");

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Delete document error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

export async function toggleDocumentStatus(id: string) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: "Not authenticated",
      };
    }

    // Get current document
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !doc) {
      throw new Error("Document not found");
    }

    let newExpiryDate: Date;
    let newStatus: string;

    // Toggle logic
    if (doc.status === "valid") {
      newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + 15);
      newStatus = "expiring";
    } else {
      newExpiryDate = new Date();
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      newStatus = "valid";
    }

    const newExpiryDateStr = newExpiryDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("documents")
      .update({
        expiry_date: newExpiryDateStr,
        status: newStatus,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/documents");

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error("Toggle status error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to toggle status",
    };
  }
}

// ==================== LOGGING ====================

export async function logExtractionAttempt(
  documentId: string,
  status: string,
  extractedData: any,
  errorMessage: string | null
) {
  try {
    const supabase = createClient();

    await supabase.from("document_extraction_logs").insert({
      document_id: documentId,
      model_used: "openai/gpt-4o-mini",
      extracted_data: extractedData,
      confidence_score: extractedData?.confidence,
      status,
      error_message: errorMessage,
    });

    return { success: true };
  } catch (err) {
    console.error("Failed to log extraction:", err);
    return { success: false };
  }
}

// ==================== STATISTICS ====================

export async function getDocumentStats() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        data: null,
        error: "Not authenticated",
      };
    }

    const { data, error } = await supabase
      .from("documents")
      .select("status, extraction_status")
      .eq("user_id", user.id)
      .eq("is_deleted", false);

    if (error) throw error;

    const stats = {
      total: data.length,
      expiring: data.filter((d) => d.status === "expiring").length,
      expired: data.filter((d) => d.status === "expired").length,
      aiProcessed: data.filter((d) => d.extraction_status === "completed")
        .length,
    };

    return {
      success: true,
      data: stats,
      error: null,
    };
  } catch (error) {
    console.error("Get stats error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}

// ==================== REMINDERS ====================

export async function createReminder(
  documentId: string,
  daysBeforeExpiry: number,
  reminderType: string = "email"
) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    const { data, error } = await supabase
      .from("document_reminders")
      .insert({
        document_id: documentId,
        user_id: user.id,
        reminder_type: reminderType,
        days_before_expiry: daysBeforeExpiry,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error("Create reminder error:", error);
    return {
      success: false,
      data: null,
      error:
        error instanceof Error ? error.message : "Failed to create reminder",
    };
  }
}
