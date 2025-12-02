"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Calendar, Check, Circle, Edit2, Flag, Trash2 } from "lucide-react";
import { ITasks } from "../../../type/index.tasks";

interface TaskCardProps {
  task: any;
  index: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: any) => void;
  // setIsAddTaskOpen: ();
}

export function TaskCard({
  task,
  index,
  onToggle,
  onDelete,
  onEdit,
  setSelectedTask,
  handleEdit,
}: TaskCardProps) {
  const getPriorityColor = (priority: ITasks["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
    }
  };

  return (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className={`group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer hover:border-primary/50 ${
        task.status === "canceled" ? "opacity-60" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task.id);
      }}
    >
      <div className="flex h-5 w-5 items-center justify-center">
        {task.status === "completed" ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1">
        <h4
          className={`font-semibold ${
            task.status === "completed" ? "line-through" : ""
          }`}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.due_date).toLocaleDateString()}</span>
            </div>
          )}
          <span className="capitalize">{task.category}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary" className={getPriorityColor(task.priority)}>
          <Flag className="mr-1 h-3 w-3" />
          {task.priority}
        </Badge>

        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(task);
          }}
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
