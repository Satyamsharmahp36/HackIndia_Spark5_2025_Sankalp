import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  FileText,
  Video,
  Link as LinkIcon,
  CheckSquare,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const SelfTaskForm = ({ onClose, onSuccess, userData }) => {
  const [taskType, setTaskType] = useState("task"); // "task" or "meeting"
  const [formData, setFormData] = useState({
    taskTitle: "",
    taskDescription: "",
    topicContext: "",
    
    // Meeting specific fields
    meetingTitle: "",
    meetingDescription: "",
    meetingDate: "",
    meetingTime: "",
    meetingDuration: "30",
    meetingLink: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (taskType === "task") {
      if (!formData.taskTitle.trim()) newErrors.taskTitle = "Task title is required";
    } else {
      if (!formData.meetingTitle.trim()) newErrors.meetingTitle = "Meeting title is required";
      if (!formData.meetingDate) newErrors.meetingDate = "Date is required";
      if (!formData.meetingTime) newErrors.meetingTime = "Time is required";
      if (!formData.meetingDuration) newErrors.meetingDuration = "Duration is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const uniqueTaskId = `self_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      let payload = {
        username: userData.user.username,
        uniqueTaskId: uniqueTaskId,
        isSelfTask: true, // Add this flag to indicate it's a self-created task
        status: "inprogress"
      };
      
      if (taskType === "task") {
        payload = {
          ...payload,
          taskQuestion: formData.taskTitle,
          taskDescription: formData.taskDescription || "Self-created task",
          topicContext: formData.topicContext || "",
        };
      } else {
        // For meeting type
        payload = {
          ...payload,
          taskQuestion: formData.meetingTitle,
          taskDescription: formData.meetingDescription || "Self-scheduled meeting",
          topicContext: formData.topicContext || "",
          isMeeting: {
            title: formData.meetingTitle,
            description: formData.meetingDescription || "",
            date: formData.meetingDate,
            time: formData.meetingTime,
            duration: formData.meetingDuration,
            status: formData.meetingLink ? "scheduled" : "pending",
            meetingLink: formData.meetingLink || "",
            topicContext: formData.topicContext || "",
            meetingRawData: formData.meetingDescription || "",
            botActivated: false,
            restriction: false
          }
        };
        
        // If meeting link is provided, also create a meeting record
        if (formData.meetingLink) {
          const meetingDate = new Date(`${formData.meetingDate} ${formData.meetingTime}`);
          const endTime = new Date(meetingDate);
          endTime.setMinutes(meetingDate.getMinutes() + parseInt(formData.meetingDuration, 10));
          
          const meetingRecord = {
            taskId: uniqueTaskId,
            google_meeting_link: formData.meetingLink,
            start_time: meetingDate,
            end_time: endTime,
            duration: formData.meetingDuration,
            username: userData.user.username
          };
          
          // Store this for potential meeting record creation
          payload.meetingRecord = meetingRecord;
        }
      }
      
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND}/create-self-task`,
        payload
      );
      
      if (response.data && response.data.success) {
        toast.success("Task created successfully!");
        onSuccess(); // Refresh task list
        onClose(); // Close the form
      } else {
        toast.error(response.data?.message || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating self-task:", error);
      toast.error("Error creating task: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {taskType === "task" ? (
              <CheckSquare className="w-5 h-5 text-green-600" />
            ) : (
              <Video className="w-5 h-5 text-blue-600" />
            )}
            {taskType === "task" ? "Create Task" : "Schedule Meeting"}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg p-2 flex border border-gray-200">
                <button
                  type="button"
                  onClick={() => setTaskType("task")}
                  className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${
                    taskType === "task"
                      ? "bg-green-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType("meeting")}
                  className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-all ${
                    taskType === "meeting"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Meeting
                </button>
              </div>
            </div>

            {taskType === "task" ? (
              // Task form
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Task Title*
                  </label>
                  <input
                    type="text"
                    name="taskTitle"
                    value={formData.taskTitle}
                    onChange={handleChange}
                    className={`w-full bg-white border ${
                      errors.taskTitle ? "border-red-500" : "border-gray-300"
                    } rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter task title"
                  />
                  {errors.taskTitle && (
                    <p className="text-red-500 text-xs mt-1">{errors.taskTitle}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Task Description
                  </label>
                  <textarea
                    name="taskDescription"
                    value={formData.taskDescription}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter task description (optional)"
                  ></textarea>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Topic Context
                  </label>
                  <textarea
                    name="topicContext"
                    value={formData.topicContext}
                    onChange={handleChange}
                    rows="2"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any context for this task (optional)"
                  ></textarea>
                </div>
              </>
            ) : (
              // Meeting form
              <>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Meeting Title*
                  </label>
                  <input
                    type="text"
                    name="meetingTitle"
                    value={formData.meetingTitle}
                    onChange={handleChange}
                    className={`w-full bg-white border ${
                      errors.meetingTitle ? "border-red-500" : "border-gray-300"
                    } rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter meeting title"
                  />
                  {errors.meetingTitle && (
                    <p className="text-red-500 text-xs mt-1">{errors.meetingTitle}</p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Meeting Description
                  </label>
                  <textarea
                    name="meetingDescription"
                    value={formData.meetingDescription}
                    onChange={handleChange}
                    rows="3"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter meeting description (optional)"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Date*
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="date"
                        name="meetingDate"
                        value={formData.meetingDate}
                        onChange={handleChange}
                        className={`w-full bg-white border ${
                          errors.meetingDate ? "border-red-500" : "border-gray-300"
                        } rounded-lg py-2 pl-10 pr-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.meetingDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.meetingDate}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Time*
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="time"
                        name="meetingTime"
                        value={formData.meetingTime}
                        onChange={handleChange}
                        className={`w-full bg-white border ${
                          errors.meetingTime ? "border-red-500" : "border-gray-300"
                        } rounded-lg py-2 pl-10 pr-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      />
                      {errors.meetingTime && (
                        <p className="text-red-500 text-xs mt-1">{errors.meetingTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Duration (minutes)*
                    </label>
                    <div className="relative">
                      <select
                        name="meetingDuration"
                        value={formData.meetingDuration}
                        onChange={handleChange}
                        className={`w-full bg-white border ${
                          errors.meetingDuration ? "border-red-500" : "border-gray-300"
                        } rounded-lg py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                      {errors.meetingDuration && (
                        <p className="text-red-500 text-xs mt-1">{errors.meetingDuration}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Meeting Link (Optional)
                    </label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                      <input
                        type="text"
                        name="meetingLink"
                        value={formData.meetingLink}
                        onChange={handleChange}
                        className="w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Google Meet or Zoom link"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    Topic Context
                  </label>
                  <textarea
                    name="topicContext"
                    value={formData.topicContext}
                    onChange={handleChange}
                    rows="2"
                    className="w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add any context for this meeting (optional)"
                  ></textarea>
                </div>
              </>
            )}

            <div className="flex items-center justify-between mt-8">
              <div className="text-xs text-gray-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Fields marked with * are required
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 ${
                    taskType === "task"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white rounded-lg shadow-lg transition-all flex items-center gap-2`}
                >
                  {isSubmitting && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {taskType === "task" ? "Create Task" : "Schedule Meeting"}
                </motion.button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SelfTaskForm;