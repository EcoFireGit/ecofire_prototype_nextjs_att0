import mongoose from "mongoose";
export enum FocusLevel {
  High = "High",
  Medium = "Medium",
  Low = "Low"
}
export enum JoyLevel {
  High = "High",
  Medium = "Medium",
  Low = "Low"
}
export interface Task extends mongoose.Document {
  _id: string;
  title: string;
  owner?: string;
  date?: Date;
  requiredHours?: number;
  focusLevel?: FocusLevel;
  joyLevel?: JoyLevel;
  notes?: string;
  tags?: string[];
  jobId: string;
  userId: string;
  completed: boolean;
  nextTask: boolean; // New property to mark task as next
}
const TaskSchema = new mongoose.Schema<Task>({
  title: {
    type: String,
    required: [true, "Please provide a title for this Task."],
  },
  owner: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: false,
  },
  requiredHours: {
    type: Number,
    required: false,
  },
  focusLevel: {
    type: String,
    enum: Object.values(FocusLevel),
    required: false,
  },
  joyLevel: {
    type: String,
    enum: Object.values(JoyLevel),
    required: false,
  },
  notes: {
    type: String,
    required: false,
  },
  tags: {
    type: [String],
    default: [],
    required: false,
  },
  jobId: {
    type: String,
    required: [true, "Job ID is required"],
    index: true
  },
  userId: {
    type: String,
    required: [true, "User ID is required"],
    index: true
  },
  completed: {
    type: Boolean,
    default: false,
    required: true
  },
  nextTask: {
    type: Boolean,
    default: false,
    required: true
  }
});

// Create a compound index to ensure only one task per job is marked as next
TaskSchema.index({ jobId: 1, nextTask: 1 }, { 
  unique: true,
  partialFilterExpression: { nextTask: true }
});

export default mongoose.models.Task || mongoose.model<Task>("Task", TaskSchema);