import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import mongoose from 'mongoose';

// Get messages for a specific chat
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract chatId from query parameters
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Regular users can only access their own chats
    const isAdmin = session.user.role === 'admin';
    const isOwner = chat.user.toString() === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ 
      messages: chat.messages,
      chatId: chat._id
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Add a message to a chat
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, content, fileUrl } = body;

    if (!chatId || !content) {
      return NextResponse.json(
        { error: 'Chat ID and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Regular users can only message their own chats
    const isAdmin = session.user.role === 'admin';
    const isOwner = chat.user.toString() === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create new message
    const newMessage = {
      _id: new mongoose.Types.ObjectId(),
      content,
      sender: session.user.id,
      isRead: false,
      timestamp: new Date(),
      fileUrl: fileUrl || null
    };

    // Add message to chat
    chat.messages.push(newMessage);
    chat.lastUpdated = new Date();
    await chat.save();

    return NextResponse.json({ 
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
} 