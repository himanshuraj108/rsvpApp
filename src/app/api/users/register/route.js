import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password, phone, username } = await request.json();

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide all required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Check if user already exists
    try {
      const userExists = await User.findOne({ 
        $or: [{ email }, { username: username || email }] 
      });
      
      if (userExists) {
        return NextResponse.json(
          { message: 'User already exists with this email or username' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Error checking existing user:', error);
      return NextResponse.json(
        { message: 'Error checking user existence' },
        { status: 500 }
      );
    }

    // Create admin user if the email matches the admin email from env variables
    let role = 'user';
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (email === adminEmail && password === adminPassword) {
      role = 'admin';
    }

    // Hash password
    let hashedPassword;
    try {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } catch (error) {
      console.error('Password hashing error:', error);
      return NextResponse.json(
        { message: 'Error processing password' },
        { status: 500 }
      );
    }

    // Create user
    try {
      const user = await User.create({
        name,
        email,
        username: username || email, // Use email as username if not provided
        password: hashedPassword,
        role,
        phone: phone || '', // Add phone field with default empty string if not provided
        receiveEmailNotifications: true
      });

      return NextResponse.json(
        { 
          message: 'Registration successful', 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username || email,
            role: user.role,
            phone: user.phone || ''
          }
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('User creation error:', error);
      return NextResponse.json(
        { message: 'Error creating user account', error: error.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Server error during registration' },
      { status: 500 }
    );
  }
} 