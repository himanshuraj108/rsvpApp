import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    // Test database connection
    const conn = await connectDB();
    
    const connectionState = mongoose.connection.readyState;
    const stateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][connectionState];
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection test successful", 
      connectionState: stateText,
      dbName: mongoose.connection.db?.databaseName || "unknown",
      models: Object.keys(mongoose.models)
    });
  } catch (error) {
    console.error("Database connection test failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Database connection test failed", 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 