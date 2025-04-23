'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [storeStatus, setStoreStatus] = useState({ isOnline: false, loading: true });
  const dropdownRef = useRef(null);

  const isActive = (path) => pathname === path;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  // Toggle store online status (admin only)
  const toggleStoreStatus = async () => {
    try {
      setStoreStatus(prev => ({ ...prev, loading: true }));
      
      const response = await fetch('/api/store/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isOnline: !storeStatus.isOnline }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update store status');
      }
      
      const data = await response.json();
      setStoreStatus({ isOnline: data.isOnline, loading: false });
      toast.success(`Store is now ${data.isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error toggling store status:', error);
      toast.error('Failed to update store status');
      setStoreStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch store status
  useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const response = await fetch('/api/store/status');
        if (response.ok) {
          const data = await response.json();
          setStoreStatus({ isOnline: data.isOnline, loading: false });
        }
      } catch (error) {
        console.error('Error fetching store status:', error);
        setStoreStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStoreStatus();
    
    // Polling for updates every 30 seconds
    const interval = setInterval(fetchStoreStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-2xl font-bold text-indigo-600">RSVP App</span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Home
              </Link>
              
              <Link 
                href="/events" 
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  pathname.startsWith('/events') 
                    ? 'border-indigo-500 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Events
              </Link>
              
              {status === 'authenticated' && (
                <Link 
                  href="/chat" 
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname.startsWith('/chat') 
                      ? 'border-indigo-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Messages
                </Link>
              )}
              
              {session?.user?.role === 'admin' && (
                <Link
                  href="/admin"
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname.startsWith('/admin') 
                      ? 'border-indigo-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Admin
                </Link>
              )}
              
              {/* Store Status Indicator for all users */}
              <div className="inline-flex items-center px-1 pt-1 text-sm">
                <span className="mr-2">Store:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  storeStatus.loading 
                    ? 'bg-gray-100 text-gray-800' 
                    : storeStatus.isOnline
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {storeStatus.loading 
                    ? 'Loading...' 
                    : storeStatus.isOnline 
                      ? 'Open' 
                      : 'Closed'}
                </span>
              </div>
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Admin Online/Offline Toggle */}
            {session?.user?.role === 'admin' && (
              <div className="mr-4">
                <button
                  onClick={toggleStoreStatus}
                  disabled={storeStatus.loading}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                    storeStatus.isOnline ? 'bg-green-600' : 'bg-gray-300'
                  } transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  role="switch"
                  aria-checked={storeStatus.isOnline}
                >
                  <span className="sr-only">
                    {storeStatus.isOnline ? 'Store Online' : 'Store Offline'}
                  </span>
                  <span
                    className={`${
                      storeStatus.isOnline ? 'translate-x-5' : 'translate-x-1'
                    } inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200`}
                  />
                </button>
              </div>
            )}
            
            {status === 'authenticated' ? (
              <div className="flex items-center space-x-4">
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      pathname.startsWith('/profile') 
                        ? 'border-indigo-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Profile
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                      <div className="py-1">
                        <Link 
                          href="/profile" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          My Profile
                        </Link>
                        <Link 
                          href="/profile/edit" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          Edit Profile
                        </Link>
                        <Link 
                          href="/chat" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          Messages
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={handleSignOut}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/login" 
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Sign In
                </Link>
                <Link 
                  href="/register" 
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive('/')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </Link>
          
          <Link
            href="/events"
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              pathname.startsWith('/events')
                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
            }`}
            onClick={() => setMobileMenuOpen(false)}
          >
            Events
          </Link>
          
          {/* Store Status Indicator for all users (mobile) */}
          <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 flex items-center">
            <span className="mr-2">Store:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              storeStatus.loading 
                ? 'bg-gray-100 text-gray-800' 
                : storeStatus.isOnline
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {storeStatus.loading 
                ? 'Loading...' 
                : storeStatus.isOnline 
                  ? 'Open' 
                  : 'Closed'}
            </span>
          </div>
          
          {/* Admin Store Toggle (mobile) */}
          {session?.user?.role === 'admin' && (
            <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 flex items-center">
              <span className="mr-2">Store Status:</span>
              <button
                onClick={toggleStoreStatus}
                disabled={storeStatus.loading}
                className={`relative inline-flex items-center h-6 rounded-full w-11 ${
                  storeStatus.isOnline ? 'bg-green-600' : 'bg-gray-300'
                } transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                role="switch"
                aria-checked={storeStatus.isOnline}
              >
                <span className="sr-only">
                  {storeStatus.isOnline ? 'Store Online' : 'Store Offline'}
                </span>
                <span
                  className={`${
                    storeStatus.isOnline ? 'translate-x-5' : 'translate-x-1'
                  } inline-block w-4 h-4 transform bg-white rounded-full transition ease-in-out duration-200`}
                />
              </button>
            </div>
          )}
          
          {status === 'authenticated' && (
            <Link
              href="/chat"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname.startsWith('/chat')
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Messages
            </Link>
          )}
          
          {session?.user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                pathname.startsWith('/admin')
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          
          {status === 'authenticated' ? (
            <>
              <Link
                href="/profile"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname.startsWith('/profile') && pathname === '/profile'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                My Profile
              </Link>
              
              <Link
                href="/profile/edit"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === '/profile/edit'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Edit Profile
              </Link>
              
              <Link
                href="/chat"
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname.startsWith('/chat')
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Messages
              </Link>
              
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 