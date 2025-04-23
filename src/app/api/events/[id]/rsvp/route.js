import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { auth } from '@/auth';
import Event from '@/models/Event';

export async function POST(request, { params }) {
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
      console.error('Invalid event ID provided for RSVP:', id);
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }
    
    const { status, additionalGuests, notes } = await request.json();

    if (!status || !['attending', 'maybe', 'declined'].includes(status)) {
      return NextResponse.json(
        { message: 'Invalid RSVP status' },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findById(id);

    if (!event) {
      console.log(`Cannot RSVP: Event not found with ID: ${id}`);
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if deadline has passed
    if (event.registrationDeadline && new Date(event.registrationDeadline) < new Date()) {
      return NextResponse.json(
        { message: 'RSVP deadline has passed' },
        { status: 400 }
      );
    }

    // Check if event is at capacity
    const currentAttendeeCount = event.attendees
      .filter(a => a.status === 'attending')
      .reduce((sum, a) => sum + a.additionalGuests + 1, 0);
      
    const newGuestCount = additionalGuests || 0;
    
    if (status === 'attending' && currentAttendeeCount + newGuestCount + 1 > event.capacity) {
      return NextResponse.json(
        { message: 'Event is at full capacity' },
        { status: 400 }
      );
    }

    // Check if user has already RSVP'd
    const existingRsvpIndex = event.attendees.findIndex(
      a => a.user.toString() === session.user.id
    );

    if (existingRsvpIndex !== -1) {
      // Update existing RSVP
      event.attendees[existingRsvpIndex] = {
        user: session.user.id,
        status,
        responseDate: new Date(),
        additionalGuests: additionalGuests || 0,
        notes: notes || '',
      };
    } else {
      // Add new RSVP
      event.attendees.push({
        user: session.user.id,
        status,
        responseDate: new Date(),
        additionalGuests: additionalGuests || 0,
        notes: notes || '',
      });
    }

    await event.save();

    return NextResponse.json(
      { message: 'RSVP updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating RSVP:', error);
    return NextResponse.json(
      { message: 'Failed to update RSVP' },
      { status: 500 }
    );
  }
} 