"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { ISignup } from "../type/index.signup";

export const SignUp = async (formData: ISignup) => {
  const supabase = await createServerSupabaseClient();

  try {
    // Try signing up first - Supabase will handle duplicate check
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          location: formData.location,
          avatar_url: formData.avatar_url || null,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);

      // Check for duplicate user errors
      if (
        error.message.includes("already registered") ||
        error.message.includes("User already registered") ||
        error.message.includes("already been registered")
      ) {
        return {
          success: false,
          message: "This email is already registered. Please sign in instead.",
        };
      }

      return {
        success: false,
        message: error.message || "Signup failed. Please try again.",
      };
    }

    if (!data?.user) {
      return {
        success: false,
        message: "User creation failed. Please try again.",
      };
    }

    // Check if we got an "identities" array - if empty, user already exists
    if (data.user.identities && data.user.identities.length === 0) {
      return {
        success: false,
        message: "This email is already registered. Please sign in instead.",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: data.session
        ? "Signup successful! You are now logged in."
        : "Signup successful! Please check your email to verify your account.",
      user: data.user,
    };
  } catch (err) {
    console.error("Signup error:", err);

    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }

    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const SignIn = async (formData: { email: string; password: string }) => {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      let message = "Login failed. Please try again.";

      if (error.message.includes("Invalid login credentials")) {
        message = "Email or password is incorrect.";
      } else if (error.message.includes("Email not confirmed")) {
        message = "Please confirm your email before logging in.";
      } else {
        message = error.message;
      }

      return { success: false, message };
    }

    // Update last_login
    if (data.user) {
      await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.user.id);
    }

    revalidatePath("/dashboard");
    return {
      success: true,
      message: "Logged in successfully",
      data,
    };
  } catch (err: any) {
    console.error("Error in SignIn:", err);
    return {
      success: false,
      message: err.message || "Something went wrong during login.",
    };
  }
};

export const sendForgotPassLink = async (email: string) => {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/new-password`,
    });

    if (error) {
      return {
        success: false,
        message: error.message || "Error in sendForgotPass",
      };
    }

    return { success: true, message: "An email has been sent!", data };
  } catch (err: any) {
    return { success: false, message: err.message || "Something went wrong" };
  }
};

export const userProfileData = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    // Get the authenticated user first
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "Not authenticated",
        profile: null,
      };
    }

    // Fetch profile with user ID
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id) // ← Add this filter!
      .single();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
      return {
        success: false,
        message: profileError.message,
        profile: null,
      };
    }

    return {
      success: true,
      profile,
      message: null,
    };
  } catch (error) {
    return {
      success: false,
      message: "Internal server error",
      profile: null,
    };
  }
};
