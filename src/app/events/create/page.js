'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  date: z.string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: 'Please enter a valid date',
    })
    .refine(val => {
      const inputDate = stripTime(new Date(val));
      return inputDate >= todayNoTime;
    }, {
      message: 'Event date cannot be in the past or today',
    }),
  time: z.string().min(1, 'Please provide event time'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  capacity: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: 'Capacity must be a positive number',
  }),
  isPrivate: z.boolean().optional(),
  registrationDeadline: z.string()
    .optional()
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'Please enter a valid date',
    })
    .refine(val => {
      if (!val) return true;
      const inputDate = stripTime(new Date(val));
      return inputDate >= todayNoTime;
    }, {
      message: 'Registration deadline cannot be in the past',
    }),
  categories: z.string().optional(),
  invitedEmails: z.string().optional(),
  sendNotifications: z.boolean().optional(),
});

export default function CreateEventPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      capacity: '',
      isPrivate: false,
      registrationDeadline: '',
      categories: '',
      invitedEmails: '',
      sendNotifications: true,
    },
  });

  // Move redirects to useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Still loading authentication status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Return null if not authenticated yet (will redirect in useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      // Convert string to number for capacity
      data.capacity = parseInt(data.capacity);
      
      // Convert categories string to array
      if (data.categories) {
        data.categories = data.categories.split(',').map(cat => cat.trim());
      } else {
        data.categories = [];
      }

      // Process invited emails
      if (data.invitedEmails) {
        data.invitedEmails = data.invitedEmails.split(',').map(email => email.trim());
      } else {
        data.invitedEmails = [];
      }

      // Add image if provided
      if (imageUrl) {
        data.image = imageUrl;
      }
      
      // Set status based on user role
      // Admin-created events are automatically approved
      // Regular user events need approval
      data.status = session?.user?.role === 'admin' ? 'upcoming' : 'pending_approval';
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || 'Failed to create event');
        setLoading(false);
        return;
      }

      if (data.status === 'pending_approval') {
        toast.success('Event created successfully! It will be visible after admin approval.');
      } else {
        toast.success('Event created successfully!');
      }
      
      router.push(`/events/${result.event._id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('An error occurred while creating the event');
      setLoading(false);
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900">Create a New Event</h1>
            <p className="mt-2 text-gray-600">Fill in the details to create your event</p>
            {session && session.user.role !== 'admin' && (
              <p className="mt-2 text-sm text-amber-600">
                Note: Your event will need admin approval before it becomes visible to others.
              </p>
            )}
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Event Title*
                </label>
                <div className="mt-1">
                  <input
                    id="title"
                    type="text"
                    className={`block w-full px-3 py-2 border ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description*
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={4}
                    className={`block w-full px-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date*
                  </label>
                  <div className="mt-1">
                    <input
                      id="date"
                      type="date"
                      min={today}
                      className={`block w-full px-3 py-2 border ${
                        errors.date ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      {...register('date')}
                    />
                    {errors.date && (
                      <p className="mt-2 text-sm text-red-600">{errors.date.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                    Time*
                  </label>
                  <div className="mt-1">
                    <input
                      id="time"
                      type="time"
                      className={`block w-full px-3 py-2 border ${
                        errors.time ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      {...register('time')}
                    />
                    {errors.time && (
                      <p className="mt-2 text-sm text-red-600">{errors.time.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location*
                </label>
                <div className="mt-1">
                  <input
                    id="location"
                    type="text"
                    className={`block w-full px-3 py-2 border ${
                      errors.location ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('location')}
                  />
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity*
                </label>
                <div className="mt-1">
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    className={`block w-full px-3 py-2 border ${
                      errors.capacity ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    {...register('capacity')}
                  />
                  {errors.capacity && (
                    <p className="mt-2 text-sm text-red-600">{errors.capacity.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Image URL (optional)
                </label>
                <div className="mt-1">
                  <input
                    id="imageUrl"
                    type="text"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="registrationDeadline" className="block text-sm font-medium text-gray-700">
                  Registration Deadline (optional)
                </label>
                <div className="mt-1">
                  <input
                    id="registrationDeadline"
                    type="date"
                    min={today}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    {...register('registrationDeadline')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-gray-700">
                  Categories (optional - separate with commas)
                </label>
                <div className="mt-1">
                  <input
                    id="categories"
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Conference, Workshop, Social"
                    {...register('categories')}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="invitedEmails" className="block text-sm font-medium text-gray-700">
                  Invite Users via Email
                </label>
                <div className="mt-1">
                  <textarea
                    id="invitedEmails"
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="user1@example.com, user2@example.com, user3@example.com"
                    {...register('invitedEmails')}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {session?.user?.role === 'admin' 
                    ? "As an admin, event details will be emailed to all comma-separated addresses above. You can also choose to notify all users who have enabled email notifications."
                    : "Enter email addresses separated by commas. Each person will receive an invitation email with details about this event."}
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="sendNotifications"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  {...register('sendNotifications')}
                  defaultChecked={session?.user?.role === 'admin'}
                  disabled={session?.user?.role === 'admin'}
                />
                <label htmlFor="sendNotifications" className="ml-2 block text-sm text-gray-900">
                  Send email invitations to all addresses listed above
                  {session?.user?.role === 'admin' && " (Always enabled for admin-created events)"}
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="isPrivate"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  {...register('isPrivate')}
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                  Private event (invitation only)
                </label>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 