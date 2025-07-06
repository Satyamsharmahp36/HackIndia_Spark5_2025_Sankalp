import React, { useState } from "react";
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
  Zap
} from "lucide-react";

const ChatIntegrationDialog = ({ isOpen, onClose, userData }) => {
  const [currentStep, setCurrentStep] = useState("main");
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAgentMeeting, setShowAgentMeeting] = useState(false);
  const [showSlackLogin, setShowSlackLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setCurrentStep("main");
    setSelectedOption(null);
    setShowAgentMeeting(false);
    setShowSlackLogin(false);
    setIsLoading(false);
    onClose();
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    if (option === "newChat") {
      setShowSlackLogin(true);
    } else if (option === "addWorkspace") {
      setShowAgentMeeting(true);
    }
  };

  const handleAgentMeetingResponse = async (agree) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    if (agree) {
      // Handle agreement - could open a new window or redirect
      window.open("https://calendly.com/your-agent", "_blank");
    }
    handleClose();
  };

  const handleSlackProceed = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    // Handle Slack OAuth flow
    window.open("https://slack.com/oauth/v2/authorize?client_id=YOUR_CLIENT_ID&scope=chat:write,channels:read&redirect_uri=YOUR_REDIRECT_URI", "_blank");
    handleClose();
  };

  const integrationOptions = [
    {
      id: "newChat",
      title: "Input New Chat",
      description: "Login to integrate with your workspace platforms",
      icon: <MessageCircle className="w-6 h-6" />,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      id: "addWorkspace",
      title: "Add Your Organisation",
      description: "Connect with our agent to integrate your workspace",
      icon: <Users className="w-6 h-6" />,
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  const workspaceOptions = [
    {
      id: "slack",
      name: "Slack",
      icon: <Slack className="w-5 h-5" />,
      description: "Connect your Slack workspace"
    },
    {
      id: "discord",
      name: "Discord",
      icon: <MessageCircle className="w-5 h-5" />,
      description: "Connect your Discord server"
    },
    {
      id: "teams",
      name: "Microsoft Teams",
      icon: <Users className="w-5 h-5" />,
      description: "Connect your Teams workspace"
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
          className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Chat Integration</h2>
                <p className="text-gray-400 text-sm">Connect your workspace with chat platforms</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {currentStep === "main" && !showAgentMeeting && !showSlackLogin && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Choose Integration Option</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Select how you'd like to integrate chat functionality with your workspace
                  </p>
                </div>

                <div className="grid gap-4">
                  {integrationOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOptionSelect(option.id)}
                      className={`w-full p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-all text-left ${option.color}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{option.title}</h4>
                          <p className="text-gray-200 text-sm">{option.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Meeting Dialog */}
            {showAgentMeeting && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Meet Our Integration Agent</h3>
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
                    onClick={() => handleAgentMeetingResponse(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    Not Agree
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAgentMeetingResponse(true)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            )}

            {/* Slack Login Dialog */}
            {showSlackLogin && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                    <Slack className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Workspace Integration</h3>
                  <p className="text-gray-400 mb-6">
                    You'll need to login in order to integrate with your workspace. 
                    Choose your preferred platform below.
                  </p>
                </div>

                <div className="space-y-3">
                  {workspaceOptions.map((option) => (
                    <motion.button
                      key={option.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-4 rounded-lg border border-gray-600 hover:border-gray-500 transition-all text-left bg-gray-700 hover:bg-gray-600"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-600 rounded-lg">
                          {option.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white">{option.name}</h4>
                          <p className="text-gray-300 text-sm">{option.description}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-blue-300 mb-1">Secure Integration</h4>
                      <p className="text-blue-200 text-sm">
                        Your workspace data is encrypted and secure. We only access the permissions you grant.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSlackProceed}
                    disabled={isLoading}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatIntegrationDialog; 