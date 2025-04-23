'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import FileUploadAlert from './FileUploadAlert';
import UserProfileCard from './UserProfileCard';

export default function ChatInterface({ chatId, onClose }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFileAlert, setShowFileAlert] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [userId, setUserId] = useState(null);
  const [chatStatus, setChatStatus] = useState({ isOnline: true, isLoading: true });
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const isAdmin = session?.user?.role === 'admin';

  // Fetch chat details and user ID
  const fetchChatDetails = async () => {
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch chat details');
      }
      const data = await res.json();
      if (data.chat && data.chat.user) {
        if (typeof data.chat.user === 'object') {
          setUserId(data.chat.user._id);
        } else {
          setUserId(data.chat.user);
        }
      }
    } catch (error) {
      console.error('Error fetching chat details:', error);
    }
  };

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

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat/messages?chatId=${chatId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    try {
      // Get IDs of unread messages that aren't from the current user
      const unreadMessageIds = messages
        .filter(msg => !msg.isRead && msg.sender !== session?.user?.id)
        .map(msg => msg._id);
      
      if (unreadMessageIds.length === 0) return;
      
      console.log('Marking messages as read:', unreadMessageIds);
      
      const res = await fetch('/api/chat/messages/read', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, messageIds: unreadMessageIds }),
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        console.error('Error response:', responseData);
        throw new Error(responseData.error || 'Failed to mark messages as read');
      }
      
      console.log('Messages marked as read:', responseData);
      
      // Update local state to show messages as read
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          unreadMessageIds.includes(msg._id) 
            ? { ...msg, isRead: true } 
            : msg
        )
      );
    } catch (error) {
      console.error('Error marking messages as read:', error);
      // Don't show toast to avoid distracting the user
    }
  };

  // Add file upload handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file type is allowed (PDF, JPG, JPEG)
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['pdf', 'jpg', 'jpeg'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        // Show the popup alert instead of just a toast
        setShowFileAlert(true);
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
      // Optionally add the filename to the message input
      setNewMessage(prev => prev ? `${prev} [File: ${file.name}]` : `[File: ${file.name}]`);
    }
  };

  // Trigger file input click
  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  // Modify sendMessage to handle file uploads
  const sendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || uploading) return;
    
    try {
      setUploading(selectedFile ? true : false);
      
      let messageContent = newMessage.trim();
      let fileUrl = null;
      
      // Handle file upload if a file is selected
      if (selectedFile) {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('chatId', chatId);
        
        // Upload the file
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || 'Failed to upload file');
        }
        
        const uploadData = await uploadRes.json();
        fileUrl = uploadData.fileUrl;
        
        // Add file information to message if not already included
        if (!messageContent.includes(selectedFile.name)) {
          messageContent = messageContent 
            ? `${messageContent} [File: ${selectedFile.name}]` 
            : `Shared a file: ${selectedFile.name}`;
        }
      }
      
      // Send the message with file information if applicable
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId, 
          content: messageContent,
          fileUrl: fileUrl 
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      
      // Optimistically add the message to the UI
      const tempMessage = {
        _id: Date.now().toString(),
        content: messageContent,
        sender: session.user.id,
        timestamp: new Date().toISOString(),
        isRead: false,
        fileUrl: fileUrl
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
      setSelectedFile(null);
      
      // Refresh messages to get the actual saved message
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial fetch and set up interval for refreshing
  useEffect(() => {
    fetchMessages();
    fetchChatStatus();
    if (isAdmin) {
      fetchChatDetails();
    }
    
    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 10000); // Every 10 seconds
    const statusInterval = setInterval(fetchChatStatus, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [chatId, isAdmin]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      markMessagesAsRead();
    }
  }, [messages, loading]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-lg bg-white">
      {/* File type alert popup */}
      <FileUploadAlert 
        show={showFileAlert} 
        onClose={() => setShowFileAlert(false)} 
      />
      
      {/* Chat header */}
      <div className="flex justify-between items-center p-4 border-b bg-blue-50">
        <h3 className="font-semibold text-lg">
          {isAdmin ? 'User Support' : 'Chat with Admin'}
        </h3>
        <div className="flex items-center space-x-2">
          {isAdmin && userId && (
            <button
              onClick={() => setShowUserProfile(!showUserProfile)}
              className="text-blue-500 hover:text-blue-700 flex items-center"
              title="View user profile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Main content area with conditional user profile sidebar for admins */}
      <div className="flex flex-grow overflow-hidden">
        {/* Messages area */}
        <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
          {!isAdmin && !chatStatus.isLoading && !chatStatus.isOnline ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full mb-4 flex items-center">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                Support is currently offline
              </div>
              <p className="text-gray-600 mb-2">Our team is not available at the moment.</p>
              <p className="text-gray-500 text-sm">You can still view previous messages, but new messages cannot be sent until an admin comes online.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender === session?.user?.id;
              return (
                <div 
                  key={message._id} 
                  className={`mb-4 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isCurrentUser 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="break-words">{message.content}</p>
                    
                    {/* File attachment */}
                    {message.fileUrl && (
                      <div className={`mt-2 ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`}>
                        <a 
                          href={message.fileUrl} 
                          download={message.fileUrl.split('/').pop()}
                          className="flex items-center hover:underline"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span>Download attachment</span>
                        </a>
                      </div>
                    )}
                    
                    <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                      isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {format(new Date(message.timestamp), 'HH:mm')}
                      {isCurrentUser && (
                        <span>
                          {message.isRead ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 15a7 7 0 110-14 7 7 0 010 14z" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* User profile sidebar for admins */}
        {isAdmin && showUserProfile && userId && (
          <div className="w-80 border-l overflow-y-auto">
            <UserProfileCard 
              userId={userId} 
              onClose={() => setShowUserProfile(false)} 
            />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <form onSubmit={sendMessage} className="border-t p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={!isAdmin && !chatStatus.isOnline ? "Chat is currently offline" : "Type your message..."}
            className="flex-grow p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={!isAdmin && !chatStatus.isOnline}
          />
          
          {/* Hidden file input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg,image/jpg"
            className="hidden"
            disabled={!isAdmin && !chatStatus.isOnline}
          />
          
          {/* File attachment button */}
          <button
            type="button"
            onClick={handleFileButtonClick}
            className={`p-2 ${(!isAdmin && !chatStatus.isOnline) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:text-blue-500'} focus:outline-none`}
            title="Attach a file (PDF, JPG, JPEG only)"
            disabled={!isAdmin && !chatStatus.isOnline}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedFile) || uploading || (!isAdmin && !chatStatus.isOnline)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 flex items-center"
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
        
        {/* Selected file info */}
        {selectedFile && (
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="truncate">{selectedFile.name}</span>
            <button 
              type="button" 
              className="ml-2 text-red-500 hover:text-red-700"
              onClick={() => setSelectedFile(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* File type restriction notice */}
        <div className="mt-1 text-xs text-gray-500">
          Allowed file types: PDF, JPG, JPEG
        </div>
      </form>
    </div>
  );
} 