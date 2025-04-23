'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!params.id) {
          toast.error('Missing event ID');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/events/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Event not found. It might have been deleted or doesn\'t exist.');
          } else if (response.status === 400) {
            toast.error('Invalid event ID format');
          } else {
            toast.error(`Error: ${data.message || 'Failed to load event'}`);
          }
          setLoading(false);
          return;
        }
        
        setEvent(data);
        
        // Check if user has already RSVP'd
        if (session?.user?.id) {
          const existingRsvp = data.attendees.find(
            (a) => a.user._id === session.user.id || a.user === session.user.id
          );
          
          if (existingRsvp) {
            setRsvpStatus(existingRsvp.status);
            setAdditionalGuests(existingRsvp.additionalGuests || 0);
            setNotes(existingRsvp.notes || '');
          }
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    } else {
      setLoading(false);
    }
  }, [params.id, session]);

  const handleRSVP = async (status) => {
    if (!session) {
      toast.error('Please sign in to RSVP');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/events/${params.id}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          additionalGuests,
          notes,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update RSVP');
      }

      setRsvpStatus(status);
      toast.success('RSVP updated successfully!');
      
      // Refresh event data
      const eventResponse = await fetch(`/api/events/${params.id}`);
      const eventData = await eventResponse.json();
      setEvent(eventData);
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error(error.message || 'Failed to update RSVP');
    } finally {
      setSubmitting(false);
    }
  };

  const isOrganizer = session?.user?.id && event?.organizer._id === session.user.id;
  const isAdmin = session?.user?.role === 'admin';
  const canEdit = isOrganizer || isAdmin;

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('Event deleted successfully');
      router.push('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">Event Not Found</h1>
            <p className="mt-4 text-gray-600">The event you're looking for doesn't exist or has been removed.</p>
            <Link href="/events" className="mt-8 inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate event stats
  const totalAttendees = event.attendees
    .filter(a => a.status === 'attending')
    .reduce((sum, a) => sum + a.additionalGuests + 1, 0);
  
  const remainingSpots = event.capacity - totalAttendees;
  const isAtCapacity = remainingSpots <= 0;
  const attendeeCount = event.attendees.filter(a => a.status === 'attending').length;
  const maybeCount = event.attendees.filter(a => a.status === 'maybe').length;
  const declinedCount = event.attendees.filter(a => a.status === 'declined').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Event Header */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="h-64 bg-gray-200 relative">
              {event.image ? (
                <Image 
                  src={event.image} 
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-indigo-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <div className="absolute top-4 right-4 flex gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                  event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                  event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                
                {event.isPrivate && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Private
                  </span>
                )}
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 md:mb-0">{event.title}</h1>
                
                {canEdit && (
                  <div className="flex gap-3">
                    <Link
                      href={`/events/${params.id}/edit`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit Event
                    </Link>
                    <button
                      onClick={handleDeleteEvent}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {event.date && format(new Date(event.date), 'EEEE, MMMM d, yyyy')} at {event.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Organized by {event.organizer.name}</span>
                  </div>
                  
                  {event.registrationDeadline && (
                    <div className="flex items-center text-gray-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Registration deadline: {format(new Date(event.registrationDeadline), 'MMMM d, yyyy')}</span>
                    </div>
                  )}
                  
                  {event.categories && event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {event.categories.map((category, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Event Status</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Capacity</p>
                      <p className="text-xl font-semibold">{event.capacity} people</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Attending</p>
                      <p className="text-xl font-semibold">{totalAttendees} people</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Spots Remaining</p>
                      <p className={`text-xl font-semibold ${remainingSpots <= 5 ? 'text-red-600' : ''}`}>
                        {remainingSpots} spots
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Responses</p>
                      <p className="text-xl font-semibold">{attendeeCount + maybeCount + declinedCount}</p>
                    </div>
                  </div>
                  
                  {event.registrationDeadline && new Date(event.registrationDeadline) < new Date() ? (
                    <div className="mt-4 bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm text-yellow-700">
                        Registration deadline has passed. RSVP is closed.
                      </p>
                    </div>
                  ) : isAtCapacity && rsvpStatus !== 'attending' ? (
                    <div className="mt-4 bg-yellow-50 p-3 rounded-md">
                      <p className="text-sm text-yellow-700">
                        This event is at full capacity.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          
          {/* Event Description */}
          <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Event</h2>
            <div className="prose max-w-none">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700">{paragraph}</p>
              ))}
            </div>
          </div>
          
          {/* RSVP Section */}
          {event.status !== 'cancelled' && (
            <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">RSVP to this Event</h2>
              
              {!session ? (
                <div className="bg-gray-50 p-4 rounded-md text-center">
                  <p className="text-gray-700 mb-4">Please sign in to RSVP to this event</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Sign In
                  </Link>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <button
                      onClick={() => handleRSVP('attending')}
                      disabled={submitting || (isAtCapacity && rsvpStatus !== 'attending') || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        rsvpStatus === 'attending'
                          ? 'bg-green-100 text-green-800 border-2 border-green-600'
                          : 'bg-gray-100 text-gray-800 hover:bg-green-50 hover:text-green-800'
                      } ${
                        (isAtCapacity && rsvpStatus !== 'attending') || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      Attending
                    </button>
                    <button
                      onClick={() => handleRSVP('maybe')}
                      disabled={submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        rsvpStatus === 'maybe'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-600'
                          : 'bg-gray-100 text-gray-800 hover:bg-yellow-50 hover:text-yellow-800'
                      } ${
                        event.registrationDeadline && new Date(event.registrationDeadline) < new Date()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => handleRSVP('declined')}
                      disabled={submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        rsvpStatus === 'declined'
                          ? 'bg-red-100 text-red-800 border-2 border-red-600'
                          : 'bg-gray-100 text-gray-800 hover:bg-red-50 hover:text-red-800'
                      } ${
                        event.registrationDeadline && new Date(event.registrationDeadline) < new Date()
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      Decline
                    </button>
                  </div>
                  
                  {(rsvpStatus === 'attending' || rsvpStatus === 'maybe') && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-md">
                      <div>
                        <label htmlFor="additionalGuests" className="block text-sm font-medium text-gray-700 mb-1">
                          Additional Guests
                        </label>
                        <input
                          type="number"
                          id="additionalGuests"
                          min="0"
                          max={Math.max(0, remainingSpots)}
                          value={additionalGuests}
                          onChange={(e) => setAdditionalGuests(parseInt(e.target.value, 10) || 0)}
                          disabled={submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                          className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                          Notes (dietary requirements, etc.)
                        </label>
                        <textarea
                          id="notes"
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          placeholder="Any special requirements or notes..."
                        />
                      </div>
                      
                      <button
                        onClick={() => handleRSVP(rsvpStatus)}
                        disabled={submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())}
                        className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 ${
                          submitting || (event.registrationDeadline && new Date(event.registrationDeadline) < new Date())
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {submitting ? 'Updating...' : 'Update RSVP'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Attendees Section (Only visible to organizer or admin) */}
          {(isOrganizer || isAdmin) && (
            <div className="mt-8 bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendees</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {event.attendees.length > 0 ? (
                      event.attendees.map((attendee) => (
                        <tr key={attendee._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {attendee.user.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{attendee.user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendee.status === 'attending' ? 'bg-green-100 text-green-800' :
                              attendee.status === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {attendee.status.charAt(0).toUpperCase() + attendee.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {attendee.additionalGuests || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {attendee.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No attendees yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 