'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Create context
const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Load notification from localStorage on component mount
  useEffect(() => {
    const savedNotification = localStorage.getItem('adminNotification');
    if (savedNotification) {
      setNotification(JSON.parse(savedNotification));
      setShowNotification(true);
    }
  }, []);

  // Save notification to localStorage
  const updateNotification = (notificationData) => {
    if (notificationData) {
      localStorage.setItem('adminNotification', JSON.stringify(notificationData));
    } else {
      localStorage.removeItem('adminNotification');
    }
    setNotification(notificationData);
    setShowNotification(!!notificationData);
  };

  // Remove notification
  const removeNotification = () => {
    localStorage.removeItem('adminNotification');
    setNotification(null);
    setShowNotification(false);
  };

  // Toggle visibility
  const toggleNotificationVisibility = () => {
    setShowNotification(prev => !prev);
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        notification, 
        showNotification, 
        updateNotification, 
        removeNotification,
        toggleNotificationVisibility
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotification() {
  return useContext(NotificationContext);
} 