import { getUserPreferences } from "../../actions/profile";

export async function shouldSendNotification(
  userId: string,
  type: "task" | "habit" | "bill" | "document"
): Promise<boolean> {
  const prefsResult = await getUserPreferences();
  const preferences = prefsResult.data;

  if (!preferences) return false;

  switch (type) {
    case "bill":
      return preferences.bill_reminders;
    case "task":
      return preferences.task_updates;
    case "document":
      return preferences.document_expiry;
    case "habit":
      return preferences.habit_reminders;
    default:
      return false;
  }
}
