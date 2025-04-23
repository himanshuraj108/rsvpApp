import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        user: {
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
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name || !userData.email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!emailRegex.test(userData.email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if so, ensure it's not already taken
    if (userData.email !== user.email) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return NextResponse.json(
          { message: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update fields
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: userData.name,
        email: userData.email,
        profilePicture: userData.profilePicture,
        phone: userData.phone,
        address: userData.address,
        receiveEmailNotifications: userData.receiveEmailNotifications,
        receiveSmsNotifications: userData.receiveSmsNotifications,
      },
      { new: true, runValidators: true }
    ).select('-password');

    return NextResponse.json(
      { 
        message: 'Profile updated successfully',
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          profilePicture: updatedUser.profilePicture,
          address: updatedUser.address,
          receiveEmailNotifications: updatedUser.receiveEmailNotifications,
          receiveSmsNotifications: updatedUser.receiveSmsNotifications,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 