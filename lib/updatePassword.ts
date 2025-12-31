"use client";
import { createServerSupabaseClient } from "./supabase/server";

export const updatePassword = async (newPassword: string) => {
  const supabase = await createServerSupabaseClient();
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Update password error:", error);
      return {
        success: false,
        message: error.message || "Failed to update password",
      };
    }

    return {
      success: true,
      message: "Password updated successfully! Redirecting to login...",
      data,
    };
  } catch (err: any) {
    console.error("updatePassword error:", err);
    return {
      success: false,
      message: err.message || "Something went wrong",
    };
  }
};
