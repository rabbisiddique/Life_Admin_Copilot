"use server";

import { supabase } from "../lib/supabase";
import { ISignup } from "../type/index.signup";

export const SignUp = async (formData: ISignup) => {
  try {
    // 1️⃣ Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url || null,
        },
      },
    });

    // 2️⃣ Handle auth errors (including existing user)
    if (error) {
      // Check if it's a duplicate user error
      if (
        error.message.includes("already registered") ||
        error.message.includes("already been registered")
      ) {
        return {
          success: false,
          message: "This email is already registered. Please sign in instead.",
        };
      }

      return {
        success: false,
        message: error.message || "Signup failed.",
      };
    }

    // 3️⃣ Check if user data exists
    if (!data?.user) {
      return {
        success: false,
        message: "User creation failed. Please try again.",
      };
    }

    // 4️⃣ Check if this is a re-signup (user exists but signed up again)
    // Supabase might return success even if email exists (anti-enumeration)
    if (data.user && !data.session) {
      // This usually means email confirmation is pending OR user already exists
      const { data: existingProfile } = await supabase
        .from("users")
        .select("email")
        .eq("email", formData.email)
        .single();

      if (existingProfile) {
        return {
          success: false,
          message: "This email is already registered. Please sign in instead.",
        };
      }
    }

    const user = data.user;

    // 5️⃣ Insert profile into users table
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
      if (profileError) {
        console.error("Profile insert failed:", profileError);
        console.error("Error code:", profileError.code);
        console.error("Error message:", profileError.message);
        console.error("Error details:", profileError.details);
        console.error("Error hint:", profileError.hint);

        // ... rest of your code
      }

      // If it's a duplicate key error
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
        // Show the actual error message for debugging
        message = error.message;
      }

      return { success: false, message };
    }

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
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/auth/new-password",
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
