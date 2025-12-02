"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, Clock, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../lib/utils";
import { Bill } from "../../../type/index.bills";

const initialBills: Bill[] = [
  {
    id: "1",
    name: "Netflix",
    amount: 15.99,
    dueDate: "2024-03-25",
    status: "pending",
    category: "subscription",
    icon: "🎬",
  },
  {
    id: "2",
    name: "Spotify",
    amount: 9.99,
    dueDate: "2024-03-28",
    status: "pending",
    category: "subscription",
    icon: "🎵",
  },
  {
    id: "3",
    name: "Electricity",
    amount: 85.5,
    dueDate: "2024-04-01",
    status: "pending",
    category: "utility",
    icon: "⚡",
  },
  {
    id: "4",
    name: "Rent",
    amount: 1200.0,
    dueDate: "2024-04-01",
    status: "pending",
    category: "rent",
    icon: "🏠",
  },
  {
    id: "5",
    name: "Internet",
    amount: 59.99,
    dueDate: "2024-03-15",
    status: "due",
    category: "utility",
    icon: "🌐",
  },
];

export function BillList() {
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const getStatusColor = (status: Bill["status"]) => {
    switch (status) {
      case "paid":
        return "bg-green-500/15 text-green-600 dark:text-green-500 border-green-500/30";
      case "due":
        return "bg-red-500/15 text-red-600 dark:text-red-500 border-red-500/30";
      default:
        return "bg-yellow-500/15 text-yellow-600 dark:text-yellow-500 border-yellow-500/30";
    }
  };

  const handleMarkPaid = (id: string) => {
    setBills(
      bills.map((bill) =>
        bill.id === id ? { ...bill, status: "paid" as const } : bill
      )
    );
  };

  const handleSnooze = (id: string) => {
    console.log("[v0] Snooze bill:", id);
  };

  const handleDelete = (id: string) => {
    setBills(bills.filter((bill) => bill.id !== id));
  };

  const handleBillClick = (bill: Bill) => {
    console.log("[v0] Bill clicked:", bill.name);
  };

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Smart Reminders
            </CardTitle>
            <CardDescription className="text-base">
              Manage your bills and subscriptions
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 shadow-md">
                <Plus className="h-4 w-4" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Bill</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="font-semibold">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Netflix"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount" className="font-semibold">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date" className="font-semibold">
                    Due Date
                  </Label>
                  <Input id="date" type="date" className="h-10" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category" className="font-semibold">
                    Category
                  </Label>
                  <Select>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="utility">Utility</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => setIsAddOpen(false)}
                  className="shadow-md"
                >
                  Add Bill
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[420px] pr-4">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {bills.map((bill, index) => (
                <motion.div
                  key={bill.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  onClick={() => handleBillClick(bill)}
                  className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-lg cursor-pointer hover:border-primary/50 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-muted to-accent text-2xl shadow-sm">
                      {bill.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{bill.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Due {new Date(bill.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        ${bill.amount.toFixed(2)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-1.5 border",
                          getStatusColor(bill.status)
                        )}
                      >
                        {bill.status.charAt(0).toUpperCase() +
                          bill.status.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkPaid(bill.id);
                        }}
                        className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-500/15 rounded-xl"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSnooze(bill.id);
                        }}
                        className="h-9 w-9 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-500/15 rounded-xl"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(bill.id);
                        }}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/15 rounded-xl"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
