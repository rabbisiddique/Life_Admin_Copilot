import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete(name);
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the user to insert into users table if needed
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user exists in users table
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        // If user doesn't exist, insert them
        if (!existingUser) {
          await supabase.from("users").insert({
            id: user.id,
            email: user.email!,
            first_name: user.user_metadata?.first_name || null,
            last_name: user.user_metadata?.last_name || null,
            location: user.user_metadata?.location || null,
            avatar_url: user.user_metadata?.avatar_url || null,
            is_verified: true,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          });
        } else {
          // Update last login
          await supabase
            .from("users")
            .update({
              last_login: new Date().toISOString(),
              is_verified: true,
            })
            .eq("id", user.id);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If no code or error, redirect to login with error
  return NextResponse.redirect(
    `${origin}/auth/login?error=verification_failed`
  );
}
