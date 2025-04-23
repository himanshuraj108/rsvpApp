import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ChatList() {
  const { data: session } = useSession();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatStatus, setChatStatus] = useState({ isOnline: true, isLoading: true });
  const isAdmin = session?.user?.role === 'admin';

  // Fetch chat status
  const fetchChatStatus = async () => {
    try {
      const res = await fetch('/api/chat/status');
      if (!res.ok) throw new Error('Failed to fetch chat status');
      
      const data = await res.json();
      setChatStatus({ isOnline: data.isOnline, isLoading: false });
    } catch (error) {
      console.error('Error fetching chat status:', error);
      setChatStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Fetch all chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chat');
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Server response:', res.status, errorData);
        throw new Error(`Failed to fetch chats: ${res.status} ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await res.json();
      console.log('Chats data:', data);
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error(error.message || 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  // Create a new chat (for regular users)
  const createNewChat = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialMessage: 'Hello, I need assistance.' }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create chat');
      }
      
      const data = await res.json();
      
      // Refresh chat list
      fetchChats();
      
      // Return the new chat ID for redirect
      return data.chat._id;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create new chat');
      return null;
    }
  };

  // Format the last message for preview
  const formatLastMessage = (chat) => {
    if (!chat.messages || chat.messages.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = chat.messages[chat.messages.length - 1];
    let sender = lastMessage.sender === session?.user?.id ? 'You' : 'Admin';
    
    if (isAdmin) {
      sender = lastMessage.sender === session?.user?.id ? 'You' : 'User';
    }
    
    const content = lastMessage.content.length > 25
      ? `${lastMessage.content.substring(0, 25)}...`
      : lastMessage.content;
      
    return `${sender}: ${content}`;
  };

  // Count unread messages
  const countUnreadMessages = (chat) => {
    if (!chat.messages) return 0;
    
    return chat.messages.filter(
      msg => !msg.isRead && msg.sender !== session?.user?.id
    ).length;
  };

  // Load chats and status on mount
  useEffect(() => {
    if (session) {
      fetchChats();
      fetchChatStatus();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show offline message for regular users when chat is offline
  if (!isAdmin && !chatStatus.isLoading && !chatStatus.isOnline) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <span className="mr-2 h-2 w-2 rounded-full bg-red-500"></span>
              Support Offline
            </span>
          </div>
          <p className="text-gray-600 mb-2">Our support team is currently offline.</p>
          <p className="text-gray-500 text-sm">Please check back later or send an email to support@example.com for urgent matters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Messages</h2>
        {!isAdmin && chatStatus.isOnline && (
          <button
            onClick={async () => {
              const newChatId = await createNewChat();
              if (newChatId) {
                window.location.href = `/chat/${newChatId}`;
              }
            }}
            className="bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
          >
            New Message
          </button>
        )}
      </div>

      {chats.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {isAdmin ? (
            <p>No support chats available.</p>
          ) : chatStatus.isOnline ? (
            <div>
              <p className="mb-2">You don't have any message threads yet.</p>
              <button
                onClick={async () => {
                  const newChatId = await createNewChat();
                  if (newChatId) {
                    window.location.href = `/chat/${newChatId}`;
                  }
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            <p>Support is offline. Please check back later.</p>
          )}
        </div>
      ) : (
        <ul className="divide-y">
          {chats.map((chat) => {
            const unreadCount = countUnreadMessages(chat);
            const lastUpdated = new Date(chat.lastUpdated || chat.createdAt);
            
            return (
              <li key={chat._id} className="py-3">
                <Link href={`/chat/${chat._id}`}>
                  <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded">
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">
                          {isAdmin ? `User #${chat._id.substring(0, 6)}` : 'Support Chat'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {format(lastUpdated, 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {formatLastMessage(chat)}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 