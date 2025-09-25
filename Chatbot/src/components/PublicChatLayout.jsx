import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Bot,
  Loader2,
  Trash2,
  Mic,
  Volume2,
  VolumeX,
  ArrowUp,
  Plus,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { getAnswer } from "../services/ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import ContributionForm from "./ContributionForm";
import ChatMateLoginModal from "./ChatMateLoginModal";
import Cookies from "js-cookie";
import MessageContent from "./MessageContent";
import { useAppContext } from "../Appcontext";
import AIVoice from "./AIVoice";

const PublicChatLayout = ({ profileOwnerData, visitorName, onBackToWelcome }) => {
  const {
    presentUserData,
    presentUserName,
  } = useAppContext();

  const [isInitialized, setIsInitialized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Check if user is already authenticated
  useEffect(() => {
    const presentUserName = Cookies.get('presentUserName');
    if (presentUserName) {
      // User is already authenticated, fetch their data
      fetchAuthenticatedUser(presentUserName);
    } else {
      // Show login modal
      setShowLoginModal(true);
    }
  }, []);

  const fetchAuthenticatedUser = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAuthenticatedUser(data);
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } else {
        // Invalid session, show login modal
        setShowLoginModal(true);
      }
    } catch (error) {
      console.error('Error fetching authenticated user:', error);
      setShowLoginModal(true);
    }
  };

  const handleLogin = (userData) => {
    setAuthenticatedUser(userData);
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  const chatHistoryKey = profileOwnerData?.user?.name
    ? `${visitorName || "anonymous"}_${profileOwnerData.user.name}_public`
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
      if (profileOwnerData?.user) {
        const savedMessages = localStorage.getItem(chatHistoryKey);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
          setShowWelcome(false);
        } else {
          const welcomeMessage = {
            id: Date.now(),
            text: `Hello! I'm ${profileOwnerData.user.name}'s AI assistant. How can I help you today?`,
            isUser: false,
            timestamp: new Date().toISOString(),
          };
          setMessages([welcomeMessage]);
        }
      }
      setIsInitialized(true);
    };

    initializeData();
  }, [profileOwnerData, visitorName, chatHistoryKey]);

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
    if (!input.trim() || isLoading || !isAuthenticated) return;

    const userMessage = {
      id: Date.now(),
      text: input.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    // Convert messages to conversation history format BEFORE adding current user message
    const conversationHistory = messages.map(msg => ({
      type: msg.isUser ? 'user' : 'bot',
      content: msg.text
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowWelcome(false);

    try {
      // Create a combined context with both profile owner and authenticated user
      const combinedContext = {
        ...profileOwnerData,
        presentUser: authenticatedUser?.user,
        presentUserData: authenticatedUser,
        presentData: {
          ...authenticatedUser?.user,
          isGuest: false // Mark as authenticated user, not guest
        }
      };

      const response = await getAnswer(input.trim(), combinedContext, combinedContext.presentData, conversationHistory);
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
    setShowWelcome(true);
  };

  const toggleVoice = () => {
    if (isSpeaking) {
      AIVoice.stop();
      setIsSpeaking(false);
    } else {
      setVoiceEnabled(!voiceEnabled);
    }
  };

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

  const suggestedQuestions = [
    "What projects has this person worked on?",
    "What are their main skills and expertise?",
    "Tell me about their professional background",
    "What technologies do they specialize in?",
  ];

  if (!isInitialized || !profileOwnerData?.user) {
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

      {/* Login Modal */}
      <ChatMateLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        chatbotOwner={profileOwnerData?.user?.name || 'this user'}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Chat Header */}
        <div className="bg-white py-4 px-6 flex justify-between items-center border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 rounded-full mr-3">
              <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {profileOwnerData.user.name}'s AI Assistant
              </h1>
              <p className="text-xs text-gray-500">Powered by ChatMATE</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {isAuthenticated && authenticatedUser ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Logged in as {authenticatedUser.user.name}
                  </span>
                </div>
                <button
                  onClick={() => {
                    Cookies.remove('presentUserName');
                    Cookies.remove('userName');
                    setIsAuthenticated(false);
                    setAuthenticatedUser(null);
                    setShowLoginModal(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                Login
              </button>
            )}
            
            <button
              onClick={clearChat}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear chat
            </button>

            <button
              onClick={() => setShowContributionForm(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Contribute
            </button>

            {onBackToWelcome && (
              <button
                onClick={onBackToWelcome}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Back to welcome"
              >
                <ArrowUp className="w-5 h-5 transform rotate-90" />
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Screen */}
            {showWelcome && messages.length <= 1 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-2xl"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="bg-purple-100 p-4 rounded-full">
                      <Bot className="w-12 h-12 text-purple-600" />
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-semibold mb-4 text-gray-900">
                    Hi there, {visitorName || "User"}!
                  </h2>
                  <h3 className="text-2xl font-medium mb-8 text-purple-600">
                    What would you like to know?
                  </h3>

                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    I can help you learn about {profileOwnerData.user.name}'s projects, 
                    experience, and skills. Try asking me anything!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {suggestedQuestions.map((question, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setInput(question)}
                        className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <MessageCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{question}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-6">
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
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                        <span className="text-gray-500 text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 bg-white p-6">
          <div className="max-w-4xl mx-auto">
            {!isAuthenticated ? (
              /* Login Prompt when not authenticated */
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Please login to start chatting with the AI assistant</p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                  >
                    <User className="w-4 h-4" />
                    Login to Chat
                  </button>
                </div>
              </div>
            ) : (
              /* Chat Input when authenticated */
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
                    placeholder={`Ask me anything about ${profileOwnerData.user.name}...`}
                    className="w-full bg-transparent border-none text-gray-800 placeholder-gray-500 resize-none focus:outline-none min-h-[24px] max-h-[200px]"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center gap-2 p-2">
                  <button
                    onClick={toggleVoice}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={!browserSupportsSpeechRecognition}
                    title="Voice input"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showContributionForm && (
          <ContributionForm
            isOpen={showContributionForm}
            onClose={() => setShowContributionForm(false)}
            userData={profileOwnerData}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicChatLayout;
