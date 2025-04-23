import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

// Add a message to a specific chat
export async function POST(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { message: 'Message content is required' },
        { status: 400 }
      );
    }
    
    const { chatId } = params;
    
    await connectDB();
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { message: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Verify permission: user must either own the chat or be an admin
    const isOwner = chat.user.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Add the new message
    chat.messages.push({
      sender: session.user.id,
      content,
      isRead: false,
      timestamp: new Date()
    });
    
    // Update lastUpdated time
    chat.lastUpdated = new Date();
    
    // If chat was inactive, make it active again
    if (!chat.isActive) {
      chat.isActive = true;
    }
    
    await chat.save();
    
    return NextResponse.json({
      message: 'Message sent',
      newMessage: chat.messages[chat.messages.length - 1]
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}

// Mark all messages in the chat as read
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { chatId } = params;
    
    await connectDB();
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { message: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Verify permission: user must either own the chat or be an admin
    const isOwner = chat.user.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Mark messages as read (only those sent by others)
    let updated = false;
    
    chat.messages.forEach(message => {
      if (message.sender.toString() !== session.user.id && !message.isRead) {
        message.isRead = true;
        updated = true;
      }
    });
    
    if (updated) {
      await chat.save();
    }
    
    return NextResponse.json({
      message: 'Messages marked as read',
      success: true
    });
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
}