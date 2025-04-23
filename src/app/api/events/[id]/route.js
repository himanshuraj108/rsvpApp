import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/auth';
import Event from '@/models/Event';
import { sendEventInvitation } from '@/lib/email';
import { format } from 'date-fns';

// GET single event
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      console.error('Invalid event ID:', id);
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    // Check if ID is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error('Invalid MongoDB ObjectId format:', id);
      return NextResponse.json(
        { message: 'Invalid event ID format' },
        { status: 400 }
      );
    }

    await connectDB();

    try {
      const event = await Event.findById(id)
        .populate('organizer', 'name email')
        .populate('attendees.user', 'name email');

      if (!event) {
        console.log(`Event not found with ID: ${id}`);
        return NextResponse.json(
          { message: 'Event not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(event);
    } catch (dbError) {
      console.error('Database error when fetching event:', dbError);
      return NextResponse.json(
        { message: 'Error retrieving event from database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { message: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

// PATCH update event status
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can approve/reject events
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Only administrators can approve or reject events' },
        { status: 403 }
      );
    }

    const { id } = params;
    
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    const { status } = await request.json();

    if (!status || !['upcoming', 'rejected'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Update event status
    event.status = status;
    await event.save();

    // If the event was approved and has invited emails, send notifications
    if (status === 'upcoming' && event.invitedEmails && event.invitedEmails.length > 0) {
      const eventDate = format(new Date(event.date), 'MMMM d, yyyy');
      const eventLink = `${process.env.NEXT_PUBLIC_APP_URL}/events/${event._id}`;
      
      // Send invitation emails to all invited users
      const emailPromises = event.invitedEmails.map(async (invitee) => {
        try {
          // Only send if notification hasn't been sent already
          if (!invitee.notificationSent) {
            const result = await sendEventInvitation({
              to: invitee.email,
              eventTitle: event.title,
              eventDate,
              eventTime: event.time,
              eventLocation: event.location,
              eventDescription: event.description,
              eventLink,
            });
            
            if (result.success) {
              // Update notification status
              invitee.notificationSent = true;
            }
          }
        } catch (error) {
          console.error(`Error sending invitation to ${invitee.email}:`, error);
        }
      });
      
      await Promise.all(emailPromises);
      await event.save(); // Save notification status updates
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error updating event status:', error);
    return NextResponse.json(
      { message: 'Failed to update event status' },
      { status: 500 }
    );
  }
}

// PUT update event
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    const eventData = await request.json();

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is the organizer or an admin
    if (
      event.organizer.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { message: 'Not authorized to update this event' },
        { status: 403 }
      );
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      eventData,
      { new: true, runValidators: true }
    );

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { message: 'Failed to update event' },
      { status: 500 }
    );
  }
}

// DELETE event
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id || typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is the organizer or an admin
    if (
      event.organizer.toString() !== session.user.id &&
      session.user.role !== 'admin'
    ) {
      return NextResponse.json(
        { message: 'Not authorized to delete this event' },
        { status: 403 }
      );
    }

    await Event.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Event deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { message: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 