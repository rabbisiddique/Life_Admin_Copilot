export interface Bill {
  id: string;
  title: string;
  amount: number;
  category: "subscription" | "utility" | "rent" | "insurance" | "other";
  due_date: string;
  status: "paid" | "pending" | "overdue";
  recurrence?: "monthly" | "yearly" | "one-time";
}
