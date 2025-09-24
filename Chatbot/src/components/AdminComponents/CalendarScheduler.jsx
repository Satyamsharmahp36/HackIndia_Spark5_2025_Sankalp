import React, { useState } from 'react';
import { Calendar, Clock, Users, AlertCircle, CheckCircle, X, Loader, Link } from 'lucide-react';

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
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md border border-gray-200 mx-auto">
        <div className="flex items-center mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle className="text-green-600 w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold ml-4 text-gray-900">Added to Calendar</h3>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <p className="font-semibold text-gray-900 text-lg mb-4">{title}</p>
          
          <div className="flex items-start mb-4">
            <div className="bg-white p-2 rounded border border-gray-200 mr-4">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-gray-700">
              <p className="font-medium text-purple-600">Time</p>
              <p>{formatDateTime(startTime)}</p>
              <p>to {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-white p-2 rounded border border-gray-200 mr-4">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-gray-700">
              <p className="font-medium text-purple-600">Participants</p>
              <p>{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <a 
            href={meetingDetails.meetLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
          >
            <Link className="w-4 h-4 mr-2" />
            Join Meeting Now
          </a>
          
          <a 
            href={meetingDetails.eventLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Open in Google Calendar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {showError && (
        <div className="bg-red-50 rounded-lg shadow-sm p-4 mb-6 border-l-4 border-red-500 flex items-start">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-grow">
            <p className="text-base font-medium text-red-800">Unable to add event</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
          <button 
            onClick={dismissError}
            className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors duration-200 p-1 hover:bg-red-100 rounded-full"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full">
            <Calendar className="w-7 h-7 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold ml-4 text-gray-900">Schedule Meeting</h3>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <h4 className="font-semibold text-lg text-gray-900 mb-3 pb-2 border-b border-gray-200">{title}</h4>
          
          {description && (
            <p className="text-gray-600 mb-4 italic text-sm bg-white p-3 rounded border border-gray-200">{description}</p>
          )}
          
          <div className="flex items-start mb-4">
            <div className="bg-white p-2 rounded border border-gray-200 mr-4">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Time</p>
              <p className="text-sm text-gray-600">{formatDateTime(startTime)} - {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-white p-2 rounded border border-gray-200 mr-4">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Participants</p>
              <p className="text-sm text-gray-600">{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={scheduleMeeting}
          disabled={isLoading}
          className="flex items-center justify-center w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 mr-3 animate-spin" />
              Adding to Calendar...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
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

const globalStyles = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-slideIn {
  animation: slideIn 0.3s ease-out forwards;
}
`;

export default CalendarScheduler;