import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn,
  X,
  Search,
  Filter,
  Calendar,
  Clock,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  RefreshCw,
  ExternalLink,
  Video,
  FileText,
  Link,
  User,
  Bot,
  Plus,
  ListChecks ,
  Clipboard// Added Bot icon for the new button
} from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "react-toastify";
import DailyWorkflow from "./DailyWorkflow";
import CalendarScheduler from "./AdminComponents/CalendarScheduler";
import AccessManagement from "./AdminComponents/AccessManagement";
import SelfTaskForm from "./AdminComponents/SelfTaskForm";
import CalendarMeetingForm from "./AdminComponents/CalendarMeetingForm";
import MeetingDetailsPopup from "./AdminComponents/MeetingDetailsPopup";
import axios from "axios";
import apiService from "../services/apiService";

const AdminPanel = ({ userData, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordError, setPasswordError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDescriptions, setUserDescriptions] = useState({});
  const [isDeleting, setIsDeleting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [showCalendarScheduler, setShowCalendarScheduler] = useState(false);
  const [calendarData, setCalendarData] = useState(null);
  const [showMeetingDetailsPopup, setShowMeetingDetailsPopup] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [creatingBot, setCreatingBot] = useState(false);
  const [showAccessManagement, setShowAccessManagement] = useState(false);
  const [taskSchedulingEnabled, setTaskSchedulingEnabled] = useState(false);
  const [taskSchedulingLoaded, setTaskSchedulingLoaded] = useState(false);
  const [toggleSchedulingLoading, setToggleSchedulingLoading] = useState(false);
  const [showSelfTask, setShowSelfTask] = useState(false);

  const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937; /* gray-800 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563; /* gray-600 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* gray-500 */
  }
  
  * {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937; 
  }
`;

  useEffect(() => {
    setIsAuthenticated(false);
    setPassword("");
    setTasks([]);
    setLoading(false);
    setError(null);
    setPasswordError("");
  }, []);

  const handleLogin = () => {
    if (password === userData.user.password) {
      setIsAuthenticated(true);
      setPasswordError("");
      fetchTasks();
    } else {
      setPasswordError("Incorrect password");
      toast.error("Incorrect passkey");
    }
  };

  const fetchTasks = () => {
    setTasks(userData.user.tasks);
  };

  const refreshUserData = async () => {
    try {
      setRefreshing(true);
      toast.info("Refreshing user data...");

      const result = await apiService.getUserData(userData.user.username);

      if (result.success && result.data) {
        setTasks(result.data.user.tasks || []);
        toast.success("User data refreshed successfully");
      } else {
        toast.error("Failed to refresh user data");
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast.error("Error refreshing user data");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchTaskSchedulingStatus = async () => {
      if (!userData?.user?.username) return;

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND}/gettaskscheduling`,
          { params: { username: userData.user.username } }
        );

        if (response.data && response.data.success) {
          setTaskSchedulingEnabled(!!response.data.taskSchedulingEnabled);
        } else {
          console.error("Failed to fetch task scheduling status");
        }
      } catch (error) {
        console.error("Error fetching task scheduling status:", error);
      } finally {
        setTaskSchedulingLoaded(true);
      }
    };

    fetchTaskSchedulingStatus();
  }, [userData?.user?.username]);

  const toggleTaskScheduling = async () => {
    try {
      setToggleSchedulingLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND}/settaskscheduling`,
        { username: userData.user.username }
      );

      if (response.data && response.data.success) {
        // Set our local state based on the response
        setTaskSchedulingEnabled(!!response.data.taskSchedulingEnabled);
        toast.success(
          response.data.message || "Task scheduling setting updated"
        );
      } else {
        toast.error("Failed to update task scheduling status");
      }
    } catch (error) {
      console.error("Error toggling task scheduling:", error);
      toast.error("Error updating task scheduling status");
    } finally {
      setToggleSchedulingLoading(false);
    }
  };

  const renderTaskSchedulingButton = () => {
    if (!taskSchedulingLoaded) {
      return (
        <motion.button
          className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-all"
          disabled={true}
        >
          <Calendar className="w-4 h-4 animate-pulse" />
          Loading...
        </motion.button>
      );
    }

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTaskScheduling}
        disabled={toggleSchedulingLoading}
        className={`px-4 py-2 ${
          taskSchedulingEnabled
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        } text-white rounded-lg flex items-center gap-2 transition-all`}
      >
        <Calendar
          className={`w-4 h-4 ${toggleSchedulingLoading ? "animate-spin" : ""}`}
        />
        {toggleSchedulingLoading
          ? "Updating..."
          : taskSchedulingEnabled
          ? "Task Scheduling: On"
          : "Task Scheduling: Off"}
      </motion.button>
    );
  };

  const handleSelfTaskToggle = () => {
    setShowSelfTask(!showSelfTask);
  };

  const handleAccessManagementUpdate = async (updatedData) => {
    try {
      setLoading(true);
      // Get the latest user data after an update
      const result = await apiService.getUserData(userData.user.username);

      if (result.success && result.data) {
        // Update the local userData state
        userData.user = result.data.user;
        setTasks(result.data.user.tasks || []);
        toast.success("User access updated successfully");
      } else {
        toast.error("Failed to update user data");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      toast.error("Error updating user data");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task) => {
    try {
      setLoading(true);

      const newStatus =
        task.status === "inprogress" ? "completed" : "inprogress";

      const response = await axios.patch(
        `${import.meta.env.VITE_BACKEND}/tasks`,
        {
          status: newStatus,
          userId: userData.user.username,
          uniqueTaskId: task.uniqueTaskId,
        }
      );

      if (response.data && response.data.task) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.uniqueTaskId === task.uniqueTaskId
              ? { ...t, status: newStatus }
              : t
          )
        );

        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = (task) => {
    if (task.isMeeting && task.isMeeting.title) {
      const meetingData = {
        taskId: task.uniqueTaskId,
        title: task.isMeeting.title,
        description: task.isMeeting.description || task.taskDescription || "",
        date: task.isMeeting.date,
        time: task.isMeeting.time,
        duration: parseInt(task.isMeeting.duration, 10) || 30,
        userEmails: [
          userData.user.email,
          task.presentUserData?.email || "",
        ].filter((email) => email),
      };

      setMeetingDetails(meetingData);
      setShowScheduler(true);
    }
  };

  const handleViewMeetingDetails = (meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetailsPopup(true);
  };

  const handleOpenMeetingLink = (meetingLink) => {
    window.open(meetingLink, "_blank");
  };

  const handleFormSubmit = (formattedData) => {
    console.log("Scheduling meeting with data:", formattedData);

    setCalendarData({
      ...formattedData,
      taskId: meetingDetails.taskId,
    });
    setShowScheduler(false);
    setShowCalendarScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowScheduler(false);
    setShowCalendarScheduler(false);
    setMeetingDetails(null);
    setCalendarData(null);
  };

  const handleCloseMeetingDetailsPopup = () => {
    setShowMeetingDetailsPopup(false);
    setSelectedMeeting(null);
  };
  // Updated handleCreateBotAssistant function
  const handleCreateBotAssistant = async (task) => {
    try {
      if (!task.isMeeting) {
        toast.error("Meeting data not available");
        return;
      }

      setCreatingBot(true);
      toast.info("Creating bot assistant for meeting...");

      // Ensure geminiApiKey exists
      if (!userData.user.geminiApiKey) {
        toast.error("API key is required but not found");
        setCreatingBot(false);
        return;
      }

      // Prepare the bot data with proper validation
      const botData = {
        name: task.topicContext || task.isMeeting.title || "Meeting Assistant",
        email: userData.user.email || "",
        mobileNo: userData.user.mobileNo || "0000000000",
        username: task.uniqueTaskId,
        password: userData.user.password || "defaultpassword", // Make sure this exists
        geminiApiKey: userData.user.geminiApiKey,
        plan: "meeting",
        prompt:
          task.isMeeting.meetingRawData ||
          task.taskDescription ||
          task.taskQuestion ||
          "",
        google: userData.user.google
          ? {
              accessToken: userData.user.google.accessToken || null,
              refreshToken: userData.user.google.refreshToken || null,
              tokenExpiryDate: userData.user.google.tokenExpiryDate || null,
            }
          : null,
      };

      console.log("Creating bot with data:", {
        ...botData,
        password: "[REDACTED]", // Don't log the actual password
      });

      // Make the API call with error handling
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND}/register`,
          botData
        );

        if (response.data && response.data.userId) {
          toast.success("Bot assistant created successfully!");

          // Open the new bot in a new tab
          window.open(
            `${import.meta.env.VITE_FRONTEND}/home/${task.uniqueTaskId}`,
            "_blank"
          );

          // Refresh user data to show updated bot status
          await refreshUserData();
        } else {
          toast.error(
            response.data?.message || "Failed to create bot assistant"
          );
        }
      } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        if (error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
        } else {
          toast.error("Server error when creating bot assistant");
        }
      }
    } catch (error) {
      console.error("Error creating bot assistant:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setCreatingBot(false);
    }
  };
  const generateUserDescription = async (prompt) => {
    try {
      if (!userData.user.geminiApiKey) {
        return "No API key available to generate description.";
      }

      const genAI = new GoogleGenerativeAI(userData.user.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const descriptionPrompt = `
        Based on the following information about a user, create a brief 5-line description highlighting key aspects of their personality, background, and interests:
        
        ${prompt}
        
        Keep the description concise, informative, and professional.
      `;

      const result = await model.generateContent(descriptionPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating user description:", error);
      return "Could not generate user description at this time.";
    }
  };

  const handleViewUserDetails = async (task) => {
    if (expandedUser === task._id) {
      setExpandedUser(null);
      return;
    }

    setExpandedUser(task._id);

    if (
      !userDescriptions[task._id] &&
      task.presentUserData &&
      task.presentUserData.prompt
    ) {
      const description = await generateUserDescription(
        task.presentUserData.prompt
      );
      setUserDescriptions((prev) => ({
        ...prev,
        [task._id]: description,
      }));
    }
  };

  const handleExpandTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleAccessManagementClose = () => {
    setShowAccessManagement(false);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearchTerm =
      task.taskQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.presentUserData &&
        task.presentUserData.name &&
        task.presentUserData.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (task.taskDescription &&
        task.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    return matchesSearchTerm && matchesStatus;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);

    if (sortOrder === "newest") {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  const renderDescription = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "inprogress":
        return "bg-yellow-500";
      case "pending":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "inprogress":
        return <ClockIcon className="w-4 h-4" />;
      case "pending":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMeetingCardStyle = (meetingStatus) => {
    switch (meetingStatus) {
      case "scheduled":
        return "border-blue-600 bg-blue-900/20";
      case "completed":
        return "border-green-600 bg-green-900/20";
      default: // pending
        return "border-gray-700 bg-gray-700";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <style>{scrollbarStyles}</style>

      {showScheduler && meetingDetails && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <CalendarMeetingForm
            initialData={meetingDetails}
            onSchedule={handleFormSubmit}
            onClose={handleCloseScheduler}
          />
        </div>
      )}

      {showCalendarScheduler && calendarData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 rounded-xl p-4 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Calendar Integration
              </h3>
              <button
                onClick={handleCloseScheduler}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <CalendarScheduler
                taskId={calendarData.taskId}
                username={userData.user.username}
                title={calendarData.title}
                description={calendarData.description}
                startTime={calendarData.startTime}
                endTime={calendarData.endTime}
                userEmails={calendarData.userEmails}
                onSuccess={refreshUserData}
              />
            </div>
          </div>
        </div>
      )}

      {showMeetingDetailsPopup && selectedMeeting && (
        <MeetingDetailsPopup
          meeting={selectedMeeting}
          onClose={handleCloseMeetingDetailsPopup}
        />
      )}

      {showAccessManagement && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 rounded-xl p-4 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <AccessManagement
              userData={userData}
              onClose={() => {
                handleAccessManagementClose();
                refreshUserData(); // Refresh data when closing
              }}
              onUpdate={(updatedData) => {
                handleAccessManagementUpdate(updatedData);
              }}
            />
          </div>
        </div>
      )}
      {showSelfTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
          <div className="bg-gray-900 rounded-xl p-4 w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Create Self Task
              </h3>
              <button
                onClick={handleSelfTaskToggle}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <SelfTaskForm
                userData={userData}
                onClose={() => {
                  handleSelfTaskToggle();
                  refreshUserData();
                }}
                onSuccess={() => {
                  refreshUserData();
                  setShowSelfTask(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-400" />
            Admin Dashboard
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-70px)]">
          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-full max-w-md">
                <h3 className="text-xl font-medium text-white mb-6 text-center">
                  Enter Admin Password
                </h3>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      className={`w-full bg-gray-800 border ${
                        passwordError ? "border-red-500" : "border-gray-600"
                      } rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                      placeholder="Password"
                      onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1">
                        {passwordError}
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogin}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
                  >
                    Login
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <DailyWorkflow userData={userData} />
              <div className="w-full flex gap-3 justify-start items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshUserData}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing..." : "Refresh Tasks"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAccessManagement(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                  <User className="w-4 h-4" />
                  Access Management
                </motion.button>
                {renderTaskSchedulingButton()}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelfTaskToggle()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Self Task
                </motion.button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks or users..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Filter className="w-4 h-4" /> Status:
                    </span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="inprogress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm flex items-center gap-1">
                      <Clock className="w-4 h-4" /> Sort by:
                    </span>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading && !isDeleting ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">{error}</div>
              ) : sortedTasks.length === 0 ? (
                <div className="text-gray-400 text-center py-8">
                  No tasks found
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {sortedTasks.map((task) => (
                    <motion.div
                      key={task.uniqueTaskId || task._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            {task.isSelfTask ? (
                              <Clipboard className="w-5 h-5 text-purple-400" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-blue-400" />
                            )}

                            <span className="text-white font-medium">
                              {task.isSelfTask
                                ? "Self Task"
                                : task.presentUserData?.name || "Unknown User"}
                            </span>

                            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                              ID: {task.uniqueTaskId || "N/A"}
                            </span>

                            {task.isSelfTask && (
                              <span className="text-xs text-purple-300 bg-purple-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ListChecks className="w-3 h-3" />
                                Self Task
                              </span>
                            )}

                            {task.isMeeting && task.isMeeting.title && (
                              <span className="text-xs text-blue-300 bg-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Meeting
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => toggleTaskStatus(task)}
                              className="p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                              disabled={loading}
                              title="Toggle Status"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-2 py-1 rounded-full text-xs text-white flex items-center gap-1 ${getStatusColor(
                                task.status
                              )}`}
                            >
                              {getStatusIcon(task.status)}
                              <span>
                                {task.status.charAt(0).toUpperCase() +
                                  task.status.slice(1)}
                              </span>
                            </motion.button>
                          </div>
                        </div>

                        {task.topicContext && (
                          <p className="text-gray-400 text-sm mb-2">
                            <span className="text-gray-300 font-bold ">
                              Context :-
                            </span>{" "}
                            {renderDescription(task.topicContext)}
                          </p>
                        )}

                        {task.taskDescription && (
                          <p className="text-gray-400 text-sm mb-2">
                            <span className="text-gray-300 font-bold  ">
                              Description :-
                            </span>{" "}
                            {renderDescription(task.taskDescription)}
                          </p>
                        )}

                        <p className="text-gray-400 text-sm mb-4">
                          <span className="text-gray-300 font-bold ">
                            {task.isSelfTask
                              ? "Task Message :-"
                              : "User Message :-"}
                          </span>{" "}
                          {task.taskQuestion}
                        </p>

                        {task.isMeeting && task.isMeeting.title && (
                          <div
                            className={`rounded-lg p-3 mb-4 border ${getMeetingCardStyle(
                              task.isMeeting.status
                            )}`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-white font-medium mb-1">
                                  {task.isMeeting.title}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-gray-300">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />{" "}
                                    {task.isMeeting.date}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />{" "}
                                    {task.isMeeting.time}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />{" "}
                                    {task.isMeeting.duration} min
                                  </span>
                                </div>
                                {task.isMeeting.description && (
                                  <p className="text-gray-400 text-sm mt-2">
                                    {task.isMeeting.description}
                                  </p>
                                )}
                                {task.isMeeting.status && (
                                  <span
                                    className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full 
                  ${
                    task.isMeeting.status === "pending"
                      ? "bg-yellow-900 text-yellow-300"
                      : task.isMeeting.status === "scheduled"
                      ? "bg-blue-900 text-blue-300"
                      : "bg-green-900 text-green-300"
                  }`}
                                  >
                                    {task.isMeeting.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      task.isMeeting.status.slice(1)}
                                  </span>
                                )}
                              </div>

                              {/* Different buttons based on meeting status */}
                              {task.isMeeting.status === "pending" && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleScheduleMeeting(task)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                >
                                  <Calendar className="w-4 h-4" />
                                  Schedule
                                </motion.button>
                              )}

                              {task.isMeeting.status === "scheduled" &&
                                task.isMeeting.meetingLink && (
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleOpenMeetingLink(
                                        task.isMeeting.meetingLink
                                      )
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                  >
                                    <Link className="w-4 h-4" />
                                    Meeting Link
                                  </motion.button>
                                )}
                              {task.isMeeting.status === "completed" && (
                                <div className="flex items-center gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      handleViewMeetingDetails(task.isMeeting)
                                    }
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                  >
                                    <FileText className="w-4 h-4" />
                                    View Details
                                  </motion.button>

                                  {task.isMeeting.botActivated ? (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() =>
                                        window.open(
                                          `${
                                            import.meta.env.VITE_FRONTEND
                                          }/home/${task.uniqueTaskId}`,
                                          "_blank"
                                        )
                                      }
                                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                    >
                                      <Bot className="w-4 h-4" />
                                      Assist Bot
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() =>
                                        handleCreateBotAssistant(task)
                                      }
                                      disabled={creatingBot}
                                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                                    >
                                      <Bot className="w-4 h-4" />
                                      {creatingBot ? "Creating..." : "Get Bot"}
                                    </motion.button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1 text-gray-400 text-xs">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(task.createdAt)}</span>
                          </div>

                          {!task.isSelfTask && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleViewUserDetails(task)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md flex items-center gap-1"
                            >
                              {expandedUser === task._id ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  User Details
                                </>
                              )}
                            </motion.button>
                          )}
                        </div>
                      </div>

                      {/* Only render the user details section if it's not a self task */}
                      {!task.isSelfTask && (
                        <AnimatePresence>
                          {expandedUser === task._id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 border-t border-gray-700 bg-gray-850">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-gray-400 text-xs mb-1">
                                      Name
                                    </h4>
                                    <p className="text-white">
                                      {task.presentUserData?.name || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-gray-400 text-xs mb-1">
                                      Email
                                    </h4>
                                    <p className="text-white">
                                      {task.presentUserData?.email || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-gray-400 text-xs mb-1">
                                      Mobile
                                    </h4>
                                    <p className="text-white">
                                      {task.presentUserData?.mobileNo || "N/A"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-gray-400 text-xs mb-1">
                                      User's Chat Assistant
                                    </h4>
                                    {task.presentUserData?.username ? (
                                      <a
                                        href={`${
                                          import.meta.env.VITE_FRONTEND
                                        }/home/${
                                          task.presentUserData.username
                                        }`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-500 hover:underline flex items-center"
                                      >
                                        {task.presentUserData.username}
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </a>
                                    ) : (
                                      <p className="text-white">N/A</p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <h4 className="text-gray-400 text-xs mb-2">
                                    About User
                                  </h4>
                                  {userDescriptions[task._id] ? (
                                    <p className="text-gray-300 text-sm whitespace-pre-line">
                                      {userDescriptions[task._id]}
                                    </p>
                                  ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                      <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Generating description...</span>
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                  <p className="text-gray-400 text-xs italic">
                                    You can use username of this sender on
                                    chatmate and ask question's and schedule
                                    tasks through their chat Assistant.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminPanel;
