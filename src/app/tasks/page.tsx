"use client";

import { TaskCard } from "@/components/TaskCard/TaskCard";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence } from "framer-motion";
import { Filter, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import Spinner from "@/components/Spinner/Spinner";
import StatCard from "@/components/stat-card/StatCard";
import {
  CreateTaskAction,
  DeleteTaskAction,
  GetAllTaskAction,
  UpdateTaskAction,
} from "../../../actions/tasks";
import { createClient } from "../../../lib/supabase/client";
import { ITasks } from "../../../type/index.tasks";

const TaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  priority: z.enum(["low", "medium", "high"], {
    required_error: "Priority is required",
  }),
  due_date: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["pending", "completed", "canceled"]),
});

type TaskFormData = z.infer<typeof TaskSchema>;

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

// Task Form Component (reusable for both Dialog and Drawer)
function TaskForm({
  type,
  onSubmit,
  register,
  handleSubmit,
  errors,
  isCreating,
  priority,
  setValue,
}: {
  type: "add" | "edit";
  onSubmit: (data: TaskFormData) => void;
  register: any;
  handleSubmit: any;
  errors: any;
  isCreating: boolean;
  priority: string;
  setValue: any;
}) {
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="e.g. Review reports"
          className="h-11"
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={priority}
          onValueChange={(value) =>
            setValue("priority", value as "low" | "medium" | "high")
          }
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-sm text-red-500">{errors.priority.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="datetime-local"
          {...register("due_date")}
          className="h-11"
        />
        {errors.due_date && (
          <p className="text-sm text-red-500">{errors.due_date.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          {...register("category")}
          placeholder="e.g. Work, Personal"
          className="h-11"
        />
        {errors.category && (
          <p className="text-sm text-red-500">{errors.category.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          {...register("description")}
          placeholder="Add details..."
          className="h-11"
        />
      </div>
      <Button type="submit" disabled={isCreating} className="h-11 ">
        {isCreating ? "Saving..." : type === "add" ? "Add Task" : "Update Task"}
      </Button>
    </form>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ITasks[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITasks | null>(null);
  const [type, setType] = useState<"add" | "edit">("add");
  const [showFilters, setShowFilters] = useState(false);

  const isMobile = useIsMobile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskSchema),
    defaultValues: {
      title: "",
      priority: "low",
      due_date: "",
      description: "",
      category: "",
      status: "pending",
    },
  });

  const supabase = createClient();
  const priority = watch("priority");

  // Reset form when modal opens/closes or type changes
  useEffect(() => {
    if (type === "edit" && selectedTask) {
      const formattedDate = selectedTask.due_date
        ? new Date(selectedTask.due_date).toISOString().slice(0, 16)
        : "";

      reset({
        title: selectedTask.title,
        priority: selectedTask.priority as "low" | "medium" | "high",
        due_date: formattedDate,
        description: selectedTask.description || "",
        category: selectedTask.category,
        status: selectedTask.status,
      });
    } else {
      reset({
        title: "",
        priority: "low",
        due_date: "",
        description: "",
        category: "",
        status: "pending",
      });
    }
  }, [type, selectedTask, reset]);

  // Handle form submission
  const onSubmit = async (data: TaskFormData) => {
    setIsCreating(true);
    try {
      if (type === "add") {
        const res = await CreateTaskAction(data);
        if (res.success) {
          toast.success(res.message);
          setIsAddTaskOpen(false);
          reset();
        } else {
          toast.error(res.message || "Failed to create task");
        }
      } else if (type === "edit" && selectedTask) {
        const res = await UpdateTaskAction(data, selectedTask.id);
        if (res.success) {
          toast.success(res.message);
          setIsAddTaskOpen(false);
          reset();
          setSelectedTask(null);
        } else {
          toast.error(res.message || "Failed to update task");
        }
      }
    } catch (err: any) {
      console.error("Error submitting task:", err);
      toast.error("Something went wrong.");
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit button click
  const handleEdit = (task: ITasks) => {
    setType("edit");
    setSelectedTask(task);
    setIsAddTaskOpen(true);
  };

  // Handle add button click
  const handleAdd = () => {
    setType("add");
    setSelectedTask(null);
    reset();
    setIsAddTaskOpen(true);
  };

  // Toggle task status
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";

    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error toggling task:", error);
        toast.error("Failed to update task");
      } else {
        toast.success("Task Completed");
      }
    } catch (error) {
      console.error("Error toggling task:", error);
      toast.error("Something went wrong");
    }
  };

  // Delete task
  const deleteTask = async (id: string) => {
    try {
      const res = await DeleteTaskAction(id);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to delete task");
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast.error("Something went wrong");
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  // Calculate task stats
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  // Fetch initial tasks
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTask(true);
      try {
        const res = await GetAllTaskAction();
        if (res.success && res.data) {
          setTasks(res.data);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoadingTask(false);
      }
    };
    fetchData();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          console.log("Real-time update:", payload);

          switch (payload.eventType) {
            case "INSERT":
              setTasks((prev) => {
                if (prev.some((t) => t.id === payload.new.id)) return prev;
                return [payload.new as ITasks, ...prev];
              });
              break;
            case "UPDATE":
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === payload.new.id ? (payload.new as ITasks) : t
                )
              );
              break;
            case "DELETE":
              setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Handle dialog/drawer close
  const handleDialogChange = (open: boolean) => {
    setIsAddTaskOpen(open);
    if (!open) {
      reset();
      setSelectedTask(null);
      setType("add");
    }
  };

  if (isLoadingTask) {
    return <Spinner title="Loading tasks..." />;
  }

  const TaskFormModal = isMobile ? (
    <Drawer open={isAddTaskOpen} onOpenChange={handleDialogChange}>
      <DrawerTrigger asChild>
        <Button
          size={isMobile ? "default" : "sm"}
          onClick={handleAdd}
          className="h-11 md:h-9"
        >
          <Plus className="h-4 w-4 md:mr-2" />
          <span className="hidden sm:inline">Add Task</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {type === "add" ? "Add New Task" : "Update Your Task"}
            </DrawerTitle>
            <DrawerDescription>
              {type === "add"
                ? "Create a new task to stay organized"
                : "Update your task details"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <TaskForm
              type={type}
              onSubmit={onSubmit}
              register={register}
              handleSubmit={handleSubmit}
              errors={errors}
              isCreating={isCreating}
              priority={priority}
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
    <Dialog open={isAddTaskOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === "add" ? "Add New Task" : "Update Your Task"}
          </DialogTitle>
        </DialogHeader>
        <TaskForm
          type={type}
          onSubmit={onSubmit}
          register={register}
          handleSubmit={handleSubmit}
          errors={errors}
          isCreating={isCreating}
          priority={priority}
          setValue={setValue}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4 sm:space-y-6  sm:p-4 md:p-6 mx-auto max-w-7xl w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your daily tasks and to-dos
        </p>
      </div>

      {/* Task Stats - Responsive Grid */}
      <div className="grid gap-1.5 sm:gap-2 md:gap-3 grid-cols-3 w-full">
        <StatCard
          label="Total Tasks"
          shortLabel="Total"
          value={taskStats.total}
        />
        <StatCard
          label="Completed"
          shortLabel="Done"
          value={taskStats.completed}
          color="text-green-500"
        />
        <StatCard
          label="Pending"
          shortLabel="Pending"
          value={taskStats.pending}
          color="text-orange-500"
        />
      </div>

      {/* Task List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <CardTitle className="text-lg sm:text-xl">Your Tasks</CardTitle>
              <CardDescription className="text-sm mt-1">
                Keep track of everything you need to do
              </CardDescription>
            </div>

            {/* Search and Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 md:h-10"
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
              <div className="flex gap-2">
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
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                {TaskFormModal}
              </div>
            </div>

            {/* Mobile Filter Panel */}
            {showFilters && isMobile && (
              <Card className="p-4 border-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Priority Filter
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
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="high">High Priority</SelectItem>
                      <SelectItem value="medium">Medium Priority</SelectItem>
                      <SelectItem value="low">Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-6 pt-0">
          <ScrollArea className="h-[calc(100vh-28rem)] sm:h-[500px]">
            <div className="space-y-2 sm:space-y-3 pr-2 sm:pr-4">
              <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 sm:py-16 text-muted-foreground px-4">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm sm:text-base">
                        {searchQuery || filterPriority !== "all"
                          ? "No tasks match your filters"
                          : "No tasks found. Create your first task to get started!"}
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
                  filteredTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onDelete={deleteTask}
                      onToggle={toggleTask}
                      handleEdit={handleEdit}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
