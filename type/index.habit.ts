export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  icon: string;
  start_at: string;
  end_at?: string;
  target_per_week?: number;
  created_at?: string;
}
