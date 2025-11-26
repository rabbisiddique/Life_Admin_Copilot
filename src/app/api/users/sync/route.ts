// app/api/users/sync/route.ts
import { NextResponse } from "next/server";
import { supabase } from "../../../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user } = body;

    if (!user?.id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      is_verified: false,
      last_login: new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "User synced successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
