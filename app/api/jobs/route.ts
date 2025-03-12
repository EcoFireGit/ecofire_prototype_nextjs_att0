// route: /api/jobs
// description: Get all jobs
import { NextResponse } from "next/server";
import { JobService } from "@/lib/services/job.service";
import { auth } from "@clerk/nextjs/server";

const jobService = new JobService();

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }
    const jobs = await jobService.getAllJobs(userId);

    return NextResponse.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("Error in GET /api/jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const newJob = await request.json();
    const job = await jobService.createJob(newJob, userId);

    return NextResponse.json(
      {
        success: true,
        data: job,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
