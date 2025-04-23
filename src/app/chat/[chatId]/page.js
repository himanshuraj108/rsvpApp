"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ChatPage({ params }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const chatId = unwrappedParams.chatId;
  
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch chat details
  const fetchChatDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat/${chatId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Chat not found');
        } else {
          throw new Error('Failed to fetch chat details');
        }
      } else {
        const data = await res.json();
        setChat(data.chat);
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
      setError('Something went wrong. Please try again later.');
      toast.error('Failed to load chat details');
    } finally {
      setLoading(false);
    }
  };

  // Close chat (for admins)
  const closeChat = async () => {
    try {
      const res = await fetch(`/api/chat/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to close chat');
      }
      
      toast.success('Chat closed successfully');
      router.push('/chat');
    } catch (error) {
      console.error('Error closing chat:', error);
      toast.error('Failed to close chat');
    }
  };

  // Load chat on mount
  useEffect(() => {
    if (session && chatId) {
      fetchChatDetails();
    }
  }, [session, chatId]);

  // Handle authentication
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading && !chat) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-4">Error</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <Link href="/chat" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/chat" className="flex items-center gap-2 text-blue-500 hover:text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back to All Messages</span>
          </Link>
          
          {session?.user?.role === 'admin' && chat?.isActive && (
            <button
              onClick={closeChat}
              className="text-red-500 hover:text-red-700 flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <span>Close Chat</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[70vh]">
          {chat ? (
            <ChatInterface 
              chatId={chatId} 
              onClose={() => router.push('/chat')}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <p className="text-gray-500">No chat information available.</p>
              <Link href="/chat" className="mt-4 text-blue-500 hover:text-blue-700">
                Back to Messages
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 