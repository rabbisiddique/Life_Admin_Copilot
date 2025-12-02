export interface ITasks {
  id: string;
  title: string;
  description?: string;
  status: "completed" | "pending" | "canceled";
  priority: "low" | "medium" | "high";
  due_date?: string;
  category: string;
}
