"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import NotificationItem from "./NotificationItem";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "bill" | "success" | "warning" | "info";
  unread: boolean;
  time: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  markAllAsRead: () => void;
}

export default function NotificationDropdown({
  notifications,
  markAllAsRead,
}: NotificationDropdownProps) {
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-xl p-2.5 hover:bg-accent transition-colors">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </div>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0 max-h-[500px]">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-popover z-10">
          <h3 className="font-semibold text-base">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="overflow-y-auto max-h-[440px]">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
