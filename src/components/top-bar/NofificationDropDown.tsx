"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import NotificationList from "./NotificationItem";

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  // Real-time subscription for unread count badge
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Initial fetch for badge count
      const fetchUnreadCount = async () => {
        const { count } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false);

        setUnreadCount(count || 0);
      };

      fetchUnreadCount();

      const channel = supabase
        .channel(`notifications-badge-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            // Refetch unread count whenever any notification changes
            fetchUnreadCount();
          }
        )
        .subscribe();

      return channel;
    };

    let channel: any;
    setupRealtime().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-xl p-2.5 hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[420px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          <NotificationList />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
