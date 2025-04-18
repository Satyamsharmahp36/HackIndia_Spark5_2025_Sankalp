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
      <div className="bg-gray-900 rounded-xl shadow-xl p-8 max-w-md border border-gray-800 mx-auto transition-all duration-300 animate-fadeIn">
        <div className="flex items-center mb-6">
          <div className="bg-green-900 p-3 rounded-full">
            <CheckCircle className="text-green-400 w-7 h-7" />
          </div>
          <h3 className="text-2xl font-bold ml-4 text-gray-100 bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">Added to Calendar</h3>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-5 rounded-xl mb-6 border border-gray-700 shadow-md">
          <p className="font-semibold text-gray-100 text-xl mb-4">{title}</p>
          
          <div className="flex items-start mb-4 group">
            <div className="bg-gray-900 p-2 rounded-lg shadow-md mr-4 group-hover:shadow-lg transition-shadow duration-300 border border-gray-700">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-gray-300">
              <p className="font-medium text-blue-300">Time</p>
              <p>{formatDateTime(startTime)}</p>
              <p>to {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start group">
            <div className="bg-gray-900 p-2 rounded-lg shadow-md mr-4 group-hover:shadow-lg transition-shadow duration-300 border border-gray-700">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-gray-300">
              <p className="font-medium text-blue-300">Participants</p>
              <p>{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <a 
            href={meetingDetails.meetLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-4 rounded-xl transition-all duration-300 font-medium text-base shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <Link className="w-5 h-5 mr-3" />
            Join Meeting Now
          </a>
          
          <a 
            href={meetingDetails.eventLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full bg-gray-800 hover:bg-gray-700 text-gray-200 py-4 px-4 rounded-xl transition-colors font-medium text-base shadow-md hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 border border-gray-700"
          >
            <Calendar className="w-5 h-5 mr-3 text-blue-400" />
            Open in Google Calendar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {showError && (
        <div className="bg-gray-900 rounded-xl shadow-lg p-4 mb-6 border-l-4 border-red-500 flex items-start animate-slideIn">
          <div className="bg-red-900 p-2 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-grow">
            <p className="text-base font-medium text-gray-200">Unable to add event</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
          </div>
          <button 
            onClick={dismissError}
            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors duration-200 p-1 hover:bg-gray-800 rounded-full"
            aria-label="Dismiss error"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-800 transform transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center mb-6">
          <div className="bg-blue-900 p-3 rounded-full">
            <Calendar className="w-7 h-7 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold ml-4 text-gray-100 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Schedule Meeting</h3>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-6 rounded-xl mb-6 border border-gray-700 shadow-md">
          <h4 className="font-semibold text-lg text-gray-100 mb-3 pb-2 border-b border-gray-700">{title}</h4>
          
          {description && (
            <p className="text-gray-300 mb-5 italic text-sm bg-gray-800 bg-opacity-50 p-3 rounded-lg">{description}</p>
          )}
          
          <div className="flex items-start mb-4 group">
            <div className="bg-gray-900 p-2 rounded-lg shadow-md mr-4 group-hover:shadow-lg transition-shadow duration-300 border border-gray-700">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Time</p>
              <p className="text-sm text-gray-400">{formatDateTime(startTime)} - {formatDateTime(endTime)}</p>
            </div>
          </div>
          
          <div className="flex items-start group">
            <div className="bg-gray-900 p-2 rounded-lg shadow-md mr-4 group-hover:shadow-lg transition-shadow duration-300 border border-gray-700">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">Participants</p>
              <p className="text-sm text-gray-400">{userEmails.length} attendee{userEmails.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={scheduleMeeting}
          disabled={isLoading}
          className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-md"
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