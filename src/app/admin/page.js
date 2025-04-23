'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    upcomingEvents: 0,
    totalRSVPs: 0,
    pendingApproval: 0,
  });

  useEffect(() => {
    // Redirect if not admin
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      router.push('/');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated' || session?.user?.role !== 'admin') return;
      
      try {
        setLoading(true);
        
        // Fetch events
        const eventsResponse = await fetch('/api/events');
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
        
        // Filter pending approval events
        const pending = eventsData.filter(e => e.status === 'pending_approval');
        setPendingEvents(pending);
        
        // Calculate stats
        const upcomingEvents = eventsData.filter(e => e.status === 'upcoming').length;
        const totalRSVPs = eventsData.reduce((sum, event) => sum + event.attendees.length, 0);
        
        // Fetch users (would be a separate endpoint in a real app)
        // For demo purposes, we'll extract unique users from events
        const userIds = new Set();
        eventsData.forEach(event => {
          userIds.add(event.organizer._id);
          event.attendees.forEach(attendee => {
            if (attendee.user._id) {
              userIds.add(attendee.user._id);
            }
          });
        });
        
        // In a real app, you would fetch actual user data
        // This is a simplified version for demo purposes
        const usersArray = Array.from(userIds).map(id => {
          const organizedEvent = eventsData.find(e => e.organizer._id === id);
          const attendee = eventsData.flatMap(e => e.attendees).find(a => a.user._id === id);
          
          if (organizedEvent) {
            return {
              _id: id,
              name: organizedEvent.organizer.name,
              email: organizedEvent.organizer.email,
              role: id === session.user.id ? 'admin' : 'user',
              eventsOrganized: eventsData.filter(e => e.organizer._id === id).length,
              eventsAttended: eventsData.filter(e => e.attendees.some(a => a.user._id === id)).length,
            };
          } else if (attendee) {
            return {
              _id: id,
              name: attendee.user.name,
              email: attendee.user.email,
              role: id === session.user.id ? 'admin' : 'user',
              eventsOrganized: 0,
              eventsAttended: eventsData.filter(e => e.attendees.some(a => a.user._id === id)).length,
            };
          }
          
          return null;
        }).filter(Boolean);
        
        setUsers(usersArray);
        
        setStats({
          totalEvents: eventsData.length,
          totalUsers: usersArray.length,
          upcomingEvents,
          totalRSVPs,
          pendingApproval: pending.length,
        });
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, status]);

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      toast.success('Event deleted successfully');
      // Update events list
      setEvents(events.filter(event => event._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const handleApproveEvent = async (eventId) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'upcoming' }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve event');
      }

      // Update the events lists
      const updatedEvent = await response.json();
      
      // Remove from pending events
      setPendingEvents(pendingEvents.filter(event => event._id !== eventId));
      
      // Update in main events list
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, status: 'upcoming' } : event
      ));
      
      // Update stats
      setStats({
        ...stats,
        pendingApproval: stats.pendingApproval - 1,
        upcomingEvents: stats.upcomingEvents + 1,
      });

      toast.success('Event approved successfully');
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Failed to approve event');
    }
  };

  const handleRejectEvent = async (eventId) => {
    if (!confirm('Are you sure you want to reject this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject event');
      }

      // Remove from pending events
      setPendingEvents(pendingEvents.filter(event => event._id !== eventId));
      
      // Update in main events list
      setEvents(events.map(event => 
        event._id === eventId ? { ...event, status: 'rejected' } : event
      ));
      
      // Update stats
      setStats({
        ...stats,
        pendingApproval: stats.pendingApproval - 1,
      });

      toast.success('Event rejected');
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Failed to reject event');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return null; // Will redirect from useEffect
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect from useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-lg text-gray-600">Manage events, users, and system settings</p>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href="/admin/events" className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Events</h3>
                  <p className="text-sm text-gray-500">Review, edit, and manage all events</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/delete-requests" className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Delete Requests</h3>
                  <p className="text-sm text-gray-500">Review and process account deletion requests</p>
                </div>
              </div>
            </Link>
            
            <Link href="/admin/users" className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                  <p className="text-sm text-gray-500">View and manage user accounts</p>
                </div>
              </div>
            </Link>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Events</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalEvents}</dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Events</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.upcomingEvents}</dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total RSVPs</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.totalRSVPs}</dd>
                </dl>
              </div>
            </div>
            
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Approval</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.pendingApproval}</dd>
                </dl>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('events')}
                  className={`${
                    activeTab === 'events'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Events
                </button>
                <button
                  onClick={() => setActiveTab('approval')}
                  className={`${
                    activeTab === 'approval'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Approval {stats.pendingApproval > 0 && <span className="ml-2 bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-0.5 rounded-full">{stats.pendingApproval}</span>}
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`${
                    activeTab === 'settings'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                >
                  Settings
                </button>
              </nav>
            </div>
            
            <div className="p-6">
              {/* Approval Tab */}
              {activeTab === 'approval' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Events Pending Approval</h2>
                  </div>
                  
                  {pendingEvents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Pending Approval</h3>
                      <p className="text-gray-600">All events have been reviewed.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organizer</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pendingEvents.map((event) => (
                            <tr key={event._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{event.organizer.name}</div>
                                <div className="text-sm text-gray-500">{event.organizer.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {format(new Date(event.date), 'dd MMM yyyy')}
                                </div>
                                <div className="text-sm text-gray-500">{event.time}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.location}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex space-x-2 justify-end">
                                  <Link href={`/events/${event._id}`} className="text-indigo-600 hover:text-indigo-900">
                                    View
                                  </Link>
                                  <button
                                    onClick={() => handleApproveEvent(event._id)}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectEvent(event._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {/* Events Tab */}
              {activeTab === 'events' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">All Events</h2>
                    <Link
                      href="/events/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Create Event
                    </Link>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Attendees
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Organizer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {events.length > 0 ? (
                          events.map((event) => (
                            <tr key={event._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                                    <div className="text-sm text-gray-500">{event.location}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {event.date && format(new Date(event.date), 'MMM d, yyyy')}
                                </div>
                                <div className="text-sm text-gray-500">{event.time}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  event.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                                  event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                  event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.attendees.filter(a => a.status === 'attending').length} / {event.capacity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{event.organizer.name}</div>
                                <div className="text-sm text-gray-500">{event.organizer.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Link 
                                    href={`/events/${event._id}`}
                                    className="text-indigo-600 hover:text-indigo-900"
                                  >
                                    View
                                  </Link>
                                  <Link 
                                    href={`/events/${event._id}/edit`}
                                    className="text-yellow-600 hover:text-yellow-900"
                                  >
                                    Edit
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteEvent(event._id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No events found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">All Users</h2>
                  </div>
                  
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
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Events Organized
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Events Attended
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.length > 0 ? (
                          users.map((user) => (
                            <tr key={user._id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.eventsOrganized}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.eventsAttended}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">System Settings</h2>
                  
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          This is a demo admin panel. In a production environment, you would have more settings here.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Account Management Section */}
                    <div className="bg-white shadow rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Account Management</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Manage account deletion requests and user accounts.
                      </p>
                      <div className="flex space-x-4">
                        <Link
                          href="/admin/delete-requests"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          View Deletion Requests
                        </Link>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Email Notifications</h3>
                      <div className="flex items-center">
                        <input
                          id="enable-notifications"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          defaultChecked={true}
                        />
                        <label htmlFor="enable-notifications" className="ml-2 block text-sm text-gray-900">
                          Enable system email notifications
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Event Settings</h3>
                      <div className="flex items-center mb-3">
                        <input
                          id="auto-approve"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          defaultChecked={true}
                        />
                        <label htmlFor="auto-approve" className="ml-2 block text-sm text-gray-900">
                          Auto-approve new events
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="private-default"
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          defaultChecked={false}
                        />
                        <label htmlFor="private-default" className="ml-2 block text-sm text-gray-900">
                          Make new events private by default
                        </label>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow rounded-md p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">System Maintenance</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        These actions affect the entire system. Use with caution.
                      </p>
                      <div className="flex space-x-4">
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                          onClick={() => toast.success('Database backup initiated')}
                        >
                          Backup Database
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                          onClick={() => toast.success('Cache cleared successfully')}
                        >
                          Clear Cache
                        </button>
                      </div>
                    </div>
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