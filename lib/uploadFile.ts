// lib/supabase/storage.ts

import { createClient } from "./supabase/client";

export const uploadFile = async (file: File): Promise<string | null> => {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const filePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);

    return data.publicUrl;
  } catch (err) {
    console.error("Upload failed:", err);
    throw err;
  }
};

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
