'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

// Get today's date in YYYY-MM-DD format for the min attribute
const today = new Date().toISOString().split('T')[0];

// Helper function to strip time for date comparisons
const stripTime = (dateString) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Get today with time stripped for validation
const todayNoTime = stripTime(new Date());

export default function EditEventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    capacity: 0,
    registrationDeadline: '',
    category: '',
    isPublic: true
  });

  // Fetch event data when component mounts
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    const fetchEvent = async () => {
      try {
        if (!eventId) {
          toast.error('Missing event ID');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();
        
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Event not found. It might have been deleted or doesn\'t exist.');
            router.push('/events');
          } else if (response.status === 400) {
            toast.error('Invalid event ID format');
            router.push('/events');
          } else {
            toast.error(`Error: ${data.message || 'Failed to load event'}`);
          }
          setLoading(false);
          return;
        }
        
        setEvent(data);
        
        // Format and set form data
        const eventDate = new Date(data.date);
        setFormData({
          title: data.title,
          description: data.description,
          date: format(eventDate, 'yyyy-MM-dd'),
          time: data.time,
          location: data.location,
          capacity: data.capacity,
          registrationDeadline: data.registrationDeadline ? format(new Date(data.registrationDeadline), 'yyyy-MM-dd') : '',
          category: data.category || '',
          isPublic: data.isPublic
        });
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Failed to load event details. Please try again later.');
        router.push('/events');
      } finally {
        setLoading(false);
      }
    };

    if (eventId && status === 'authenticated') {
      fetchEvent();
    }
  }, [eventId, status, router]);

  // Check if user is authorized to edit this event
  useEffect(() => {
    if (event && session) {
      const isOrganizer = event.organizer._id === session.user.id;
      const isAdmin = session.user.role === 'admin';
      
      if (!isOrganizer && !isAdmin) {
        toast.error('You are not authorized to edit this event');
        router.push(`/events/${eventId}`);
      }
    }
  }, [event, session, eventId, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Basic validation
      if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
        toast.error('Please fill in all required fields');
        setSubmitting(false);
        return;
      }
      
      // Validate date is not in the past
      const eventDate = stripTime(new Date(formData.date));
      
      if (eventDate < todayNoTime) {
        toast.error('Event date cannot be in the past or today');
        setSubmitting(false);
        return;
      }
      
      // Validate registration deadline
      if (formData.registrationDeadline) {
        const deadlineDate = stripTime(new Date(formData.registrationDeadline));
        if (deadlineDate < todayNoTime) {
          toast.error('Registration deadline cannot be in the past');
          setSubmitting(false);
          return;
        }
      }
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      
      toast.success('Event updated successfully');
      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
              <Link
                href={`/events/${eventId}`}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Event
              </Link>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    min={today}
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    id="time"
                    required
                    value={formData.time}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  id="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    min="1"
                    required
                    value={formData.capacity}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="">Select a category</option>
                    <option value="Social">Social</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Technology">Technology</option>
                    <option value="Arts">Arts</option>
                    <option value="Sports">Sports</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  name="registrationDeadline"
                  id="registrationDeadline"
                  min={today}
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
                  Public event (anyone can view and RSVP)
                </label>
              </div>
              
              <div className="flex justify-end pt-5">
                <Link
                  href={`/events/${eventId}`}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 