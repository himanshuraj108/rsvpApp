import { NextResponse } from 'next/server';
import { auth, signIn } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    // Fetch latest user data
    const user = await User.findById(session.user.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Return success with updated user data
    return NextResponse.json({
      success: true,
      userData: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profilePicture: user.profilePicture,
        address: user.address,
        receiveEmailNotifications: user.receiveEmailNotifications,
        receiveSmsNotifications: user.receiveSmsNotifications,
      }
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { message: 'Failed to update session' },
      { status: 500 }
    );
  }
} 