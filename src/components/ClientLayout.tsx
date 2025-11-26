"use client";

import { usePathname } from "next/navigation";
import useSyncUser from "../../hooks/UserSync";
import { ChatWidget } from "./ai-copilot/chat-widget";
import { Sidebar } from "./sidebar/Sidebar";
import { TopBar } from "./top-bar/TopBar";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideUI =
    pathname.startsWith("/auth") ||
    pathname === "/login" ||
    pathname === "/signup";

  // AUTH PAGES → No sidebar, no topbar, no chat widget
  if (hideUI) {
    return <>{children}</>;
  }
  useSyncUser();
  // DASHBOARD PAGES → Full layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col md:pl-64">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>

      <ChatWidget />
    </div>
  );
}
