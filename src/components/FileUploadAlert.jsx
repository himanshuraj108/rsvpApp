import React, { useState, useEffect } from 'react';

export default function FileUploadAlert({ show, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto close timer
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // Auto close after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Handle closing the alert
  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose}></div>
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full z-10 relative">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">Invalid File Type</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Only PDF, JPG, and JPEG files are allowed.</p>
                <p className="mt-1">Please select a file with one of the supported formats.</p>
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="text-gray-400 hover:text-gray-500"
            onClick={handleClose}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-5">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            onClick={handleClose}
          >
            OK, I Understand
          </button>
        </div>
      </div>
    </div>
  );
} 