"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  CheckSquare,
  ChevronRight,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "../../../lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Habits", href: "/habits", icon: Activity },
  { name: "Bills", href: "/bills", icon: CreditCard },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/profile", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-card shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-72 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out shadow-2xl backdrop-blur-sm",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl overflow-hidden shadow-lg">
              <img
                src="/logo.jpg"
                alt="Logo"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Life-Admin
              </span>
              <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                Copilot
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 px-4 py-8">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={false}
                  animate={false}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all",
                      isActive
                        ? "text-primary bg-sidebar-accent/50 shadow-lg shadow-primary/5 border-l-3 border-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-md"
                    )}
                  >
                    <motion.div
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 10,
                      }}
                      className={cn(
                        isActive
                          ? "text-primary"
                          : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>

                    <span className="flex-1">{item.name}</span>

                    {hoveredItem === item.name && !isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </motion.div>
                    )}

                    {/* {isActive && (
                      <>
                        <div className="absolute inset-0 rounded-2xl bg-sidebar-accent/50 -z-10" />

                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-2xl shadow-[0_0_8px_var(--color-primary)]" />
                      </>
                    )} */}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User section */}
          <motion.div
            className="border-t border-sidebar-border p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Link href="/profile">
              <motion.div
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-sidebar-accent to-sidebar-accent/80 p-4 transition-all hover:shadow-lg cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-md"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  JD
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-sidebar-foreground truncate">
                    John Doe
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    john@example.com
                  </p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.aside>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
