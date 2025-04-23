import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

export async function GET(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    // Connect to database
    await connectDB();
    
    // Check if user is authorized to view this data
    // Allow access if user is viewing their own data or if user is an admin
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Not authorized to view this data' },
        { status: 403 }
      );
    }
    
    // Get current date for comparing
    const now = new Date();
    
    // Fetch events organized by the user
    const organizedEvents = await Event.find({ 
      organizer: id 
    })
    .sort({ date: -1 })
    .lean();
    
    // Fetch events user is attending
    const attendingEvents = await Event.find({
      'attendees': {
        $elemMatch: {
          userId: id,
          status: 'attending'
        }
      },
      date: { $gte: now }
    })
    .sort({ date: 1 })
    .lean();
    
    // Fetch events user has responded "maybe" to
    const maybeEvents = await Event.find({
      'attendees': {
        $elemMatch: {
          userId: id,
          status: 'maybe'
        }
      },
      date: { $gte: now }
    })
    .sort({ date: 1 })
    .lean();
    
    // Fetch past events the user attended
    const pastEvents = await Event.find({
      'attendees.userId': id,
      date: { $lt: now }
    })
    .sort({ date: -1 })
    .lean();
    
    return NextResponse.json({
      organizedEvents,
      attendingEvents,
      maybeEvents,
      pastEvents
    });
    
  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
} 