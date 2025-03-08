import { NextResponse } from 'next/server';
import { BusinessFunctionService } from '@/lib/services/business-function.service';
import { auth } from '@clerk/nextjs/server';

const businessFunctionService = new BusinessFunctionService();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }
    
    const deleted = await businessFunctionService.deleteBusinessFunction(
      params.id,
      userId
    );
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business function not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Business function deleted successfully'
    });
  } catch (error: any) {
    console.error(`Error in DELETE /api/business-functions/${params.id}:`, error);
   
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized'
        },
        { status: 401 }
      );
    }
    
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required'
        },
        { status: 400 }
      );
    }
    
    const updatedFunction = await businessFunctionService.updateBusinessFunction(
      params.id,
      name,
      userId
    );
    
    if (!updatedFunction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Business function not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedFunction
    });
  } catch (error) {
    console.error(`Error in PATCH /api/business-functions/${params.id}:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error'
      },
      { status: 500 }
    );
  }
}