// app/api/auth/callback/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "../../../../../lib/supabase/server-action";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const redirectResponse = NextResponse.redirect(`${origin}${next}`);
    const supabase = await createRouteHandlerClient(redirectResponse);

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // That's it! The trigger handles user creation automatically
      return redirectResponse;
    }

    console.error("❌ Auth error:", error);
  }

  return NextResponse.redirect(
    `${origin}/auth/login?error=verification_failed`
  );
}
