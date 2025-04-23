'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function AdminEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [adminComment, setAdminComment] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Redirect if not an admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (status !== 'authenticated' || !session || session.user.role !== 'admin') return;
      
      try {
        const response = await fetch('/api/events');
        
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
          setFilteredEvents(data);
        } else {
          toast.error('Failed to load events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('An error occurred while loading events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [status, session]);

  // Filter events when filter or search changes
  useEffect(() => {
    let result = [...events];
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(event => event.status === filter);
    }
    
    // Apply search filter (search in title, description, location)
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        (event.organizer?.name && event.organizer.name.toLowerCase().includes(searchLower)) ||
        (event.organizer?.email && event.organizer.email.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredEvents(result);
  }, [events, filter, search]);

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setAdminComment('');
  };

  const handleApproveEvent = async (eventId) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'upcoming',
          adminComment
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Event approved successfully');
        
        // Update the events list
        setEvents(prev => 
          prev.map(event => 
            event._id === eventId 
              ? { ...event, status: 'upcoming' }
              : event
          )
        );
        
        setSelectedEvent(null);
      } else {
        toast.error(data.message || 'Failed to approve event');
      }
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('An error occurred while approving the event');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectEvent = async (eventId) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'rejected',
          adminComment
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Event rejected successfully');
        
        // Update the events list
        setEvents(prev => 
          prev.map(event => 
            event._id === eventId 
              ? { ...event, status: 'rejected' }
              : event
          )
        );
        
        setSelectedEvent(null);
      } else {
        toast.error(data.message || 'Failed to reject event');
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('An error occurred while rejecting the event');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Event deleted successfully');
        
        // Remove the event from the list
        setEvents(prev => prev.filter(event => event._id !== eventId));
        setSelectedEvent(null);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('An error occurred while deleting the event');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (timeString) => {
    return timeString || 'No time specified';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin Dashboard
            </Link>
          </div>
          
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filter === 'all' 
                      ? 'bg-indigo-100 text-indigo-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setFilter('pending_approval')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filter === 'pending_approval' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending Approval
                </button>
                <button
                  onClick={() => setFilter('upcoming')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filter === 'upcoming' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filter === 'completed' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    filter === 'rejected' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Rejected
                </button>
              </div>
              
              <div className="relative flex-1 sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Events List */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Events</h2>
                  <span className="text-sm text-gray-500">
                    {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
                  </span>
                </div>
                
                <div className="border-t border-gray-200">
                  {filteredEvents.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No events found matching your criteria
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredEvents.map((event) => (
                        <li key={event._id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                {event.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(event.date)} • {formatTime(event.time)} • {event.location}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                Organized by: {event.organizer?.name || 'Unknown'} 
                                ({event.organizer?.email || 'No email'})
                              </div>
                              <div className="flex items-center mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  event.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' : 
                                  event.status === 'upcoming' ? 'bg-green-100 text-green-800' : 
                                  event.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                                  event.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {event.status === 'pending_approval' ? 'Pending Approval' : 
                                   event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                                <span className="text-xs text-gray-500 ml-3">
                                  {event.attendees?.length || 0} attendees
                                </span>
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() => handleViewEvent(event)}
                                className="px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            {/* Event Details */}
            <div className="lg:w-1/3">
              {selectedEvent ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Event Details</h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedEvent.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' : 
                      selectedEvent.status === 'upcoming' ? 'bg-green-100 text-green-800' : 
                      selectedEvent.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                      selectedEvent.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.status === 'pending_approval' ? 'Pending Approval' : 
                       selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Title</h3>
                        <p className="mt-1">{selectedEvent.title}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Description</h3>
                        <p className="mt-1 text-sm text-gray-600">{selectedEvent.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Date</h3>
                          <p className="mt-1">{formatDate(selectedEvent.date)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Time</h3>
                          <p className="mt-1">{formatTime(selectedEvent.time)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="mt-1">{selectedEvent.location}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Organizer</h3>
                        <p className="mt-1">{selectedEvent.organizer?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{selectedEvent.organizer?.email || 'No email'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Attendees</h3>
                        <p className="mt-1">{selectedEvent.attendees?.length || 0} people</p>
                      </div>
                      
                      {selectedEvent.status === 'pending_approval' && (
                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Comment (optional)</h3>
                          <textarea
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            rows="3"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Add a comment about this event..."
                          />
                          
                          <div className="mt-4 flex gap-3">
                            <button
                              onClick={() => handleApproveEvent(selectedEvent._id)}
                              disabled={processing}
                              className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {processing ? 'Processing...' : 'Approve'}
                            </button>
                            
                            <button
                              onClick={() => handleRejectEvent(selectedEvent._id)}
                              disabled={processing}
                              className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              {processing ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex justify-between">
                          <Link
                            href={`/events/${selectedEvent._id}`}
                            target="_blank"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Event Page
                          </Link>
                          
                          <button
                            onClick={() => handleDeleteEvent(selectedEvent._id)}
                            disabled={processing}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {processing ? 'Processing...' : 'Delete Event'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No event selected</h3>
                    <p className="text-sm text-gray-500">
                      Select an event from the list to view its details
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 