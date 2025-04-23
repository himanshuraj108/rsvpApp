import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Chat from "@/models/Chat";
import User from "@/models/User";

// GET endpoint to fetch all chats for the current user
export async function GET(request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to the database
    try {
      await connectDB();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    let chats = [];
    const isAdmin = session.user.role === "admin";
    
    console.log("User session:", { 
      id: session.user.id, 
      role: session.user.role,
      isAdmin
    });

    try {
      if (isAdmin) {
        // Admins can see all chats
        chats = await Chat.find({ isActive: true })
          .sort({ lastUpdated: -1 })
          .populate("user", "name email");
      } else {
        // Regular users can only see their own chats
        chats = await Chat.find({ 
          user: session.user.id,
          isActive: true
        }).sort({ lastUpdated: -1 });
      }
      console.log(`Found ${chats.length} chats`);
    } catch (queryError) {
      console.error("Error querying chats:", queryError);
      return NextResponse.json(
        { error: "Failed to query chats: " + queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats: " + error.message },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new chat
export async function POST(request) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only regular users can create new chats
    if (session.user.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot create new chats" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { initialMessage } = body;

    if (!initialMessage) {
      return NextResponse.json(
        { error: "Initial message is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Check if user exists
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has an active chat
    const existingChat = await Chat.findOne({
      user: session.user.id,
      isActive: true
    });

    if (existingChat) {
      // Add the message to the existing chat
      existingChat.messages.push({
        content: initialMessage,
        sender: session.user.id,
        timestamp: new Date(),
        isRead: false
      });
      existingChat.lastUpdated = new Date();
      await existingChat.save();

      return NextResponse.json({ 
        message: "Message added to existing chat",
        chat: existingChat
      });
    }

    // Create a new chat
    const newChat = new Chat({
      user: session.user.id,
      messages: [
        {
          content: initialMessage,
          sender: session.user.id,
          timestamp: new Date(),
          isRead: false
        }
      ],
      lastUpdated: new Date(),
      isActive: true
    });

    await newChat.save();

    return NextResponse.json({ 
      message: "Chat created successfully",
      chat: newChat
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}