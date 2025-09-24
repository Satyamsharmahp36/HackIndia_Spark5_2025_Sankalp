import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const useAdminPanelTasks = (userData, searchTerm = "", statusFilter = "all", sortOrder = "newest", taskCategories = { all: true, meetings: false, selfTasks: false, completed: false, pending: false }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedTask, setExpandedTask] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);
  const [userDescriptions, setUserDescriptions] = useState({});
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState("");

  useEffect(() => {
    if (userData?.user?.tasks) {
      setTasks(userData.user.tasks);
    } else {
      setTasks([]);
    }
  }, [userData?.user?.tasks]);

  const fetchTasks = () => {
    setTasks(userData.user.tasks);
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
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "completed":
        return "bg-green-50 border-green-200 text-green-900";
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-900";
      case "pending":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  const renderDescription = (text) => {
    if (!text) return "N/A";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
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