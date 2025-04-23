'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatList from '@/components/ChatList';
import Link from 'next/link';
import ChatStatusToggle from '@/components/ChatStatusToggle';

export default function ChatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {session?.user?.role === 'admin' ? 'Support Chats' : 'My Messages'}
            </h1>
            <div className="flex items-center space-x-4">
              <ChatStatusToggle />
              <Link 
                href="/dashboard" 
                className="text-blue-500 hover:text-blue-700 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
          
          {session?.user?.role === 'admin' ? (
            <p className="text-gray-600 mb-4">
              All user support conversations are listed below. You can respond to users and manage their inquiries.
            </p>
          ) : (
            <p className="text-gray-600 mb-4">
              Have a question or need help with something? Start a conversation with our support team below.
            </p>
          )}
        </div>

        <ChatList />
      </div>
    </div>
  );
} 