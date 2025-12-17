"use server";

import { SupabaseClient } from "@supabase/supabase-js";

export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  title: string
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
}
