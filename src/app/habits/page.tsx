"use client";

import Spinner from "@/components/Spinner/Spinner";
import StatCard from "@/components/stat-card/StatCard";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
import { Check, Filter, Plus, Search, Trash2, X } from "lucide-react";
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
import { HabitWithLog } from "../../../type/index.habit";

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

// Hook to detect mobile screens
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

// Habit Form Component
function HabitForm({
  onSubmit,
  register,
  handleSubmit,
  errors,
  isCreating,
  frequency,
  setValue,
}: {
  onSubmit: (data: HabitFormData) => void;
  register: any;
  handleSubmit: any;
  errors: any;
  isCreating: boolean;
  frequency: string;
  setValue: any;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Habit Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g. Morning Exercise"
          className="h-11"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
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
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
          </SelectContent>
        </Select>
        {errors.frequency && (
          <p className="text-sm text-red-500">{errors.frequency.message}</p>
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
            className="h-11"
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
          className="h-11"
        />
        {errors.icon && (
          <p className="text-sm text-red-500">{errors.icon.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="start_at">Start Date</Label>
        <Input
          id="start_at"
          type="date"
          {...register("start_at")}
          className="h-11"
        />
        {errors.start_at && (
          <p className="text-sm text-red-500">{errors.start_at.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="end_at">End Date (Optional)</Label>
        <Input
          id="end_at"
          type="date"
          {...register("end_at")}
          className="h-11"
        />
      </div>

      <Button type="submit" disabled={isCreating} className="h-11">
        {isCreating ? "Creating..." : "Add Habit"}
      </Button>
    </form>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitWithLog[]>([]);
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();
  const isMobile = useIsMobile();

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
  const loadHabits = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetchAllHabits();
      if (res.success) {
        setHabits(res.habits);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
      toast.error("Failed to load habits");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  // Create habit
  const onSubmit = async (datas: HabitFormData) => {
    setIsCreating(true);
    try {
      const res = await createHabitAction(datas);
      if (res.success) {
        toast.success(res.message);
        setIsAddHabitOpen(false);
        reset();
        await loadHabits(false);
      }
    } catch (error: any) {
      console.error("Error creating habit:", error);
      toast.error(error.message || "Failed to create habit");
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle habit completion
  const toggleHabitCompletion = async (habitId: string, habitTitle: string) => {
    try {
      const result = await toggleHabit(habitId, habitTitle);

      if (result.status === "complete") {
        toast.success("Habit completed! 🎉");
      } else {
        toast.success("Habit marked as incomplete");
      }
      await loadHabits(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Delete habit with optimistic update
  const deleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));

    try {
      const res = await deleteHabitAction(id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        await loadHabits();
        toast.error("Failed to delete habit");
      }
    } catch (error: any) {
      console.error("Error deleting habit:", error);
      await loadHabits();
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

  const filteredHabits = habits.filter((habit) => {
    const matchSearch = habit.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      filterPriority === "all" || habit.frequency === filterPriority;
    return matchSearch && matchesPriority;
  });

  const handleDialogChange = (open: boolean) => {
    setIsAddHabitOpen(open);
    if (!open) {
      reset();
    }
  };

  if (isLoading) {
    return <Spinner title="Loading habits..." />;
  }

  const HabitFormModal = isMobile ? (
    <Drawer open={isAddHabitOpen} onOpenChange={handleDialogChange}>
      <DrawerTrigger asChild>
        <Button size={isMobile ? "default" : "sm"} className="h-11 md:h-9">
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Add Habit</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Add New Habit</DrawerTitle>
            <DrawerDescription>
              Create a new habit to track daily or weekly
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <HabitForm
              onSubmit={onSubmit}
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isCreating={isCreating}
              frequency={frequency}
              setValue={setValue}
            />
          </div>
          <DrawerFooter className="mt-[-19px]">
            <DrawerClose asChild>
              <Button variant="outline" className="h-11">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isAddHabitOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Habit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Habit</DialogTitle>
        </DialogHeader>
        <HabitForm
          onSubmit={onSubmit}
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          isCreating={isCreating}
          frequency={frequency}
          setValue={setValue}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 md:p-6 mx-auto max-w-7xl w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Habits
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track your daily and weekly habits
        </p>
      </div>

      {/* Habit Stats - Responsive Grid */}
      <div className="grid gap-1.5 sm:gap-2 md:gap-3 grid-cols-3 w-full">
        <StatCard
          label="Total Habits"
          shortLabel="Total"
          value={habitStats.total}
        />
        <StatCard
          label="Completed Today"
          shortLabel="Done"
          value={habitStats.completedToday}
          color="text-green-500"
        />
        <StatCard
          label="Average Streak"
          shortLabel="Streak"
          value={habitStats.averageStreak}
          color="text-orange-500"
        />
      </div>

      {/* Habit List */}
      <Card className="overflow-hidden w-full max-w-full">
        <CardHeader className="p-3 sm:p-6 w-full">
          <div className="space-y-4 w-full">
            {/* Title and Description */}
            <div>
              <CardTitle className="text-lg sm:text-xl">Your Habits</CardTitle>
              <CardDescription className="text-sm mt-1">
                Track your daily and weekly habits
              </CardDescription>
            </div>

            {/* Search and Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 md:h-10 w-full"
                />
                {searchQuery && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filter and Add Button */}
              <div className="flex gap-2 shrink-0">
                {/* Mobile: Filter Toggle Button */}
                <Button
                  variant="outline"
                  size={isMobile ? "default" : "sm"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="sm:hidden h-11 flex-1"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {filterPriority !== "all" && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      1
                    </span>
                  )}
                </Button>

                {/* Desktop: Filter Dropdown */}
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="hidden sm:flex w-[140px] h-10">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>

                {HabitFormModal}
              </div>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && isMobile && (
              <Card className="p-4 border-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Frequency Filter
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowFilters(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <Select
                    value={filterPriority}
                    onValueChange={(value) => {
                      setFilterPriority(value);
                      setShowFilters(false);
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Frequencies</SelectItem>
                      <SelectItem value="daily">Daily Only</SelectItem>
                      <SelectItem value="weekly">Weekly Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-6 pt-0">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 min-h-[200px]">
            <AnimatePresence mode="sync">
              {filteredHabits.length === 0 ? (
                <div className="col-span-full text-center py-12 sm:py-16 text-muted-foreground px-4">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm sm:text-base">
                      {searchQuery || filterPriority !== "all"
                        ? "No habits match your filters"
                        : "No habits yet. Create your first habit to get started!"}
                    </p>
                    {(searchQuery || filterPriority !== "all") && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchQuery("");
                          setFilterPriority("all");
                        }}
                        className="text-sm"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                filteredHabits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      layout: { duration: 0.3 },
                    }}
                    className="group relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card to-muted/30 p-3 sm:p-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/50 w-full max-w-full"
                    onClick={() => toggleHabitCompletion(habit.id, habit.title)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="text-2xl sm:text-3xl shrink-0">
                          {habit.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm sm:text-base break-words">
                            {habit.title}
                          </h4>
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
                        className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border-2 transition-all shrink-0 ${
                            habit.completedToday
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground bg-transparent"
                          }`}
                        >
                          {habit.completedToday && (
                            <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">
                          {habit.completedToday ? "Completed" : "Mark as done"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {habit.streak}
                        </div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
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
