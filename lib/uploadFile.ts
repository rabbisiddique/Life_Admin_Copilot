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

export async function uploadAvatar(file: File, userId: string) {
  const supabase = createClient();

  const filePath = `${userId}/${Date.now()}-${file.name}`; // Example path: userId/timestamp-filename.ext
  const { data, error } = await supabase.storage
    .from("avatars") // Replace 'avatars' with your storage bucket name
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false, // Set to true if you want to overwrite existing files at the same path
    });

  if (error) {
    console.error("Error uploading avatar:", error.message);
    return null;
  }

  // Get the public URL of the uploaded image
  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
