'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [userEvents, setUserEvents] = useState({
    organizedEvents: [],
    attendingEvents: [],
    maybeEvents: [],
    pastEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Could not load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId && status === 'authenticated') {
      fetchUserData();
    }
  }, [userId, status]);

  // Fetch user events
  useEffect(() => {
    const fetchUserEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/events`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user events');
        }
        
        const data = await response.json();
        setUserEvents({
          organizedEvents: data.organizedEvents || [],
          attendingEvents: data.attendingEvents || [],
          maybeEvents: data.maybeEvents || [],
          pastEvents: data.pastEvents || [],
        });
      } catch (err) {
        console.error('Error fetching user events:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId && status === 'authenticated' && user) {
      fetchUserEvents();
    }
  }, [userId, status, user]);

  if (status === 'loading' || (loading && !user && !error)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-xl font-semibold text-red-600 mb-4">Error</h1>
              <p className="text-gray-700">{error}</p>
              <Link href="/events" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                Back to Events
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-xl font-semibold text-gray-900 mb-4">User Not Found</h1>
              <p className="text-gray-700">The user you're looking for does not exist or has been deleted.</p>
              <Link href="/events" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
                Back to Events
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const getEventsForActiveTab = () => {
    switch (activeTab) {
      case 'upcoming':
        return userEvents.attendingEvents;
      case 'maybe':
        return userEvents.maybeEvents;
      case 'past':
        return userEvents.pastEvents;
      case 'organized':
        return userEvents.organizedEvents;
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/4">
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center text-gray-600">
                      {user.profilePicture ? (
                        <Image 
                          src={user.profilePicture}
                          alt={user.name}
                          width={96}
                          height={96}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                    <p className="text-gray-600 mt-1">{user.email}</p>
                    
                    {/* Contact Information */}
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                      
                      <div className="text-left">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium">{user.email}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Username:</span>
                          <span className="font-medium">
                            {user.username || 'Not set'}
                          </span>
                        </div>
                        
                        {session?.user?.role === 'admin' && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Role:</span>
                            <span className={`font-medium ${
                              user.role === 'admin' ? 'text-purple-600' : 'text-green-600'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {session?.user?.id === userId && (
                      <div className="mt-6">
                        <Link
                          href="/profile/edit"
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Edit Profile
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="sm:w-3/4">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Event Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-600">{userEvents.organizedEvents.length}</span>
                        <span className="text-sm text-gray-500">Events Organized</span>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-green-600">{userEvents.attendingEvents.length}</span>
                        <span className="text-sm text-gray-500">Attending</span>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-yellow-600">{userEvents.maybeEvents.length}</span>
                        <span className="text-sm text-gray-500">Maybe</span>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-gray-600">{userEvents.pastEvents.length}</span>
                        <span className="text-sm text-gray-500">Past Events</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4 border-b border-gray-200">
                      <nav className="flex -mb-px">
                        <button
                          onClick={() => setActiveTab('upcoming')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                            activeTab === 'upcoming'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Upcoming Events
                        </button>
                        <button
                          onClick={() => setActiveTab('maybe')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                            activeTab === 'maybe'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Maybe
                        </button>
                        <button
                          onClick={() => setActiveTab('past')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm mr-8 ${
                            activeTab === 'past'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Past Events
                        </button>
                        <button
                          onClick={() => setActiveTab('organized')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'organized'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Organized
                        </button>
                      </nav>
                    </div>
                    
                    {loading ? (
                      <div className="py-10 flex justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getEventsForActiveTab().length > 0 ? (
                          getEventsForActiveTab().map(event => (
                            <div key={event._id} className="bg-white shadow rounded-lg p-4 border border-gray-200">
                              <div className="sm:flex sm:items-center sm:justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">
                                    <Link href={`/events/${event._id}`} className="hover:text-indigo-600">
                                      {event.title}
                                    </Link>
                                  </h4>
                                  <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-2">
                                    <span>{format(new Date(event.date), 'MMM d, yyyy')}</span>
                                    <span>•</span>
                                    <span>{event.time}</span>
                                    <span>•</span>
                                    <span>{event.location}</span>
                                  </div>
                                </div>
                                <Link
                                  href={`/events/${event._id}`}
                                  className="mt-3 sm:mt-0 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  View Details
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <p className="text-gray-500 mb-4">
                              {activeTab === 'upcoming' && 'No upcoming events found.'}
                              {activeTab === 'maybe' && 'No "maybe" responses to events.'}
                              {activeTab === 'past' && 'No past events found.'}
                              {activeTab === 'organized' && 'No organized events found.'}
                            </p>
                            <div className="mt-2">
                              {activeTab === 'organized' ? (
                                <Link
                                  href="/events/create"
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Create an Event
                                </Link>
                              ) : (
                                <Link
                                  href="/events"
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                  Explore Events
                                </Link>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 