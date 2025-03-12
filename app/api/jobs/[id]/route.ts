// route: /api/jobs/:id
// description: Get job by id
import { NextRequest, NextResponse } from "next/server";
import { JobService } from "@/lib/services/job.service";
import { auth } from "@clerk/nextjs/server";

const jobService = new JobService();

export async function GET(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params;
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
    const job = await jobService.getJobById(id, userId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error(`Error in GET /api/jobs/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params;
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
    const updateData = await request.json();
    const updatedJobResult = await jobService.updateJob(id, userId, updateData);
    if (!updatedJobResult) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      data: updatedJobResult,
    });
  } catch (error) {
    console.error(`Error in PUT /api/jobs/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } },
) {
  const { id } = await context.params;
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
    const deleted = await jobService.deleteJob(id, userId);
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(`Error in DELETE /api/jobs/${id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
