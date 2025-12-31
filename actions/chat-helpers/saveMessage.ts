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
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("❌ No user found in saveMessage");
      throw new Error("Unauthorized");
    }

    console.log("💬 Saving message:", {
      conversationId,
      role,
      userId: user.id,
    });

    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to save message:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log("✅ Message saved:", data?.id);
    return data;
  } catch (error) {
    console.error("❌ Exception in saveMessage:", error);
    throw error;
  }
}
