import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DeleteRequest from '@/models/DeleteRequest';
import { auth } from '@/auth';

// API endpoint for admins to approve or reject a delete request
export async function PATCH(request, { params }) {
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
    
    const { id } = params;
    const { action, adminComment } = await request.json();
    
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid action. Must be either "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Find the delete request
    const deleteRequest = await DeleteRequest.findById(id);
    
    if (!deleteRequest) {
      return NextResponse.json(
        { message: 'Delete request not found' },
        { status: 404 }
      );
    }
    
    // Update the delete request status
    deleteRequest.status = action === 'approve' ? 'approved' : 'rejected';
    deleteRequest.adminComment = adminComment || '';
    deleteRequest.resolvedAt = new Date();
    deleteRequest.resolvedBy = session.user.id;
    
    await deleteRequest.save();
    
    // If approved, delete the user account
    if (action === 'approve') {
      await User.findByIdAndDelete(deleteRequest.userId);
    }
    
    return NextResponse.json(
      { 
        message: `Delete request ${action}d successfully`,
        status: deleteRequest.status 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error processing delete request:`, error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// API endpoint to get a specific delete request
export async function GET(request, { params }) {
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
    
    const { id } = params;
    
    await connectDB();
    
    // Find the delete request with user details
    const deleteRequest = await DeleteRequest.findById(id)
      .populate('userId', 'name email username')
      .populate('resolvedBy', 'name email');
    
    if (!deleteRequest) {
      return NextResponse.json(
        { message: 'Delete request not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { request: deleteRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching delete request:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 