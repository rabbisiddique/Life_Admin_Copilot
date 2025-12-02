"use client";

import Spinner from "@/components/Spinner/Spinner";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import {
  createHabitAction,
  deleteHabitAction,
  fetchAllHabits,
  toggleHabit,
} from "../../../actions/habit";
import { createClient } from "../../../lib/supabase/client";
import { Habit } from "../../../type/index.habit";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  frequency: z.enum(["daily", "weekly"], {
    required_error: "Frequency is required",
  }),
  icon: z.string().min(1, "Icon is required"),
  start_at: z.string().min(1, "Start date is required"),
  end_at: z.string().optional(),
  target_per_week: z.number().optional(),
});

type HabitFormData = z.infer<typeof habitSchema>;

interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  log_date?: string;
  status: "done" | "miss";
}

interface HabitWithLog extends Habit {
  completedToday: boolean;
  streak: number;
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithLog[]>([]);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<HabitFormData>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      title: "",
      icon: "",
      start_at: "",
      end_at: "",
      frequency: "daily",
      target_per_week: undefined,
    },
  });

  const frequency = watch("frequency");

  // Fetch habits and their logs
  const loadHabits = async () => {
    setIsLoading(true);
    try {
      const res = await fetchAllHabits();
      if (res.success) {
        toast.success(res.message!);
        setHabits(res.habits);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast.error("Failed to load habits");
    } finally {
      setIsLoading(false);
    }
  };

  // Create habit
  const onSubmit = async (data: HabitFormData) => {
    setIsCreating(true);
    try {
      const res = await createHabitAction(data);
      if (res.success) {
        toast.success("Habit created successfully!");
        setIsAddHabitOpen(false);
        reset();
      }
    } catch (error: any) {
      console.error("Error creating habit:", error);
      toast.error(error.message || "Failed to create habit");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle habit completion
  const toggleHabitCompletion = async (habitId: string) => {
    try {
      const result = await toggleHabit(habitId);

      if (result.status === "complete") {
        toast.success("Habit completed! 🎉");
      } else {
        toast.success("Habit marked as incomplete");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete habit
  const deleteHabit = async (id: string) => {
    try {
      const res = await deleteHabitAction(id);
      if (res?.success) {
        toast.success(res.message);
      }
    } catch (error: any) {
      console.error("Error deleting habit:", error);
      toast.error(error.message || "Failed to delete habit");
    }
  };

  // Calculate stats
  const habitStats = {
    total: habits.length,
    completedToday: habits.filter((h) => h.completedToday).length,
    averageStreak:
      habits.length > 0
        ? Math.round(
            habits.reduce((acc, h) => acc + h.streak, 0) / habits.length
          )
        : 0,
  };

  // Fetch habits on mount
  useEffect(() => {
    loadHabits();
  }, []);

  // Real-time subscription for habits
  useEffect(() => {
    const channel = supabase
      .channel("habits-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habits" },
        () => {
          loadHabits();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "habit_logs" },
        () => {
          loadHabits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return <Spinner title="Loading habits..." />;
  }

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
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid gap-4 py-4"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="title">Habit Title</Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="e.g. Morning Exercise"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-500">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={frequency}
                      onValueChange={(value) =>
                        setValue("frequency", value as "daily" | "weekly")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.frequency && (
                      <p className="text-sm text-red-500">
                        {errors.frequency.message}
                      </p>
                    )}
                  </div>

                  {frequency === "weekly" && (
                    <div className="grid gap-2">
                      <Label htmlFor="target_per_week">Target per Week</Label>
                      <Input
                        id="target_per_week"
                        type="number"
                        min="1"
                        max="7"
                        {...register("target_per_week", {
                          valueAsNumber: true,
                        })}
                        placeholder="e.g. 3"
                      />
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="icon">Icon (emoji)</Label>
                    <Input
                      id="icon"
                      {...register("icon")}
                      placeholder="e.g. 💪"
                      maxLength={2}
                    />
                    {errors.icon && (
                      <p className="text-sm text-red-500">
                        {errors.icon.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="start_at">Start Date</Label>
                    <Input
                      id="start_at"
                      type="date"
                      {...register("start_at")}
                    />
                    {errors.start_at && (
                      <p className="text-sm text-red-500">
                        {errors.start_at.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="end_at">End Date (Optional)</Label>
                    <Input id="end_at" type="date" {...register("end_at")} />
                  </div>

                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Add Habit"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {habits.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p>No habits yet. Create your first habit to get started!</p>
                </div>
              ) : (
                habits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-muted/30 p-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                    onClick={() => toggleHabitCompletion(habit.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{habit.icon}</div>
                        <div>
                          <h4 className="font-semibold">{habit.title}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {habit.frequency}
                            {habit.frequency === "weekly" &&
                              habit.target_per_week &&
                              ` (${habit.target_per_week}x/week)`}
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
                ))
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
