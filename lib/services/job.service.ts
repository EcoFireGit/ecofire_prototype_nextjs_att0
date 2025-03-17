import Job from '../models/job.model';
import { Jobs } from '../models/job.model';
import dbConnect from '../mongodb';

export class JobService {
  async getAllJobs(userId: string): Promise<Jobs[]> {
    try {
      await dbConnect();
      const jobs = await Job.find({ userId }).lean();
      return JSON.parse(JSON.stringify(jobs));
    } catch (error) {
      throw new Error('Error fetching jobs from database');
    }
  }

  async getJobById(id: string, userId: string): Promise<Jobs | null> {
    try {
      await dbConnect();
      const job = await Job.findOne({ _id: id, userId }).lean();
      return job ? JSON.parse(JSON.stringify(job)) : null;
    } catch (error) {
      throw new Error('Error fetching job from database');
    }
  }

  async createJob(jobData: Partial<Jobs>, userId: string): Promise<Jobs> {
    try {
      await dbConnect();
      const job = new Job({
        ...jobData,
        userId
      });
      const savedJob = await job.save();
      return JSON.parse(JSON.stringify(savedJob));
    } catch (error) {
      throw new Error('Error creating job in database');
    }
  }

  async updateJob(id: string, userId: string, updateData: Partial<Jobs>): Promise<Jobs | null> {
    try {
      await dbConnect();
      const updatedJob = await Job.findOneAndUpdate(
        { _id: id, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();
      
      return updatedJob ? JSON.parse(JSON.stringify(updatedJob)) : null;
    } catch (error) {
      throw new Error('Error updating job in database');
    }
  }

  async deleteJob(id: string, userId: string): Promise<boolean> {
    try {
      await dbConnect();
      const result = await Job.findOneAndDelete({ _id: id, userId });
      return !!result;
    } catch (error) {
      throw new Error('Error deleting job from database');
    }
  }
}