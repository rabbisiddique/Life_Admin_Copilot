"use server";

import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Saves an AI action to the database
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param conversationId - Conversation ID
 * @param messageId - AI message ID that triggered the action
 * @param actionType - Type of action (query, create, summary, remind, conversation)
 * @param entityType - Type of entity (task, bill, habit, document, general)
 * @param payload - Additional data about the action
 * @param status - Action status (pending, executed, failed, rejected)
 * @param entityId - Optional ID of the entity being acted upon
 * @param confidence - Optional confidence score (0-1)
 * @returns The saved action data or null if failed
 */
export async function saveAIAction(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  messageId: string,
  actionType: string,
  entityType: string,
  payload: object,
  status: "pending" | "executed" | "failed" | "rejected" = "pending",
  entityId?: string | null,
  confidence?: number
) {
  console.log("💾 Saving AI action:", {
    userId,
    conversationId,
    messageId,
    actionType,
    entityType,
    status,
    entityId,
    confidence,
  });

  const { data, error } = await supabase
    .from("ai_actions")
    .insert([
      {
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId,
        action_type: actionType,
        entity_type: entityType,
        entity_id: entityId || null,
        payload,
        status,
        confidence: confidence || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("❌ Error saving AI action:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return null;
  }

  console.log("✅ AI action saved successfully:", data?.id);
  return data;
}
