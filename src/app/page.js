'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/ui/Header';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

export default function Home() {
  const { data: session } = useSession();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events?status=upcoming');
        if (!response.ok) {
          console.error('API error:', response.status);
          setFeaturedEvents([]);
          return;
        }
        
        const data = await response.json();
        
        // Check if data is an array before using slice
        if (Array.isArray(data)) {
          setFeaturedEvents(data.slice(0, 3));
        } else {
          console.error('API did not return an array:', data);
          setFeaturedEvents([]);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setFeaturedEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-indigo-700 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-indigo-600 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Simplify Event Management and RSVPs
          </h1>
          <p className="text-xl max-w-3xl mb-8">
            Create events, track attendance, and manage RSVPs with our comprehensive platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {session ? (
              <Link href="/events/create" className="px-8 py-3 bg-white text-indigo-700 font-medium rounded-md shadow-md hover:bg-gray-100 transition-colors">
                Create an Event
              </Link>
            ) : (
              <Link href="/register" className="px-8 py-3 bg-white text-indigo-700 font-medium rounded-md shadow-md hover:bg-gray-100 transition-colors">
                Get Started
              </Link>
            )}
            <Link href="/events" className="px-8 py-3 bg-transparent border border-white text-white font-medium rounded-md hover:bg-white/10 transition-colors">
              Explore Events
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Powerful Features for Event Organizers
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Everything you need to create and manage successful events
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Event Creation</h3>
              <p className="text-gray-600">
                Create events in minutes with our intuitive interface. Set dates, capacities, and customize all details.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time RSVP Tracking</h3>
              <p className="text-gray-600">
                Instantly see who&apos;s attending, who&apos;s declined, and manage your guest list with ease.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automated Notifications</h3>
              <p className="text-gray-600">
                Send invites, reminders, and updates automatically to keep your guests informed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Events
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Check out these upcoming events
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {featuredEvents.map((event) => (
                <Link 
                  href={`/events/${event._id}`} 
                  key={event._id}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 relative">
                    {event.image ? (
            <Image
                        src={event.image} 
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-indigo-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center text-sm text-indigo-600 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {event.date && format(new Date(event.date), 'MMMM d, yyyy')}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                    <div className="flex items-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600">No events found</p>
              {session && (
                <Link href="/events/create" className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
                  Create an Event
                </Link>
              )}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/events" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Only show admin setup link to actual admins */}
      {session?.user?.role === 'admin' && (
        <div className="mt-6">
          <Link
            href="/admin-setup"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Admin Setup
          </Link>
        </div>
      )}
    </div>
  );
}
