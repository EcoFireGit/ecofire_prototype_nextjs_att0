"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { TasksTable } from "./table/tasks-table";
import { columns } from "./table/columns";
import { TaskDialog } from "./tasks-dialog";
import { Task } from "./types";
import { Job } from "@/components/jobs/table/columns";
import { useToast } from "@/hooks/use-toast";
import { NextTaskSelector } from "./next-task-selector";

// Owner interface
interface Owner {
  _id: string;
  name: string;
  userId: string;
}

interface TasksSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedJob: Job | null;
  onRefreshJobs?: () => void; // Simple callback to refresh jobs data
}

export function TasksSidebar({
  open,
  onOpenChange,
  selectedJob,
  onRefreshJobs,
}: TasksSidebarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [nextTaskId, setNextTaskId] = useState<string | undefined>(undefined);

  const { toast } = useToast();

  // Fetch owners from API
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await fetch("/api/owners");

        if (!response.ok) {
          throw new Error(`Failed to fetch owners: ${response.status}`);
        }

        const ownersData = await response.json();
        setOwners(ownersData);

        // Create a mapping from owner ID to owner name
        const mapping: Record<string, string> = {};
        ownersData.forEach((owner: Owner) => {
          mapping[owner._id] = owner.name;
        });
        setOwnerMap(mapping);
      } catch (error) {
        console.error("Error fetching owners:", error);
        toast({
          title: "Error",
          description: "Failed to fetch owners list",
          variant: "destructive",
        });
      }
    };

    fetchOwners();
  }, [toast]);

  // Fetch tasks when job changes
  useEffect(() => {
    if (selectedJob) {
      fetchTasks();
      // Set the next task ID from the job
      setNextTaskId(selectedJob.nextTaskId);
    } else {
      setTasks([]);
      setNextTaskId(undefined);
    }
  }, [selectedJob]);

  const fetchTasks = async () => {
    if (!selectedJob) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tasks?jobId=${selectedJob.id}`);
      const result = await response.json();

      if (result.success) {
        // Map from MongoDB _id to id for frontend consistency
        const formattedTasks = result.data.map((task: any) => ({
          id: task._id,
          title: task.title,
          owner: task.owner,
          date: task.date,
          requiredHours: task.requiredHours,
          focusLevel: task.focusLevel,
          joyLevel: task.joyLevel,
          notes: task.notes,
          tags: task.tags || [],
          jobId: task.jobId,
          completed: task.completed,
          isNextTask: task._id === selectedJob.nextTaskId,
        }));

        setTasks(formattedTasks);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tasks",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tasks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = () => {
    setDialogMode("create");
    setCurrentTask(undefined);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setDialogMode("edit");
    setCurrentTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // If the deleted task was the next task, we need to update the job
        if (id === nextTaskId) {
          await updateJobNextTask("none");
        }

        setTasks(tasks.filter((task) => task.id !== id));
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      });

      const result = await response.json();

      if (result.success) {
        // If the completed task was the next task, we need to update the job
        if (completed && id === nextTaskId) {
          // Clear the next task since it's now completed
          await updateJobNextTask("none");
        }

        setTasks(
          tasks.map((task) => (task.id === id ? { ...task, completed } : task))
        );
      } else {
        toast({
          title: "Error",
          description: "Failed to update task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleNextTaskChange = async (taskId: string): Promise<void> => {
    if (!selectedJob) return;

    try {
      // Update the job with the new next task ID
      const taskIdToSave = taskId === "none" ? null : taskId;

      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nextTaskId: taskIdToSave }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Update local state
      setNextTaskId(taskIdToSave || undefined);

      // Update isNextTask flag for all tasks
      setTasks(
        tasks.map((task) => ({
          ...task,
          isNextTask: task.id === taskIdToSave,
        }))
      );

      // Call onRefreshJobs to trigger a refresh of all jobs data
      if (typeof onRefreshJobs === "function") {
        onRefreshJobs();
      }

      toast({
        title: "Success",
        description: "Next task updated successfully",
      });
    } catch (error) {
      console.error("Error updating next task:", error);
      toast({
        title: "Error",
        description: "Failed to update next task",
        variant: "destructive",
      });
    }
  };

  const updateJobNextTask = async (taskId: string): Promise<void> => {
    if (!selectedJob) return;

    try {
      const taskIdToSave = taskId === "none" ? null : taskId;

      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nextTaskId: taskIdToSave }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setNextTaskId(taskIdToSave || undefined);

        // Update isNextTask flag for all tasks
        setTasks(
          tasks.map((task) => ({
            ...task,
            isNextTask: task.id === taskIdToSave,
          }))
        );
      } else {
        throw new Error(result.error || "Failed to update next task");
      }
    } catch (error) {
      console.error("Error updating next task:", error);
      throw error;
    }
  };

  const handleTaskSubmit = async (taskData: Partial<Task>) => {
    try {
      // Make sure tags is always defined as an array
      const processedTaskData = {
        ...taskData,
        tags: taskData.tags || [],
      };

      if (dialogMode === "create") {
        // Create new task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processedTaskData),
        });

        const result = await response.json();

        if (result.success) {
          // Map from MongoDB _id to id for frontend consistency
          const newTask: Task = {
            id: result.data._id,
            title: result.data.title,
            owner: result.data.owner,
            date: result.data.date,
            requiredHours: result.data.requiredHours,
            focusLevel: result.data.focusLevel,
            joyLevel: result.data.joyLevel,
            notes: result.data.notes,
            tags: result.data.tags || [],
            jobId: result.data.jobId,
            completed: result.data.completed,
            isNextTask: false,
          };

          // Add task ID to job's tasks array
          if (selectedJob) {
            await updateJobTasks([...tasks.map((t) => t.id), newTask.id]);
          }

          setTasks([...tasks, newTask]);
          toast({
            title: "Success",
            description: "Task created successfully",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create task",
            variant: "destructive",
          });
        }
      } else {
        // Update existing task
        if (!currentTask) return;

        const response = await fetch(`/api/tasks/${currentTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(processedTaskData),
        });

        const result = await response.json();

        if (result.success) {
          // Map from MongoDB _id to id for frontend consistency
          const updatedTask: Task = {
            id: result.data._id,
            title: result.data.title,
            owner: result.data.owner,
            date: result.data.date,
            requiredHours: result.data.requiredHours,
            focusLevel: result.data.focusLevel,
            joyLevel: result.data.joyLevel,
            notes: result.data.notes,
            tags: result.data.tags || [],
            jobId: result.data.jobId,
            completed: result.data.completed,
            isNextTask: result.data._id === nextTaskId,
          };

          setTasks(
            tasks.map((task) =>
              task.id === updatedTask.id ? updatedTask : task
            )
          );

          toast({
            title: "Success",
            description: "Task updated successfully",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update task",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting task:", error);
      toast({
        title: "Error",
        description: "Failed to submit task",
        variant: "destructive",
      });
    }
  };

  const updateJobTasks = async (taskIds: string[]): Promise<void> => {
    if (!selectedJob) return;

    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tasks: taskIds }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update job tasks");
      }
    } catch (error) {
      console.error("Error updating job tasks:", error);
      throw error;
    }
  };

  if (!selectedJob) {
    return null;
  }

  // Sort tasks to show the next task first
  const sortedTasks = [...tasks].sort((a, b) => {
    // If a is the next task, it comes first
    if (a.isNextTask) return -1;
    // If b is the next task, it comes first
    if (b.isNextTask) return 1;
    // Otherwise, keep the original order
    return 0;
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl overflow-y-auto"
          side="right"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>Job Tasks</SheetTitle>
            <SheetDescription>Manage tasks for this job</SheetDescription>
          </SheetHeader>

          {/* Job Details Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{selectedJob.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedJob.notes && (
                <div>
                  <p className="text-sm font-medium">Notes:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.notes}
                  </p>
                </div>
              )}
              {selectedJob.businessFunctionName && (
                <div>
                  <p className="text-sm font-medium">Business Function:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedJob.businessFunctionName}
                  </p>
                </div>
              )}
              {selectedJob.dueDate && (
                <div>
                  <p className="text-sm font-medium">Due Date:</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedJob.dueDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Next Task Selector */}
          {tasks.length > 0 && (
            <NextTaskSelector
              tasks={tasks}
              onNextTaskChange={handleNextTaskChange}
              currentNextTaskId={nextTaskId}
            />
          )}

          {/* Add Task Button */}
          <div className="mb-4">
            <Button onClick={handleAddTask} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>

          {/* Tasks Table */}
          {isLoading ? (
            <div className="flex justify-center p-8">
              <p>Loading tasks...</p>
            </div>
          ) : (
            <TasksTable
              columns={columns(
                handleEditTask,
                handleDeleteTask,
                handleCompleteTask,
                ownerMap
              )}
              data={sortedTasks}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Task Dialog for creating/editing tasks */}
      <TaskDialog
        mode={dialogMode}
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={handleTaskSubmit}
        initialData={currentTask}
        jobId={selectedJob.id}
      />
    </>
  );
}
