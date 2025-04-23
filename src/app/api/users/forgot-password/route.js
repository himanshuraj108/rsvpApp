import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Please provide an email address' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user with the provided email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { message: 'No account found with that email' },
        { status: 404 }
      );
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Set token and expiry on user model
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save();

    // Send email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json(
      { message: 'Password reset email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Server error during password reset' },
      { status: 500 }
    );
  }
}