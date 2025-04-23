'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userEvents, setUserEvents] = useState({
    organizedEvents: [],
    attendingEvents: [],
    maybeEvents: [],
    pastEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Handle authentication status
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (status !== 'authenticated' || !session) return;
      
      try {
        const response = await fetch('/api/users/me');
        if (response.ok) {
          const data = await response.json();
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session, status]);

  // Fetch user events
  useEffect(() => {
    const fetchUserEvents = async () => {
      if (status !== 'authenticated' || !session) return;
      
      try {
        // Fetch all events
        const response = await fetch('/api/events');
        const events = await response.json();

        // Filter events
        const now = new Date();
        const organized = events.filter(e => e.organizer._id === session.user.id);
        
        const attending = events.filter(e => {
          return (
            e.attendees.some(a => 
              (a.user._id === session.user.id || a.user === session.user.id) && 
              a.status === 'attending'
            ) &&
            new Date(e.date) >= now
          );
        });
        
        const maybe = events.filter(e => {
          return (
            e.attendees.some(a => 
              (a.user._id === session.user.id || a.user === session.user.id) && 
              a.status === 'maybe'
            ) &&
            new Date(e.date) >= now
          );
        });
        
        const past = events.filter(e => {
          return (
            e.attendees.some(a => 
              (a.user._id === session.user.id || a.user === session.user.id)
            ) &&
            new Date(e.date) < now
          );
        });

        setUserEvents({
          organizedEvents: organized,
          attendingEvents: attending,
          maybeEvents: maybe,
          pastEvents: past,
        });
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load your events');
      } finally {
        setLoading(false);
      }
    };

    fetchUserEvents();
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect to login from useEffect
  }

  if (!session) {
    return null;
  }

  const { organizedEvents, attendingEvents, maybeEvents, pastEvents } = userEvents;

  // Determine which events to show based on active tab
  let eventsToShow = [];
  if (activeTab === 'upcoming') {
    eventsToShow = attendingEvents;
  } else if (activeTab === 'maybe') {
    eventsToShow = maybeEvents;
  } else if (activeTab === 'past') {
    eventsToShow = pastEvents;
  } else if (activeTab === 'organized') {
    eventsToShow = organizedEvents;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="sm:w-1/4">
                  <div className="bg-gray-100 rounded-lg p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-gray-300 mx-auto mb-4 flex items-center justify-center text-gray-600">
                      {(userData?.profilePicture || session.user.profilePicture) ? (
                        <Image 
                          src={userData?.profilePicture || session.user.profilePicture}
                          alt={userData?.name || session.user.name}
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
                    <h2 className="text-xl font-semibold text-gray-900">{session.user.name}</h2>
                    <p className="text-gray-600 mt-1">{session.user.email}</p>
                    
                    {/* Contact Information */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
                      
                      <div className="text-left">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Email:</span>
                          <span className="font-medium">{session.user.email}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-500">Username:</span>
                          <span className="font-medium">
                            {session.user.username || userData?.username || 'Not set'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Phone:</span>
                          <span className="font-medium">
                            {userData?.phone || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Link
                        href="/profile/edit"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Edit Profile
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-gray-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">My Events Summary</h3>
                    <ul className="space-y-3">
                      <li className="flex justify-between">
                        <span className="text-gray-600">Organizing</span>
                        <span className="font-semibold">{organizedEvents.length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Attending</span>
                        <span className="font-semibold">{attendingEvents.length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Maybe</span>
                        <span className="font-semibold">{maybeEvents.length}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-gray-600">Past</span>
                        <span className="font-semibold">{pastEvents.length}</span>
                      </li>
                    </ul>
                    
                    <div className="mt-6">
                      <Link
                        href="/events/create"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Create New Event
                      </Link>
                    </div>
                  </div>
                </div>
                
                <div className="sm:w-3/4">
                  <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                      <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`${
                          activeTab === 'upcoming'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Upcoming ({attendingEvents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('maybe')}
                        className={`${
                          activeTab === 'maybe'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Maybe ({maybeEvents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('past')}
                        className={`${
                          activeTab === 'past'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Past ({pastEvents.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('organized')}
                        className={`${
                          activeTab === 'organized'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Organized ({organizedEvents.length})
                      </button>
                    </nav>
                  </div>
                  
                  <div className="mt-6">
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : eventsToShow.length > 0 ? (
                      <div className="space-y-6">
                        {eventsToShow.map((event) => (
                          <Link 
                            href={`/events/${event._id}`} 
                            key={event._id}
                            className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            <div className="p-6">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                                  <div className="flex items-center mt-2 text-sm text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>
                                      {event.date && format(new Date(event.date), 'EEEE, MMMM d, yyyy')} at {event.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center mt-1 text-sm text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{event.location}</span>
                                  </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                                  event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                  event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                              </div>
                              <p className="mt-3 text-gray-600 line-clamp-2">{event.description}</p>
                              
                              {activeTab === 'organized' && (
                                <div className="mt-4 flex items-center text-sm">
                                  <span className="text-gray-500">
                                    {event.attendees.filter(a => a.status === 'attending').length} attending • 
                                    {' '}{event.attendees.filter(a => a.status === 'maybe').length} maybe • 
                                    {' '}{event.attendees.filter(a => a.status === 'declined').length} declined
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                        <p className="text-gray-600 mb-6">
                          {activeTab === 'upcoming' && "You're not attending any upcoming events."}
                          {activeTab === 'maybe' && "You haven't marked any events as 'maybe'."}
                          {activeTab === 'past' && "You haven't attended any past events."}
                          {activeTab === 'organized' && "You haven't organized any events yet."}
                        </p>
                        
                        {activeTab === 'organized' && (
                          <Link
                            href="/events/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Create Your First Event
                          </Link>
                        )}
                        
                        {activeTab !== 'organized' && (
                          <Link
                            href="/events"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Explore Events
                          </Link>
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