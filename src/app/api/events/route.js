import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import User from '@/models/User';
import { auth } from '@/auth';
import { sendEventInvitation } from '@/lib/email';
import { format } from 'date-fns';

// GET all events
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const organizer = url.searchParams.get('organizer');
    const category = url.searchParams.get('category');
    
    // Get the current user's session to check if they're an admin
    let session;
    let isAdmin = false;
    
    try {
      session = await auth();
      isAdmin = session?.user?.role === 'admin';
    } catch (error) {
      console.error('Auth error:', error);
      // Continue without auth - will just return non-admin view
    }

    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { message: 'Failed to connect to database', error: error.message },
        { status: 200 }
      );
    }

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    } else {
      // If not explicitly requesting events by status, only show approved events
      // for non-admin users (exclude pending_approval events)
      if (!isAdmin) {
        query.status = { $ne: 'pending_approval' };
      }
    }
    
    if (organizer) query.organizer = organizer;
    if (category) query.categories = { $in: [category] };

    try {
      const events = await Event.find(query)
        .populate('organizer', 'name email')
        .sort({ date: 1 });

      return NextResponse.json(events);
    } catch (error) {
      console.error('Error finding events:', error);
      return NextResponse.json(
        { message: 'Failed to fetch events', error: error.message },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Failed to fetch events', error: error.message },
      { status: 200 }
    );
  }
}

// POST create new event
export async function POST(request) {
  try {
    let session;
    try {
      session = await auth();
      
      if (!session) {
        return NextResponse.json(
          { message: 'Not authenticated' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Auth error:', error);
      return NextResponse.json(
        { message: 'Authentication failed', error: error.message },
        { status: 401 }
      );
    }

    let eventData;
    try {
      eventData = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    let { invitedEmails, sendNotifications, ...eventDetails } = eventData;

    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { message: 'Failed to connect to database', error: error.message },
        { status: 500 }
      );
    }

    // Set organizer to current user
    eventDetails.organizer = session.user.id;
    
    // If the user is not an admin and hasn't set a status, set it to pending_approval
    if (session.user.role !== 'admin' && (!eventDetails.status || eventDetails.status === 'upcoming')) {
      eventDetails.status = 'pending_approval';
    }
    
    // Ensure invitedEmails is properly formatted
    // Convert string of comma-separated emails to array if needed
    if (typeof invitedEmails === 'string' && invitedEmails.trim() !== '') {
      invitedEmails = invitedEmails.split(',').map(email => email.trim());
    } else if (!Array.isArray(invitedEmails)) {
      invitedEmails = [];
    }
    
    // Filter invalid emails
    invitedEmails = invitedEmails.filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    // Format invitedEmails for the database if they exist
    if (invitedEmails.length > 0) {
      eventDetails.invitedEmails = invitedEmails.map(email => ({
        email,
        invitedAt: new Date(),
        notificationSent: false,
      }));
    }
    
    let event;
    try {
      event = await Event.create(eventDetails);
    } catch (error) {
      console.error('Error creating event:', error);
      return NextResponse.json(
        { message: 'Failed to create event', error: error.message },
        { status: 500 }
      );
    }
    
    // If admin is creating an event, automatically send notifications to all users with email notifications enabled
    if (session.user.role === 'admin' && event.status !== 'pending_approval') {
      // Even if sendNotifications is not explicitly set, admins will send emails
      sendNotifications = true;
      
      // If no emails were provided, find all users with email notifications enabled
      if (invitedEmails.length === 0) {
        try {
          const usersWithNotifications = await User.find({ receiveEmailNotifications: true });
          invitedEmails = usersWithNotifications.map(user => user.email);
          
          // Update the event with these emails
          if (invitedEmails.length > 0) {
            event.invitedEmails = invitedEmails.map(email => ({
              email,
              invitedAt: new Date(),
              notificationSent: false,
            }));
            
            await event.save();
          }
        } catch (error) {
          console.error('Error finding users with notifications:', error);
          // Continue anyway, we already created the event
        }
      }
    }
    
    // Send email notifications if requested and event is not pending approval
    let notificationResult = null;
    if (sendNotifications && invitedEmails.length > 0 && event.status !== 'pending_approval') {
      try {
        const eventDate = format(new Date(event.date), 'MMMM d, yyyy');
        const eventLink = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event._id}`;
        
        // Send a single email to all recipients to improve performance and delivery
        const result = await sendEventInvitation({
          to: invitedEmails, // The email library will handle multiple recipients
          eventTitle: event.title,
          eventDate,
          eventTime: event.time,
          eventLocation: event.location,
          eventDescription: event.description,
          eventLink,
          subject: `Invitation: ${event.title}`
        });
        
        notificationResult = result;
        
        if (result.success) {
          // Update all email statuses at once for better performance
          await Event.updateOne(
            { _id: event._id },
            { $set: { "invitedEmails.$[elem].notificationSent": true } },
            { arrayFilters: [{ "elem.email": { $in: invitedEmails } }], multi: true }
          );
        }
      } catch (error) {
        console.error('Error sending invitation emails:', error);
        notificationResult = { 
          success: false, 
          error: error.message 
        };
        // Continue anyway, the event was still created
      }
    }
    
    return NextResponse.json(
      { 
        message: event.status === 'pending_approval' 
          ? 'Event created successfully and is pending admin approval' 
          : 'Event created successfully', 
        event,
        notificationResults: notificationResult
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Failed to create event', error: error.message },
      { status: 200 }
    );
  }
} 
