"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import NotificationList from "./NotificationItem";

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();
  const isMobile = useIsMobile();

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
  }, [supabase]);

  const NotificationButton = (
    <button className="relative rounded-xl p-2 sm:p-2.5 hover:bg-accent transition-colors">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-destructive-foreground animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </div>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{NotificationButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center justify-between">
              <DrawerTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({unreadCount} unread)
                  </span>
                )}
              </DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="overflow-y-auto">
            <NotificationList />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{NotificationButton}</DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] sm:w-[420px] p-0">
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
