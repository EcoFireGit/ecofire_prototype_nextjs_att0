// lib/models/qbo.model.ts
import mongoose from "mongoose";

// lib/models/qbo.model.ts
export interface JobPiMapping extends mongoose.Document {
  _id: string;
  jobId: string;
  piId: string;
  jobName: string;
  piName: string;
  piImpactValue: number;
  piTarget: number; // Added field
  notes?: string;
  userId: string;
}

const MappingJobToPISchema = new mongoose.Schema<JobPiMapping>({
  userId: {
    type: String,
    required: [true, "User ID is required"],
    index: true
  },
  jobId: {
    type: String,
    required: [true, "Please provide the job you want to map to"],
  },
  piId: {
    type: String,
    required: true,
  },
  piName: {
    type: String,
    required: true,
  },
  jobName: {
    type: String,
    required: true,
  },
  piImpactValue: {
    type: Number,
    required: [true, "Please provide a current value."],
    default: 0
  },
  piTarget: {  
    type: Number,
    required: false,
    default: 0
  },
  notes: {
    type: String,
    required: false,
  }
});

export default mongoose.models.MappingJobToPI || mongoose.model<JobPiMapping>("MappingJobToPI", MappingJobToPISchema);