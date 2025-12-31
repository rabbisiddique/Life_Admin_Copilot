export interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly";
  icon: string;
  start_at: string;
  end_at?: string;
  completed: boolean; // ✅ add this
  target_per_week?: number;
  created_at?: string;
}

export interface HabitWithLog extends Habit {
  completedToday: boolean;
  streak: number;
}
