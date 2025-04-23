import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { auth } from '@/auth';

export async function GET(request) {
  try {
    // Check authentication and admin status
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Not authorized. Admin access required.' },
        { status: 403 }
      );
    }
    
    // Connect to MongoDB
    await connectDB();
    
    // Get admin credentials from env
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Admin credentials not found in environment variables' },
        { status: 400 }
      );
    }
    
    // Hash the password - using a lower salt round to ensure consistency
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Get direct access to the users collection
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Check if admin user exists
    const adminUser = await usersCollection.findOne({ email: adminEmail });
    
    let result;
    if (adminUser) {
      // Update the existing admin user
      result = await usersCollection.updateOne(
        { email: adminEmail },
        {
          $set: {
            name: 'Admin User',
            password: hashedPassword,
            role: 'admin',
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Admin user updated successfully',
        credentials: {
          email: adminEmail,
          password: 'Password hidden for security',
          passwordHash: hashedPassword
        }
      });
    } else {
      // Create a new admin user
      result = await usersCollection.insertOne({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return NextResponse.json({
        success: true,
        message: 'Admin user created successfully',
        credentials: {
          email: adminEmail,
          password: 'Password hidden for security',
          passwordHash: hashedPassword
        }
      });
    }
  } catch (error) {
    console.error('Error fixing admin user:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
} 