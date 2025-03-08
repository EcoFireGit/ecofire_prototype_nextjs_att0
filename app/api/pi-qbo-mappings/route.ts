import { NextRequest, NextResponse } from "next/server";
import { PIQBOMappingService } from "@/lib/services/pi-qbo-mapping.service";
import { auth } from '@clerk/nextjs/server';

const mappingService = new PIQBOMappingService();

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const url = new URL(req.url);
    const piId = url.searchParams.get("piId");
    const qboId = url.searchParams.get("qboId");
    
    let mappings;
    if (piId) {
      // Get mappings for a specific PI
      mappings = await mappingService.getMappingsForPI(piId, userId);
    } else if (qboId) {
      // Get mappings for a specific QBO
      mappings = await mappingService.getMappingsForQBO(qboId, userId);
    } else {
      // Get all mappings
      mappings = await mappingService.getAllMappings(userId);
    }
    
    return NextResponse.json({
      success: true,
      data: mappings
    });
  } catch (error) {
    console.error("Error fetching PI-QBO mappings:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error" 
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { 
          success: false,
          error: "Unauthorized" 
        },
        { status: 401 }
      );
    }
    
    // Get mapping data from request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.piId || !data.qboId || data.qboImpact === undefined) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing required fields" 
        },
        { status: 400 }
      );
    }
    
    // Create mapping
    const mapping = await mappingService.createMapping(data, userId);
    
    return NextResponse.json({
      success: true,
      data: mapping
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating PI-QBO mapping:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Internal Server Error" 
      },
      { status: 500 }
    );
  }
}