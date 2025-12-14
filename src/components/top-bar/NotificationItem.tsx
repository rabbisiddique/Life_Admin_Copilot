"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Loader, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  deleteNotification,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../../actions/notifications";
import { useAuth } from "../../../hooks/useAuth";
import { createClient } from "../../../lib/supabase/client";
import { Notification } from "../../../type/index.notifications";

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { user } = useAuth();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Fetch notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setIsLoading(true);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        setNotifications(data || []);
      } catch (err) {
        console.error("Fetch notifications error:", err);
        toast.error("Failed to load notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Real-time subscription for new notifications
  useEffect(() => {
    // Don't set up realtime until initial fetch is done
    if (isLoading) return;

    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const channel = supabase
        .channel(`notifications-list-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;

            // Add to list only if it doesn't already exist (prevent duplicates)
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === newNotification.id);
              if (exists) return prev;
              return [newNotification, ...prev];
            });

            // Show toast if it should trigger now
            if (
              !newNotification.trigger_time ||
              new Date(newNotification.trigger_time) <= new Date()
            ) {
              toast.success(
                `${newNotification.title}: ${newNotification.message}`,
                {
                  id: newNotification.id,
                }
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === payload.new.id ? (payload.new as Notification) : n
              )
            );
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== (payload.old as { id: string }).id)
            );
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
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoading, supabase]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const res = await markNotificationAsRead(notificationId, user?.id!);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      // Optimistically update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Mark as read error:", err);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    setIsMarkingAllRead(true);
    try {
      const res = await markAllNotificationsAsRead(user?.id!);

      if (!res.success) {
        toast.error(res.message);
        setIsMarkingAllRead(false);
        return;
      }

      // Update all notifications to read
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      toast.success("All notifications marked as read");
    } catch (err) {
      console.error("Mark all as read error:", err);
      toast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate if link exists
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="space-y-1">
        {[...Array(5)].map((_, i) => (
          <NotificationSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Bell className="h-10 w-10 text-primary/50" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            No notifications yet
          </p>
          <p className="text-sm text-muted-foreground">
            You'll see updates here when something happens
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with Mark All as Read */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="h-8 text-xs"
          >
            {isMarkingAllRead ? (
              <>
                <Loader className="h-3 w-3 mr-1 animate-spin" />
                Marking...
              </>
            ) : (
              <>
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all as read
              </>
            )}
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <div className="divide-y">
        {notifications.map((notification, index) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
            formatTime={formatTime}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton Loading Component
function NotificationSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

// Separate NotificationItem component
function NotificationItem({
  notification,
  onClick,
  formatTime,
  index,
}: {
  notification: Notification;
  onClick: () => void;
  formatTime: (date: string) => string;
  index: number;
}) {
  const { title, message, created_at, type, is_read, id } = notification;
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await deleteNotification(id, user?.id!);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleting(false);
    }
  };

  const typeColor = {
    bill: "bg-orange-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group flex gap-3 px-4 py-3 transition-all relative ${
        !is_read ? "bg-primary/5" : ""
      }`}
    >
      {/* Content area - clickable */}
      <div
        onClick={onClick}
        className="flex gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
      >
        <div
          className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${typeColor}`}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm leading-tight">{title}</p>
            {!is_read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
            {message}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatTime(created_at)}
          </p>
        </div>
      </div>

      {/* Delete Button - Always visible */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="h-8 w-8 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive flex items-center justify-center flex-shrink-0 transition-colors"
        onClick={handleDelete}
        disabled={isDeleting}
        title="Delete notification"
      >
        {isDeleting ? (
          <Loader className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </motion.button>
    </motion.div>
  );
}
