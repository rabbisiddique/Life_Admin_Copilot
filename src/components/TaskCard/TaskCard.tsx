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
  handleEdit: (task: ITasks) => void;
}

export function TaskCard({
  task,
  index,
  onToggle,
  onDelete,
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
      className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-border bg-card p-2 sm:p-3 transition-all hover:shadow-md cursor-pointer hover:border-primary/50 w-full max-w-full ${
        task.status === "canceled" ? "opacity-60" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task.id);
      }}
    >
      {/* Mobile Layout: Vertical stacking */}
      <div className="flex items-start gap-2 sm:gap-3 w-full min-w-0">
        {/* Checkbox */}
        <div className="flex h-5 w-5 items-center justify-center shrink-0 mt-0.5">
          {task.status === "completed" ? (
            <Check className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-semibold text-sm sm:text-base break-words ${
              task.status === "completed" ? "line-through" : ""
            }`}
          >
            {task.title}
          </h4>

          {/* Meta information */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground mt-1">
            {task.due_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                <span className="whitespace-nowrap">
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <span className="capitalize">{task.category}</span>
          </div>
        </div>

        {/* Priority Badge - Mobile: Top Right */}
        <Badge
          variant="secondary"
          className={`${getPriorityColor(task.priority)} shrink-0 sm:hidden`}
        >
          <Flag className="h-3 w-3 sm:mr-1" />
          <span className="hidden xs:inline ml-1">{task.priority}</span>
        </Badge>
      </div>

      {/* Desktop: Priority Badge and Actions on the right */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
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
          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-primary hover:bg-primary/10"
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

      {/* Mobile: Action Buttons at Bottom */}
      <div className="flex sm:hidden items-center gap-2 ml-8">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(task);
          }}
          className="h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Edit
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
}
