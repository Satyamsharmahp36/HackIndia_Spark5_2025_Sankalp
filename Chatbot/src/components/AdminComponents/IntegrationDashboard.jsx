import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MessageCircle,
  Slack,
  Plus,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Shield,
  Zap,
  Trash2,
  Edit,
  RefreshCw,
  Globe,
  Building,
  Key,
  Link,
  Unlink,
  Activity,
  Bell,
  Hash,
  Lock,
  Volume2,
  MoreHorizontal,
  Bot
} from "lucide-react";
import axios from "axios";

const IntegrationDashboard = ({ isOpen, onClose, userData }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showAddChatDialog, setShowAddChatDialog] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedWorkspaces, setConnectedWorkspaces] = useState([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [error, setError] = useState(null);
  const [creatingBot, setCreatingBot] = useState(false);

  // Fetch integration data when component opens
  useEffect(() => {
    if (isOpen && userData?.user?.username) {
      fetchIntegrationData();
    }
  }, [isOpen, userData?.user?.username]);

  const fetchIntegrationData = async () => {
    if (!userData?.user?.username) return;
    
    setLoadingWorkspaces(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND}/integrations/${userData.user.username}`
      );
      
      if (response.data.success) {
        // Transform the API data to match our component structure
        const transformedWorkspaces = response.data.data.map(integration => ({
          id: integration._id,
          name: integration.workspaceName,
          platform: integration.platform,
          status: "connected",
          lastSync: "Just now", // You can add last sync time to your API if needed
          workspacelink: integration.workspacelink,
          // workspaceBackendLink: integration.workspaceBackendLink,
          userid: integration.userid,
          channels: integration.channels.map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.is_private ? "private" : "public",
            members: 0, // You can add member count if available in your API
            unread: 0, // You can add unread count if available in your API
            is_private: channel.is_private,
            is_archived: channel.is_archived,
            created: channel.created,
            topic: channel.topic,
            purpose: channel.purpose,
            creator: channel.purpose.creator
          }))
        }));
        
        setConnectedWorkspaces(transformedWorkspaces);
      } else {
        setError("Failed to fetch integration data");
      }
    } catch (error) {
      console.error("Error fetching integration data:", error);
      setError(error.response?.data?.message || "Failed to fetch integration data");
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleClose = () => {
    setSelectedWorkspace(null);
    setShowAddChatDialog(false);
    setShowAgentDialog(false);
    setIsLoading(false);
    setCreatingBot(false);
    setError(null);
    onClose();
  };

  const handleAddChat = () => {
    setShowAddChatDialog(true);
  };

  const handleConnectWorkspace = () => {
    setShowAgentDialog(true);
  };

  const handleAgentMeetingResponse = async (agree) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    if (agree) {
      window.open("https://calendly.com/your-agent", "_blank");
    }
    setShowAgentDialog(false);
  };

  const handleSlackProceed = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    window.open("https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=chat:write,channels:read&redirect_uri=YOUR_REDIRECT_URI", "_blank");
    setShowAddChatDialog(false);
  };

  const handleCreateChannelBot = async (channel, workspace) => {
    setCreatingBot(true);
    
    try {
      // First check if bot already exists
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND}/create-channel-bot`,
        {
          channelId: channel.id,
          workspaceLink: workspace.workspacelink,
          ownerId: channel.creator,
          channelName: workspace.name + "-" + channel.name
        }
      );
      
      if (response.data.success) {
        // Bot created or already exists, redirect to bot
        window.open(
          `${import.meta.env.VITE_FRONTEND}/home/${channel.id}`,
          "_blank"
        );
      } else {
        console.error("Failed to create bot:", response.data.message);
        setError("Failed to create bot for this channel");
      }
    } catch (error) {
      console.error("Error creating channel bot:", error);
      setError(error.response?.data?.message || "Error creating bot for this channel");
    } finally {
      setCreatingBot(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case "slack":
        return <Slack className="w-5 h-5" />;
      case "discord":
        return <MessageCircle className="w-5 h-5" />;
      case "teams":
        return <Users className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case "public":
      case "text":
        return <Hash className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      case "voice":
        return <Volume2 className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const workspaceOptions = [
    {
      id: "slack",
      name: "Slack",
      icon: <Slack className="w-5 h-5" />,
      description: "Connect your Slack workspace",
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-7xl h-[90vh] overflow-hidden flex"
        >
          {/* Left Sidebar */}
          <div className="w-80 bg-gray-900 border-r border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Link className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Integrations</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddChat}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-3 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Chat</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnectWorkspace}
                  className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-3 transition-colors text-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>Connect Workspace</span>
                </motion.button>
              </div>
            </div>

            {/* Connected Workspaces */}
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Connected Workspaces</h3>
              
              {loadingWorkspaces ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                  </div>
                  <p className="text-gray-400 text-sm">Loading workspaces...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-red-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-red-400 text-sm mb-2">Error loading workspaces</p>
                  <p className="text-gray-400 text-xs">{error}</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={fetchIntegrationData}
                    className="mt-3 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-xs"
                  >
                    Retry
                  </motion.button>
                </div>
              ) : connectedWorkspaces.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400 text-sm">No workspaces connected</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {connectedWorkspaces.map((workspace) => (
                    <motion.button
                      key={workspace.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedWorkspace(workspace)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedWorkspace?.id === workspace.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-600 rounded-lg">
                          {getPlatformIcon(workspace.platform)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{workspace.name}</h4>
                          <div className="flex items-center gap-2 text-xs opacity-75">
                            <span>{workspace.channels.length} channels</span>
                            <span>•</span>
                            <span>{workspace.lastSync}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(workspace.workspacelink, "_blank");
                            }}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {selectedWorkspace ? (
              <>
                {/* Workspace Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-700 rounded-lg">
                        {getPlatformIcon(selectedWorkspace.platform)}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedWorkspace.name}</h2>
                        <p className="text-gray-400 text-sm">
                          {selectedWorkspace.channels.length} channels • Last sync: {selectedWorkspace.lastSync}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Channels List */}
                <div className="flex-1 overflow-auto p-6">
                  <div className="grid gap-4">
                    {selectedWorkspace.channels.map((channel) => (
                      <div key={channel.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-600 rounded-lg">
                              {getChannelIcon(channel.type)}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{channel.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  channel.is_private 
                                    ? 'bg-purple-900/20 text-purple-400' 
                                    : 'bg-green-900/20 text-green-400'
                                }`}>
                                  {channel.is_private ? 'private' : 'public'}
                                </span>
                                {channel.is_archived && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-gray-900/20 text-gray-400">
                                    archived
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  Created: {new Date(channel.created * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              {channel.purpose?.value && (
                                <p className="text-gray-400 text-sm mt-2 line-clamp-2">
                                  {channel.purpose.value}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateChannelBot(channel, selectedWorkspace);
                              }}
                              disabled={creatingBot}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                            >
                              <Bot className="w-4 h-4" />
                              {creatingBot ? "Creating..." : "Bot"}
                            </motion.button>
                            <MoreHorizontal className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Globe className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No Workspace Selected</h3>
                  <p className="text-gray-400 mb-8">
                    Choose a workspace from the sidebar to view its channels, or connect a new workspace to get started.
                  </p>
                  
                  {loadingWorkspaces ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                      </div>
                      <p className="text-gray-400">Loading workspaces...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-red-400 mb-2">Error loading workspaces</p>
                      <p className="text-gray-400 text-sm mb-4">{error}</p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={fetchIntegrationData}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded"
                      >
                        Retry
                      </motion.button>
                    </div>
                  ) : connectedWorkspaces.length === 0 ? (
                    <div className="space-y-4">
                      <div className="bg-gray-700 rounded-lg p-6 border border-gray-600">
                        <h4 className="text-lg font-semibold text-white mb-2">Get Started</h4>
                        <p className="text-gray-400 text-sm mb-4">
                          Connect your first workspace to start managing channels and integrations.
                        </p>
                        <div className="grid gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAddChat}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-3 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add New Chat</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConnectWorkspace}
                            className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-3 transition-colors"
                          >
                            <Users className="w-4 h-4" />
                            <span>Connect Workspace</span>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">
                      Select a workspace from the sidebar to view its channels and manage integrations.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Add New Chat Dialog */}
        <AnimatePresence>
          {showAddChatDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md p-6"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Add New Chat</h3>
                  <p className="text-gray-400 mb-6">
                    You'll need to login in order to integrate with your workspace. 
                    Choose your preferred platform below.
                  </p>
                </div>

                <div className="mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-all text-left bg-gray-700 hover:bg-gray-600"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-600 rounded-lg">
                        <Slack className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">Slack</h4>
                        <p className="text-gray-300 text-sm">Connect your Slack workspace</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.button>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddChatDialog(false)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSlackProceed}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Proceed to Login
                        <Zap className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect Workspace Dialog */}
        <AnimatePresence>
          {showAgentDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md p-6"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Connect Your Workspace</h3>
                  <p className="text-gray-400 mb-6">
                    You'll have a meeting with our agent to connect you with your workspace. 
                    This ensures a seamless integration experience.
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-white mb-1">What to expect:</h4>
                      <ul className="text-gray-300 text-sm space-y-1">
                        <li>• 15-minute consultation call</li>
                        <li>• Workspace assessment and setup</li>
                        <li>• Custom integration configuration</li>
                        <li>• Post-integration support</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAgentDialog(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAgentMeetingResponse(true)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        Agree & Schedule
                        <ExternalLink className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntegrationDashboard; 