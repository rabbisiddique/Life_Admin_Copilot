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
import { Filter, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import Spinner from "@/components/Spinner/Spinner";
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<ITasks[]>([]);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ITasks | null>(null);
  const [type, setType] = useState<"add" | "edit">("add");

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
      // Format the date for datetime-local input
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
      const { data, error } = await supabase
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
        // The real-time subscription will handle updating the state
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
                // Avoid duplicates
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

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setIsAddTaskOpen(open);
    if (!open) {
      // Reset form when closing
      reset();
      setSelectedTask(null);
      setType("add");
    }
  };

  if (isLoadingTask) {
    return <Spinner title="Loading tasks..." />;
  }

  return (
    <div className="space-y-6 p-6 mx-auto max-w-7xl">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Manage your daily tasks and to-dos
        </p>
      </div>

      {/* Task Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {taskStats.completed}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-card to-muted/50 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {taskStats.pending}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>
                Keep track of everything you need to do
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[140px]">
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
              <Dialog open={isAddTaskOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {type === "add" ? "Add New Task" : "Update Your Task"}
                    </DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="grid gap-4 py-4"
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="title">Task Title</Label>
                      <Input
                        id="title"
                        {...register("title")}
                        placeholder="e.g. Review reports"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">
                          {errors.title.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={priority}
                        onValueChange={(value) =>
                          setValue(
                            "priority",
                            value as "low" | "medium" | "high"
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-sm text-red-500">
                          {errors.priority.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="datetime-local"
                        {...register("due_date")}
                      />
                      {errors.due_date && (
                        <p className="text-sm text-red-500">
                          {errors.due_date.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        {...register("category")}
                        placeholder="e.g. Work, Personal"
                      />
                      {errors.category && (
                        <p className="text-sm text-red-500">
                          {errors.category.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">
                        Description (Optional)
                      </Label>
                      <Input
                        id="description"
                        {...register("description")}
                        placeholder="Add details..."
                      />
                    </div>

                    <Button type="submit" disabled={isCreating}>
                      {isCreating
                        ? "Saving..."
                        : type === "add"
                        ? "Add Task"
                        : "Update Task"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>
                      No tasks found. Create your first task to get started!
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onDelete={deleteTask}
                      onToggle={toggleTask}
                      setSelectedTask={setSelectedTask}
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
