import Job from '../models/job.model';
import dbConnect from '../mongodb';

export class JobCountService {
  async getJobCountsByBusinessFunction(userId: string): Promise<Record<string, number>> {
    try {
      await dbConnect();
      
      // Aggregate to count jobs by businessFunctionId
      const jobCounts = await Job.aggregate([
        { $match: { userId } },
        { $group: { _id: "$businessFunctionId", count: { $sum: 1 } } }
      ]);
      
      // Convert to a more usable format: { businessFunctionId: count }
      const countMap: Record<string, number> = {};
      
      jobCounts.forEach((item) => {
        // Handle null or undefined businessFunctionId
        const businessFunctionId = item._id || 'uncategorized';
        countMap[businessFunctionId] = item.count;
      });
      
      return countMap;
    } catch (error) {
      console.error('Error getting job counts:', error);
      return {};
    }
  }
}