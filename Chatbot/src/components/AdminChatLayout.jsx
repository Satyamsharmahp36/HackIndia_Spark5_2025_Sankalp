import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  User,
  Bot,
  Loader2,
  Settings,
  Trash2,
  Mic,
  Home,
  LogOut,
  Menu,
  Plus,
  ListChecks,
  Calendar,
  Users,
  Activity,
  MessageCircle,
  Slack,
  Mail,
  X,
  ChevronDown,
  Shield,
  BarChart3,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAnswer } from "../services/ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import ContributionForm from "./ContributionForm";
import AdminPanel from "./AdminPanel";
import Cookies from "js-cookie";
import MessageContent from "./MessageContent";
import { useAppContext } from "../Appcontext";
import AIVoice from "./AIVoice";
import TaskList from "./AdminComponents/TaskList";
import TaskControls from "./AdminComponents/TaskControls";
import DailyWorkflow from "./DailyWorkflow";
import AccessManagement from "./AdminComponents/AccessManagement";
import VisitorAnalytics from "./AdminComponents/VisitorAnalytics";
import Memory from "./AdminComponents/Memory";
import IntegrationDashboard from "./AdminComponents/IntegrationDashboard";
import EmailDashboard from "./AdminComponents/EmailDashboard";
import SelfTaskForm from "./AdminComponents/SelfTaskForm";
import MeetingDetailsPopup from "./AdminComponents/MeetingDetailsPopup";
import CalendarScheduler from "./AdminComponents/CalendarScheduler";
import useAdminPanelTasks from "./AdminComponents/useAdminPanelTasks";

