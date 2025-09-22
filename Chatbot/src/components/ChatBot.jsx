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
  ArrowUp,
  Home,
  Menu,
} from "lucide-react";
import { getAnswer } from "../services/ai";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { motion, AnimatePresence } from "framer-motion";
import ContributionForm from "./ContributionForm";
import AdminModal from "./AdminModal";
import MessageContent from "./MessageContent";
import languages from "../services/languages";
import { useAppContext } from "../Appcontext";

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

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

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
    console.log("Speech transcript:", transcript);
  }, [transcript]);

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
      SpeechRecognition.stopListening();
      setIsVoiceInput(false);
      setInput(transcript);
    } else {
      setInput("");
      resetTranscript();
      setIsVoiceInput(true);
      SpeechRecognition.startListening({
        continuous: false,
        language:
          selectedLanguage.code === "auto" ? "en-US" : selectedLanguage.code,
      });
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
    <div className="flex h-screen bg-gray-50 text-gray-800 overflow-hidden">
      <style>{scrollbarStyles}</style>
      {/* Main content */}
      <div className="flex-1 flex flex-col w-[100vw]">
        {/* Header */}
        <div className="bg-white py-3 px-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-2">
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
              <Bot className="w-5 h-5 text-gray-700 mr-2" />
              <h1 className="text-lg font-medium">
                {currentUserData.user.name}'s AI Assistant
              </h1>
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {messages.length > 1 && (
              <button
                onClick={handleOpenDeleteModal}
                disabled={isDeleting}
                aria-label="Delete chat history"
                className={`text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ${isDeleting ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid="delete-chat-button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear chat</span>
              </button>
            )}
            
            <div className="relative" ref={languageDropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguageDropdown}
                className="p-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">{selectedLanguage.name}</span>
                <ChevronDown className="w-3 h-3" />
              </motion.button>

              {showLanguageDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                  <div className="max-h-64 overflow-y-auto">
                    {languages.map((language) => (
                      <button
                        key={language.code}
                        onClick={() => handleLanguageSelect(language)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center ${
                          selectedLanguage.code === language.code
                            ? "bg-gray-100"
                            : ""
                        }`}
                      >
                        {language.code === selectedLanguage.code && (
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
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
              className="px-3 py-1.5 bg-black text-white text-sm rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Contribute</span>
            </motion.button>
            
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
              {presentUserName ? presentUserName.charAt(0).toUpperCase() : "U"}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat content area */}
          <div className="flex-1 flex flex-col justify-center items-center relative overflow-y-auto">
          {messages.length <= 1 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-3xl font-medium mb-8 text-gray-800">What can {currentUserData.user.name}'s AI Assistant help with?</h2>
              <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Ask anything" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
                        disabled={isVoiceInput}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100"
                        onClick={handleMicClick}
                        disabled={isLoading || !browserSupportsSpeechRecognition}
                      >
                        <Mic className="w-4 h-4 text-gray-500" />
                      </button>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100"
                        onClick={handleSendMessage}
                        disabled={isLoading || input.trim() === "" || isVoiceInput}
                      >
                        <ArrowUp className="w-4 h-4 text-gray-500" />
                      </button>
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
                    className={`flex items-start ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-3 shadow-sm ${
                        message.type === "user"
                          ? "bg-black text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.type === "bot" ? (
                          <Bot className="w-4 h-4 mr-2 text-gray-500" />
                        ) : (
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                        )}
                        <div className="text-xs text-gray-500">
                          {message.type === "bot"
                            ? "Assistant"
                            : presentUserName || "You"}
                          {message.timestamp && (
                            <span className="ml-2 text-xs text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                          {message.originalLanguage &&
                            message.originalLanguage !== "en" && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {languages.find(
                                  (l) => l.code === message.originalLanguage
                                )?.name || message.originalLanguage}
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.type === "bot" &&
                        index === messages.length - 1 &&
                        isLoading ? (
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
                  </motion.div>
                ))}
                {isLoading && messages[messages.length - 1]?.type === "user" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start justify-start"
                  >
                    <div className="max-w-[80%] rounded-xl p-3 shadow-sm bg-white text-gray-800 rounded-bl-none border border-gray-200">
                      <div className="flex items-center mb-1">
                        <Bot className="w-4 h-4 mr-2 text-gray-500" />
                        <div className="text-xs text-gray-500">Assistant</div>
                      </div>
                      <div className="text-sm">
                        <motion.div
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="flex items-center gap-2"
                        >
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
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
            <div className="border-t border-gray-200 bg-white p-4">
              <div className="relative flex items-center w-full rounded-full bg-white border border-gray-200 p-2 shadow-sm">
                <div className="flex items-center space-x-2 px-2">
                  <button 
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                    onClick={() => setShowSettings(true)}
                    aria-label="Open settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Ask me anything about ${currentUserData.user.name} ...`}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-sm"
                  disabled={isVoiceInput}
                />

                <div className="flex items-center space-x-1 px-1">
                  <button 
                    className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                    onClick={handleMicClick}
                    disabled={isLoading || !browserSupportsSpeechRecognition}
                    aria-label={listening ? "Stop voice input" : "Start voice input"}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={isLoading || input.trim() === "" || isVoiceInput}
                    className="p-2 rounded-full bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {!browserSupportsSpeechRecognition && (
                  <span className="text-red-500 text-xs absolute -top-6 left-2">
                    Browser doesn't support voice input.
                  </span>
                )}

                {/* Voice input UI */}
                {isVoiceInput && (
                  <div className="absolute bottom-14 left-2 right-2 bg-white rounded-xl shadow-lg border border-gray-200 z-10 p-3 flex items-center gap-2">
                    <span className="flex-1 text-gray-700 text-sm">
                      {transcript || (listening ? "Listening..." : "")}
                    </span>
                    <button
                      onClick={handleVoiceSend}
                      disabled={!transcript.trim()}
                      className="px-3 py-1 bg-black text-white rounded-lg text-sm hover:bg-gray-800"
                    >
                      Send
                    </button>
                    <button
                      onClick={handleVoiceCancel}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      
      {/* Modals */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm px-4">
          <div
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            data-testid="delete-modal-content"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-800 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Delete Chat History
              </h2>
              <button
                onClick={handleCloseDeleteModal}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your entire chat history? This
              action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm"
                data-testid="delete-modal-cancel"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHistory}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center text-sm"
                data-testid="delete-modal-confirm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    
      <AnimatePresence>
        {showDeleteSuccessModal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-white border border-green-200 text-green-700 px-6 py-3 rounded-lg shadow-md flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Chat history deleted successfully
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
      </div>
  );
};

export default ChatBot;
