// lib/models/qbo.model.ts
import mongoose from "mongoose";

export interface QBOs extends mongoose.Document {
  _id: string;
  name: string;
  unit: string;
  beginningValue: number;
  currentValue: number;
  targetValue: number;
  deadline: Date;
  points: number;
  notes?: string;
  userId: string;
}

/* QBOSchema will correspond to a collection in your MongoDB database. */
const QBOSchema = new mongoose.Schema<QBOs>({
  userId: {
    type: String,
    required: [true, "User ID is required"],
    index: true // Add index for better query performance
  },
  name: {
    type: String,
    required: [true, "Please provide a name for this QBO."],
  },
  unit: {
    type: String,
    required: false,
  },
  beginningValue: {
    type: Number,
    required: [true, "Please provide a beginning value."],
    default: 0
  },
  currentValue: {
    type: Number,
    required: [true, "Please provide a current value."],
    default: 0
  },
  targetValue: {
    type: Number,
    required: [true, "Please provide a target value."],
  },
  deadline: {
    type: Date,
    required: [true, "Please provide a deadline."],
  },
  points: {
    type: Number,
    required: [true, "Please provide points value."],
  },
  notes: {
    type: String,
    required: false,
  }
});

export default mongoose.models.QBO || mongoose.model<QBOs>("QBO", QBOSchema);