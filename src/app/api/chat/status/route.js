import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import ChatStatus from '@/models/ChatStatus';

// GET /api/chat/status - Get current chat status
export async function GET() {
  try {
    await connectDB();
    
    // Find the chat status or create if it doesn't exist
    let chatStatus = await ChatStatus.findOne();
    if (!chatStatus) {
      chatStatus = await ChatStatus.create({ isOnline: false });
    }
    
    return NextResponse.json({ isOnline: chatStatus.isOnline });
  } catch (error) {
    console.error('Error fetching chat status:', error);
    return NextResponse.json(
      { error: 'Error fetching chat status' },
      { status: 500 }
    );
  }
}

// PUT /api/chat/status - Update chat status (admin only)
export async function PUT(request) {
  try {
    const session = await auth();
    
    // Check if user is authenticated and is admin
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { isOnline } = await request.json();
    
    if (typeof isOnline !== 'boolean') {
      return NextResponse.json(
        { error: 'isOnline field must be a boolean' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Find and update the chat status or create if it doesn't exist
    let chatStatus = await ChatStatus.findOne();
    if (chatStatus) {
      chatStatus.isOnline = isOnline;
      chatStatus.lastUpdated = new Date();
      chatStatus.updatedBy = session.user.id;
      await chatStatus.save();
    } else {
      chatStatus = await ChatStatus.create({ 
        isOnline, 
        lastUpdated: new Date(),
        updatedBy: session.user.id
      });
    }
    
    return NextResponse.json({ isOnline: chatStatus.isOnline });
  } catch (error) {
    console.error('Error updating chat status:', error);
    return NextResponse.json(
      { error: 'Error updating chat status' },
      { status: 500 }
    );
  }
} 