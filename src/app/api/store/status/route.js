import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define StoreStatus model inline if it doesn't exist
let StoreStatus;
try {
  StoreStatus = mongoose.model('StoreStatus');
} catch (error) {
  // Model not registered yet, create it
  const StoreStatusSchema = new mongoose.Schema({
    isOnline: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  });
  
  StoreStatus = mongoose.models.StoreStatus || mongoose.model('StoreStatus', StoreStatusSchema);
}

// GET store status
export async function GET() {
  try {
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { message: 'Failed to connect to database', error: error.message },
        { status: 200 }
      );
    }
    
    try {
      // Get the most recent status entry, or create default one if none exists
      let status = await StoreStatus.findOne().sort({ lastUpdated: -1 });
      
      if (!status) {
        status = {
          isOnline: false,
          lastUpdated: new Date()
        };
      }
      
      return NextResponse.json({ isOnline: status.isOnline, lastUpdated: status.lastUpdated });
    } catch (error) {
      console.error('Error retrieving store status:', error);
      return NextResponse.json(
        { message: 'Failed to retrieve store status', error: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting store status:', error);
    return NextResponse.json(
      { message: 'Failed to get store status', error: error.message },
      { status: 500 }
    );
  }
}

// PUT update store status
export async function PUT(request) {
  try {
    let session;
    try {
      session = await auth();
      
      // Only admin can update store status
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json(
          { message: 'Not authorized' },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { message: 'Authentication failed', error: error.message },
        { status: 401 }
      );
    }
    
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    const { isOnline } = requestData;
    
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid status value. Must be boolean.' },
        { status: 400 }
      );
    }
    
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { message: 'Failed to connect to database', error: error.message },
        { status: 500 }
      );
    }
    
    try {
      // Create a new status entry
      const newStatus = new StoreStatus({
        isOnline,
        updatedBy: session.user.id,
        lastUpdated: new Date()
      });
      
      await newStatus.save();
      
      return NextResponse.json({ 
        message: `Store is now ${isOnline ? 'online' : 'offline'}`,
        isOnline,
        lastUpdated: newStatus.lastUpdated
      });
    } catch (error) {
      console.error('Error saving store status:', error);
      return NextResponse.json(
        { message: 'Failed to save store status', error: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating store status:', error);
    return NextResponse.json(
      { message: 'Failed to update store status', error: error.message },
      { status: 500 }
    );
  }
} 
