"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { ISignup } from "../type/index.signup";

export const SignUp = async (formData: ISignup) => {
  const supabase = await createServerSupabaseClient();

  try {
    // 1️⃣ Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", formData.email)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: "This email is already registered. Please sign in instead.",
      };
    }

    // 2️⃣ Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: "http://localhost:3000/api/auth/callback/",

        data: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url || null,
        },
      },
    });

    // 3️⃣ Handle auth errors
    if (error) {
      return {
        success: false,
        message: error.message || "Signup failed.",
      };
    }

    // 4️⃣ Check if user data exists
    if (!data?.user) {
      return {
        success: false,
        message: "User creation failed. Please try again.",
      };
    }

    const user = data.user;

    // 5️⃣ ONLY insert if NO database trigger exists
    // If you have a trigger, REMOVE this entire block
    const { error: profileError } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || formData.full_name,
      avatar_url: user.user_metadata?.avatar_url || formData.avatar_url,
      is_verified: false,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Profile insert error:", profileError);

      // Duplicate key error - user already exists
      if (profileError.code === "23505") {
        return {
          success: false,
          message: "This email is already registered. Please sign in instead.",
        };
      }

      return {
        success: false,
        message: "Failed to create user profile. Please try again.",
      };
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: data.session
        ? "Signup successful! You are now logged in."
        : "Signup successful! Please check your email to verify your account.",
      user,
    };
  } catch (err) {
    console.error("Signup error:", err);
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

    revalidatePath("/");

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

export const resendVerificationEmail = async (email: string) => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return {
    success: true,
    message: "Verification email sent again!",
    data,
  };
};
