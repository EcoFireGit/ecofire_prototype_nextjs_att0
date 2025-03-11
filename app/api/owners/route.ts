
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import ownerService from "@/lib/services/owner.service";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const owners = await ownerService.getAllOwners(userId);
    return NextResponse.json(owners);
  } catch (error) {
    console.error("Failed to get owners:", error);
    return NextResponse.json(
      { error: "Failed to get owners" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const owner = await ownerService.createOwner(name, userId);
    return NextResponse.json(owner);
  } catch (error) {
    console.error("Failed to create owner:", error);
    return NextResponse.json(
      { error: "Failed to create owner" },
      { status: 500 }
    );
  }
}
