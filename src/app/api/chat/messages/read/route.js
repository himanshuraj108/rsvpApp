import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

// PUT endpoint to mark messages as read
export async function PUT(request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { chatId, messageIds } = body;
    
    if (!chatId || !messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: 'Chat ID and an array of message IDs are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find chat by ID
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is authorized to mark messages as read
    const isAdmin = session.user.role === 'admin';
    const isOwner = chat.user.toString() === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark messages as read
    let updatedCount = 0;

    // Using updateOne with $set operator for each message that matches the criteria
    for (const messageId of messageIds) {
      const result = await Chat.updateOne(
        { 
          _id: chatId,
          "messages._id": messageId,
          "messages.sender": { $ne: session.user.id } // Only mark as read if sender is not current user
        },
        { 
          $set: { "messages.$.isRead": true }
        }
      );
      
      if (result.modifiedCount > 0) {
        updatedCount++;
      }
    }

    console.log(`Marked ${updatedCount} messages as read in chat ${chatId}`);

    return NextResponse.json({ 
      message: `${updatedCount} messages marked as read`,
      updatedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
} 