import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check for important environment variables
    const envVars = {
      MONGODB_URI: process.env.MONGODB_URI ? "Set" : "Not set",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? "Set" : "Not set",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
    };
    
    // Check if MONGODB_URI starts with mongodb://
    let mongoDbValid = false;
    if (process.env.MONGODB_URI) {
      const uri = process.env.MONGODB_URI.toLowerCase();
      mongoDbValid = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
    }
    
    return NextResponse.json({ 
      success: true, 
      environment: process.env.NODE_ENV || "unknown",
      envVars,
      mongoDbValid
    });
  } catch (error) {
    console.error("Environment check failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Environment check failed", 
        message: error.message
      },
      { status: 500 }
    );
  }
} 