const AdminChatLayout = ({ onLogout, adminUserData }) => {
  const {
    userData,
    userName,
    presentUserData,
    presentUserName,
    refreshUserData,
    refreshPresentUserData,
  } = useAppContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState("chat"); // Default to chat view
  const [showSelfTask, setShowSelfTask] = useState(false);
  const [showCalendarScheduler, setShowCalendarScheduler] = useState(false);
  const [showIntegrationDashboard, setShowIntegrationDashboard] = useState(false);
  const [showEmailDashboard, setShowEmailDashboard] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [calendarData, setCalendarData] = useState(null);

  // Admin state - declare these before using them in the hook
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [taskCategories, setTaskCategories] = useState({
    all: true,
    meetings: false,
    selfTasks: false,
    completed: false,
    pending: false,
  });

  // Admin tasks hook
  const {
    tasks,
    loading,
    error,
    sortedTasks,
    expandedTask,
    expandedUser,
    userDescriptions,
    handleExpandTask,
    handleViewUserDetails,
    toggleTaskStatus,
    formatDate,
    getStatusColor,
    getStatusIcon,
    getMeetingCardStyle,
    renderDescription,
    setExpandedTask,
    setExpandedUser,
    setUserDescriptions,
  } = useAdminPanelTasks(currentUserData, searchTerm, statusFilter, sortOrder, taskCategories);

  // Placeholder functions for task actions
  const handleOpenMeetingLink = useCallback((meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    }
  }, []);

  const handleViewMeetingDetails = useCallback((meeting) => {
    console.log("View meeting details:", meeting);
    setSelectedMeeting(meeting);
    setShowMeetingDetails(true);
  }, []);

  const handleScheduleMeeting = useCallback((task) => {
    if (task.isMeeting && task.isMeeting.title) {
      const meetingData = {
        taskId: task.uniqueTaskId || task._id,
        title: task.isMeeting.title,
        description: task.isMeeting.description || task.taskDescription || "",
        startTime: task.isMeeting.date ? `${task.isMeeting.date}T${task.isMeeting.time}` : new Date().toISOString(),
        endTime: task.isMeeting.date ? `${task.isMeeting.date}T${task.isMeeting.time}` : new Date(Date.now() + 30 * 60000).toISOString(),
        userEmails: [
          currentUserData?.user?.email,
          task.presentUserData?.email || "",
        ].filter((email) => email),
      };

      setCalendarData(meetingData);
      setShowCalendarScheduler(true);
    }
  }, [currentUserData]);

  const handleCreateBotAssistant = useCallback((task) => {
    console.log("Create bot assistant for task:", task);
    // TODO: Implement bot assistant creation
  }, []);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const chatHistoryKey = currentUserData?.user?.name
    ? `${presentUserName || "anonymous"}_${currentUserData.user.name}`
    : null;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands: [
      {
        command: "clear chat",
        callback: () => {
          setMessages([]);
          localStorage.removeItem(chatHistoryKey);
        },
      },
    ],
  });

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      // Use adminUserData if provided, otherwise fall back to context userData
      const dataToUse = adminUserData || userData;
      
      if (dataToUse?.user) {
        // Check if this is a different user than the current one
        const isDifferentUser = currentUserData?.user?.name !== dataToUse.user.name;
        
        if (isDifferentUser) {
          console.log(`[User Switch] Switching from ${currentUserData?.user?.name || 'none'} to ${dataToUse.user.name}`);
          // Clear previous user's data
          setCurrentUserData(null);
          setMessages([]);
          setInput("");
          setIsInitialized(false);
        }
        
        setCurrentUserData(dataToUse);
        console.log('[AdminChatLayout] Setting currentUserData:', dataToUse);
        console.log('[AdminChatLayout] User name:', dataToUse.user.name);
        console.log('[AdminChatLayout] User tasks:', dataToUse.user.tasks);
        
        const savedMessages = localStorage.getItem(
          `${presentUserName || "anonymous"}_${dataToUse.user.name}`
        );
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          const welcomeMessage = {
            id: Date.now(),
            text: `Hello! I'm ${dataToUse.user.name}'s AI assistant. How can I help you today?`,
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        }
      } else {
        // No user data, clear everything
        setCurrentUserData(null);
        setMessages([]);
        setInput("");
      }
      setIsInitialized(true);
    };

    initializeData();
  }, [adminUserData, userData, presentUserName, currentUserData?.user?.name]);

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0 && chatHistoryKey) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages));
    }
  }, [messages, chatHistoryKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speech recognition
  useEffect(() => {
    if (transcript && !listening) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, listening, resetTranscript]);

  const autoResizeTextarea = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Validate user data before making AI call
      if (!currentUserData?.user) {
        console.error("No valid user data available for AI response");
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm sorry, there was an issue loading your profile information. Please try refreshing the page.",
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const response = await getAnswer(input.trim(), currentUserData);
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error getting response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    if (chatHistoryKey) {
      localStorage.removeItem(chatHistoryKey);
    }
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      AIVoice.stop();
      setIsSpeaking(false);
    } else {
      setVoiceEnabled(!voiceEnabled);
    }
  };

  const sidebarItems = useMemo(() => [
    { id: "chat", label: "Chat", icon: MessageCircle, active: activeView === "chat" },
    { id: "tasks", label: "Task Management", icon: ListChecks, active: activeView === "tasks" },
    { id: "workflow", label: "Daily Workflow", icon: Activity, active: activeView === "workflow" },
    { id: "calendar", label: "Calendar", icon: Calendar, active: activeView === "calendar" },
    { id: "access", label: "Access Management", icon: Shield, active: activeView === "access" },
    { id: "analytics", label: "Visitor Analytics", icon: BarChart3, active: activeView === "analytics" },
    { id: "memory", label: "Memory", icon: Brain, active: activeView === "memory" },
    { id: "slack", label: "Slack", icon: Slack, active: activeView === "slack" },
    { id: "email", label: "Email", icon: Mail, active: activeView === "email" },
  ], [activeView]);

  const handleTabChange = useCallback((tabId) => {
    setActiveView(tabId);
  }, []);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === "grid" ? "list" : "grid");
  }, []);

  const handleCategoryToggle = useCallback((category) => {
    setTaskCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  const renderChatView = () => (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white py-4 px-6 flex justify-between items-center border-b border-gray-100">
        <div className="flex items-center">
          <div className="bg-purple-100 p-2 rounded-full mr-3">
            <Bot className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentUserData?.user?.name}'s AI Assistant
            </h1>
            <p className="text-xs text-gray-500">Powered by ChatMATE</p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear chat
          </Button>
          
          <Button
            onClick={() => setShowContributionForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            Contribute
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[80%] ${
                  message.isUser ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.isUser
                      ? "bg-purple-600"
                      : "bg-gray-100"
                  }`}
                >
                  {message.isUser ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.isUser
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <MessageContent text={message.text} />
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className={`relative flex items-end rounded-xl transition-all duration-200 ${
              isFocused ? "ring-2 ring-purple-500" : "ring-1 ring-gray-200"
            }`}
          >
            <div className="flex-1 p-4">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResizeTextarea(e);
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={`Ask me anything about ${currentUserData?.user?.name}...`}
                className="w-full bg-transparent border-none text-gray-800 placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-[200px]"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center gap-2 p-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleVoice}
                disabled={!browserSupportsSpeechRecognition}
                className="text-gray-500 hover:text-gray-700"
              >
                <Mic className="w-5 h-5" />
              </Button>
              
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                size="icon"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="flex-1 flex flex-col">
      <div className="bg-white py-4 px-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 capitalize">
            {activeView.replace('_', ' ')} Management
          </h2>
          <button
            onClick={() => setActiveView("chat")}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeView === "tasks" && (
            <div className="space-y-6">
              {/* Task Controls */}
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
                creatingBot={false}
                formatDate={formatDate}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                getMeetingCardStyle={getMeetingCardStyle}
                renderDescription={renderDescription}
                setExpandedTask={setExpandedTask}
                setExpandedUser={setExpandedUser}
                setUserDescriptions={setUserDescriptions}
                userData={currentUserData}
              />
            </div>
          )}

          {activeView === "workflow" && (
            <DailyWorkflow
              userData={currentUserData}
              onRefresh={() => window.location.reload()}
            />
          )}


          {activeView === "calendar" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Calendar Integration</h3>
                <p className="text-gray-600">
                  Schedule meetings, set reminders, and integrate with your 
                  calendar applications.
                </p>
                <div className="mt-4">
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Open Calendar Manager
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === "slack" && (
            <IntegrationDashboard
              isOpen={true}
              onClose={() => setActiveView("chat")}
              userData={currentUserData}
            />
          )}

          {activeView === "access" && (
            <AccessManagement
              onClose={() => setActiveView("chat")}
              userData={currentUserData}
              onUpdate={() => refreshUserData()}
            />
          )}

          {activeView === "analytics" && (
            <VisitorAnalytics
              onClose={() => setActiveView("chat")}
              userData={currentUserData}
            />
          )}

          {activeView === "memory" && (
            <Memory
              onClose={() => setActiveView("chat")}
              userData={currentUserData}
            />
          )}

          {activeView === "email" && (
            <EmailDashboard
              isOpen={true}
              onClose={() => setActiveView("chat")}
              userData={currentUserData}
            />
          )}
        </div>
      </div>
    </div>
  );

  const scrollbarStyles = `
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;

  if (!isInitialized || !currentUserData?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-gray-500" />
        </motion.div>
        <p className="ml-4 text-gray-500">Initializing...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      <style>{scrollbarStyles}</style>

      {/* Sidebar */}
      <motion.div
        initial={{ width: 280 }}
        animate={{ width: sidebarCollapsed ? 60 : 280 }}
        className="bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <Bot className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">ChatMATE</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => handleTabChange(item.id)}
              className={`w-full justify-start ${
                item.active
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium">{item.label}</span>
              )}
            </Button>
          ))}
        </nav>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="px-4 pb-4">
            <h3 className="text-gray-600 text-sm font-medium mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setShowSelfTask(true)}
                className="w-full justify-start text-purple-700 hover:bg-purple-50 border border-purple-200"
              >
                <Plus className="w-4 h-4" />
                <span className="ml-3 text-sm font-medium">Create Self Task</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCalendarScheduler(true)}
                className="w-full justify-start text-blue-700 hover:bg-blue-50 border border-blue-200"
              >
                <Calendar className="w-4 h-4" />
                <span className="ml-3 text-sm font-medium">Schedule Meeting</span>
              </Button>
              {/* <Button
                variant="ghost"
                onClick={() => setShowIntegrationDashboard(true)}
                className="w-full justify-start text-green-700 hover:bg-green-50 border border-green-200"
              >
                <Slack className="w-4 h-4" />
                <span className="ml-3 text-sm font-medium">Chat Integration</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowEmailDashboard(true)}
                className="w-full justify-start text-purple-700 hover:bg-purple-50 border border-purple-200"
              >
                <Mail className="w-4 h-4" />
                <span className="ml-3 text-sm font-medium">Email Dashboard</span>
              </Button> */}
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            {/* <Button
              variant="ghost"
              onClick={() => setShowAdminPanel(true)}
              className="w-full justify-start text-gray-600 hover:bg-gray-100"
            >
              <Settings className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium">Settings</span>
              )}
            </Button> */}
            <Button
              variant="ghost"
              onClick={onLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              {!sidebarCollapsed && (
                <span className="ml-3 text-sm font-medium">Logout</span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content Area */}
      {activeView === "chat" ? renderChatView() : renderAdminView()}

      {/* Modals */}
      <AnimatePresence>
        {showContributionForm && (
          <ContributionForm
            isOpen={showContributionForm}
            onClose={() => setShowContributionForm(false)}
            userData={currentUserData}
          />
        )}
        
        {showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}

        {showSelfTask && (
          <SelfTaskForm
            onClose={() => setShowSelfTask(false)}
            onSuccess={() => {
              setShowSelfTask(false);
              refreshUserData();
            }}
            userData={currentUserData}
          />
        )}

        {showIntegrationDashboard && (
          <IntegrationDashboard
            isOpen={showIntegrationDashboard}
            onClose={() => setShowIntegrationDashboard(false)}
            userData={currentUserData}
          />
        )}

        {showEmailDashboard && (
          <EmailDashboard
            isOpen={showEmailDashboard}
            onClose={() => setShowEmailDashboard(false)}
            userData={currentUserData}
          />
        )}

        {showMeetingDetails && selectedMeeting && (
          <MeetingDetailsPopup
            meeting={selectedMeeting}
            onClose={() => {
              setShowMeetingDetails(false);
              setSelectedMeeting(null);
            }}
          />
        )}

        {showCalendarScheduler && calendarData && (
          <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Schedule Meeting
                </h3>
                <button
                  onClick={() => {
                    setShowCalendarScheduler(false);
                    setCalendarData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <CalendarScheduler
                taskId={calendarData.taskId}
                username={currentUserData?.user?.username}
                title={calendarData.title}
                description={calendarData.description}
                startTime={calendarData.startTime}
                endTime={calendarData.endTime}
                userEmails={calendarData.userEmails}
                onSuccess={() => {
                  setShowCalendarScheduler(false);
                  setCalendarData(null);
                  refreshUserData();
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminChatLayout;