import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Bot,
  Loader2,
  MessageCircle,
  LightbulbIcon,
  ExternalLink,
  Settings,
  ChevronDown,
  X,
  Trash2,
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  Filter,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  HelpCircle,
  Globe,
  Mic,
  Volume2,
  VolumeX,
  Search,
  BrainCircuit,
  Home,
  LogOut,
  ArrowUp,
  Menu,
} from "lucide-react";
import { getAnswer } from "../services/ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import ContributionForm from "./ContributionForm";
import AdminPanel from "./AdminPanel";
import Cookies from "js-cookie";
import AdminModal from "./AdminModal";
import MessageContent from "./MessageContent";
import languages from "../services/languages";
import { useAppContext } from "../Appcontext";
import AIVoice from "./AIVoice";

const ChatBot = () => {
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

  const chatHistoryKey = currentUserData?.user?.name
    ? `${presentUserName || "anonymous"}_${currentUserData.user.name}`
    : null;

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [promptUpdated, setPromptUpdated] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({
    name: "Auto",
    native: "Detect",
    code: "auto",
  });
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [showTranslationInfo, setShowTranslationInfo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showMicPermissionPrompt, setShowMicPermissionPrompt] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition({
    clearTranscriptOnListen: true,
    commands: [
      {
        command: '*',
        callback: (command) => console.log(`Voice command detected: ${command}`),
      },
    ],
  });

  const [isVoiceInput, setIsVoiceInput] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const languageDropdownRef = useRef(null);

  const scrollbarStyles = `
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #f3f4f6; /* gray-100 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #d1d5db; /* gray-300 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #9ca3af; /* gray-400 */
  }
  
  * {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6; 
  }
`;
  useEffect(() => {
    console.log("Current input:", input);
  }, [input]);

  useEffect(() => {
    console.log("Speech transcript updated:", transcript);
    console.log("Listening status:", listening);
    console.log("Browser supports speech recognition:", browserSupportsSpeechRecognition);
    console.log("Microphone available:", isMicrophoneAvailable);
  }, [transcript, listening, browserSupportsSpeechRecognition, isMicrophoneAvailable]);
  
  // Check for microphone permissions when component mounts
  useEffect(() => {
    if (browserSupportsSpeechRecognition) {
      // Check if we already have microphone permission
      navigator.permissions.query({ name: 'microphone' })
        .then(permissionStatus => {
          console.log("Microphone permission status:", permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            // We already have permission
          } else if (permissionStatus.state === 'prompt') {
            // We'll be prompted when we try to use the microphone
          } else if (permissionStatus.state === 'denied') {
            // Permission has been denied
            setShowMicPermissionPrompt(true);
          }
          
          // Listen for changes to permission state
          permissionStatus.onchange = () => {
            console.log("Microphone permission changed to:", permissionStatus.state);
            if (permissionStatus.state === 'granted') {
              setShowMicPermissionPrompt(false);
            } else if (permissionStatus.state === 'denied') {
              setShowMicPermissionPrompt(true);
            }
          };
        })
        .catch(error => {
          console.error("Error checking microphone permission:", error);
        });
    }
  }, [browserSupportsSpeechRecognition]);

  useEffect(() => {
    const initializeChat = async () => {
      if (userData?.user) {
        setCurrentUserData(userData);
        setIsInitialized(true);

        const allChatHistories = JSON.parse(
          localStorage.getItem("chatHistories") || "{}"
        );
        const historyKey = `${presentUserName || "anonymous"}_${
          userData.user.name
        }`;

        const userChatHistory = allChatHistories[historyKey]
          ? allChatHistories[historyKey]
          : [
              {
                type: "bot",
                content: `Hi${
                  presentUserName ? " " + presentUserName : ""
                }! I'm ${
                  userData.user.name
                } AI assistant. Feel free to ask me about my projects, experience, or skills!`,
                timestamp: new Date().toISOString(),
              },
            ];

        setMessages(userChatHistory);
      }
    };

    initializeChat();
  }, [userData, presentUserName]);

  useEffect(() => {
    if (!chatHistoryKey || messages.length === 0) return;

    const allChatHistories = JSON.parse(
      localStorage.getItem("chatHistories") || "{}"
    );
    allChatHistories[chatHistoryKey] = messages;
    localStorage.setItem("chatHistories", JSON.stringify(allChatHistories));
  }, [messages, chatHistoryKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      scrollToBottom();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showDeleteModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target)
      ) {
        setShowDeleteModal(false);
      }

      if (
        showLanguageDropdown &&
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target)
      ) {
        setShowLanguageDropdown(false);
      }
    }

    if (showDeleteModal || showLanguageDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDeleteModal, showLanguageDropdown]);

  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
        if (showLanguageDropdown) {
          setShowLanguageDropdown(false);
        }
      }
    }

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showDeleteModal, showLanguageDropdown]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(true);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };
  
  const handleLogout = async () => {
    // Remove cookies and refresh context
    Cookies.remove('presentUserName');
    await refreshPresentUserData(); // Wait for context to update
    
    // Navigate back to the home page
    window.location.href = '/';
  };

  const handleDeleteHistory = () => {
    setIsDeleting(true);

    try {
      setShowDeleteModal(false);

      setTimeout(() => {
        const allChatHistories = JSON.parse(
          localStorage.getItem("chatHistories") || "{}"
        );
        delete allChatHistories[chatHistoryKey];
        localStorage.setItem("chatHistories", JSON.stringify(allChatHistories));

        const initialMessage = {
          type: "bot",
          content: `Hi${presentUserName ? " " + presentUserName : ""}! I'm ${
            currentUserData.user.name
          } AI assistant. Feel free to ask me about my projects, experience, or skills!`,
          timestamp: new Date().toISOString(),
        };

        setMessages([initialMessage]);

        setShowDeleteSuccessModal(true);

        setTimeout(() => {
          setShowDeleteSuccessModal(false);
          setIsDeleting(false);
        }, 3000);
      }, 300);
    } catch (error) {
      console.error("Error deleting chat history:", error);
      setIsDeleting(false);
    }
  };

  const handleMicClick = () => {
    if (listening) {
      console.log("Stopping speech recognition");
      SpeechRecognition.stopListening();
      setIsVoiceInput(false);
      setInput(transcript);
    } else {
      console.log("Starting speech recognition");
      setInput("");
      resetTranscript();
      console.log("resetTranscript called");
      setIsVoiceInput(true);
      
      // Check if browser supports speech recognition
      if (!browserSupportsSpeechRecognition) {
        console.error("Browser doesn't support speech recognition");
        return;
      }
      
      // Check if microphone is available
      if (!isMicrophoneAvailable) {
        console.error("Microphone is not available");
        setShowMicPermissionPrompt(true);
        // Try to request microphone permission
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(() => {
            console.log("Microphone permission granted");
            setShowMicPermissionPrompt(false);
            // Try starting speech recognition again
            SpeechRecognition.startListening({
              continuous: true,
              language: selectedLanguage.code === "auto" ? "en-US" : selectedLanguage.code,
            });
          })
          .catch(err => {
            console.error("Error getting microphone permission:", err);
            setShowMicPermissionPrompt(true);
          });
        return;
      }
      
      try {
        SpeechRecognition.startListening({
          continuous: true,  // Keep listening until stopped
          language: selectedLanguage.code === "auto" ? "en-US" : selectedLanguage.code,
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };
  // Send voice transcript as message
  const handleVoiceSend = () => {
    setInput(transcript);
    resetTranscript();
    setIsVoiceInput(false);
    handleSendMessage();
  };
  // Cancel voice input
  const handleVoiceCancel = () => {
    SpeechRecognition.stopListening();
    resetTranscript();
    setIsVoiceInput(false);
    setInput("");
  };
  const speakText = (text, languageCode) => {
    if (!("speechSynthesis" in window)) {
      console.warn("Speech Synthesis not supported in this browser");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCode === "auto" ? "en-US" : languageCode;

    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === utterance.lang);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const detectLanguage = async (text) => {
    if (!text.trim()) return "en";
    if (selectedLanguage.code !== "auto") return selectedLanguage.code;

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURI(
        text
      )}`;
      const response = await fetch(url);
      const data = await response.json();
      const detectedCode = data[2];
      const detected = languages.find((lang) => lang.code === detectedCode) || {
        name: "Unknown",
        native: "Unknown",
        code: detectedCode,
      };

      setDetectedLanguage(detected);
      setShowTranslationInfo(detectedCode !== "en");

      return detectedCode;
    } catch (error) {
      console.error("Error detecting language:", error);
      return "en";
    }
  };
  const translateText = async (text, sourceLang, targetLang) => {
    if (!text.trim()) return "";
    if (sourceLang === targetLang) return text;

    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(
        text
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      return data[0].map((item) => item[0]).join("");
    } catch (error) {
      console.error("Error translating text:", error);
      return text;
    }
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const originalText = input;
    setInput("");
    setIsLoading(true);
    inputRef.current?.focus();

    try {
      const detectedLangCode = await detectLanguage(originalText);
      const userMessage = {
        type: "user",
        content: originalText,
        timestamp: new Date().toISOString(),
        originalLanguage: detectedLangCode,
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setLastQuestion(originalText);

      const urlPattern = /(https?:\/\/[^\s]+)/g;
      const urls = originalText.match(urlPattern) || [];

      let textForAI = originalText;
      if (detectedLangCode !== "en") {
        textForAI = await translateText(originalText, detectedLangCode, "en");

        if (urls.length > 0) {
          let translatedUrlPattern = /(https?:\/\/[^\s]+)/g;
          let translatedUrls = textForAI.match(translatedUrlPattern) || [];

          for (
            let i = 0;
            i < Math.min(urls.length, translatedUrls.length);
            i++
          ) {
            textForAI = textForAI.replace(translatedUrls[i], urls[i]);
          }
        }
      }

      const englishResponse = await getAnswer(
        textForAI,
        userData.user,
        presentUserData ? presentUserData.user : null,
        updatedMessages
      );

      let finalResponse = englishResponse;
      if (detectedLangCode !== "en") {
        finalResponse = await translateText(
          englishResponse,
          "en",
          detectedLangCode
        );
      }

      const botMessage = {
        type: "bot",
        content: finalResponse,
        timestamp: new Date().toISOString(),
        originalLanguage: detectedLangCode,
      };

      setMessages((prev) => [...prev, botMessage]);

      if (voiceEnabled) {
        speakText(finalResponse, detectedLangCode);
      }
    } catch (error) {
      console.error("Error in message flow:", error);

      const errorMessage = {
        type: "bot",
        content:
          "I'm sorry, I couldn't process your request. Please try again later.",
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

  const handlePromptUpdated = async () => {
    try {
      await refreshUserData();
      setPromptUpdated(true);
      setTimeout(() => setPromptUpdated(false), 3000);
    } catch (error) {
      console.error("Error refetching user data:", error);
    }
  };

  const handleContriUpdated = async () => {
    try {
      await refreshUserData();
      setPromptUpdated(true);
      setTimeout(() => setPromptUpdated(false), 3000);
    } catch (error) {
      console.error("Error refetching user data:", error);
    }
  };

  const autoResizeTextarea = (e) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    setShowLanguageDropdown(false);
  };

  const toggleLanguageDropdown = () => {
    setShowLanguageDropdown((prev) => !prev);
  };

  if (!isInitialized || !currentUserData?.user) {
    return (
      <div className="flex flex-col h-screen md:h-11/12 lg:max-w-1/2 lg:rounded-xl md:pt-0 pt-16 text-xl bg-gray-50 text-gray-800 shadow-lg overflow-hidden items-center justify-center min-w-[100vw]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-8 h-8 text-gray-500" />
        </motion.div>
        <p className="mt-4 text-gray-500">Initializing chat...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white text-gray-800 overflow-hidden">
      <style>{scrollbarStyles}</style>

      {/* Main content */}
      <div className="flex-1 flex flex-col w-[100vw] mx-auto">
        {/* Header */}
        <div className="bg-white py-4 px-6 flex justify-between items-center border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ChevronDown className="w-5 h-5 transform rotate-90" />
            </motion.button>
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Bot className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {currentUserData.user.name}'s AI Assistant
                </h1>
                <p className="text-xs text-gray-500">Powered by ChatMATE</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 items-center">
            {messages.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpenDeleteModal}
                disabled={isDeleting}
                aria-label="Delete chat history"
                className={`text-xs text-gray-500 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid="delete-chat-button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear chat</span>
              </motion.button>
            )}
            
            <div className="relative" ref={languageDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguageDropdown}
                className="p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{selectedLanguage.name}</span>
                <ChevronDown className="w-3 h-3" />
              </motion.button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-10">
                  <div className="max-h-64 overflow-y-auto">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageSelect(language)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center ${
                          selectedLanguage.code === language.code
                            ? "bg-gray-50"
                            : ""
                        }`}
                      >
                        {language.code === selectedLanguage.code && (
                          <CheckCircle className="w-4 h-4 mr-2 text-purple-500" />
                        )}
                        <span className="mr-1 text-sm">{language.name}</span>
                        <span className="text-xs text-gray-500">
                          ({language.native})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowContributionForm(true)}
              className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contribute</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdminPanel(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center cursor-pointer"
            >
              <Home className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
            
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-sm font-medium text-white shadow-sm">
              {presentUserName ? presentUserName.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden justify-center w-full">
          {/* Chat content area */}
          <div className="flex-1 flex flex-col justify-center items-center relative overflow-y-auto w-full max-w-[1200px] mx-auto">
          {messages.length <= 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-4xl font-semibold mb-4 text-gray-900">Hi there, {presentUserName || 'User'}</h2>
              <h3 className="text-2xl font-medium mb-8 text-purple-600">What would you like to know?</h3>
              
              <p className="text-gray-500 mb-6 max-w-md">Use one of the most common prompts below or use your own to begin</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-2xl">
                {[
                  { icon: <MessageCircle className="w-5 h-5" />, text: "Write a to-do list for a personal project or task" },
                  { icon: <Send className="w-5 h-5" />, text: "Generate an email in reply to a job offer" },
                  { icon: <Bot className="w-5 h-5" />, text: "Summarize this article or text for me in one paragraph" },
                  { icon: <BrainCircuit className="w-5 h-5" />, text: "How does AI work in a technical capacity" }
                ].map((item, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(item.text)}
                    className="flex items-start p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all text-left"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      {item.icon}
                    </div>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </motion.button>
                ))}
              </div>
              
              <div className="w-full max-w-xl">
                <div className="relative flex flex-col rounded-xl transition-all duration-200 w-full text-left cursor-text ring-1 ring-black/10 bg-black/5">
                  <div className="overflow-y-auto max-h-[200px]">
                    <textarea
                      id="ai-input-04"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask whatever you want..."
                      className="w-full rounded-xl rounded-b-none px-4 py-3 bg-white border-none text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 border-b leading-[1.2] min-h-[52px]"
                      disabled={isVoiceInput}
                      style={{ height: input ? 'auto' : '52px' }}
                      onInput={autoResizeTextarea}
                    />
                  </div>
                  
                  <div className="h-12 bg-white rounded-b-xl border-t border-gray-100">
                    <div className="absolute left-3 bottom-3 flex items-center gap-2">
                      {!isVoiceInput && (
                        <button
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                          onClick={handleMicClick}
                          disabled={isLoading || !browserSupportsSpeechRecognition}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="absolute right-3 bottom-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={isLoading || input.trim() === "" || isVoiceInput}
                        className={`rounded-lg p-2 transition-colors ${input.trim() ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {messages.length > 1 && (
            <div className="w-full p-4 space-y-4" id="chat-messages-container">
              <AnimatePresence>
                {promptUpdated && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 flex items-center"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Knowledge base updated successfully! I'm now equipped with the
                    latest information.
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showTranslationInfo && detectedLanguage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-700 flex items-center"
                  >
                    <Info className="w-5 h-5 mr-2" />
                    Detected {detectedLanguage.name} ({detectedLanguage.native}).
                    Translation is active.
                    <button
                      onClick={() => setShowTranslationInfo(false)}
                      className="ml-auto text-blue-700 hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.type === "bot" && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
                        <Bot className="w-4 h-4 text-purple-600" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-2xl p-4 ${message.type === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : "bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm"}`}
                    >
                      <div className="flex items-center mb-1.5">
                        <div className={`text-xs text-opacity-90 flex items-center gap-2 ${message.type === "user" ? "text-white" : "text-gray-500"}`}>
                          <span className="font-medium">
                            {message.type === "bot" ? "Assistant" : presentUserName || "You"}
                          </span>
                          {message.timestamp && (
                            <span className="text-xs opacity-70">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {message.originalLanguage && message.originalLanguage !== "en" && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${message.type === "user" ? "bg-purple-500 text-white" : "bg-purple-100 text-purple-700"}`}>
                              {languages.find((l) => l.code === message.originalLanguage)?.name || message.originalLanguage}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {message.type === "bot" && index === messages.length - 1 && isLoading ? (
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="flex items-center gap-2"
                          >
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </motion.div>
                        ) : (
                          <MessageContent content={message.content} />
                        )}
                      </div>
                    </div>
                    
                    {message.type === "user" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center ml-3 mt-1 text-white text-sm font-medium">
                        {presentUserName ? presentUserName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.type === "user" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-1">
                      <Bot className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="max-w-[75%] rounded-2xl p-4 bg-white text-gray-800 rounded-bl-none border border-gray-100 shadow-sm">
                      <div className="flex items-center mb-1.5">
                        <div className="text-xs text-opacity-90 flex items-center gap-2 text-gray-500">
                          <span className="font-medium">Assistant</span>
                        </div>
                      </div>
                      <div className="text-sm">
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          </div>
          
          {/* Input area - only shown when there are messages */}
          {messages.length > 1 && (
            <div className="border-t border-gray-100 bg-white p-6">
              <div className="relative max-w-3xl mx-auto">
                <div
                  role="textbox"
                  tabIndex={0}
                  aria-label="Chat input container"
                  className={`relative flex flex-col rounded-xl transition-all duration-200 w-full text-left cursor-text
                    ${isFocused ? "ring-2 ring-purple-500" : "ring-1 ring-black/10"}`}
                  onClick={() => inputRef.current?.focus()}
                >
                  <div className="overflow-y-auto max-h-[200px]">
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
                      placeholder={`Ask me anything about ${currentUserData.user.name} ...`}
                      className="w-full rounded-xl rounded-b-none px-4 py-3 bg-black/5 border-none text-gray-800 placeholder-gray-500 resize-none focus:outline-none leading-[1.2] min-h-[52px]"
                      disabled={isVoiceInput}
                      style={{ height: input ? 'auto' : '52px' }}
                    />
                  </div>
                  
                  <div className="h-12 bg-black/5 rounded-b-xl">
                    <div className="absolute left-3 bottom-3 flex items-center gap-2">
                      <button
                        className="p-2 rounded-lg bg-white/80 text-gray-600 hover:bg-white transition-colors shadow-sm"
                        onClick={() => setShowSettings(true)}
                        aria-label="Open settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      
                      {!isVoiceInput && (
                        <button
                          className="p-2 rounded-lg bg-white/80 text-gray-600 hover:bg-white transition-colors shadow-sm"
                          onClick={handleMicClick}
                          disabled={isLoading || !browserSupportsSpeechRecognition}
                          aria-label={listening ? "Stop voice input" : "Start voice input"}
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      
                      {voiceEnabled ? (
                        <button
                          className="p-2 rounded-lg bg-white/80 text-gray-600 hover:bg-white transition-colors shadow-sm"
                          onClick={() => setVoiceEnabled(false)}
                          aria-label="Disable voice output"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          className="p-2 rounded-lg bg-white/80 text-gray-600 hover:bg-white transition-colors shadow-sm"
                          onClick={() => setVoiceEnabled(true)}
                          aria-label="Enable voice output"
                        >
                          <VolumeX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="absolute right-3 bottom-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        disabled={isLoading || input.trim() === "" || isVoiceInput}
                        className={`rounded-lg p-2 transition-colors ${input.trim() ? "bg-purple-600 text-white shadow-sm" : "bg-white/80 text-gray-400"}`}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {!browserSupportsSpeechRecognition && (
                  <span className="text-red-500 text-xs absolute -top-6 left-2">
                    Browser doesn't support voice input.
                  </span>
                )}
                
                {showMicPermissionPrompt && (
                  <div className="absolute -top-16 left-2 right-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg text-sm flex items-center justify-between">
                    <span>Please allow microphone access to use voice input</span>
                    <button 
                      onClick={() => setShowMicPermissionPrompt(false)}
                      className="ml-2 p-1 rounded-full hover:bg-yellow-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Voice input UI */}
                <div className="relative">
                  <AnimatePresence>
                    {isVoiceInput && (
                      <AIVoice
                        isListening={listening}
                        onMicClick={handleMicClick}
                        transcript={transcript}
                        onSend={handleVoiceSend}
                        onCancel={handleVoiceCancel}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      
      {/* Modals */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
            ref={modalRef}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-2 rounded-full mr-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Clear chat history?</h3>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCloseDeleteModal}
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-gray-600 mb-8 pl-12">
              This will permanently delete your entire conversation history with{" "}
              <span className="font-medium">{currentUserData.user.name}'s AI assistant</span>. This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleCloseDeleteModal}
                className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDeleteHistory}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-sm"
              >
                {isDeleting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="flex justify-center"
                  >
                    <Loader2 className="w-5 h-5" />
                  </motion.div>
                ) : (
                  "Clear History"
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    
      <AnimatePresence>
        {showDeleteSuccessModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white border border-green-200 text-green-700 px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
              <div className="bg-green-100 p-1 rounded-full">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium">Chat history cleared successfully</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onPromptUpdated={handlePromptUpdated}
        password={currentUserData.user.password}
      />

      <ContributionForm
        isOpen={showContributionForm}
        onClose={() => setShowContributionForm(false)}
        lastQuestion={lastQuestion}
        onContriUpdated={handleContriUpdated}
      />

      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
    </div>

  );
};

export default ChatBot;
