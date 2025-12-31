"use server";

import { createServerActionClient } from "../lib/supabase/server-action";
import { ProfileData } from "../type/index.profile";

export const updateUserProfile = async (
  profileData: ProfileData,
  userId: string
) => {
  const supabase = await createServerActionClient();
  try {
    // 1. Update auth user (email and metadata separately)
    const updatePayload: any = {
      data: {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        location: profileData.location,
      },
    };

    const { data: authData, error: authError } = await supabase.auth.updateUser(
      updatePayload
    );

    if (authError) {
      return {
        success: false,
        message: authError.message,
      };
    }

    // 2. Update users table (if you have one)
    const { data, error } = await supabase
      .from("users")
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        location: profileData.location,
        updated_at: new Date(),
      })
      .eq("id", userId)
      .select();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Profile Updated Successfully",
      data,
      authData,
    };
  } catch (error) {
    return { success: false, message: "Failed to update profile." };
  }
};

export async function updateProfileAvatarUrl(
  userId: string,
  newAvatarUrl: string
) {
  const supabase = await createServerActionClient();

  const { data, error } = await supabase
    .from("users") // Replace 'profiles' with your table name
    .update({ avatar_url: newAvatarUrl, updated_at: new Date() })
    .eq("id", userId);

  if (error) {
    console.error("Error updating profile:", error.message);
    return {
      success: false,
      message: error.message,
    };
  } else {
    return {
      success: true,
      message: "Avatar URL updated successfully!",
    };
  }
}

export async function getUserPreferences() {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized", data: null };
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no preferences exist, create default ones
    if (error.code === "PGRST116") {
      const { data: newPrefs, error: insertError } = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          bill_reminders: true,
          task_updates: true,
          document_expiry: true,
        })
        .select()
        .single();

      if (insertError) {
        return { success: false, message: insertError.message, data: null };
      }

      return { success: true, data: newPrefs };
    }

    return { success: false, message: error.message, data: null };
  }

  return { success: true, data };
}

export async function updateUserPreferences(preferences: {
  bill_reminders?: boolean;
  task_updates?: boolean;
  document_expiry?: boolean;
}) {
  const supabase = await createServerActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  const { error } = await supabase
    .from("user_preferences")
    .update(preferences)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, message: "Preferences updated successfully" };
}
