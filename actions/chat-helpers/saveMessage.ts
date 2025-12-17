"use server";

export async function saveMessage({
  supabase,
  conversationId,
  role,
  content,
}: {
  supabase: any;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    role,
    content,
  });

  if (error) throw error;
}
