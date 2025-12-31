"use client";
import { useMemo } from "react";
import { Bill } from "../type/index.bills";

export const useKpis = (bills: Bill[] = []) => {
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthBills = bills.filter((bill) => {
      const billDate = new Date(bill.due_date);
      return (
        billDate.getMonth() === currentMonth &&
        billDate.getFullYear() === currentYear
      );
    });

    const totalAmount = thisMonthBills.reduce(
      (sum, bill) => sum + (Number(bill.amount) || 0),
      0
    );

    const paidCount = thisMonthBills.filter((b) => b.status === "paid").length;

    const unpaidCount = thisMonthBills.filter(
      (b) => b.status !== "paid"
    ).length;

    const upcomingBills = bills
      .filter((b) => b.status !== "paid" && new Date(b.due_date) >= now)
      .sort(
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      )
      .slice(0, 3);

    return {
      totalAmount,
      paidCount,
      unpaidCount,
      upcomingBills,
    };
  }, [bills]);

  return kpis;
};
