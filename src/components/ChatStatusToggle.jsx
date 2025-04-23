import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function ChatStatusToggle({ onStatusChange }) {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isAdmin = session?.user?.role === 'admin';
  
  useEffect(() => {
    const fetchChatStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/chat/status');
        if (!response.ok) throw new Error('Failed to fetch chat status');
        
        const data = await response.json();
        setIsOnline(data.isOnline);
        
        // Notify parent component if provided
        if (onStatusChange) {
          onStatusChange(data.isOnline);
        }
      } catch (error) {
        console.error('Error fetching chat status:', error);
        toast.error('Could not load chat status');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatStatus();
    
    // Refresh status every minute
    const intervalId = setInterval(fetchChatStatus, 60000);
    return () => clearInterval(intervalId);
  }, [onStatusChange]);
  
  const toggleChatStatus = async () => {
    if (!isAdmin) return;
    
    try {
      setIsUpdating(true);
      const newStatus = !isOnline;
      
      const response = await fetch('/api/chat/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update chat status');
      
      const data = await response.json();
      setIsOnline(data.isOnline);
      toast.success(`Chat is now ${data.isOnline ? 'Online' : 'Offline'}`);
      
      // Notify parent component if provided
      if (onStatusChange) {
        onStatusChange(data.isOnline);
      }
    } catch (error) {
      console.error('Error updating chat status:', error);
      toast.error('Could not update chat status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center text-gray-500">Loading chat status...</div>;
  }
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        <span className="mr-2 text-sm font-medium">Chat Status:</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      
      {isAdmin && (
        <button
          onClick={toggleChatStatus}
          disabled={isUpdating}
          className={`px-3 py-1 text-xs font-medium rounded-md ${
            isUpdating 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isOnline 
                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                : 'bg-green-100 text-green-800 hover:bg-green-200'
          }`}
        >
          {isUpdating ? 'Updating...' : isOnline ? 'Set Offline' : 'Set Online'}
        </button>
      )}
    </div>
  );
} 