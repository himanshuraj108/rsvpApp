import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import User from '@/models/User';

// Get unread message count
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
    
    let unreadCount = 0;
    
    if (session.user.role === 'admin') {
      // For admin: count all unread messages across all user chats
      const chats = await Chat.find({ isActive: true });
      
      for (const chat of chats) {
        const userUnreadCount = chat.messages.filter(
          msg => !msg.isRead && 
          msg.sender.toString() !== session.user.id
        ).length;
        
        unreadCount += userUnreadCount;
      }
    } else {
      // For regular user: count unread messages in their chat
      const userChat = await Chat.findOne({ 
        user: session.user.id,
        isActive: true
      });
      
      if (userChat) {
        // Find admin user ID to check for unread admin messages
        const adminUser = await User.findOne({ role: 'admin' });
        
        unreadCount = userChat.messages.filter(
          msg => !msg.isRead && 
          msg.sender.toString() === adminUser?._id.toString()
        ).length;
      }
    }
    
    return NextResponse.json(
      { unreadCount },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 