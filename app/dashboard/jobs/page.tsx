"use client";
import { useEffect, useState } from "react";
import { Jobs } from "@/lib/models/job.model";
import { BusinessFunctionForDropdown } from "@/lib/models/business-function.model";
import { Job, columns } from "@/components/jobs/table/columns";
import { DataTable } from "@/components/jobs/table/jobs-table";
import { JobDialog } from "@/components/jobs/job-dialog";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { completedColumns } from "@/components/jobs/table/completedColumns";
import { TasksSidebar } from "@/components/tasks/tasks-sidebar";
import { Task } from "@/components/tasks/types";

// Updated to include business functions and remove owner
function convertJobsToTableData(
  jobs: Jobs[],
  businessFunctions: BusinessFunctionForDropdown[],
): Job[] {
  return jobs.map((job) => {
    // Find the business function name if it exists
    const businessFunction = job.businessFunctionId
      ? businessFunctions.find((bf) => bf.id === job.businessFunctionId)
      : undefined;

    return {
      id: job._id,
      title: job.title,
      notes: job.notes || undefined,
      businessFunctionId: job.businessFunctionId || undefined,
      businessFunctionName: businessFunction?.name || undefined,
      dueDate: job.dueDate ? new Date(job.dueDate).toISOString() : undefined,
      isDone: job.isDone || false,
      nextTaskId: job.nextTaskId || undefined,
      tasks: job.tasks || [],
      // Owner removed as it's now derived from the next task
    };
  });
}

