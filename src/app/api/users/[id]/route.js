import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    await connectDB();
    
    // Find the user - exclude sensitive information
    const user = await User.findById(id).select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Only allow admin or the user themselves to access
    if (session.user.role !== 'admin' && session.user.id !== id) {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { user },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only admins can update other users' roles
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const data = await request.json();
    
    await connectDB();
    
    // Find the user
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update the user role
    if (data.role && ['admin', 'user'].includes(data.role)) {
      user.role = data.role;
      await user.save();
      
      return NextResponse.json(
        { 
          message: 'User role updated successfully',
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { message: 'Invalid role value' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 