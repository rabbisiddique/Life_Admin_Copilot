"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "bill" | "success" | "warning" | "info";
  unread: boolean;
  time: string;
  link?: string;
}

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const { title, message, time, type, unread, link } = notification;

  const typeColor = {
    bill: "bg-orange-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  }[type];

  const handleClick = () => {
    if (link) {
      router.push(link); // navigate to the specific page
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-accent ${
        unread ? "bg-primary/5" : ""
      }`}
    >
      <div className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${typeColor}`} />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium text-sm leading-tight">{title}</p>
          {unread && (
            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
          {message}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </motion.div>
  );
}
