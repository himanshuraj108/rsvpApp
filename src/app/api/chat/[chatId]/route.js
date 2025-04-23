import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';

// Get a specific chat
export async function GET(request, { params }) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Find chat by ID
    const chat = await Chat.findById(chatId).populate("user", "name email");
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is authorized to view this chat
    const isAdmin = session.user.role === "admin";
    const isOwner = chat.user._id.toString() === session.user.id;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

// Add a message to a chat
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { message: 'Message content is required' },
        { status: 400 }
      );
    }

    const { db } = await connectDB();
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    // Check if user is authorized to message in this chat
    const isAdmin = session.user.role === 'admin';
    if (!isAdmin && chat.user.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Add message to chat
    chat.messages.push({
      sender: session.user.id,
      content,
      isRead: false,
      timestamp: new Date()
    });

    chat.lastUpdated = new Date();
    await chat.save();

    return NextResponse.json(
      { message: 'Message sent successfully', chat },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { message: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a chat (close chat or other updates)
export async function PUT(request, { params }) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Connect to the database
    await connectDB();

    // Find chat by ID
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Check if user is authorized to update this chat
    const isAdmin = session.user.role === "admin";
    const isOwner = chat.user.toString() === session.user.id;
    
    // Only admins or chat owners can update a chat
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    
    // Update chat properties
    // For now, we only support updating isActive status (to close a chat)
    if (body.hasOwnProperty('isActive')) {
      chat.isActive = body.isActive;
    }

    chat.lastUpdated = new Date();
    await chat.save();

    return NextResponse.json({ 
      message: "Chat updated successfully",
      chat
    });
  } catch (error) {
    console.error("Error updating chat:", error);
    return NextResponse.json(
      { error: "Failed to update chat" },
      { status: 500 }
    );
  }
}

// Delete a chat (mark as inactive)
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { chatId } = await params;
    
    const { db } = await connectDB();
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { message: 'Chat not found' },
        { status: 404 }
      );
    }
    
    // Verify access permissions
    const isOwner = chat.user.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      );
    }
    
    // Mark chat as inactive instead of deleting it
    chat.isActive = false;
    await chat.save();
    
    return NextResponse.json({
      message: 'Chat archived successfully'
    });
    
  } catch (error) {
    console.error('Error archiving chat:', error);
    return NextResponse.json(
      { message: 'Server error' },
      { status: 500 }
    );
  }
} 