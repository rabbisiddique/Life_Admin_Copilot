"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [isMounted, setIsMounted] = useState(false);

  // IMPORTANT: Call all hooks at the top level, unconditionally
  useSyncUser();

  // Define auth routes (no UI chrome)
  const exactRoutes = ["/", "/not-found"];
  const prefixRoutes = ["/auth"];

  const isAuthRoute =
    exactRoutes.includes(pathname) ||
    prefixRoutes.some((route) => pathname.startsWith(route));

  // Fix hydration: only run after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // AUTH PAGES → No sidebar, no topbar, no chat widget
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // ALL OTHER PAGES → Full layout
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
