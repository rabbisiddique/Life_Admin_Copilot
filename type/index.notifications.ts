export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "task" | "habit" | "document" | "expiry";
  is_read: boolean;
  trigger_time: string;
  action_url: string;
  created_at: string;
}
