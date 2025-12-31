export interface Message {
  id: string; // uuid from DB
  conversation_id: string;
  user_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string; // ISO string
}

export type AIIntent = {
  type:
    | "summary"
    | "task_query"
    | "bill_query"
    | "habit_query"
    | "document_query"
    | "off_topic";
  details?: any; // optional, like date range or specific item
};
