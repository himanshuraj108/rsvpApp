'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Header from '@/components/ui/Header';

export default function AdminDeleteRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [processing, setProcessing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Redirect if not an admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      router.push('/');
    }
  }, [status, session, router]);

  // Fetch delete requests
  useEffect(() => {
    const fetchDeleteRequests = async () => {
      if (status !== 'authenticated' || !session || session.user.role !== 'admin') return;
      
      try {
        const response = await fetch('/api/users/delete-request');
        
        if (response.ok) {
          const data = await response.json();
          setDeleteRequests(data.requests);
        } else {
          toast.error('Failed to load delete requests');
        }
      } catch (error) {
        console.error('Error fetching delete requests:', error);
        toast.error('An error occurred while loading delete requests');
      } finally {
        setLoading(false);
      }
    };

    fetchDeleteRequests();
  }, [status, session]);

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setAdminComment('');
  };

  const handleProcessRequest = async (action) => {
    if (!selectedRequest) return;
    
    setProcessing(true);
    try {
      const response = await fetch(`/api/users/delete-request/${selectedRequest._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          adminComment,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Delete request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        
        // Update the local state to reflect the change
        setDeleteRequests(prev => 
          prev.map(req => 
            req._id === selectedRequest._id 
              ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
              : req
          )
        );
        
        setSelectedRequest(null);
      } else {
        toast.error(data.message || `Failed to ${action} delete request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing delete request:`, error);
      toast.error(`An error occurred while ${action}ing the delete request`);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Account Delete Requests</h1>
            <Link
              href="/admin"
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back to Admin Dashboard
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Delete Request List */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h2 className="text-lg font-medium text-gray-900">Pending Requests</h2>
                </div>
                
                <div className="border-t border-gray-200">
                  {deleteRequests.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      No delete requests found
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {deleteRequests.map((request) => (
                        <li key={request._id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-sm font-medium text-gray-900">
                                {request.userId?.name || 'Unknown User'}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {request.userId?.email || 'No email'}
                              </p>
                              <p className="text-xs text-gray-500">
                                Requested: {formatDate(request.requestedAt)}
                              </p>
                            </div>
                            <div className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                request.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </span>
                              <button
                                onClick={() => handleViewRequest(request)}
                                className="ml-4 px-3 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            {/* Delete Request Detail */}
            <div className="lg:w-1/3">
              {selectedRequest ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50">
                    <h2 className="text-lg font-medium text-gray-900">Request Details</h2>
                  </div>
                  
                  <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">User</h3>
                        <p>{selectedRequest.userId?.name || 'Unknown User'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p>{selectedRequest.userId?.email || 'No email'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Username</h3>
                        <p>{selectedRequest.userId?.username || 'No username'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Status</h3>
                        <p className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          selectedRequest.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Requested At</h3>
                        <p>{formatDate(selectedRequest.requestedAt)}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">User's Reason</h3>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap border p-2 rounded bg-gray-50">
                          {selectedRequest.reason || 'No reason provided'}
                        </p>
                      </div>
                      
                      {selectedRequest.status === 'pending' && (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Admin Comment</h3>
                            <textarea
                              value={adminComment}
                              onChange={(e) => setAdminComment(e.target.value)}
                              rows="3"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              placeholder="Add a comment (optional)"
                            />
                          </div>
                          
                          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleProcessRequest('reject')}
                              disabled={processing}
                              className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-75"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleProcessRequest('approve')}
                              disabled={processing}
                              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-75"
                            >
                              Approve & Delete
                            </button>
                          </div>
                        </>
                      )}
                      
                      {selectedRequest.status !== 'pending' && (
                        <>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Admin Comment</h3>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap border p-2 rounded bg-gray-50">
                              {selectedRequest.adminComment || 'No comment provided'}
                            </p>
                          </div>
                          
                          {selectedRequest.resolvedAt && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Resolved At</h3>
                              <p>{formatDate(selectedRequest.resolvedAt)}</p>
                            </div>
                          )}
                          
                          {selectedRequest.resolvedBy && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Resolved By</h3>
                              <p>{selectedRequest.resolvedBy.name || 'Unknown Admin'}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6 text-center text-gray-500">
                    Select a request to view details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 