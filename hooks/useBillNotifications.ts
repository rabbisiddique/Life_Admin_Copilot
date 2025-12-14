"use client";

import { useEffect } from "react";
import {
  createBillDueTodayNotification,
  createBillNextDueNotification,
  createBillOverdueNotification,
} from "../actions/notifications";

export const useBillNotifications = (bills: any[], userId: string) => {
  useEffect(() => {
    if (!bills?.length || !userId) return;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    bills.forEach((bill) => {
      if (bill.status === "paid") return; // 🔒 HARD STOP

      const dueDate = new Date(bill.due_date);
      const diffDays = Math.floor(
        (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 🔔 Due Today
      if (bill.due_date === todayStr) {
        createBillDueTodayNotification(userId, bill.title, bill.id);
        return;
      }

      // 🔔 Upcoming (within 3 days)
      if (diffDays > 0 && diffDays <= 3) {
        createBillNextDueNotification(
          userId,
          bill.title,
          bill.id,
          bill.due_date
        );
        return;
      }

      // 🔔 Overdue
      if (diffDays < 0) {
        createBillOverdueNotification(
          userId,
          bill.title,
          bill.id,
          bill.due_date
        );
      }
    });
  }, [bills, userId]);
};
