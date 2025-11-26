"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { FileUp, Plus, Receipt } from "lucide-react";
import Link from "next/link";

const actions = [
  {
    label: "Add Task",
    icon: Plus,
    color: "bg-blue-500 hover:bg-blue-600",
    delay: 0.4,
    href: "/tasks",
  },
  {
    label: "Add Bill",
    icon: Receipt,
    color: "bg-green-500 hover:bg-green-600",
    delay: 0.5,
    href: "/bills",
  },
  {
    label: "Upload Doc",
    icon: FileUp,
    color: "bg-purple-500 hover:bg-purple-600",
    delay: 0.6,
    href: "/documents",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => (
        <motion.div
          key={action.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: action.delay }}
        >
          <Link href={action.href} className="block">
            <Button
              className={`w-full h-auto py-4 flex flex-col gap-2 ${action.color} text-white border-none shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
