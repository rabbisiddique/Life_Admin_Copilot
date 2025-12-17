"use server";

import { createServerActionClient } from "../lib/supabase/server-action";
import { buildUserContext } from "./chat-helpers/context/buildUserContext";
import { createConversation } from "./chat-helpers/createConversation";
import { generateAIResponse } from "./chat-helpers/generateAIResponse";
import { saveMessage } from "./chat-helpers/saveMessage";

export async function sendMessageToAI({
  conversationId,
  message,
}: {
  conversationId?: string;
  message: string;
}) {
  const supabase = await createServerActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Unauthorized" };
  }

  let convoId = conversationId;

  // 1️⃣ Create conversation if missing
  if (!convoId) {
    const convo = await createConversation(supabase, user.id, message);
    convoId = convo.id;
  }

  // 2️⃣ Save user message
  await saveMessage({
    supabase,
    conversationId: convoId!,
    role: "user",
    content: message,
  });

  // 3️⃣ Build AI context
  const contextMessage = await buildUserContext(supabase, user);

  // 4️⃣ Generate AI response
  const aiReply = await generateAIResponse(contextMessage, message);

  // 5️⃣ Save AI message
  await saveMessage({
    supabase,
    conversationId: convoId!,
    role: "assistant",
    content: aiReply,
  });

  return {
    success: true,
    conversationId: convoId,
    reply: aiReply,
  };
}
