import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { reason } = await request.json();
    
    await connectDB();
    
    // Check if the user already has a pending delete request
    const existingRequest = await DeleteRequest.findOne({ 
      userId: session.user.id, 
      status: 'pending' 
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { message: 'You already have a pending delete request' },
        { status: 400 }
      );
    }
    
    // Create the delete request
    const deleteRequest = await DeleteRequest.create({
      userId: session.user.id,
      reason: reason || 'No reason provided',
      status: 'pending',
      requestedAt: new Date()
    });
    
    return NextResponse.json(
      { message: 'Delete request submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting delete request:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// API endpoint for admins to get all delete requests
export async function GET(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Fetch all delete requests with user details
    const deleteRequests = await DeleteRequest.find()
      .sort({ requestedAt: -1 }) // Most recent first
      .populate('userId', 'name email username'); // Include user details
    
    return NextResponse.json(
      { requests: deleteRequests },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching delete requests:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 