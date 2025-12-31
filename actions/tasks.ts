"use server";

import { createServerSupabaseClient } from "../lib/supabase/server";
import { ITasks } from "../type/index.tasks";
import { createTaskNotification } from "./notifications";

export const CreateTaskAction = async (tasks: Omit<ITasks, "id">) => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const taskName = tasks.title;
    // Add .select() to get the inserted row(s)
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          ...tasks,
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

    // Create notification
    await createTaskNotification(taskName, data?.[0].id);
    return {
      success: true,
      message: "Task Created Successfully",
      data,
    };
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const UpdateTaskAction = async (
  tasks: Omit<ITasks, "id">,
  id: string
) => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("tasks")
      .update(tasks)
      .eq("id", id)
      .select();
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: true,
      message: "Task Updated Successfully",
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

export const DeleteTaskAction = async (id: string) => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .select();
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: "Task Deleted Successfully",
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

export const GetAllTaskAction = async () => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    // revalidatePath("/tasks");

    return {
      success: true,
      message: "Found Tasks",
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
