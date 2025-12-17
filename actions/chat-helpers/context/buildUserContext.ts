"use server";

import { SupabaseClient, User } from "@supabase/supabase-js";

export async function buildUserContext(
  supabase: SupabaseClient,
  user: User
): Promise<string> {
  // ALL your existing logic goes here
  // return ONE string: contextMessage
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  // Get user profile name
  const userName =
    user.user_metadata?.first_name || user.email?.split("@")[0] || "there";

  // Tasks data
  const { data: tasksData, error: taskError } = await supabase
    .from("tasks")
    .select("id, title, status, due_date, priority, created_at")
    .eq("user_id", user.id);

  if (taskError) console.error("Tasks fetch error:", taskError);

  const taskStats = {
    total: tasksData?.length || 0,
    completed: tasksData?.filter((t) => t.status === "completed").length || 0,
    pending: tasksData?.filter((t) => t.status === "pending").length || 0,
    in_progress:
      tasksData?.filter((t) => t.status === "in_progress").length || 0,
    // This week
    thisWeekTotal:
      tasksData?.filter((t) => {
        const taskDate = new Date(t.created_at);
        return taskDate >= startOfWeek && taskDate <= endOfWeek;
      }).length || 0,
    thisWeekCompleted:
      tasksData?.filter((t) => {
        const taskDate = new Date(t.created_at);
        return (
          t.status === "completed" &&
          taskDate >= startOfWeek &&
          taskDate <= endOfWeek
        );
      }).length || 0,
    // This month
    thisMonthTotal:
      tasksData?.filter((t) => {
        const taskDate = new Date(t.created_at);
        return (
          taskDate.getMonth() === currentMonth &&
          taskDate.getFullYear() === currentYear
        );
      }).length || 0,
    thisMonthCompleted:
      tasksData?.filter((t) => {
        const taskDate = new Date(t.created_at);
        return (
          t.status === "completed" &&
          taskDate.getMonth() === currentMonth &&
          taskDate.getFullYear() === currentYear
        );
      }).length || 0,
  };

  // Bills data
  const { data: billsData, error: billsError } = await supabase
    .from("bills")
    .select("id, title, amount, due_date, status, recurrence, created_at")
    .eq("user_id", user.id);

  if (billsError) console.error("Bills fetch error:", billsError);
  console.log("📊 Bills data fetched:", billsData?.length || 0);

  const thisMonthBills =
    billsData?.filter((bill) => {
      const billDate = new Date(bill.due_date);
      return (
        billDate.getMonth() === currentMonth &&
        billDate.getFullYear() === currentYear
      );
    }) || [];

  const thisWeekBills =
    billsData?.filter((bill) => {
      const billDate = new Date(bill.due_date);
      return billDate >= startOfWeek && billDate <= endOfWeek;
    }) || [];

  const billStats = {
    total: billsData?.length || 0,
    paid: billsData?.filter((b) => b.status === "paid").length || 0,
    unpaid: billsData?.filter((b) => b.status === "unpaid").length || 0,
    pending: billsData?.filter((b) => b.status === "pending").length || 0,
    // This month
    thisMonthTotal: thisMonthBills.length,
    thisMonthAmount: thisMonthBills.reduce((sum, bill) => sum + bill.amount, 0),
    thisMonthPaid: thisMonthBills.filter((b) => b.status === "paid").length,
    thisMonthPaidAmount: thisMonthBills
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + b.amount, 0),
    thisMonthUnpaid: thisMonthBills.filter((b) => b.status !== "paid").length,
    thisMonthUnpaidAmount: thisMonthBills
      .filter((b) => b.status !== "paid")
      .reduce((sum, b) => sum + b.amount, 0),
    // This week
    thisWeekTotal: thisWeekBills.length,
    thisWeekAmount: thisWeekBills.reduce((sum, bill) => sum + bill.amount, 0),
    thisWeekPaid: thisWeekBills.filter((b) => b.status === "paid").length,
    thisWeekUnpaid: thisWeekBills.filter((b) => b.status !== "paid").length,
    // Upcoming
    upcomingBills:
      billsData
        ?.filter((b) => b.status !== "paid" && new Date(b.due_date) >= today)
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )
        .slice(0, 3)
        .map((b) => ({
          name: b.title,
          amount: b.amount,
          due_date: b.due_date,
        })) || [],
    recurringCount:
      billsData?.filter((b) => b.recurrence && b.recurrence !== "none")
        .length || 0,
  };

  // Habits data
  const { data: habitsData, error: habitError } = await supabase
    .from("habits")
    .select("id, title, created_at")
    .eq("user_id", user.id);

  const { data: habitLogsData, error: habitLogsError } = await supabase
    .from("habit_logs")
    .select("habit_id, status, date")
    .eq("user_id", user.id);

  if (habitError) console.error("Habits fetch error:", habitError);

  const habitStats = {
    total: habitsData?.length || 0,
    completedToday:
      habitLogsData?.filter(
        (log) =>
          log.status === "completed" &&
          new Date(log.date).toDateString() === today.toDateString()
      ).length || 0,
    // This week
    thisWeekCompleted:
      habitLogsData?.filter((log) => {
        const logDate = new Date(log.date);
        return (
          log.status === "completed" &&
          logDate >= startOfWeek &&
          logDate <= endOfWeek
        );
      }).length || 0,
    // This month
    thisMonthCompleted:
      habitLogsData?.filter((log) => {
        const logDate = new Date(log.date);
        return (
          log.status === "completed" &&
          logDate.getMonth() === currentMonth &&
          logDate.getFullYear() === currentYear
        );
      }).length || 0,
    totalLogs: habitLogsData?.length || 0,
  };

  // Documents data
  const { data: documentsData, error: documentError } = await supabase
    .from("documents")
    .select("id, name, expiry_date, status, created_at")
    .eq("user_id", user.id);

  if (documentError) console.error("Documents fetch error:", documentError);

  const documentStats = {
    total: documentsData?.length || 0,
    valid: documentsData?.filter((d) => d.status === "valid").length || 0,
    expiring: documentsData?.filter((d) => d.status === "expiring").length || 0,
    expired: documentsData?.filter((d) => d.status === "expired").length || 0,
    // This month
    thisMonthUploaded:
      documentsData?.filter((d) => {
        const docDate = new Date(d.created_at);
        return (
          docDate.getMonth() === currentMonth &&
          docDate.getFullYear() === currentYear
        );
      }).length || 0,
    expiringDocs:
      documentsData
        ?.filter((d) => d.status === "expiring")
        .map((d) => {
          const daysUntilExpiry = Math.ceil(
            (new Date(d.expiry_date).getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          );
          return {
            name: d.name,
            expiry_date: d.expiry_date,
            days_until_expiry: daysUntilExpiry,
          };
        }) || [],
  };

  const upcomingBills =
    billStats.upcomingBills.length > 0
      ? billStats.upcomingBills
          .map(
            (b) =>
              `${b.name} ($${b.amount}, ${new Date(
                b.due_date
              ).toLocaleDateString()})`
          )
          .join(", ")
      : "None";

  const expiringDocs =
    documentStats.expiringDocs.length > 0
      ? documentStats.expiringDocs
          .map((d) => `${d.name} (${d.days_until_expiry}d)`)
          .join(", ")
      : "None";

  // 4️⃣ Create context for AI
  const contextMessage = `You are ${userName}'s productivity assistant. Be concise, personable, and encouraging.

USER: ${userName})

TASKS: ${taskStats.total} total | ${taskStats.completed} done | ${
    taskStats.pending
  } pending | ${taskStats.in_progress} in progress
- Week: ${taskStats.thisWeekTotal} (${taskStats.thisWeekCompleted} done)
- Month: ${taskStats.thisMonthTotal} (${taskStats.thisMonthCompleted} done)

BILLS: ${billStats.total} total | ${billStats.paid} paid | ${
    billStats.unpaid
  } unpaid | ${billStats.recurringCount || 0} recurring
- Week: ${billStats.thisWeekTotal} bills ($${billStats.thisWeekAmount})
- Month: ${billStats.thisMonthTotal} bills ($${
    billStats.thisMonthAmount
  }) - Paid: $${billStats.thisMonthPaidAmount}, Unpaid: $${
    billStats.thisMonthUnpaidAmount
  }
- Upcoming: ${upcomingBills}

HABITS: ${habitStats.total} total | Today: ${
    habitStats.completedToday
  } | Week: ${habitStats.thisWeekCompleted} | Month: ${
    habitStats.thisMonthCompleted
  }

DOCUMENTS: ${documentStats.total} total | ${documentStats.valid} valid | ${
    documentStats.expiring
  } expiring | ${documentStats.expired} expired
- Expiring soon: ${expiringDocs}

RULES:
1. Only greet by name if it's the FIRST message in conversation
2. Be concise - keep responses under 100 words unless asked for details
3. For summaries, provide actionable insights
4. ONLY answer questions about tasks, bills, habits, and documents
5. If asked about anything else, reply: "I can only help with tasks, bills, habits, and documents in this app."
6. Never repeat greetings in follow-up messages`;

  return contextMessage;
}
