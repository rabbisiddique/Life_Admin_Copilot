"use server";

import { addDays, parseISO } from "date-fns";
import { createServerSupabaseClient } from "../lib/supabase/server";
import { createServerActionClient } from "../lib/supabase/server-action";

/* =========================================================
   CORE – SINGLE SOURCE OF TRUTH
========================================================= */

export const createNotification = async (payload: {
  user_id: string;
  title: string;
  message: string;
  type: "task" | "habit" | "bill" | "document";
  action_url: string;
  trigger_time: string;
  unique_key: string;
}) => {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("notifications").upsert(
    {
      ...payload,
      is_read: false,
    },
    { onConflict: "unique_key" }
  );

  if (error) {
    console.error("❌ Notification Error:", error);
    return { success: false, error };
  }

  return { success: true };
};

/* =========================================================
   TASK NOTIFICATIONS
========================================================= */

export const createTaskNotification = async (
  taskName: string,
  taskId: string
) => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  return createNotification({
    user_id: user.id,
    title: "New Task Added",
    message: `Your task "${taskName}" is ready to go.`,
    type: "task",
    action_url: `/tasks/${taskId}`,
    trigger_time: new Date().toISOString(),
    unique_key: `task_created_${taskId}`,
  });
};

/* =========================================================
   EXPIRY / RENEW
========================================================= */

export const createExpiryNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "task" | "habit" | "bill" | "document",
  actionUrl: string,
  expiryDate: string
) => {
  const triggerTime = addDays(parseISO(expiryDate), -2);

  return createNotification({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl,
    trigger_time: triggerTime.toISOString(),
    unique_key: `expiry_${type}_${actionUrl}_${expiryDate}`,
  });
};

export const createRenewNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "task" | "habit" | "bill" | "document",
  actionUrl: string
) => {
  return createNotification({
    user_id: userId,
    title,
    message,
    type,
    action_url: actionUrl,
    trigger_time: new Date().toISOString(),
    unique_key: `renew_${type}_${actionUrl}`,
  });
};

/* =========================================================
   BILL NOTIFICATIONS
========================================================= */

export const createBillCreatedNotification = async (
  userId: string,
  billName: string,
  billId: string
) => {
  return createNotification({
    user_id: userId,
    title: "New Bill Added",
    message: `Your bill "${billName}" has been created.`,
    type: "bill",
    action_url: `/bills`,
    trigger_time: new Date().toISOString(),
    unique_key: `bill_created_${billId}`,
  });
};

export const createBillNextDueNotification = async (
  userId: string,
  billName: string,
  billId: string,
  dueDate: string
) => {
  return createNotification({
    user_id: userId,
    title: "Upcoming Bill Due",
    message: `Your bill "${billName}" is due on ${new Date(
      dueDate
    ).toLocaleDateString()}.`,
    type: "bill",
    action_url: `/bills`,
    trigger_time: new Date().toISOString(),
    unique_key: `bill_next_due_${billId}_${dueDate}`,
  });
};

export const createBillDueTodayNotification = async (
  userId: string,
  billTitle: string,
  billId: string
) => {
  return createNotification({
    user_id: userId,
    title: "Bill Due Today",
    message: `Your bill "${billTitle}" is due today!`,
    type: "bill",
    action_url: `/bills`,
    trigger_time: new Date().toISOString(),
    unique_key: `bill_due_today_${billId}`,
  });
};

export const createBillOverdueNotification = async (
  userId: string,
  billName: string,
  billId: string,
  dueDate: string
) => {
  return createNotification({
    user_id: userId,
    title: "Bill Overdue",
    message: `Your bill "${billName}" was due on ${dueDate} and is now overdue.`,
    type: "bill",
    action_url: `/bills`,
    trigger_time: new Date().toISOString(),
    unique_key: `bill_overdue_${billId}`,
  });
};

export const createBillPaidNotification = async (
  userId: string,
  billName: string,
  billId: string
) => {
  return createNotification({
    user_id: userId,
    title: "Bill Paid",
    message: `Your bill "${billName}" has been paid. Nice work!`,
    type: "bill",
    action_url: `/bills`,
    trigger_time: new Date().toISOString(),
    unique_key: `bill_paid_${billId}`,
  });
};

/* =========================================================
   READ / DELETE
========================================================= */

export async function deleteNotification(
  notificationId: string,
  userId: string
) {
  const supabase = await createServerActionClient();

  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("Delete error:", error);
    return { success: false };
  }

  return { success: true, data };
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("Mark read error:", error);
    return { success: false };
  }

  return { success: true, data };
}

export async function markAllNotificationsAsRead(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) {
    console.error("Mark all read error:", error);
    return { success: false };
  }

  return { success: true, data };
}
