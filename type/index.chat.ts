export interface Message {
  id: string; // uuid from DB
  conversation_id: string;
  user_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string; // ISO string
}