export default function JobsPage() {
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [businessFunctions, setBusinessFunctions] = useState<
    BusinessFunctionForDropdown[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | undefined>(undefined);
  const [selectedActiveJobs, setSelectedActiveJobs] = useState<Set<string>>(
    new Set(),
  );
  const [selectedCompletedJobs, setSelectedCompletedJobs] = useState<
    Set<string>
  >(new Set());
  const [tasksSidebarOpen, setTasksSidebarOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [taskOwnerMap, setTaskOwnerMap] = useState<Record<string, string>>({});

  const { toast } = useToast();

  // Fetch business functions
  const fetchBusinessFunctions = async () => {
    try {
      const response = await fetch("/api/business-functions");
      const result = await response.json();

      if (result.success) {
        const functions = result.data.map((bf: any) => ({
          id: bf._id,
          name: bf.name,
        }));
        setBusinessFunctions(functions);
        return functions;
      }
      return [];
    } catch (error) {
      console.error("Error fetching business functions:", error);
      return [];
    }
  };

  // New improved fetchTaskOwners function to properly map owner names
  const fetchTaskOwners = async (taskIds: string[]) => {
    if (!taskIds.length) return;
    
    try {
      // First, fetch all owners for this user
      const ownersResponse = await fetch('/api/owners');
      const ownersResult = await ownersResponse.json();
      
      let ownerMap: Record<string, string> = {};
      
      // Check the structure of the owners response
      if (Array.isArray(ownersResult)) {
        // Case 1: API returns direct array of owners
        ownersResult.forEach((owner) => {
          if (owner._id && owner.name) {
            ownerMap[owner._id] = owner.name;
          }
        });
      } else if (ownersResult.data && Array.isArray(ownersResult.data)) {
        // Case 2: API returns { data: [...owners] }
        ownersResult.data.forEach((owner: any) => {
          if (owner._id && owner.name) {
            ownerMap[owner._id] = owner.name;
          }
        });
      }
      
      // Now fetch the tasks with the owner IDs we want to map
      const queryParams = new URLSearchParams();
      taskIds.forEach(id => queryParams.append('ids', id));
      
      const tasksResponse = await fetch(`/api/tasks/batch?${queryParams.toString()}`);
      const tasksResult = await tasksResponse.json();
      
      if (!tasksResult.success && !tasksResult.data) {
        console.error('Tasks API did not return success or data');
        return;
      }
      
      const tasks = tasksResult.data || tasksResult;
      
      // Map task IDs to owner names
      const taskOwnerMapping: Record<string, string> = {};
      
      tasks.forEach((task: any) => {
        // In your system, task.owner should be the owner ID
        if (task.owner && typeof task.owner === 'string') {
          // Look up the owner name from our previously built map
          taskOwnerMapping[task.id] = ownerMap[task.owner] || 'Not assigned';
        } else {
          taskOwnerMapping[task.id] = 'Not assigned';
        }
      });
      
      // Update the state with our new mapping
      setTaskOwnerMap(taskOwnerMapping);
      
    } catch (error) {
      console.error('Error creating task owner mapping:', error);
    }
  };

  // Function to handle active job selection
  const handleActiveSelect = (jobId: string, checked: boolean) => {
    setSelectedActiveJobs((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  // Function to handle completed job selection
  const handleCompletedSelect = (jobId: string, checked: boolean) => {
    setSelectedCompletedJobs((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(jobId);
      } else {
        newSet.delete(jobId);
      }
      return newSet;
    });
  };

  // Function to mark selected active jobs as done
  const handleMarkAsDone = async () => {
    try {
      const jobIds = Array.from(selectedActiveJobs);

      // Make API call to update all selected jobs
      const promises = jobIds.map((id) =>
        fetch(`/api/jobs/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isDone: true }),
        }),
      );

      await Promise.all(promises);

      // Move selected jobs from active to completed
      const jobsToMove = activeJobs.filter((job) =>
        selectedActiveJobs.has(job.id),
      );
      const updatedJobs = jobsToMove.map((job) => ({ ...job, isDone: true }));

      setActiveJobs((prev) =>
        prev.filter((job) => !selectedActiveJobs.has(job.id)),
      );
      setCompletedJobs((prev) => [...prev, ...updatedJobs]);

      // Clear selection
      setSelectedActiveJobs(new Set());

      toast({
        title: "Success",
        description: "Selected jobs marked as complete",
      });
    } catch (error) {
      console.error("Error marking jobs as done:", error);
      toast({
        title: "Error",
        description: "Failed to update jobs",
        variant: "destructive",
      });
    }
  };

  // Function to mark selected completed jobs as active
  const handleMarkAsActive = async () => {
    try {
      const jobIds = Array.from(selectedCompletedJobs);

      // Make API call to update all selected completed jobs
      const promises = jobIds.map((id) =>
        fetch(`/api/jobs/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isDone: false }),
        }),
      );

      await Promise.all(promises);

      // Move selected jobs from completed to active
      const jobsToMove = completedJobs.filter((job) =>
        selectedCompletedJobs.has(job.id),
      );
      const updatedJobs = jobsToMove.map((job) => ({ ...job, isDone: false }));

      setCompletedJobs((prev) =>
        prev.filter((job) => !selectedCompletedJobs.has(job.id)),
      );
      setActiveJobs((prev) => [...prev, ...updatedJobs]);

      // Clear selection
      setSelectedCompletedJobs(new Set());

      toast({
        title: "Success",
        description: "Selected jobs moved back to active",
      });
    } catch (error) {
      console.error("Error marking jobs as active:", error);
      toast({
        title: "Error",
        description: "Failed to update jobs",
        variant: "destructive",
      });
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);

      // First fetch business functions
      const bfResponse = await fetch("/api/business-functions");
      const bfResult = await bfResponse.json();

      let currentBusinessFunctions = [];
      if (bfResult.success) {
        currentBusinessFunctions = bfResult.data.map((bf: any) => ({
          id: bf._id,
          name: bf.name,
        }));
        // Update state for later use
        setBusinessFunctions(currentBusinessFunctions);
      }

      // Then fetch jobs
      const jobsResponse = await fetch("/api/jobs");
      const jobsResult = await jobsResponse.json();

      if (jobsResult.success) {
        // Collect all next task IDs to fetch their owners
        const taskIds = jobsResult.data
          .filter((job: any) => job.nextTaskId)
          .map((job: any) => job.nextTaskId);
        
        // Fetch task owners if any tasks exist
        if (taskIds.length > 0) {
          fetchTaskOwners(taskIds);
        }
        
        // Use the business functions we just fetched
        const allJobs = convertJobsToTableData(
          jobsResult.data,
          currentBusinessFunctions,
        );
        
        // Separate active and completed jobs
        setActiveJobs(allJobs.filter((job) => !job.isDone));
        setCompletedJobs(allJobs.filter((job) => job.isDone));
      } else {
        setError(jobsResult.error);
      }
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreate = async (jobData: Partial<Job>) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...jobData,
          // Ensure we're sending businessFunctionId, not businessFunctionName
          businessFunctionId: jobData.businessFunctionId,
          // No need to send owner as it's derived from the next task
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Job created successfully",
        });
        fetchJobs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (jobData: Partial<Job>) => {
    if (!editingJob) return;

    try {
      const response = await fetch(`/api/jobs/${editingJob.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...jobData,
          // Ensure we're sending businessFunctionId, not businessFunctionName
          businessFunctionId: jobData.businessFunctionId,
          // No need to send owner as it's derived from the next task
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Job updated successfully",
        });
        fetchJobs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Job deleted successfully",
        });
        fetchJobs();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (job: Job) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingJob(undefined);
    setDialogOpen(true);
  };

  // New function to handle opening the tasks sidebar
  const handleOpenTasksSidebar = (job: Job) => {
    setSelectedJob(job);
    setTasksSidebarOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-lg">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-lg text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch("/api/jobs/calculate-impact", {
                    method: "POST",
                  });
                  const result = await response.json();

                  if (result.success) {
                    toast({
                      title: "Success",
                      description: `${result.message}`,
                    });
                    fetchJobs(); // Refresh jobs to show updated impact values
                  } else {
                    throw new Error(result.error);
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to calculate job impact values",
                    variant: "destructive",
                  });
                }
              }}
            >
              Recalculate Impact
            </Button>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create Job
            </Button>
          </div>
        </div>

        <DataTable
          columns={columns(handleOpenEdit, handleDelete, handleActiveSelect, handleOpenTasksSidebar, taskOwnerMap)}
          data={activeJobs}
        />

        <div className="mt-16 mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Completed Jobs</h2>
        </div>

        <DataTable
          columns={completedColumns(
            handleOpenEdit,
            handleDelete,
            handleCompletedSelect,
            handleOpenTasksSidebar,
            taskOwnerMap
          )}
          data={completedJobs}
        />

        <JobDialog
          mode={editingJob ? "edit" : "create"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={editingJob ? handleEdit : handleCreate}
          initialData={editingJob}
        />

        <TasksSidebar
          open={tasksSidebarOpen}
          onOpenChange={setTasksSidebarOpen}
          selectedJob={selectedJob}
          onRefreshJobs={fetchJobs}
        />

        {/* Toast for active jobs selection */}
        {selectedActiveJobs.size > 0 && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
            <span className="text-sm font-medium">
              {selectedActiveJobs.size}{" "}
              {selectedActiveJobs.size === 1 ? "job" : "jobs"} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedActiveJobs(new Set())}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleMarkAsDone}>
              Mark as Done
            </Button>
          </div>
        )}

        {/* Toast for completed jobs selection */}
        {selectedCompletedJobs.size > 0 && (
          <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
            <span className="text-sm font-medium">
              {selectedCompletedJobs.size}{" "}
              {selectedCompletedJobs.size === 1 ? "job" : "jobs"} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedCompletedJobs(new Set())}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleMarkAsActive}>
              <ArrowUp className="mr-2 h-4 w-4" />
              Move to Active
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}