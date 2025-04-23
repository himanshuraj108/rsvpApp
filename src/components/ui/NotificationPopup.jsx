'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/providers/NotificationProvider';

export default function NotificationPopup() {
  const { data: session } = useSession();
  const { notification, showNotification, removeNotification, toggleNotificationVisibility, updateNotification } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (notification) {
      setEditedText(notification.text);
      setIsPublic(notification.isPublic);
    }
  }, [notification]);

  // If there's no notification or it's private and user is not admin, don't show
  if (!notification || (!isPublic && !isAdmin) || !showNotification) {
    return null;
  }

  const handleSave = () => {
    const newNotification = {
      text: editedText,
      isPublic: isPublic,
      createdAt: notification?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    updateNotification(newNotification);
    setIsEditing(false);
  };

  const toggleVisibility = () => {
    setIsPublic(!isPublic);
  };

  // Background color based on visibility
  const bgColor = isPublic ? 'bg-blue-50' : 'bg-yellow-50';
  const borderColor = isPublic ? 'border-blue-200' : 'border-yellow-200';

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-md ${bgColor} border ${borderColor} rounded-lg shadow-lg p-4`}>
      {isEditing && isAdmin ? (
        <>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-2 min-h-[100px]"
            placeholder="Enter notification text..."
          />
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <label className="inline-flex items-center mr-4">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={toggleVisibility}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2 text-sm text-gray-700">Public</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-indigo-600 text-white rounded text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between">
            <div className="flex-1 pr-4">
              <p className="text-gray-800">{notification.text}</p>
              {notification.updatedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Updated: {new Date(notification.updatedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-start space-x-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 hover:text-indigo-800"
                    title="Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={removeNotification}
                    className="text-red-600 hover:text-red-800"
                    title="Remove"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </>
              )}
              <button
                onClick={toggleNotificationVisibility}
                className="text-gray-600 hover:text-gray-800"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 