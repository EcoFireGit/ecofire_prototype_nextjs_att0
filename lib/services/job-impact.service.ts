
import Job from "../models/job.model";
import MappingJobToPI from "../models/pi-job-mapping.model";
import dbConnect  from "../mongodb";

export async function updateJobImpactValues(userId: string) {
  try {
    await dbConnect();

    // 1. Get all jobs and initialize impact to 0
    const jobs = await Job.find({ userId });
    for (const job of jobs) {
      job.impact = 0;
      await job.save();
    }

    // 2. Get all job-PI mappings
    const mappings = await MappingJobToPI.find({ userId });

    // 3. Create a map to efficiently aggregate impact values by job
    const jobImpactMap = new Map<string, number>();

    // 4. Process all mappings to calculate impact values
    mappings.forEach(mapping => {
      const jobId = mapping.jobId;
      const impactValue = mapping.piImpactValue || 0;

      // Add to the existing value or initialize
      jobImpactMap.set(jobId, (jobImpactMap.get(jobId) || 0) + impactValue);
    });


    // 5. Update all jobs with their calculated impact values
    const updatePromises = Array.from(jobImpactMap.entries()).map(([jobId, impactValue]) => {
      return Job.findByIdAndUpdate(jobId, { impact: impactValue });
    });

    await Promise.all(updatePromises);

    return {
      success: true,
      jobsUpdated: updatePromises.length,
      message: `Updated impact values for ${updatePromises.length} jobs`
    };
  } catch (error) {
    console.error("Error updating job impact values:", error);
    return {
      success: false,
      message: "Failed to update job impact values",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
