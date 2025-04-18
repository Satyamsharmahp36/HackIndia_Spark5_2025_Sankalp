import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Edit3, ChevronDown } from 'lucide-react';

const CalendarMeetingForm = ({ initialData, onSchedule, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    duration: 30,
    customDuration: false,
    userEmails: ['', '']
  });

  useEffect(() => {
    if (initialData) {
      const presetDurations = [15, 30, 45, 60, 90, 120];
      const duration = initialData.duration || 30;
      const isCustomDuration = !presetDurations.includes(duration);
      
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: initialData.date || '',
        startTime: initialData.time || '',
        duration: duration,
        customDuration: isCustomDuration,
        userEmails: initialData.userEmails || ['', '']
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailChange = (index, value) => {
    const updatedEmails = [...formData.userEmails];
    updatedEmails[index] = value;
    setFormData(prev => ({ ...prev, userEmails: updatedEmails }));
  };

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      userEmails: [...prev.userEmails, '']
    }));
  };

  const removeEmailField = (index) => {
    if (formData.userEmails.length <= 1) return;
    
    const updatedEmails = [...formData.userEmails];
    updatedEmails.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      userEmails: updatedEmails
    }));
  };

  const toggleCustomDuration = () => {
    setFormData(prev => ({
      ...prev,
      customDuration: !prev.customDuration
    }));
  };

  const handleDurationChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setFormData(prev => ({ ...prev, duration: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const [hours, minutes] = formData.startTime.split(':').map(Number);
    const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDate = new Date(startDate.getTime() + formData.duration * 60000);
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    const formattedData = {
      title: formData.title,
      description: formData.description,
      startTime: `${formData.date}T${formData.startTime}:00+05:30`,
      endTime: `${formData.date}T${endHours}:${endMinutes}:00+05:30`,
      duration: formData.duration, // Preserve the original duration value
      userEmails: formData.userEmails.filter(email => email.trim() !== '')
    };
    
    onSchedule(formattedData);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500 rounded-full p-2">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">Schedule Meeting</h3>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <Edit3 className="w-4 h-4 text-blue-400" />
            Meeting Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter meeting title"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            required
          />
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
            <Edit3 className="w-4 h-4 text-blue-400" />
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What's this meeting about?"
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" /> 
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <Clock className="w-4 h-4 text-blue-400" /> 
              Start Time
            </label>
            <div className="relative">
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
          </div>
        </div>
        
        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-1">
              <Clock className="w-4 h-4 text-blue-400" />
              Duration
            </label>
            <button
              type="button"
              onClick={toggleCustomDuration}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium mb-1"
            >
              {formData.customDuration ? "Use preset durations" : "Set custom duration"}
            </button>
          </div>
          
          <div className="relative">
            {formData.customDuration ? (
              <div className="flex items-center">
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleDurationChange}
                  min="1"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
                <span className="ml-2 text-gray-300">minutes</span>
              </div>
            ) : (
              <div className="relative">
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleDurationChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  {/* Display the current duration if it doesn't match any preset */}
                  {![15, 30, 45, 60, 90, 120].includes(formData.duration) && (
                    <option value={formData.duration}>{formData.duration} minutes</option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            Participants
          </label>
          <div className="space-y-2">
            {formData.userEmails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder={`Participant ${index + 1} email`}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {formData.userEmails.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeEmailField(index)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addEmailField}
              className="mt-2 text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              + Add another participant
            </button>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <Calendar className="w-5 h-5" />
            Schedule Meeting
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalendarMeetingForm;
