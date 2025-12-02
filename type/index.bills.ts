export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "due";
  category: "subscription" | "utility" | "rent" | "other";
  icon: string;
}
