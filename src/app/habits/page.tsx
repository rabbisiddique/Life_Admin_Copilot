"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type Habit = {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
  frequency: "daily" | "weekly";
  icon: string;
};

const initialHabits: Habit[] = [
  {
    id: "1",
    title: "Morning Exercise",
    streak: 12,
    completedToday: true,
    frequency: "daily",
    icon: "💪",
  },
  {
    id: "2",
    title: "Read 30 minutes",
    streak: 8,
    completedToday: false,
    frequency: "daily",
    icon: "📚",
  },
  {
    id: "3",
    title: "Meditate",
    streak: 5,
    completedToday: true,
    frequency: "daily",
    icon: "🧘",
  },
  {
    id: "4",
    title: "Drink 8 glasses of water",
    streak: 15,
    completedToday: false,
    frequency: "daily",
    icon: "💧",
  },
  {
    id: "5",
    title: "Weekly Review",
    streak: 3,
    completedToday: false,
    frequency: "weekly",
    icon: "📝",
  },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);

  const toggleHabit = (id: string) => {
    setHabits(
      habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completedToday: !habit.completedToday,
              streak: !habit.completedToday ? habit.streak + 1 : habit.streak,
            }
          : habit
      )
    );
  };

  const deleteHabit = (id: string) => {
    setHabits(habits.filter((habit) => habit.id !== id));
  };

  const habitStats = {
    total: habits.length,
    completedToday: habits.filter((h) => h.completedToday).length,
    averageStreak: Math.round(
      habits.reduce((acc, h) => acc + h.streak, 0) / habits.length
    ),
  };

  return (
    <div className="space-y-6 p-6 mx-auto max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
        <p className="text-muted-foreground mt-2">
          Track your daily and weekly habits
        </p>
      </div>

      {/* Habit Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Habits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{habitStats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {habitStats.completedToday}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {habitStats.averageStreak} days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Habits</CardTitle>
              <CardDescription>
                Build consistency and track your progress
              </CardDescription>
            </div>
            <Dialog open={isAddHabitOpen} onOpenChange={setIsAddHabitOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Habit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Habit</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="habit-title">Habit Title</Label>
                    <Input
                      id="habit-title"
                      placeholder="e.g. Morning Exercise"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="habit-frequency">Frequency</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="habit-icon">Icon (emoji)</Label>
                    <Input
                      id="habit-icon"
                      placeholder="e.g. 💪"
                      maxLength={2}
                    />
                  </div>
                  <Button onClick={() => setIsAddHabitOpen(false)}>
                    Add Habit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {habits.map((habit, index) => (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-muted/30 p-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                  onClick={() => toggleHabit(habit.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{habit.icon}</div>
                      <div>
                        <h4 className="font-semibold">{habit.title}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {habit.frequency}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteHabit(habit.id);
                      }}
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                          habit.completedToday
                            ? "border-green-500 bg-green-500"
                            : "border-muted-foreground bg-transparent"
                        }`}
                      >
                        {habit.completedToday && (
                          <Check className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium">
                        {habit.completedToday ? "Completed" : "Mark as done"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {habit.streak}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        day streak
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
