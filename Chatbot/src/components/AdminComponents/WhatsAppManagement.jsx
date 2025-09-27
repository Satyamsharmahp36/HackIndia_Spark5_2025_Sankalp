import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Search, Filter, Clock, User, Paperclip, Eye, EyeOff,
  RefreshCw, ChevronDown, ChevronUp, Star, Trash2, Inbox, Plus, Users,
  Hash, Send, FileText, Brain, Sparkles, Copy, Check, AlertCircle, Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";

const WhatsAppManagement = ({ userData }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [savedGroups, setSavedGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupLimit, setNewGroupLimit] = useState(50);
  
  // Summary related states
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");

  // New states for auto-processing
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");

  // Get API key from environment or state
  const geminiApiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || apiKey;

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedGroupsData = localStorage.getItem('whatsapp-groups');
    const savedCurrentGroup = localStorage.getItem('whatsapp-current-group');
    const savedApiKey = localStorage.getItem('whatsapp-gemini-api-key');
    const savedSummaryHistory = localStorage.getItem('whatsapp-summary-history');

    if (savedGroupsData) {
      try {
        const groups = JSON.parse(savedGroupsData);
        setSavedGroups(groups);
        
        // Auto-select last used group
        if (savedCurrentGroup) {
          const currentGroupData = JSON.parse(savedCurrentGroup);
          const groupExists = groups.find(g => g.id === currentGroupData.id);
          if (groupExists) {
            setCurrentGroup(groupExists);
          }
        } else if (groups.length > 0) {
          setCurrentGroup(groups[0]);
        }
      } catch (error) {
        console.error("Error parsing saved data:", error);
      }
    }

    if (savedApiKey && !import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
      setApiKey(savedApiKey);
    }

    if (savedSummaryHistory) {
      try {
        setSummaryHistory(JSON.parse(savedSummaryHistory));
      } catch (error) {
        console.error("Error parsing summary history:", error);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (savedGroups.length > 0) {
      localStorage.setItem('whatsapp-groups', JSON.stringify(savedGroups));
    }
  }, [savedGroups]);

  useEffect(() => {
    if (currentGroup) {
      localStorage.setItem('whatsapp-current-group', JSON.stringify(currentGroup));
    }
  }, [currentGroup]);

  useEffect(() => {
    if (apiKey && !import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
      localStorage.setItem('whatsapp-gemini-api-key', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    if (summaryHistory.length > 0) {
      localStorage.setItem('whatsapp-summary-history', JSON.stringify(summaryHistory));
    }
  }, [summaryHistory]);

  // Fetch messages from the API
  const fetchMessages = async (groupName, limit = 50) => {
    if (!groupName) {
      toast.error("Please select or add a group");
      return [];
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3002/api/whatsapp/groups/messages/fetch',
        { groupName: groupName, limit: limit },
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 
        }
      );

      if (response.data?.success) {
        const messagesData = response.data.data?.messages || [];
        setMessages(messagesData);
        toast.success(`📱 Retrieved ${messagesData.length} messages from ${groupName}`);
        return messagesData;
      } else {
        toast.error("Failed to fetch WhatsApp messages");
        setMessages([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        toast.error("Backend server is not running. Please start your WhatsApp API server on port 3002.");
      } else {
        toast.error(`Error fetching messages: ${error.message}`);
      }
      setMessages([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate summary with specific messages
  const generateAutoSummary = async (messagesToSummarize, groupName) => {
    if (!geminiApiKey) {
      toast.warning("Set up Gemini API key for AI summaries");
      return;
    }

    if (!messagesToSummarize || messagesToSummarize.length === 0) {
      toast.warning("No messages to summarize");
      return;
    }

    setSummaryLoading(true);
    setProcessingStage("🤖 Generating AI summary...");
    
    try {
      // Prepare messages for summary
      const messageTexts = messagesToSummarize.map(msg => {
        const sender = msg.senderName || msg.actualSenderName || msg.pushName || 'Unknown';
        const content = msg.content || msg.body || 'No content';
        const time = msg.timeAgo || formatDate(msg.timestamp);
        const status = msg.isRead === 0 ? 'Unread' : 'Read';
        return `${sender} (${status}) - ${time}: ${content}`;
      }).join('\n');

      const defaultPrompt = `Analyze this WhatsApp group "${groupName}" conversation and provide a detailed professional summary. Focus on:

1. **Key Discussion Points**: What are the main topics being discussed?
2. **Action Items**: What tasks or commitments were mentioned?
3. **Participants**: Who are the key contributors and their roles?
4. **Decisions Made**: Any agreements or conclusions reached?
5. **Follow-ups**: What needs to happen next?
6. **Timeline**: When are things expected to be completed?

Context: This is a real WhatsApp group conversation.

Conversation:
${messageTexts}

Please provide a comprehensive summary that would be useful for someone who missed the conversation.`;

      // Use the correct Gemini API endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: defaultPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        
        if (response.status === 400) {
          throw new Error('Invalid API request. Please check your API key and request format.');
        } else if (response.status === 403) {
          throw new Error('API key is invalid or doesn\'t have permission to access Gemini API.');
        } else if (response.status === 404) {
          throw new Error('Invalid API endpoint or model name. Please verify your Gemini API key is correct.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again in a few minutes.');
        } else {
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      const generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedSummary) {
        setSummary(generatedSummary);
        setShowSummary(true);
        
        // Add to summary history with proper data
        const newSummaryEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          groupName: groupName,
          messageCount: messagesToSummarize.length,
          summary: generatedSummary.substring(0, 200) + '...', // Store preview
          fullSummary: generatedSummary,
          promptUsed: 'Auto-generated summary'
        };
        
        setSummaryHistory(prev => [newSummaryEntry, ...prev.slice(0, 9)]);
        toast.success("✨ AI summary generated successfully!");
      } else {
        throw new Error("No summary content received from API");
      }

    } catch (error) {
      console.error("Error generating auto summary:", error);
      toast.error(`Failed to generate summary: ${error.message}`);
    } finally {
      setSummaryLoading(false);
      setProcessingStage("");
    }
  };

  // Enhanced selectGroup function with auto-fetch and auto-summary
  const selectGroup = async (group) => {
    // Prevent multiple simultaneous operations
    if (autoProcessing || loading) {
      toast.info("Processing in progress, please wait...");
      return;
    }
    
    setAutoProcessing(true);
    setCurrentGroup(group);
    setMessages([]);
    setShowSummary(false);
    setSummary("");
    
    // Save to localStorage
    localStorage.setItem('whatsapp-current-group', JSON.stringify(group));
    
    toast.info(`🔄 Processing ${group.name}...`);
    
    try {
      // Step 1: Fetch messages automatically
      setProcessingStage(`📱 Fetching ${group.limit} messages from ${group.name}...`);
      const fetchedMessages = await fetchMessages(group.name, group.limit);
      
      // Step 2: Auto-generate summary if we have messages and API key
      if (fetchedMessages && fetchedMessages.length > 0) {
        if (geminiApiKey) {
          await generateAutoSummary(fetchedMessages, group.name);
        } else {
          toast.info("Messages loaded! Set up Gemini API key for auto-summaries");
        }
      } else {
        toast.warning(`No messages found in ${group.name}`);
      }
      
    } catch (error) {
      console.error("Error in auto-processing:", error);
      toast.error(`Failed to process ${group.name}: ${error.message}`);
    } finally {
      setAutoProcessing(false);
      setProcessingStage("");
    }
  };

  // Manual generate summary (existing function with modifications)
  const generateSummary = async (useCustomPrompt = false) => {
    if (!geminiApiKey) {
      toast.error("Please set your Gemini API key first");
      setShowApiSettings(true);
      return;
    }

    if (!messages || messages.length === 0) {
      toast.error("No messages to summarize");
      return;
    }

    setSummaryLoading(true);
    
    try {
      // Prepare messages in the actual format from your conversation
      const messageTexts = messages.map(msg => {
        const sender = msg.senderName || msg.actualSenderName || msg.pushName || 'Unknown';
        const content = msg.content || msg.body || 'No content';
        const time = msg.timeAgo || formatDate(msg.timestamp);
        const status = msg.isRead === 0 ? 'Unread' : 'Read';
        return `${sender} (${status}) - ${time}: ${content}`;
      }).join('\n');

      const defaultPrompt = `Analyze this WhatsApp group conversation and provide a detailed professional summary. Focus on:

1. **Key Discussion Points**: What are the main topics being discussed?
2. **Action Items**: What tasks or commitments were mentioned?
3. **Participants**: Who are the key contributors and their roles?
4. **Decisions Made**: Any agreements or conclusions reached?
5. **Follow-ups**: What needs to happen next?
6. **Timeline**: When are things expected to be completed?

Context: This appears to be a work-related conversation in the "${currentGroup?.name}" group.

Conversation:
${messageTexts}

Please provide a comprehensive summary that would be useful for someone who missed the conversation.`;

      const promptToUse = useCustomPrompt && customPrompt.trim() 
        ? `${customPrompt}\n\nConversation:\n${messageTexts}` 
        : defaultPrompt;

      // Use the correct Gemini API endpoint
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: promptToUse
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 32,
            topP: 0.8,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH", 
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        
        if (response.status === 400) {
          throw new Error('Invalid API request. Please check your API key and request format.');
        } else if (response.status === 403) {
          throw new Error('API key is invalid or doesn\'t have permission to access Gemini API.');
        } else if (response.status === 404) {
          throw new Error('Invalid API endpoint or model name. Please verify your Gemini API key is correct.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again in a few minutes.');
        } else {
          throw new Error(`API Error (${response.status}): ${errorText}`);
        }
      }

      const data = await response.json();
      const generatedSummary = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (generatedSummary) {
        setSummary(generatedSummary);
        setShowSummary(true);
        
        // Add to summary history with proper data
        const newSummaryEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          groupName: currentGroup?.name,
          messageCount: messages.length,
          summary: generatedSummary.substring(0, 200) + '...', // Store preview
          fullSummary: generatedSummary,
          promptUsed: useCustomPrompt ? customPrompt : 'Default summary prompt'
        };
        
        setSummaryHistory(prev => [newSummaryEntry, ...prev.slice(0, 9)]);
        toast.success("✨ Summary generated successfully!");
      } else {
        throw new Error("No summary content received from API");
      }

    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error(`Failed to generate summary: ${error.message}`);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Copy summary to clipboard
  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy summary");
    }
  };

  // Save API key
  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter a valid API key");
      return;
    }
    if (!apiKey.startsWith('AIza')) {
      toast.warning("API key should start with 'AIza'. Please verify your key.");
    }
    localStorage.setItem('whatsapp-gemini-api-key', apiKey);
    setShowApiSettings(false);
    toast.success("API key saved successfully!");
  };

  // Add new group
  const addGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const newGroup = {
      id: Date.now().toString(),
      name: newGroupName.trim(),
      limit: newGroupLimit,
      createdAt: new Date().toISOString()
    };

    setSavedGroups(prev => [...prev, newGroup]);
    setCurrentGroup(newGroup);
    setNewGroupName("");
    setNewGroupLimit(50);
    setShowAddGroup(false);
    toast.success(`Group "${newGroup.name}" added successfully`);
  };

  // Remove group
  const removeGroup = (groupId) => {
    const groupToRemove = savedGroups.find(g => g.id === groupId);
    setSavedGroups(prev => prev.filter(group => group.id !== groupId));
    
    if (currentGroup?.id === groupId) {
      const remainingGroups = savedGroups.filter(group => group.id !== groupId);
      setCurrentGroup(remainingGroups.length > 0 ? remainingGroups[0] : null);
      setMessages([]);
      localStorage.removeItem('whatsapp-current-group');
    }
    
    toast.success(`Group "${groupToRemove?.name}" removed`);
  };

  const filteredMessages = React.useMemo(() => {
    const messageArray = Array.isArray(messages) ? messages : [];
    
    return messageArray.filter((message) => {
      const searchFields = [
        message.content,
        message.body,
        message.senderName,
        message.actualSenderName,
        message.pushName,
        message.senderPhone
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterType === "all" ||
        (filterType === "unread" && message.isRead === 0) ||
        (filterType === "important" && message.isImportant);

      return matchesSearch && matchesFilter;
    });
  }, [messages, searchTerm, filterType]);

  // Toggle message expansion
  const toggleMessageExpansion = (messageId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown time";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        return `${diffInMinutes}m ago`;
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status color and icon
  const getStatusColor = (message) => {
    if (message.isRead === 0) return "bg-green-100 text-green-800";
    if (message.isImportant) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (message) => {
    if (message.isRead === 0) return <EyeOff className="w-4 h-4" />;
    if (message.isImportant) return <Star className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with improved status display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">WhatsApp Management</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {Array.isArray(messages) ? messages.length : 0} messages
          </Badge>
          {currentGroup && (
            <Badge variant="outline" className="border-green-300 text-green-700">
              📱 {currentGroup.name}
            </Badge>
          )}
          {autoProcessing && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 animate-pulse">
              🔄 Processing...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!import.meta.env.VITE_GOOGLE_GENAI_API_KEY && (
            <Button
              onClick={() => setShowApiSettings(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              API Settings
            </Button>
          )}
          <Button
            onClick={() => currentGroup && fetchMessages(currentGroup.name, currentGroup.limit)}
            disabled={loading || !currentGroup || autoProcessing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", (loading || autoProcessing) && "animate-spin")} />
            {loading ? 'Loading...' : 'Manual Refresh'}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {(autoProcessing || processingStage) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  {processingStage || "Processing group..."}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please wait while we fetch messages and generate AI summary
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Settings Section */}
      {showApiSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Gemini API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://ai.google.dev/gemini-api/docs/api-key', '_blank')}
                >
                  Get Key
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your free API key from Google AI Studio. Keys are stored locally.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveApiKey} className="bg-purple-600 hover:bg-purple-700">
                Save API Key
              </Button>
              <Button onClick={() => setShowApiSettings(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Summary Section */}
      {currentGroup && messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI Conversation Summary
                {!geminiApiKey && (
                  <Badge variant="destructive" className="ml-2">
                    API Key Required
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                  variant="outline"
                  size="sm"
                >
                  Custom Prompt
                </Button>
                <Button
                  onClick={() => generateSummary(false)}
                  disabled={summaryLoading || !geminiApiKey || autoProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {summaryLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Generate Summary
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Warning */}
            {!geminiApiKey && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Gemini API Key Required</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Set up your free Gemini API key to use AI-powered conversation summaries and auto-processing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Prompt Input */}
            {showCustomPrompt && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Analysis Prompt
                  </label>
                  <Textarea
                    placeholder="E.g., 'Focus on technical decisions and deadlines', 'Identify who is responsible for what tasks', 'Summarize the project status and next steps'"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateSummary(true)}
                    disabled={summaryLoading || !customPrompt.trim() || !geminiApiKey || autoProcessing}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate Custom Summary
                  </Button>
                  <Button
                    onClick={() => setShowCustomPrompt(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Summary Display */}
            {/* Enhanced Summary Display with Proper Markdown Rendering */}
            {showSummary && summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">AI Analysis Results</h3>
                  </div>
                  <Button
                    onClick={copySummary}
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                
                {/* Properly formatted Markdown content */}
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="markdown-content"
                    dangerouslySetInnerHTML={{
                      __html: summary
                        // Convert **bold** to <strong>
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                        // Convert *italic* to <em>
                        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="italic text-gray-700">$1</em>')
                        // Convert numbered sections like "**1. Key Discussion Points:**"
                        .replace(/\*\*(\d+\.\s+[^*]+):\*\*/g, '<h2 class="text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">$1</h2>')
                        // Convert bullet points with **labels:**
                        .replace(/\*\s+\*\*([^*]+):\*\*/g, '<h3 class="text-base font-semibold text-gray-800 mt-4 mb-2">• $1:</h3>')
                        // Convert regular bullet points
                        .replace(/^\*\s+([^*\n]+)$/gm, '<li class="ml-6 mb-2 list-disc text-gray-700">$1</li>')
                        // Wrap consecutive <li> elements in <ul>
                        .replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul class="mb-4">$&</ul>')
                        // Convert line breaks to paragraphs
                        .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700">')
                        // Wrap remaining content in paragraphs
                        .replace(/^(?!<[hul])/gm, '<p class="mb-3 text-gray-700">')
                        // Clean up any extra closing tags
                        .replace(/<\/p>$/, '')
                    }}
                  />
                </div>
                
                {/* Summary metadata */}
                <div className="mt-4 pt-4 border-t border-purple-200 flex items-center justify-between text-xs text-gray-500">
                  <span>📱 {currentGroup.name} • {messages.length} messages analyzed</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Groups Section - Updated with auto-processing functionality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            WhatsApp Groups ({savedGroups.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Group Form */}
          {showAddGroup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <Input
                    placeholder="Enter exact WhatsApp group name (e.g., WorkDemo)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Limit
                  </label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={newGroupLimit}
                    onChange={(e) => setNewGroupLimit(parseInt(e.target.value) || 50)}
                    className="w-full"
                    min="1"
                    max="500"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addGroup} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Group
                  </Button>
                  <Button 
                    onClick={() => setShowAddGroup(false)} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Info about auto-processing */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Auto-Processing Enabled</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Click any group card to automatically fetch recent messages and generate an AI summary
                  {!geminiApiKey && " (API key required for AI summaries)"}
                </p>
              </div>
            </div>
          </div>

          {/* Saved Groups Display */}
          <div className="space-y-2">
            {savedGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="font-medium">No WhatsApp groups configured</p>
                <p className="text-sm">Add your first group to start managing conversations</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedGroups.map((group) => (
                  <Card 
                    key={group.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                      currentGroup?.id === group.id 
                        ? "ring-2 ring-green-500 bg-green-50 border-green-200" 
                        : "border-gray-200 hover:border-green-300",
                      autoProcessing && "opacity-60 pointer-events-none"
                    )}
                    onClick={() => !autoProcessing && selectGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-4 h-4 text-green-600" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {group.name}
                            </h3>
                            {currentGroup?.id === group.id && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-1">
                            Auto-fetch {group.limit} messages + AI summary
                          </p>
                          <p className="text-xs text-gray-400">
                            Added: {new Date(group.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGroup(group.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          disabled={autoProcessing}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Group Button */}
          {!showAddGroup && (
            <Button
              onClick={() => setShowAddGroup(true)}
              variant="outline"
              className="w-full border-dashed border-2 border-gray-300 hover:border-green-500 hover:bg-green-50"
              disabled={autoProcessing}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add WhatsApp Group
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter Bar */}

      {/* Messages List Display */}


      {/* No Group Selected State */}
      {!currentGroup && savedGroups.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a WhatsApp Group</h3>
            <p className="text-gray-500">Click any group card above to automatically fetch messages and generate AI summary</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppManagement;
