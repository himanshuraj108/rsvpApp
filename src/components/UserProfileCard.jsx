import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function UserProfileCard({ userId, onClose }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching user details for:', userId);
        const response = await fetch(`/api/users/${userId}`);
        
        if (!response.ok) {
          console.error('API response error:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch user details: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('User data received:', data);
        setUser(data.user);
      } catch (err) {
        console.error('Error fetching user details:', err);
        setError(`Could not load user profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-5/6"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-red-500 text-sm">{error || 'User profile unavailable'}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-indigo-50 border-b">
        <h3 className="font-semibold text-indigo-700">User Profile</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt={user.name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-indigo-500">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h4 className="text-lg font-semibold">{user.name}</h4>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">Username:</div>
            <div className="col-span-2">{user.username || 'Not set'}</div>
          </div>
          
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">Phone:</div>
            <div className="col-span-2">{user.phone || 'Not provided'}</div>
          </div>
          
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">Address:</div>
            <div className="col-span-2">{user.address || 'Not provided'}</div>
          </div>
          
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">Email Notifications:</div>
            <div className="col-span-2">
              {user.receiveEmailNotifications ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">SMS Notifications:</div>
            <div className="col-span-2">
              {user.receiveSmsNotifications ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          
          <div className="grid grid-cols-3 text-sm">
            <div className="text-gray-500">Member Since:</div>
            <div className="col-span-2">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t">
          <Link 
            href={`/admin/users/${userId}`}
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            View Full Profile
          </Link>
        </div>
      </div>
    </div>
  );
} 