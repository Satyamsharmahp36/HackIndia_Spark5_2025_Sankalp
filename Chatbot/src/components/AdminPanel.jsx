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
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "react-toastify";
import DailyWorkflow from "./DailyWorkflow";
import AccessManagement from "./AdminComponents/AccessManagement";
import axios from "axios";
import apiService from "../services/apiService";
import VisitorAnalytics from "./AdminComponents/VisitorAnalytics";
import MainTabNavigator from "./AdminComponents/MainTabNavigator";
import NotificationMessage from "./AdminComponents/NotificationMessage";
import { useAppContext } from "../Appcontext";
import TaskList from "./AdminComponents/TaskList";
import AdminPanelHeader from "./AdminComponents/AdminPanelHeader";
import TaskControls from "./AdminComponents/TaskControls";
import AdminPanelOverlays from "./AdminComponents/AdminPanelOverlays";
import NotificationToast from "./AdminComponents/NotificationToast";
import useAdminPanelTasks from "./AdminComponents/useAdminPanelTasks";
import IntegrationDashboard from "./AdminComponents/IntegrationDashboard";
import EmailDashboard from "./AdminComponents/EmailDashboard";
import EmailManagement from "./AdminComponents/EmailManagement";
import ReminderPanel from "./AdminComponents/ReminderPanel";

const AdminPanel = ({ onClose, showOnlyView = null }) => {
  const { userData, refreshUserData } = useAppContext();

  // Original state management
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Start as authenticated since user is already logged in
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
  const [showIntegrationDashboard, setShowIntegrationDashboard] =
    useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  const [reminders, setReminders] = useState([]);

  // New state for UI improvements
  const [activeView, setActiveView] = useState("reminders"); // 'reminders' (access and analytics moved to main sidebar)
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
    refreshTasks,
    manualRefresh,
    isRefreshing,
    lastRefreshTime,
    toggleTaskStatus,
    expandedTask,
    setExpandedTask,
    expandedUser,
    setExpandedUser,
    userDescriptions,
    setUserDescriptions,
    handleViewUserDetails,
    handleExpandTask,
    sortedTasks,
    filteredTasks,
    formatDate,
    getStatusColor,
    getStatusIcon,
    getMeetingCardStyle,
    renderDescription,
  } = useAdminPanelTasks(userData, searchTerm, statusFilter, sortOrder, taskCategories, 30000);

  useEffect(() => {
    setIsAuthenticated(false);
    setPassword("");
    setTasks([]);
    setLoading(false);
    setError(null);
    setPasswordError("");
  }, []);

  // Tasks are now managed by useAdminPanelTasks hook
  // Removed duplicate task setting to avoid conflicts
  
  // Debug logging removed - tasks should now display properly

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
      await manualRefresh();
    } catch (error) {
      console.error("Error refreshing user data:", error);
      toast.error("Error refreshing user data");
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddReminder = (reminder) => {
    // Save reminder to backend & update state here
    setReminders((prev) => [
      ...prev,
      { ...reminder, id: Date.now().toString() },
    ]);
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

  const handleChatIntegration = () => {
    setShowIntegrationDashboard(true);
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

      // Ensure geminiApiKey exists (use environment variable as fallback)
      const apiKey = userData.user.geminiApiKey || import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
      if (!apiKey) {
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
        geminiApiKey: apiKey,
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
    // Close any open overlays when switching tabs
    if (tab !== "emails") {
      setShowEmailDashboard(false);
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

  // Task filtering and sorting is now handled in the useAdminPanelTasks hook
  // Utility functions are also provided by the hook

  // Login form
  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold">Admin Panel</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Enter Admin Password
              </label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
                placeholder="Enter password"
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleLogin}
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <style>{scrollbarStyles}</style>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Admin Panel Header */}
        <AdminPanelHeader
          username={userData.user.username}
          renderTaskSchedulingButton={renderTaskSchedulingButton}
          handleRefreshUserData={handleRefreshUserData}
          refreshing={refreshing}
          isRefreshing={isRefreshing}
          lastRefreshTime={lastRefreshTime}
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
            handleChatIntegration={handleChatIntegration}
            handleEmailDashboard={() => setShowEmailDashboard(true)}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50">
            {error && (
              <NotificationMessage type="error" title="Error" message={error} />
            )}

            {successMessage && (
              <NotificationMessage
                type="success"
                title="Success"
                message={successMessage}
              />
            )}

            {/* Access Management and Visitor Analytics moved to main sidebar */}

            {activeView === "reminders" && (
              <ReminderPanel
                userId={userData.user.id}
                reminders={reminders}
                onAddReminder={handleAddReminder}
              />
            )}

            {activeView === "emails" && (
              <EmailManagement userData={userData} />
            )}

            {activeView === "access" && showAccessManagement && (
              <AccessManagement
                userData={userData}
                onUpdate={handleAccessManagementUpdate}
                onClose={() => setShowAccessManagement(false)}
              />
            )}

            {activeView === "analytics" && showVisitorAnalytics && (
              <VisitorAnalytics
                userData={userData}
                onClose={() => setShowVisitorAnalytics(false)}
              />
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

      {/* Integration Dashboard */}
      <IntegrationDashboard
        isOpen={showIntegrationDashboard}
        onClose={() => setShowIntegrationDashboard(false)}
        userData={userData}
      />


      {/* Notifications */}
      <NotificationToast
        notification={notification}
        setNotification={setNotification}
      />
    </motion.div>
  );
};

export default AdminPanel;
