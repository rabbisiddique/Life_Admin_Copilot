"use server";

import { createServerActionClient } from "../lib/supabase/server-action";

export const updateUserProfile = async (profileData, userId: string) => {
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
      message: profileData.email
        ? "Profile updated! Please check your new email for a confirmation link."
        : "Profile Updated Successfully",
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
