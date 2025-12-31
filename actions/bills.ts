"use server";

import { createServerSupabaseClient } from "../lib/supabase/server";
import { Bill } from "../type/index.bills";
import {
  createBillCreatedNotification,
  createBillPaidNotification,
} from "./notifications";

export const CreateBillsAction = async (bills: Omit<Bill, "id">) => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    // Add .select() to get the inserted row(s)
    const { data, error } = await supabase
      .from("bills")
      .insert([
        {
          ...bills,
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

    const createdBill = data[0];

    await createBillCreatedNotification(
      userData.user?.id!,
      createdBill.title,
      createdBill.id
    );

    // revalidatePath("/Billss");

    return {
      success: true,
      message: "Bill Created Successfully",
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

export const UpdateBillsAction = async (
  bills: Omit<Bill, "id">,
  id: string
) => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("bills")
      .update(bills)
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
      message: "Bills Updated Successfully",
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

export const DeleteBillsAction = async (id: string) => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("bills")
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
      message: "Bill Deleted Successfully",
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

export const GetAllBillsAction = async () => {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from("bills")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }
    // revalidatePath("/Billss");

    return {
      success: true,
      message: "Found Bills",
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

export const BillMarkPaid = async (id: string) => {
  const supabase = await createServerSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("bills")
    .update({ status: "paid" })
    .eq("id", id)
    .select()
    .single(); // cleaner + safer

  if (error) {
    console.error("Error updating bill:", error);
    return {
      success: false,
      message: error.message,
    };
  }

  // Send bill paid notification
  await createBillPaidNotification(authData.user?.id!, data.title, data.id);

  return {
    success: true,
    message: "Bill marked as paid 🎉",
    data,
  };
};
