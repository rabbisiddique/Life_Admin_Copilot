// lib/supabase/storage.ts

import { createClient } from "./supabase/client";

export async function uploadFile(
  file: File,
  folder: string = "documents"
): Promise<{ url: string; path: string } | null> {
  const supabase = createClient();

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filePath = `${folder}/${timestamp}-${random}.${extension}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "application/octet-stream",
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath);

    return {
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
}

export async function deleteFile(filePath: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase.storage
      .from("documents")
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Delete failed:", err);
    return false;
  }
}

// lib/supabase/database.ts

export interface Document {
  id: string;
  user_id: string;
  name: string;
  category: "identity" | "insurance" | "license" | "contract" | "other";
  file_type: string;
  file_path: string;
  file_url: string;
  file_size: number;
  expiry_date: string;
  status: "valid" | "expiring" | "expired";
  upload_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export async function createDocument(
  userId: string,
  data: Omit<Document, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Document | null> {
  const supabase = createClient();

  try {
    const { data: result, error } = await supabase
      .from("documents")
      .insert([{ user_id: userId, ...data }])
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (err) {
    console.error("Create document error:", err);
    throw err;
  }
}

export async function getUserDocuments(userId: string): Promise<Document[]> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .order("upload_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Get documents error:", err);
    throw err;
  }
}

export async function updateDocument(
  documentId: string,
  updates: Partial<Omit<Document, "id" | "user_id" | "created_at">>
): Promise<Document | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("documents")
      .update(updates)
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Update document error:", err);
    throw err;
  }
}

export async function softDeleteDocument(documentId: string): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from("documents")
      .update({ is_deleted: true })
      .eq("id", documentId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Delete document error:", err);
    return false;
  }
}

export async function getExpiringDocuments(
  userId: string,
  daysThreshold: number = 30
): Promise<Document[]> {
  const supabase = createClient();

  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysThreshold);

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("is_deleted", false)
      .eq("status", "expiring")
      .lte("expiry_date", futureDate.toISOString().split("T")[0])
      .order("expiry_date", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Get expiring documents error:", err);
    throw err;
  }
}

export async function getDocumentStats(userId: string): Promise<{
  total: number;
  valid: number;
  expiring: number;
  expired: number;
}> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("documents")
      .select("status")
      .eq("user_id", userId)
      .eq("is_deleted", false);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      valid: data?.filter((d) => d.status === "valid").length || 0,
      expiring: data?.filter((d) => d.status === "expiring").length || 0,
      expired: data?.filter((d) => d.status === "expired").length || 0,
    };

    return stats;
  } catch (err) {
    console.error("Get stats error:", err);
    throw err;
  }
}
