import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Event from '@/models/Event';

export async function GET(req) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const userId = session.user.id;
    
    // Wrap MongoDB queries in try/catch to handle potential errors
    try {
      // Get upcoming events user is attending
      const upcomingEvents = await Event.countDocuments({
        'attendees.userId': userId,
        'attendees.status': 'attending',
        date: { $gt: new Date() }
      });
      
      // Get events user is maybe attending
      const maybeEvents = await Event.countDocuments({
        'attendees.userId': userId,
        'attendees.status': 'maybe',
        date: { $gt: new Date() }
      });
      
      // Get past events user attended
      const pastEvents = await Event.countDocuments({
        'attendees.userId': userId,
        date: { $lt: new Date() }
      });
      
      // Get events organized by user
      const organizedEvents = await Event.countDocuments({
        organizer: userId
      });
      
      return NextResponse.json({
        upcomingEvents,
        maybeEvents,
        pastEvents,
        organizedEvents
      });
    } catch (dbError) {
      console.error('Database error when fetching stats:', dbError);
      // Return empty stats instead of error
      return NextResponse.json({
        upcomingEvents: 0,
        maybeEvents: 0,
        pastEvents: 0,
        organizedEvents: 0
      });
    }
    
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return empty stats instead of error
    return NextResponse.json({
      upcomingEvents: 0,
      maybeEvents: 0,
      pastEvents: 0,
      organizedEvents: 0
    });
  }
} 