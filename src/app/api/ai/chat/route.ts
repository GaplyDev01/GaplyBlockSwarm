import { NextRequest, NextResponse } from 'next/server';

// Simple placeholder implementation for initial deployment
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      message: "AI Chat API is under maintenance",
      status: "coming-soon" 
    }, 
    { status: 200 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      message: "AI Chat API is under maintenance",
      status: "coming-soon" 
    }, 
    { status: 200 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { 
      message: "AI Chat API is under maintenance",
      status: "coming-soon" 
    }, 
    { status: 200 }
  );
}