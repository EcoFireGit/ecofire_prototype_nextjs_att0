"use client";

import { Button } from "@/components/ui/button";
import { ListTodo } from "lucide-react";
import { Job } from "@/components/jobs/table/columns";

interface TasksButtonProps {
  job: Job;
  onOpenTasksSidebar: (job: Job) => void;
}

export function TasksButton({ job, onOpenTasksSidebar }: TasksButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="default" 
      onClick={() => onOpenTasksSidebar(job)}
      title="Manage Tasks"
    >
      <span>Tasks</span><ListTodo className="h-4 w-4" />
    </Button>
  );
}