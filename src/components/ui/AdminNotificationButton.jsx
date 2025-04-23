'use client';

import { useSession } from 'next-auth/react';
import { useNotification } from '@/providers/NotificationProvider';

export default function AdminNotificationButton() {
  const { data: session } = useSession();
  const { notification, updateNotification, toggleNotificationVisibility } = useNotification();
  
  // Only show for admins
  if (session?.user?.role !== 'admin') {
    return null;
  }

  const handleAddNotification = () => {
    if (!notification) {
      // Create a new default notification
      updateNotification({
        text: 'New announcement for all users',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // If notification exists but is hidden, just show it
      toggleNotificationVisibility();
    }
  };

  return (
    <button
      onClick={handleAddNotification}
      className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-full p-3 shadow-lg hover:bg-indigo-700 transition-colors z-40"
      title="Manage notification"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    </button>
  );
} 