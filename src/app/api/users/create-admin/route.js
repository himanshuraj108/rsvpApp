import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { message: 'Admin credentials not configured in environment variables' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: adminEmail });
    
    if (adminExists) {
      // Update the admin user password directly in MongoDB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Use updateOne to bypass schema pre-save hooks
      const result = await mongoose.connection.db.collection('users').updateOne(
        { email: adminEmail },
        { 
          $set: { 
            password: hashedPassword,
            role: 'admin' 
          } 
        }
      );
      
      return NextResponse.json({
        message: 'Admin user credentials updated successfully',
        created: false,
        updated: true,
        email: adminEmail
      });
    }
    
    // Create the admin user with hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Insert directly into MongoDB to bypass schema hooks
    const result = await mongoose.connection.db.collection('users').insertOne({
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      message: 'Admin user created successfully',
      created: true,
      email: adminEmail
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { message: 'Server error creating admin user', error: error.message },
      { status: 500 }
    );
  }
} 