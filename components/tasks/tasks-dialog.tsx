// components/tasks/task-dialog.tsx

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Task, FocusLevel, JoyLevel } from "./types";

interface TaskDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Task;
  jobId: string;
  owners?: string[]; // List of available owners
}

export function TaskDialog({
  mode,
  open,
  onOpenChange,
  onSubmit,
  initialData,
  jobId,
  owners = [],
}: TaskDialogProps) {
  // Form state with typed fields
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<string | undefined>(undefined);
  const [requiredHours, setRequiredHours] = useState<number | undefined>(undefined);
  const [focusLevel, setFocusLevel] = useState<FocusLevel | undefined>(undefined);
  const [joyLevel, setJoyLevel] = useState<JoyLevel | undefined>(undefined);
  const [notes, setNotes] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form when the dialog opens or the initial data changes
  useEffect(() => {
    if (mode === "create") {
      // Reset for create mode
      setTitle("");
      setOwner(undefined);
      setDate(undefined);
      setRequiredHours(undefined);
      setFocusLevel(undefined);
      setJoyLevel(undefined);
      setNotes(undefined);
    } else if (initialData) {
      // Set data for edit mode
      setTitle(initialData.title);
      setOwner(initialData.owner);
      
      // Format date for input field
      if (initialData.date) {
        setDate(new Date(initialData.date).toISOString().split("T")[0]);
      } else {
        setDate(undefined);
      }
      
      setRequiredHours(initialData.requiredHours);
      setFocusLevel(initialData.focusLevel);
      setJoyLevel(initialData.joyLevel);
      setNotes(initialData.notes);
    }
  }, [mode, initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Build task object from form fields
      const task: Partial<Task> = {
        title,
        jobId,
      };

      // Only add optional fields if they have values
      if (owner) task.owner = owner;
      if (date) task.date = `${date}T00:00:00.000Z`;
      if (requiredHours !== undefined) task.requiredHours = requiredHours;
      if (focusLevel) task.focusLevel = focusLevel;
      if (joyLevel) task.joyLevel = joyLevel;
      if (notes) task.notes = notes;

      await onSubmit(task);
      onOpenChange(false);
      
      // Reset form if creating new task
      if (mode === "create") {
        setTitle("");
        setOwner(undefined);
        setDate(undefined);
        setRequiredHours(undefined);
        setFocusLevel(undefined);
        setJoyLevel(undefined);
        setNotes(undefined);
      }
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Task" : "Edit Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Title Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            {/* Owner Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">
                Owner
              </Label>
              <div className="col-span-3">
                <Select
                  value={owner || "none"}
                  onValueChange={(value) => setOwner(value === "none" ? undefined : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {owners.map((ownerName) => (
                      <SelectItem key={ownerName} value={ownerName}>
                        {ownerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Do Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date || ""}
                onChange={(e) => setDate(e.target.value || undefined)}
                className="col-span-3"
              />
            </div>

            {/* Required Hours Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requiredHours" className="text-right">
                Hours Required
              </Label>
              <Input
                id="requiredHours"
                type="number"
                min="0"
                step="0.5"
                value={requiredHours === undefined ? "" : requiredHours}
                onChange={(e) => {
                  const value = e.target.value;
                  setRequiredHours(value === "" ? undefined : parseFloat(value));
                }}
                className="col-span-3"
              />
            </div>

            {/* Focus Level Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="focusLevel" className="text-right">
                Focus Level
              </Label>
              <div className="col-span-3">
                <Select
                  value={focusLevel || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setFocusLevel(undefined);
                    } else {
                      setFocusLevel(value as FocusLevel);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select focus level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value={FocusLevel.High}>{FocusLevel.High}</SelectItem>
                    <SelectItem value={FocusLevel.Medium}>{FocusLevel.Medium}</SelectItem>
                    <SelectItem value={FocusLevel.Low}>{FocusLevel.Low}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Joy Level Field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="joyLevel" className="text-right">
                Joy Level
              </Label>
              <div className="col-span-3">
                <Select
                  value={joyLevel || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      setJoyLevel(undefined);
                    } else {
                      setJoyLevel(value as JoyLevel);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select joy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value={JoyLevel.High}>{JoyLevel.High}</SelectItem>
                    <SelectItem value={JoyLevel.Medium}>{JoyLevel.Medium}</SelectItem>
                    <SelectItem value={JoyLevel.Low}>{JoyLevel.Low}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes Field */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes || ""}
                onChange={(e) => setNotes(e.target.value || undefined)}
                className="col-span-3 min-h-[100px]"
                placeholder="Add any notes for this task..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : mode === "create"
                ? "Add Task"
                : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}