"use server";

export type AIIntent = {
  actionType: string;
  entityType: string;
  entityId?: string | null;
  confidence?: number;
  payload?: any;
};

/**
 * Detects AI intent and maps to action and entity types
 */
export async function detectAIIntent(
  aiReply: string,
  userMessage: string
): Promise<AIIntent> {
  const msg = userMessage.toLowerCase();

  // ⭐ CREATE/ADD/NEW ACTIONS - CHECK FIRST (highest priority)
  if (msg.includes("create") || msg.includes("add") || msg.includes("new")) {
    // Determine what they want to create
    if (msg.includes("task")) {
      return {
        actionType: "create",
        entityType: "task",
        confidence: 0.9,
        payload: {
          userQuery: userMessage,
          aiResponse: aiReply,
        },
      };
    }
    if (msg.includes("bill")) {
      return {
        actionType: "create",
        entityType: "bill",
        confidence: 0.9,
        payload: {
          userQuery: userMessage,
          aiResponse: aiReply,
        },
      };
    }
    if (msg.includes("habit")) {
      return {
        actionType: "create",
        entityType: "habit",
        confidence: 0.9,
        payload: {
          userQuery: userMessage,
          aiResponse: aiReply,
        },
      };
    }
    if (msg.includes("document")) {
      return {
        actionType: "create",
        entityType: "document",
        confidence: 0.9,
        payload: {
          userQuery: userMessage,
          aiResponse: aiReply,
        },
      };
    }
  }

  // Remind/Notification requests - CHECK BEFORE GENERIC QUERIES
  if (msg.includes("remind") || msg.includes("notify")) {
    return {
      actionType: "remind",
      entityType: "general",
      confidence: 0.85,
      payload: {
        userQuery: userMessage,
        aiResponse: aiReply,
      },
    };
  }

  // Query actions
  if (
    msg.includes("task") ||
    msg.includes("todo") ||
    msg.includes("pending") ||
    msg.includes("complete")
  ) {
    return {
      actionType: "query",
      entityType: "task",
      confidence: 0.9,
      payload: { userQuery: userMessage },
    };
  }

  if (
    msg.includes("bill") ||
    msg.includes("payment") ||
    msg.includes("invoice") ||
    msg.includes("due")
  ) {
    return {
      actionType: "query",
      entityType: "bill",
      confidence: 0.9,
      payload: { userQuery: userMessage },
    };
  }

  if (
    msg.includes("habit") ||
    msg.includes("routine") ||
    msg.includes("streak")
  ) {
    return {
      actionType: "query",
      entityType: "habit",
      confidence: 0.85,
      payload: { userQuery: userMessage },
    };
  }

  if (
    msg.includes("document") ||
    msg.includes("docs") ||
    msg.includes("file") ||
    msg.includes("expir")
  ) {
    return {
      actionType: "query",
      entityType: "document",
      confidence: 0.85,
      payload: { userQuery: userMessage },
    };
  }

  // Summary
  if (
    msg.includes("summary") ||
    msg.includes("overview") ||
    msg.includes("show me")
  ) {
    return {
      actionType: "summary",
      entityType: "general",
      confidence: 0.8,
      payload: { userQuery: userMessage },
    };
  }

  // Remind
  if (msg.includes("remind") || msg.includes("notify")) {
    return {
      actionType: "remind",
      entityType: "general",
      confidence: 0.75,
      payload: { userQuery: userMessage },
    };
  }

  // Default
  return {
    actionType: "conversation",
    entityType: "general",
    confidence: 0.5,
    payload: { userQuery: userMessage },
  };
}
