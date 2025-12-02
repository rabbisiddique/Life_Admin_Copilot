"use server";

import { createServerSupabaseClient } from "../lib/supabase/server";
import { ITasks } from "../type/index.tasks";

export const CreateTaskAction = async (tasks: ITasks) => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
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

    // revalidatePath("/tasks");

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

export const UpdateTaskAction = async (tasks: ITasks, id: string) => {
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

// export const EditTaskAction = async (tasks: ITasks, id: string) => {
//   try {
//     const supabase = await createServerSupabaseClient();

//     const { data, error } = await supabase
//       .from("tasks")
//       .update(tasks)
//       .eq("id", id)
//       .select();
//     if (error) {
//       return {
//         success: false,
//         message: error.message,
//       };
//     }
//     return {
//       success: true,
//     };
//   } catch (err) {
//     console.error("Unexpected error:", err);
//     return {
//       success: false,
//       message: "Something went wrong. Please try again.",
//     };
//   }
// };
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
