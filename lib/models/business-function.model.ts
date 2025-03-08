import mongoose from "mongoose";

export interface BusinessFunction extends mongoose.Document {
  _id: string;
  name: string;
  userId: string;
  isDefault?: boolean;
}

export interface BusinessFunctionForDropdown {
  id: string;
  name: string;
}

const BusinessFunctionSchema = new mongoose.Schema<BusinessFunction>({
  userId: {
    type: String,
    required: [true, "User ID is required"],
    index: true
  },
  name: {
    type: String,
    required: [true, "Please provide a name for this Business Function."],
  },
  isDefault: {
    type: Boolean,
    default: false
  }
});

export default mongoose.models.BusinessFunction || 
  mongoose.model<BusinessFunction>("BusinessFunction", BusinessFunctionSchema);