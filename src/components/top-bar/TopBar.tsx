"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";
import NotificationDropdown from "./NofificationDropDown";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "bill" | "success" | "warning" | "info";
  unread: boolean;
  time: string;
  link?: string; // optional URL or route
}

const dummyNotifications: Notification[] = [
  {
    id: 1,
    title: "Netflix Bill Due",
    message: "Your Netflix subscription is due tomorrow",
    time: "2 hours ago",
    type: "bill",
    unread: true,
    link: "/bills",
  },
  {
    id: 2,
    title: "Habit Completed",
    message: "You finished your morning workout",
    time: "3 hours ago",
    type: "success",
    unread: true,
    link: "/habits",
  },
  {
    id: 3,
    title: "Document Expiring",
    message: "Your license expires in 15 days",
    time: "5 hours ago",
    type: "warning",
    unread: false,
    link: "/documents",
  },
  {
    id: 4,
    title: "New Task Assigned",
    message: "Complete quarterly report by Friday",
    time: "1 day ago",
    type: "info",
    unread: false,
    link: "/tasks",
  },
];

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(dummyNotifications);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => setMounted(true), []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log(error.message);
      }
      router.push("/auth/login");
      // console.log(data);
    } catch (error) {
      console.log(error);
      console.log("error in signout");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 bg-background border-b border-border">
      <div className="flex items-center flex-1">{/* Optional search */}</div>

      <div className="flex items-center gap-2">
        <NotificationDropdown
          notifications={notifications}
          markAllAsRead={markAllAsRead}
        />

        {mounted && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl p-2.5 hover:bg-accent transition-colors"
          >
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-black" />
              )}
            </AnimatePresence>
          </motion.button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button className="flex items-center gap-2 rounded-xl p-1 pr-3 hover:bg-accent transition-colors">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                  SD
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold leading-none">
                  Sam Doe
                </span>
                <span className="text-xs text-muted-foreground">
                  sam@example.com
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">Sam Doe</p>
                <p className="text-xs text-muted-foreground">sam@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer">
              <User className="w-4 h-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
