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
import { ChevronDown, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProfileAuth } from "../../../hooks/useAuth";
import { createClient } from "../../../lib/supabase/client";
import NotificationDropdown from "./NofificationDropDown";

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();
  const { userProfile } = useProfileAuth();
  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log(error.message);
      }
      router.push("/auth/login");
    } catch (error) {
      console.log(error);
      console.log("error in signout");
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between px-6 bg-background border-b border-border">
      <div className="flex items-center flex-1">{/* Optional search */}</div>

      <div className="flex items-center gap-2">
        {/* Notification Dropdown - self-contained */}
        <NotificationDropdown />

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
                <AvatarImage src={userProfile?.avatar_url!} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold">
                  {userProfile?.first_name?.[0]?.toUpperCase() ||
                    userProfile?.email?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold leading-none">
                  {userProfile?.first_name || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {userProfile?.email}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </motion.button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {userProfile?.first_name || "User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => handleNavigate("/profile")}
            >
              <User className="w-4 h-4 mr-2" /> Profile
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
