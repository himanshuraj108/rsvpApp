'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [processing, setProcessing] = useState(false);

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

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (status !== 'authenticated' || !session || session.user.role !== 'admin') return;
      
      try {
        const response = await fetch('/api/users');
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
          setFilteredUsers(data.users);
        } else {
          toast.error('Failed to load users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('An error occurred while loading users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [status, session]);

  // Filter users when search changes
  useEffect(() => {
    if (search.trim() === '') {
      setFilteredUsers(users);
      return;
    }
    
    const searchLower = search.toLowerCase();
    const filtered = users.filter(user => 
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower))
    );
    
    setFilteredUsers(filtered);
  }, [users, search]);

  const handleViewUser = (user) => {
    setSelectedUser(user);
  };

  const handleToggleAdmin = async (userId, isCurrentlyAdmin) => {
    if (!confirm(`Are you sure you want to ${isCurrentlyAdmin ? 'remove' : 'grant'} admin privileges to this user?`)) {
      return;
    }
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          role: isCurrentlyAdmin ? 'user' : 'admin' 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Admin privileges ${isCurrentlyAdmin ? 'removed' : 'granted'} successfully`);
        
        // Update the users list
        setUsers(prev => 
          prev.map(user => 
            user._id === userId 
              ? { ...user, role: isCurrentlyAdmin ? 'user' : 'admin' }
              : user
          )
        );
        
        // Update the selected user if it's the one being modified
        if (selectedUser && selectedUser._id === userId) {
          setSelectedUser(prev => ({ ...prev, role: isCurrentlyAdmin ? 'user' : 'admin' }));
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('An error occurred while updating user role');
    } finally {
      setProcessing(false);
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin Dashboard
            </Link>
          </div>
          
          {/* Search */}
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <div className="relative max-w-xs">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Users List */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">Users</h2>
                  <span className="text-sm text-gray-500">
                    {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
                  </span>
                </div>
                
                <div className="border-t border-gray-200">
                  {filteredUsers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No users found matching your criteria
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <li key={user._id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                {user.name}
                                {user._id === session.user.id && ' (You)'}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                              {user.username && (
                                <p className="text-xs text-gray-500 mt-1">Username: {user.username}</p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() => handleViewUser(user)}
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
            
            {/* User Details */}
            <div className="lg:w-1/3">
              {selectedUser ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">User Details</h2>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Name</h3>
                        <p className="mt-1">{selectedUser.name}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="mt-1">{selectedUser.email}</p>
                      </div>
                      
                      {selectedUser.username && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Username</h3>
                          <p className="mt-1">{selectedUser.username}</p>
                        </div>
                      )}
                      
                      {selectedUser.phone && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                          <p className="mt-1">{selectedUser.phone}</p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Created</h3>
                        <p className="mt-1">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      
                      {selectedUser._id !== session.user.id && (
                        <div className="pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleToggleAdmin(selectedUser._id, selectedUser.role === 'admin')}
                            disabled={processing}
                            className={`inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                              selectedUser.role === 'admin'
                                ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                                : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50`}
                          >
                            {processing 
                              ? 'Processing...' 
                              : selectedUser.role === 'admin'
                                ? 'Remove Admin Privileges'
                                : 'Grant Admin Privileges'
                            }
                          </button>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t border-gray-200">
                        <Link
                          href={`/profile/${selectedUser._id}`}
                          target="_blank"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <div className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No user selected</h3>
                    <p className="text-sm text-gray-500">
                      Select a user from the list to view their details
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