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
  FileText,
  Link,
  User,
  Bot,
  Plus,
  ListChecks,
  Clipboard,
  Activity,
  Users,
  Settings,
  Layout,
  Grid,
  List,
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
import VisitorAnalytics from "./AdminComponents/VisitorAnalytics";
import MainTabNavigator from "./AdminComponents/MainTabNavigator"
import NotificationMessage from "./AdminComponents/NotificationMessage";

const AdminPanel = ({ userData, onClose }) => {
  // Original state management
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
  const [showVisitorAnalytics, setShowVisitorAnalytics] = useState(false);
  const [notification, setNotification] = useState(null);

  const [promptContent, setPromptContent] = useState("");
  const [responseStyleContent, setResponseStyleContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("prompt");
  const [contributions, setContributions] = useState([]);
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [promptUpdated, setPromptUpdated] = useState(false);

  // New state for UI improvements
  const [activeView, setActiveView] = useState("tasks"); // 'tasks', 'workflow', 'analytics'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [taskCategories, setTaskCategories] = useState({
    all: true,
    meetings: false,
    selfTasks: false,
    completed: false,
    pending: false,
  });

  const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
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
          className="px-3 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2 transition-all text-sm"
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
        className={`px-3 py-2 ${
          taskSchedulingEnabled
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        } text-white rounded-lg flex items-center gap-2 transition-all text-sm`}
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

  // New handlers for improved UI
  const handleTabChange = (tab) => {
    setActiveView(tab);
    if (tab === "access") {
      setShowAccessManagement(true);
    }
    if (tab === "analytics") {
      setShowVisitorAnalytics(true);
    }
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const handleCategoryToggle = (category) => {
    if (category === "all") {
      // If "All" is clicked, set it to true and all others to false
      setTaskCategories({
        all: true,
        meetings: false,
        selfTasks: false,
        completed: false,
        pending: false,
      });
    } else {
      // Otherwise, set "All" to false and toggle the selected category
      setTaskCategories({
        ...taskCategories,
        all: false,
        [category]: !taskCategories[category],
      });
    }
  };

  // Task filtering with new category filters
  const filteredTasks = tasks.filter((task) => {
    // Text search filter
    const matchesSearchTerm =
      task.taskQuestion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.presentUserData &&
        task.presentUserData.name &&
        task.presentUserData.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (task.taskDescription &&
        task.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filter (from dropdown)
    const matchesStatusDropdown =
      statusFilter === "all" || task.status === statusFilter;

    // Category filters (from pills)
    let matchesCategories = true;

    if (!taskCategories.all) {
      const categoryMatches = [];

      if (taskCategories.meetings && task.isMeeting.title) {
        categoryMatches.push(true);
      }

      if (taskCategories.selfTasks && task.isSelfTask) {
        categoryMatches.push(true);
      }

      if (taskCategories.completed && task.status === "completed") {
        categoryMatches.push(true);
      }

      if (
        taskCategories.pending &&
        (task.status === "pending" || task.status === "inprogress")
      ) {
        categoryMatches.push(true);
      }

      // If any category is selected but none match this task
      if (
        Object.values(taskCategories).some((value) => value) &&
        categoryMatches.length === 0
      ) {
        matchesCategories = false;
      }
    }

    return matchesSearchTerm && matchesStatusDropdown && matchesCategories;
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
  //FOR CONTRIBUTION
  const handleSortChange = (order) => {
    setSortOrder(order);

    const sortedContributions = [...contributions];

    sortedContributions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);

      if (order === "newest") {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setContributions(sortedContributions);
  };

  // const handleFilterChange = (status) => {
  //   setStatusFilter(status);
  //   loadContributions(status);
  // };

  const handleClose = () => {
    setPromptContent("");
    setResponseStyleContent("");
    setError("");
    setSuccessMessage("");
    setActiveTab("tasks");
  };

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

  // Render grid or list view for tasks
  const renderTasksView = () => {
    if (loading && !isDeleting) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (sortedTasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-gray-800 p-6 rounded-full mb-4">
            <ListChecks className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">
            No tasks found
          </h3>
          <p className="text-gray-400 max-w-md">
            No tasks match your current filters. Try adjusting your search or
            filters, or create a new task.
          </p>
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {sortedTasks.map((task) => renderTaskCard(task))}
        </div>
      );
    } else {
      return (
        <div className="flex flex-col gap-3">
          {sortedTasks.map((task) => renderTaskListItem(task))}
        </div>
      );
    }
  };

  // Render an individual task card (grid view)
  const renderTaskCard = (task) => (
    <motion.div
      key={task.uniqueTaskId || task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:border-gray-600 transition-all"
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
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </motion.button>
          </div>
        </div>

        {task.topicContext && (
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-gray-300 font-bold">Context:</span>{" "}
            {renderDescription(task.topicContext)}
          </p>
        )}

        {task.taskDescription && (
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-gray-300 font-bold">Description:</span>{" "}
            {renderDescription(task.taskDescription)}
          </p>
        )}

        <p className="text-gray-400 text-sm mb-4">
          <span className="text-gray-300 font-bold">
            {task.isSelfTask ? "Task Message:" : "User Message:"}
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
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {task.isMeeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" /> {task.isMeeting.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" /> {task.isMeeting.duration}{" "}
                    min
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
                    {task.isMeeting.status.charAt(0).toUpperCase() +
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
                      handleOpenMeetingLink(task.isMeeting.meetingLink)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Meeting
                  </motion.button>
                )}

              {task.isMeeting.status === "completed" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewMeetingDetails(task.isMeeting)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 ml-2"
                >
                  <FileText className="w-4 h-4" />
                  Details
                </motion.button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExpandTask(task._id)}
              className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
            >
              {expandedTask === task._id ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> More
                </>
              )}
            </motion.button>

            {!task.isSelfTask && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleViewUserDetails(task)}
                className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
              >
                <User className="w-4 h-4" /> User Info
              </motion.button>
            )}
           {task.isMeeting.status === "completed" &&(
             task.isMeeting.botActivated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_FRONTEND}/home/${
                      task.uniqueTaskId
                    }`,
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
                onClick={() => handleCreateBotAssistant(task)}
                disabled={creatingBot}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <Bot className="w-4 h-4" />
                {creatingBot ? "Creating..." : "Get Bot"}
              </motion.button>
              )
            )}
          </div>

          <p className="text-xs text-gray-500">
            Created: {formatDate(task.createdAt)}
          </p>
        </div>

        <AnimatePresence>
          {expandedTask === task._id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-gray-300 font-medium mb-2">Full Details</h4>
                <div className="bg-gray-900 p-3 rounded-lg text-sm">
                  {task.taskQuestion && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Message:
                      </span>{" "}
                      <span className="text-gray-300">{task.taskQuestion}</span>
                    </div>
                  )}

                  {task.taskDescription && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Description:
                      </span>{" "}
                      <span className="text-gray-300">
                        {task.taskDescription}
                      </span>
                    </div>
                  )}

                  {task.topicContext && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Context:
                      </span>{" "}
                      <span className="text-gray-300">{task.topicContext}</span>
                    </div>
                  )}

                  {task.createdAt && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Created:
                      </span>{" "}
                      <span className="text-gray-300">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  )}

                  {task.updatedAt && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Updated:
                      </span>{" "}
                      <span className="text-gray-300">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  )}

                  {task.uniqueTaskId && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Task ID:
                      </span>{" "}
                      <span className="text-gray-300">{task.uniqueTaskId}</span>
                    </div>
                  )}

                  {task.isMeeting && task.isMeeting.title && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Meeting Type:
                      </span>{" "}
                      <span className="text-gray-300">
                        {task.isMeeting.meetingType || "Standard"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {expandedUser === task._id && !task.isSelfTask && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-gray-300 font-medium mb-2">
                  User Information
                </h4>
                <div className="bg-gray-900 p-3 rounded-lg text-sm">
                  {task.presentUserData && (
                    <>
                      {task.presentUserData.name && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Name:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.name}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.email && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Email:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.email}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.mobileNo && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Mobile:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.mobileNo}
                          </span>
                        </div>
                      )}
                      {userDescriptions[task._id] && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-400 font-medium block mb-2">
                            AI-Generated User Profile:
                          </span>
                          <p className="text-gray-300 whitespace-pre-line">
                            {userDescriptions[task._id]}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Render a task list item (list view)
  const renderTaskListItem = (task) => (
    <motion.div
      key={task.uniqueTaskId || task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow hover:border-gray-600 transition-all p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {task.isSelfTask
                  ? "Self Task"
                  : task.presentUserData?.name || "Unknown User"}
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

            <p className="text-gray-400 text-sm mt-1 line-clamp-1">
              {task.taskQuestion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.isMeeting && task.isMeeting.status === "scheduled" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                task.isMeeting.meetingLink
                  ? handleOpenMeetingLink(task.isMeeting.meetingLink)
                  : handleViewMeetingDetails(task.isMeeting)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              {task.isMeeting.meetingLink ? (
                <>
                  <ExternalLink className="w-3 h-3" />
                  Join
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" />
                  Details
                </>
              )}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExpandTask(task._id)}
            className="bg-gray-700 hover:bg-gray-600 transition-colors px-2 py-1 rounded text-xs"
          >
            {expandedTask === task._id ? "Less" : "More"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {expandedTask === task._id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 overflow-hidden"
          >
            <div className="border-t border-gray-700 pt-3">
              {task.taskDescription && (
                <p className="text-gray-400 text-sm mb-2">
                  <span className="text-gray-300 font-bold">Description:</span>{" "}
                  {task.taskDescription}
                </p>
              )}

              {task.isMeeting && task.isMeeting.title && (
                <div
                  className={`rounded-lg p-3 my-2 border ${getMeetingCardStyle(
                    task.isMeeting.status
                  )}`}
                >
                  <h4 className="text-white font-medium mb-1">
                    {task.isMeeting.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {task.isMeeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {task.isMeeting.time}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTaskStatus(task)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  disabled={loading}
                >
                  <RefreshCw className="w-4 h-4" />
                  Toggle Status
                </motion.button>

                {!task.isSelfTask && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewUserDetails(task)}
                    className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <User className="w-4 h-4" /> User Info
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Login form
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Enter Admin Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
    >
      <style>{scrollbarStyles}</style>
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Admin Panel Header */}
        <div className="border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
            <span className="bg-green-700 text-green-100 text-xs px-2 py-0.5 rounded-full">
              {userData.user.username}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {renderTaskSchedulingButton()}
            <button
              onClick={refreshUserData}
              disabled={refreshing}
              className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => {
                onClose();
              }}
              className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <MainTabNavigator
            activeView={activeView}
            handleTabChange={handleTabChange}
            userData={userData}
            handleSelfTaskToggle={handleSelfTaskToggle}
            setShowCalendarScheduler={setShowCalendarScheduler}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-4">

          {error && (
                  <NotificationMessage
                    type="error"
                    title="Error"
                    message={error}
                  />
                )}
                
                {successMessage && (
                  <NotificationMessage
                    type="success"
                    title="Success"
                    message={successMessage}
                  />
                )}


            {activeView === "tasks" && (
              <>
                {/* Search and Filter Controls */}
                <div className="mb-4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Completed</option>
                          <option value="inprogress">In Progress</option>
                          <option value="pending">Pending</option>
                        </select>
                        <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>

                      <div className="relative">
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      </div>

                      <button
                        onClick={handleViewModeToggle}
                        className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-gray-300 hover:text-white transition-colors"
                        title={
                          viewMode === "grid"
                            ? "Switch to List View"
                            : "Switch to Grid View"
                        }
                      >
                        {viewMode === "grid" ? (
                          <List className="w-5 h-5" />
                        ) : (
                          <Grid className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCategoryToggle("all")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                        ${
                          taskCategories.all
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      All Tasks
                    </button>
                    <button
                      onClick={() => handleCategoryToggle("meetings")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                        ${
                          taskCategories.meetings
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      <Calendar className="w-3 h-3" /> Meetings
                    </button>
                    <button
                      onClick={() => handleCategoryToggle("selfTasks")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                        ${
                          taskCategories.selfTasks
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      <Clipboard className="w-3 h-3" /> Self Tasks
                    </button>
                    <button
                      onClick={() => handleCategoryToggle("completed")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                        ${
                          taskCategories.completed
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      <CheckCircle className="w-3 h-3" /> Completed
                    </button>
                    <button
                      onClick={() => handleCategoryToggle("pending")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
                        ${
                          taskCategories.pending
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                      <ClockIcon className="w-3 h-3" /> Pending
                    </button>
                  </div>
                </div>

                {/* Task List */}
                {renderTasksView()}
              </>
            )}

            {activeView === "workflow" && (
              <DailyWorkflow userData={userData} onRefresh={refreshUserData} />
            )}

            {activeView === "access" && showAccessManagement && (
              <div>
                <AccessManagement
                  userData={userData}
                  onUpdate={handleAccessManagementUpdate}
                  onClose={() => {
                    setActiveView("tasks");
                    setShowAccessManagement(false);
                  }}
                />
              </div>
            )}

            {activeView === "analytics" && showVisitorAnalytics && (
              <div>
                <VisitorAnalytics
                  userData={userData}
                  onClose={() => {
                    setShowVisitorAnalytics(false);
                    setActiveView("tasks");
                  }}
                />
              </div>
            )}

            {/* {activeView === "prompt" && (
              <DataManagementTab
                promptContent={promptContent}
                setPromptContent={setPromptContent}
                updatePrompt={updatePrompt}
                clearPrompt={clearPrompt}
                isLoading={isLoading}
              />
            )}

            {activeView === "responseStyle" && (
              <ResponseStyleTab
                responseStyleContent={responseStyleContent}
                setResponseStyleContent={setResponseStyleContent}
                updateResponseStyle={updateResponseStyle}
                clearResponseStyle={clearResponseStyle}
                isLoading={isLoading}
              />
            )}

            {activeView === "contributions" && (
              <ContributionsTab
                contributions={contributions}
                statusFilter={statusFilter}
                sortOrder={sortOrder}
                handleFilterChange={handleFilterChange}
                handleSortChange={handleSortChange}
                updateContributionStatus={updateContributionStatuse}
                refreshAllData={refreshUserData}
                refreshing={refreshing}
              />
            )} */}
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AnimatePresence>
        {showSelfTask && (
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
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showScheduler && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
            <CalendarMeetingForm
              initialData={meetingDetails}
              onSchedule={handleFormSubmit}
              onClose={handleCloseScheduler}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
        {showMeetingDetailsPopup && selectedMeeting && (
          <MeetingDetailsPopup
            meeting={selectedMeeting}
            onClose={() => setShowMeetingDetailsPopup(false)}
          />
        )}
      </AnimatePresence>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              notification.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <p className="text-white font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
export default AdminPanel;
