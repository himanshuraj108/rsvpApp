'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

export default function AdminSetupPage() {
  const [adminStatus, setAdminStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/users/check-admin');
        const data = await response.json();
        setAdminStatus(data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setMessage('Error checking admin status');
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      router.push('/');
    }
  }, [session, router]);

  const createAdmin = async () => {
    setCreating(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/users/create-admin');
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setAdminStatus({ ...adminStatus, adminExists: data.created });
      } else {
        setMessage(data.message || 'Error creating admin user');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setMessage('Error creating admin user');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50">
              <h1 className="text-2xl font-bold text-gray-900">Admin Setup</h1>
              <p className="mt-1 text-sm text-gray-600">
                Check and create admin account if needed
              </p>
            </div>
            
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900">Admin Status</h2>
                    {adminStatus && (
                      <div className="mt-2">
                        <p>Admin Email: {adminStatus.adminEmail}</p>
                        <p className="mt-1">
                          Status: {adminStatus.adminExists ? (
                            <span className="text-green-600 font-medium">Admin user exists</span>
                          ) : (
                            <span className="text-red-600 font-medium">Admin user does not exist</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {adminStatus && !adminStatus.adminExists && (
                    <div className="mt-4">
                      <button
                        onClick={createAdmin}
                        disabled={creating}
                        className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70"
                      >
                        {creating ? 'Creating Admin...' : 'Create Admin User'}
                      </button>
                    </div>
                  )}
                  
                  {adminStatus && adminStatus.adminExists && (
                    <div className="mt-4">
                      <Link
                        href="/login"
                        className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Go to Login
                      </Link>
                    </div>
                  )}
                  
                  {message && (
                    <div className={`mt-4 p-3 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {message}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}