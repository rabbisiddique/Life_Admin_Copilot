import { BillList } from "@/components/reminders/bill-list";

export default function BillsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <BillList />
        </div>
      </div>
    </div>
  );
}
