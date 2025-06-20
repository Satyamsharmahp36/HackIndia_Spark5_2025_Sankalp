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
import AccessManagement from "./AdminComponents/AccessManagement";
import axios from "axios";
import apiService from "../services/apiService";
import VisitorAnalytics from "./AdminComponents/VisitorAnalytics";
import MainTabNavigator from "./AdminComponents/MainTabNavigator";
import NotificationMessage from "./AdminComponents/NotificationMessage";
import { useAppContext } from '../Appcontext';
import TaskList from "./AdminComponents/TaskList";
import AdminPanelHeader from "./AdminComponents/AdminPanelHeader";
import TaskControls from "./AdminComponents/TaskControls";
import AdminPanelOverlays from "./AdminComponents/AdminPanelOverlays";
import NotificationToast from "./AdminComponents/NotificationToast";
import useAdminPanelTasks from "./AdminComponents/useAdminPanelTasks";

const AdminPanel = ({ onClose }) => {
  const { userData, refreshUserData } = useAppContext();

  // Original state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");
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
  const [successMessage, setSuccessMessage] = useState("");

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

  const {
    tasks,
    setTasks,
    loading,
    setLoading,
    error,
    setError,
    fetchTasks,
    toggleTaskStatus,
    expandedTask,
    setExpandedTask,
    expandedUser,
    setExpandedUser,
    userDescriptions,
    setUserDescriptions,
    handleViewUserDetails,
    handleExpandTask,
  } = useAdminPanelTasks(userData);

  useEffect(() => {
    setIsAuthenticated(false);
    setPassword("");
    setTasks([]);
    setLoading(false);
    setError(null);
    setPasswordError("");
  }, []);

  // Add effect to keep tasks in sync with userData
  useEffect(() => {
    if (userData?.user?.tasks) {
      setTasks(userData.user.tasks);
    }
  }, [userData?.user?.tasks]);

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

  const handleRefreshUserData = async () => {
    try {
      setRefreshing(true);
      toast.info("Refreshing user data...");

      await refreshUserData();
      setTasks(userData.user.tasks || []);
      toast.success("User data refreshed successfully");
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
          await handleRefreshUserData();
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
        <AdminPanelHeader
          username={userData.user.username}
          renderTaskSchedulingButton={renderTaskSchedulingButton}
          handleRefreshUserData={handleRefreshUserData}
          refreshing={refreshing}
          onClose={onClose}
        />

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
                <TaskControls
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  viewMode={viewMode}
                  handleViewModeToggle={handleViewModeToggle}
                  taskCategories={taskCategories}
                  handleCategoryToggle={handleCategoryToggle}
                />

                {/* Task List */}
                <TaskList
                  tasks={tasks}
                  loading={loading}
                  error={error}
                  sortedTasks={sortedTasks}
                  expandedTask={expandedTask}
                  expandedUser={expandedUser}
                  userDescriptions={userDescriptions}
                  viewMode={viewMode}
                  searchTerm={searchTerm}
                  statusFilter={statusFilter}
                  sortOrder={sortOrder}
                  taskCategories={taskCategories}
                  handleExpandTask={handleExpandTask}
                  handleViewUserDetails={handleViewUserDetails}
                  handleOpenMeetingLink={handleOpenMeetingLink}
                  handleViewMeetingDetails={handleViewMeetingDetails}
                  handleScheduleMeeting={handleScheduleMeeting}
                  handleCreateBotAssistant={handleCreateBotAssistant}
                  toggleTaskStatus={toggleTaskStatus}
                  creatingBot={creatingBot}
                  formatDate={formatDate}
                  getStatusColor={getStatusColor}
                  getStatusIcon={getStatusIcon}
                  getMeetingCardStyle={getMeetingCardStyle}
                  renderDescription={renderDescription}
                  setExpandedTask={setExpandedTask}
                  setExpandedUser={setExpandedUser}
                  setUserDescriptions={setUserDescriptions}
                  userData={userData}
                />
              </>
            )}

            {activeView === "workflow" && (
              <DailyWorkflow userData={userData} onRefresh={handleRefreshUserData} />
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
          </div>
        </div>
      </div>

      {/* Overlays */}
      <AdminPanelOverlays
        showSelfTask={showSelfTask}
        handleSelfTaskToggle={handleSelfTaskToggle}
        handleRefreshUserData={handleRefreshUserData}
        setShowSelfTask={setShowSelfTask}
        userData={userData}
        showScheduler={showScheduler}
        meetingDetails={meetingDetails}
        handleFormSubmit={handleFormSubmit}
        handleCloseScheduler={handleCloseScheduler}
        showCalendarScheduler={showCalendarScheduler}
        calendarData={calendarData}
        showMeetingDetailsPopup={showMeetingDetailsPopup}
        selectedMeeting={selectedMeeting}
        setShowMeetingDetailsPopup={setShowMeetingDetailsPopup}
      />

      {/* Notifications */}
      <NotificationToast notification={notification} setNotification={setNotification} />
    </motion.div>
  );
};

export default AdminPanel;
