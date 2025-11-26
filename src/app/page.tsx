import { MoodTracker } from "@/components/dashboard/mood-tracker";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BillList } from "@/components/reminders/bill-list";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-base">
            Welcome back! Here's your overview for today.
          </p>
        </div>
      </div>

      <QuickActions />
      <SummaryCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <MoodTracker />
        <div className="rounded-2xl border border-border bg-card shadow-lg p-6">
          <BillList />
        </div>
      </div>
    </div>
  );
}
