import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

// Mark messages as read
export async function PUT(request) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { chatId } = await request.json();
    
    if (!chatId) {
      return NextResponse.json(
        { message: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { message: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Check permissions - only admins can mark user messages as read
    // or a user can mark admin messages as read in their own chat
    if (
      (session.user.role === 'admin') || 
      (chat.user.toString() === session.user.id)
    ) {
      // Determine whose messages to mark as read
      const otherSenderId = session.user.role === 'admin' 
        ? chat.user.toString() 
        : (await Chat.findOne({ user: chat.user }).populate('messages.sender')).messages.find(m => m.sender.role === 'admin')?.sender._id;
      
      // Mark messages from the other party as read
      await Chat.findByIdAndUpdate(
        chatId,
        { 
          $set: { 
            "messages.$[elem].isRead": true 
          } 
        },
        { 
          arrayFilters: [{ 
            "elem.sender": otherSenderId,
            "elem.isRead": false 
          }],
          new: true 
        }
      );
      
      return NextResponse.json(
        { message: 'Messages marked as read' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Not authorized to update this chat' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 