"use server";

import { createServerSupabaseClient } from "../lib/supabase/server";
import { Habit } from "../type/index.habit";
import {
  createHabitCompletedNotification,
  createHabitStartAndEndNotification,
} from "./notifications";

export const createHabitAction = async (
  habits: Omit<Habit, "id" | "completed" | "created_at">
) => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("habits")
      .insert([
        {
          ...habits,
          user_id: userData.user?.id,
        },
      ])
      .select();

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    await createHabitStartAndEndNotification(
      userData?.user?.id!,
      habits.title,
      data?.[0].id
    );

    // revalidatePath("/tasks");

    return {
      success: true,
      message: "Habit Created Successfully",
      data,
    };
  } catch (err) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
};

export async function toggleHabit(habitId: string, habitTitle: string) {
  const supabase = await createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  // today's date
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // find today's log
  const { data: todayLog, error: logError } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("habit_id", habitId)
    .eq("date", today)
    .select()
    .single();

  if (logError && logError.code !== "PGRST116") {
    // ignore "no rows found"
    throw new Error(logError.message);
  }

  // --- toggle logic ---
  if (todayLog) {
    // remove log → mark incomplete
    const { error } = await supabase
      .from("habit_logs")
      .delete()
      .eq("habit_id", habitId)
      .eq("date", today);

    if (error) throw new Error(error.message);

    return { status: "incomplete" };
  } else {
    // create log → mark complete
    const { error } = await supabase.from("habit_logs").insert({
      habit_id: habitId,
      date: today,
      completed: true,
      log_date: now,
      status: "done",
    });

    if (error) throw new Error(error.message);
    await createHabitCompletedNotification(
      userData.user?.id!,
      habitId,
      habitTitle
    );

    return { status: "complete" };
  }
}

export const fetchAllHabits = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    // 1) Fetch all habits for the current user
    const { data: habitsData, error: habitsError } = await supabase
      .from("habits")
      .select("*")
      .order("created_at", { ascending: false });

    if (habitsError) throw habitsError;
    if (!habitsData) {
      return { success: true, habits: [] };
    }

    const today = new Date().toISOString().split("T")[0];

    // 2) Build each habit with logs + streak
    const habitsWithLogs = await Promise.all(
      habitsData.map(async (habit) => {
        // --- Completed today ---
        const { data: todayLog } = await supabase
          .from("habit_logs")
          .select("*")
          .eq("habit_id", habit.id)
          .eq("date", today)
          .eq("completed", true)
          .single();

        // --- Successful streak ---
        const { data: logs } = await supabase
          .from("habit_logs")
          .select("date, completed")
          .eq("habit_id", habit.id)
          .eq("completed", true)
          .order("date", { ascending: false });

        let streak = 0;

        if (logs && logs.length > 0) {
          const sortedDates = logs.map((l) => new Date(l.date));
          let currentDate = new Date(today);

          for (const logDate of sortedDates) {
            const diffTime = currentDate.getTime() - logDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) {
              streak++;
              currentDate = logDate;
            } else break;
          }
        }

        return {
          ...habit,
          completedToday: !!todayLog,
          streak,
        };
      })
    );

    // 3) Final response
    return {
      success: true,
      habits: habitsWithLogs,
    };
  } catch (error) {
    console.error("Error fetching habits:", error);
    return {
      success: false,
      message: "Failed to load habits",
      habits: [],
    };
  }
};

export const deleteHabitAction = async (id: string) => {
  const supabase = await createServerSupabaseClient();

  try {
    // Delete logs first (foreign key constraint)
    await supabase.from("habit_logs").delete().eq("habit_id", id);

    // Delete habit
    const { error } = await supabase.from("habits").delete().eq("id", id);

    if (error) throw error;
    return {
      success: true,
      message: "Habit deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting habit:", error);
  }
};
