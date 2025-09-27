import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import apiService from "../../services/apiService";

const useAdminPanelTasks = (userData, searchTerm = "", statusFilter = "all", sortOrder = "newest", taskCategories = { all: true, meetings: false, selfTasks: false, completed: false, pending: false }, autoRefreshInterval = 30000) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDescriptions, setUserDescriptions] = useState({});
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const refreshIntervalRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    if (userData?.user?.tasks) {
      setTasks(userData.user.tasks);
    } else {
      setTasks([]);
    }
  }, [userData?.user?.tasks]);

  // Auto-refresh function
  const refreshTasks = useCallback(async () => {
    if (!userData?.user?.username || isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      console.log('[useAdminPanelTasks] Auto-refreshing tasks...');
      
      const result = await apiService.getUserData(userData.user.username);
      
      if (result.success && result.data?.user?.tasks) {
        const newTasks = result.data.user.tasks;
        
        // Use functional update to avoid dependency on current tasks
        setTasks(currentTasks => {
          const currentTaskIds = currentTasks.map(task => task._id || task.uniqueTaskId).sort();
          const newTaskIds = newTasks.map(task => task._id || task.uniqueTaskId).sort();
          
          // Check if tasks have actually changed
          const tasksChanged = JSON.stringify(currentTaskIds) !== JSON.stringify(newTaskIds) ||
            JSON.stringify(currentTasks) !== JSON.stringify(newTasks);
          
          if (tasksChanged) {
            setLastRefreshTime(new Date());
            console.log('[useAdminPanelTasks] Tasks updated via auto-refresh');
            
            // Show subtle notification for new tasks
            const newTaskCount = newTasks.length - currentTasks.length;
            if (newTaskCount > 0) {
              toast.info(`${newTaskCount} new task${newTaskCount > 1 ? 's' : ''} available`, {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: true,
              });
            }
            return newTasks;
          }
          
          return currentTasks; // No change, return current tasks
        });
      }
    } catch (error) {
      console.error('[useAdminPanelTasks] Error during auto-refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [userData?.user?.username, isRefreshing]);

  const fetchTasks = () => {
    setTasks(userData.user.tasks);
  };

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (!userData?.user?.username) return;
    
    try {
      setIsRefreshing(true);
      toast.info("Refreshing tasks...", { position: "top-right" });
      
      const result = await apiService.getUserData(userData.user.username);
      
      if (result.success && result.data?.user?.tasks) {
        setTasks(result.data.user.tasks);
        setLastRefreshTime(new Date());
        toast.success("Tasks refreshed successfully", { position: "top-right" });
      } else {
        toast.error("Failed to refresh tasks", { position: "top-right" });
      }
    } catch (error) {
      console.error('[useAdminPanelTasks] Error during manual refresh:', error);
      toast.error("Error refreshing tasks", { position: "top-right" });
    } finally {
      setIsRefreshing(false);
    }
  }, [userData?.user?.username]);

  // Auto-refresh setup
  useEffect(() => {
    if (!userData?.user?.username || autoRefreshInterval <= 0) return;

    // Clear existing intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Set up auto-refresh interval
    refreshIntervalRef.current = setInterval(() => {
      refreshTasks();
    }, autoRefreshInterval);

    // Initial refresh after a short delay
    refreshTimeoutRef.current = setTimeout(() => {
      refreshTasks();
    }, 2000);

    // Cleanup on unmount or dependency change
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [userData?.user?.username, autoRefreshInterval]); // Removed refreshTasks from dependencies

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

  const generateUserDescription = async (prompt) => {
    try {
      if (!userData.user.geminiApiKey) {
        return "No API key available to generate description.";
      }
      const genAI = new GoogleGenerativeAI(userData.user.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
    setUserInfoLoading(true);
    setUserInfoError("");
    if (
      !userDescriptions[task._id] &&
      task.presentUserData &&
      task.presentUserData.prompt
    ) {
      try {
        const description = await generateUserDescription(
          task.presentUserData.prompt
        );
        setUserDescriptions((prev) => ({
          ...prev,
          [task._id]: description,
        }));
        setUserInfoError("");
      } catch (err) {
        setUserInfoError("Failed to generate user description.");
      }
    }
    setUserInfoLoading(false);
  };

  const handleExpandTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Utility functions for task display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-600 hover:bg-green-700";
      case "inprogress":
        return "bg-yellow-600 hover:bg-yellow-700";
      case "pending":
        return "bg-blue-600 hover:bg-blue-700";
      case "cancelled":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-gray-600 hover:bg-gray-700";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return "✓";
      case "inprogress":
        return "⏳";
      case "pending":
        return "⏸";
      case "cancelled":
        return "✗";
      default:
        return "?";
    }
  };

  const getMeetingCardStyle = (meetingStatus) => {
    switch (meetingStatus) {
      case "scheduled":
        return "bg-blue-100 border-blue-700";
      case "completed":
        return "bg-green-100 border-green-700";
      case "cancelled":
        return "bg-red-900 border-red-700";
      case "pending":
        return "bg-yellow-100 border-yellow-700";
      default:
        return "bg-gray-900 border-gray-700";
    }
  };

  const renderDescription = (text) => {
    if (!text) return "N/A";
    // For now, return the text as-is since we can't use JSX in a .js file
    // The actual JSX rendering will be handled by the components that use this function
    return text;
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

      // If any specific category is selected (not "all") but none match this task
      if (
        (taskCategories.meetings || taskCategories.selfTasks || taskCategories.completed || taskCategories.pending) &&
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

  return {
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
    userInfoLoading,
    userInfoError,
    setUserInfoLoading,
    setUserInfoError,
    sortedTasks,
    filteredTasks,
    formatDate,
    getStatusColor,
    getStatusIcon,
    getMeetingCardStyle,
    renderDescription,
  };
};

export default useAdminPanelTasks; 