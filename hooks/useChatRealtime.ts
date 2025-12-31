"use client";

import { useEffect } from "react";
import { createClient } from "../lib/supabase/client";
import { Message } from "../type/index.chat";

// In your useChatRealtime hook, add logic to:
// 1. Remove temp messages when real ones arrive
// 2. Prevent duplicate messages

export function useChatRealtime(
  conversationId: string | null,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
) {
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    const channel = supabase.channel(`chat:${conversationId}`);

    // Handle new messages (INSERT events)
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMessage = payload.new as Message;

        setMessages((prev) => {
          // Remove any temp messages with same content and role
          const withoutTemp = prev.filter(
            (m) =>
              !(
                m.id.startsWith("temp-") &&
                m.content === newMessage.content &&
                m.role === newMessage.role
              )
          );

          // Check if message already exists (prevent duplicates)
          const exists = withoutTemp.some((m) => m.id === newMessage.id);
          if (exists) return prev;

          return [...withoutTemp, newMessage];
        });
      }
    );

    // Handle updated messages (UPDATE events) - for clarifications
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "ai_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const updatedMessage = payload.new as Message;

        setMessages((prev) =>
          prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
        );

        console.log("📝 Message updated:", updatedMessage.id);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);
}
