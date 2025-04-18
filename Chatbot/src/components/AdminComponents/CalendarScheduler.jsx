import React, { useState } from 'react';
import { Calendar, Clock, Users, AlertCircle, CheckCircle, X, Loader } from 'lucide-react';

function CalendarScheduler({ taskId, username, title, description, startTime, endTime, userEmails, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [showError, setShowError] = useState(false);

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('en-US', {
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const scheduleMeeting = async () => {
    setIsLoading(true);
    setError('');
    setShowError(false);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/schedule-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          username,
          title,
          description,
          startTime,
          endTime,
          userEmails
        }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule meeting');
      }
      
      setMeetingDetails(data);
      setSuccess(true);
      
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissError = () => {
    setShowError(false);
  };

  if (success && meetingDetails) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md border border-gray-200 mx-auto">
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-2 rounded-full">
            <CheckCircle className="text-green-600 w-6 h-6" />
          </div>
          <h3 className="text-xl font-semibold ml-3 text-gray-800">Added to Google Calendar</h3>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-5 border-l-4 border-blue-500">
          <p className="font-medium text-gray-900 text-lg mb-3">{title}</p>
          
          <div className="flex items-start mb-3">
            <Clock className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-gray-700">
              <p className="font-medium">Time</p>
              <p>{formatDateTime(startTime)}</p>
              <p>to {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-gray-700">
              <p className="font-medium">Participants</p>
              <p>{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <a 
            href={meetingDetails.meetLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium text-base"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.309 4.95C18.764 4.337 18 4 17.191 4H6.809C6 4 5.236 4.337 4.691 4.95C4.156 5.55 3.912 6.347 4.004 7.147L5.233 18.448C5.326 19.248 5.75 19.962 6.391 20.45C7.032 20.937 7.846 21.125 8.632 20.987L11.542 20.502C11.844 20.456 12 20.192 12 19.886V4.25C12 4.112 11.888 4 11.75 4H6.809C6 4 5.236 4.337 4.691 4.95Z" />
              <path d="M16.084 20.987C16.87 21.125 17.684 20.937 18.325 20.45C18.966 19.962 19.39 19.248 19.483 18.448L20.712 7.147C20.804 6.347 20.56 5.55 20.025 4.95C19.48 4.337 18.716 4 17.907 4H12.265C12.119 4 12 4.119 12 4.265V19.889C12 20.196 12.163 20.454 12.467 20.5L16.084 20.987Z" />
            </svg>
            Join with Google Meet
          </a>
          
          <a 
            href={meetingDetails.eventLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full border border-gray-300 hover:bg-gray-50 text-gray-800 py-3 px-4 rounded-lg transition-colors font-medium text-base"
          >
            <Calendar className="w-5 h-5 mr-2 text-blue-600" />
            Open in Google Calendar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {showError && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-red-500 flex items-start">
          <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="ml-3 flex-grow">
            <p className="text-base font-medium text-gray-800">Unable to add event</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button 
            onClick={dismissError}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center mb-4">
          <Calendar className="w-6 h-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-800">Schedule Meeting</h3>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-5">
          <h4 className="font-medium text-lg text-gray-900 mb-3">{title}</h4>
          
          {description && (
            <p className="text-gray-700 mb-4 text-sm">{description}</p>
          )}
          
          <div className="flex items-start mb-3">
            <Clock className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Time</p>
              <p className="text-sm text-gray-600">{formatDateTime(startTime)} - {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">Participants</p>
              <p className="text-sm text-gray-600">{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={scheduleMeeting}
          disabled={isLoading}
          className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:outline-none text-white py-3 px-4 rounded-lg transition-colors shadow-md font-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Adding to Calendar...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
              </svg>
              Add to Google Calendar
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CalendarScheduler;