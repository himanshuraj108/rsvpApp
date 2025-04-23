import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function POST(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await connectDB();
    
    const { senderId } = await request.json();
    
    if (!senderId) {
      return NextResponse.json({ error: 'Sender ID is required' }, { status: 400 });
    }
    
    // Mark all messages from the sender to the current user as read
    const result = await Chat.updateMany(
      { 
        sender: senderId, 
        receiver: session.user.id,
        isRead: false 
      },
      { 
        $set: { 
          isRead: true,
          readAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      markedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
} 