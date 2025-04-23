import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    
    await connectDB();
    
    // Check if admin user exists
    const adminUser = await User.findOne({ email: adminEmail });
    
    return NextResponse.json({
      adminExists: !!adminUser,
      adminEmail: adminEmail,
      // Don't include sensitive information like the password
    });
  } catch (error) {
    console.error('Error checking admin:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 