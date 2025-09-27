import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Linkedin,
  Search,
  Filter,
  Clock,
  User,
  Paperclip,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  Archive,
  Trash2,
  Inbox,
  ExternalLink,
  MessageSquare,
  Users,
  FileText,
  Brain,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";

const LinkedInManagement = ({ userData }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const [messageLimit, setMessageLimit] = useState(20);

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

  // Auto-processing states
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState("");
  const [hasAutoFetched, setHasAutoFetched] = useState(false);

  // Get API key from environment or state
  const geminiApiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || apiKey;

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('linkedin-gemini-api-key');
    const savedSummaryHistory = localStorage.getItem('linkedin-summary-history');
    const savedMessageLimit = localStorage.getItem('linkedin-message-limit');

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

    if (savedMessageLimit) {
      setMessageLimit(parseInt(savedMessageLimit) || 20);
    }

    // Auto-fetch messages on component mount
    if (!hasAutoFetched) {
      autoFetchAndSummarize();
      setHasAutoFetched(true);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (apiKey && !import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
      localStorage.setItem('linkedin-gemini-api-key', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    if (summaryHistory.length > 0) {
      localStorage.setItem('linkedin-summary-history', JSON.stringify(summaryHistory));
    }
  }, [summaryHistory]);

  useEffect(() => {
    localStorage.setItem('linkedin-message-limit', messageLimit.toString());
  }, [messageLimit]);

  // Auto-fetch and summarize on component load
  const autoFetchAndSummarize = async () => {
    if (autoProcessing) return;
    
    setAutoProcessing(true);
    toast.info("🔄 Auto-loading LinkedIn messages...");
    
    try {
      // Step 1: Fetch messages automatically
      setProcessingStage("📧 Fetching LinkedIn messages...");
      const fetchedMessages = await fetchMessagesInternal(messageLimit);
      
      // Step 2: Auto-generate summary if we have messages and API key
      if (fetchedMessages && fetchedMessages.length > 0) {
        if (geminiApiKey) {
          await generateAutoSummary(fetchedMessages);
        } else {
          toast.info("Messages loaded! Set up Gemini API key for auto-summaries");
        }
      } else {
        toast.warning("No LinkedIn messages found");
      }
      
    } catch (error) {
      console.error("Error in auto-processing:", error);
      toast.error(`Failed to auto-process LinkedIn messages: ${error.message}`);
    } finally {
      setAutoProcessing(false);
      setProcessingStage("");
    }
  };

  // Internal fetch function that returns messages
  const fetchMessagesInternal = async (limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:4000/api/linkedin/messages?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data?.success) {
        const messagesData = response.data.data || [];
        setMessages(messagesData);
        toast.success(`💼 Retrieved ${messagesData.length} LinkedIn messages`);
        return messagesData;
      } else {
        toast.error("Failed to fetch LinkedIn messages");
        setMessages([]);
        return [];
      }
    } catch (error) {
      console.error("Error fetching LinkedIn messages:", error);
      if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
        toast.error("LinkedIn API server is not running. Please start your server on port 4000.");
      } else {
        toast.error(`Error fetching LinkedIn messages: ${error.message}`);
      }
      setMessages([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Public fetch function for manual refresh
  const fetchMessages = async (limit = 20) => {
    await fetchMessagesInternal(limit);
  };

  // Auto-generate summary with specific messages
  const generateAutoSummary = async (messagesToSummarize) => {
    if (!geminiApiKey) {
      toast.warning("Set up Gemini API key for AI summaries");
      return;
    }

    if (!messagesToSummarize || messagesToSummarize.length === 0) {
      toast.warning("No messages to summarize");
      return;
    }

    setSummaryLoading(true);
    setProcessingStage("🤖 Generating AI summary of LinkedIn conversations...");
    
    try {
      // Prepare LinkedIn messages for summary
      const messageTexts = messagesToSummarize.map(msg => {
        const sender = msg.from?.name || 'Unknown Sender';
        const content = msg.content || msg.preview || 'No content';
        const date = new Date(msg.date).toLocaleDateString();
        const isCurrentUser = msg.from?.isCurrentUser ? ' (You)' : '';
        const subject = msg.subject && msg.subject !== "No Subject" ? ` - Subject: ${msg.subject}` : '';
        const threadId = msg.threadId ? ` [Thread: ${msg.threadId}]` : '';
        
        return `[${date}] ${sender}${isCurrentUser}${subject}: ${content}${threadId}`;
      }).join('\n');

      const defaultPrompt = `Analyze these LinkedIn message conversations and provide a comprehensive professional summary. Focus on:

1. **Professional Networking**: What connections and professional relationships are being built?
2. **Business Opportunities**: Any job offers, project collaborations, or business discussions?
3. **Knowledge Sharing**: Educational content, advice, or expertise being shared?
4. **Key Conversations**: Important discussions with specific people and their outcomes?
5. **Action Items**: Any follow-ups, meetings, or commitments mentioned?
6. **Professional Development**: Career advice, learning opportunities, or skill development?

Context: These are LinkedIn direct messages showing professional networking activity.

LinkedIn Conversations:
${messageTexts}

Please provide a detailed summary that captures the professional networking value and key relationships being developed.`;

      // Use the Gemini API
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
        
        // Add to summary history
        const newSummaryEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          messageCount: messagesToSummarize.length,
          summary: generatedSummary.substring(0, 200) + '...', // Store preview
          fullSummary: generatedSummary,
          promptUsed: 'Auto-generated LinkedIn summary'
        };
        
        setSummaryHistory(prev => [newSummaryEntry, ...prev.slice(0, 9)]);
        toast.success("✨ LinkedIn summary generated successfully!");
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

  // Manual generate summary
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
      // Prepare LinkedIn messages for summary
      const messageTexts = messages.map(msg => {
        const sender = msg.from?.name || 'Unknown Sender';
        const content = msg.content || msg.preview || 'No content';
        const date = new Date(msg.date).toLocaleDateString();
        const isCurrentUser = msg.from?.isCurrentUser ? ' (You)' : '';
        const subject = msg.subject && msg.subject !== "No Subject" ? ` - Subject: ${msg.subject}` : '';
        return `[${date}] ${sender}${isCurrentUser}${subject}: ${content}`;
      }).join('\n');

      const defaultPrompt = `Analyze these LinkedIn message conversations and provide a comprehensive professional summary. Focus on:

1. **Professional Networking**: What connections and professional relationships are being built?
2. **Business Opportunities**: Any job offers, project collaborations, or business discussions?
3. **Knowledge Sharing**: Educational content, advice, or expertise being shared?
4. **Key Conversations**: Important discussions with specific people and their outcomes?
5. **Action Items**: Any follow-ups, meetings, or commitments mentioned?
6. **Professional Development**: Career advice, learning opportunities, or skill development?

LinkedIn Conversations:
${messageTexts}

Please provide a detailed summary that captures the professional networking value and key relationships being developed.`;

      const promptToUse = useCustomPrompt && customPrompt.trim() 
        ? `${customPrompt}\n\nLinkedIn Conversations:\n${messageTexts}` 
        : defaultPrompt;

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
        
        const newSummaryEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          messageCount: messages.length,
          summary: generatedSummary.substring(0, 200) + '...',
          fullSummary: generatedSummary,
          promptUsed: useCustomPrompt ? customPrompt : 'Default LinkedIn summary prompt'
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
    localStorage.setItem('linkedin-gemini-api-key', apiKey);
    setShowApiSettings(false);
    toast.success("API key saved successfully!");
  };

  // Filter messages based on search and filter criteria
  const filteredMessages = React.useMemo(() => {
    const messageArray = Array.isArray(messages) ? messages : [];
    
    return messageArray.filter((message) => {
      const searchFields = [
        message.content,
        message.subject,
        message.from?.name,
        message.preview,
        message.from?.headline
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = !searchTerm || searchFields.includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterType === "all" ||
        (filterType === "unread" && !message.isRead) ||
        (filterType === "important" && message.hasAttachments);

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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) {
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get status color for message
  const getStatusColor = (message) => {
    if (!message.isRead) return "bg-blue-100 text-blue-800";
    if (message.hasAttachments) return "bg-orange-100 text-orange-800";
    if (message.from?.isCurrentUser) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get status icon for message
  const getStatusIcon = (message) => {
    if (!message.isRead) return <EyeOff className="w-4 h-4" />;
    if (message.hasAttachments) return <Paperclip className="w-4 h-4" />;
    if (message.from?.isCurrentUser) return <User className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Linkedin className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">LinkedIn Messages</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {Array.isArray(messages) ? messages.length : 0} messages
          </Badge>
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Limit:</label>
            <Input
              type="number"
              value={messageLimit}
              onChange={(e) => setMessageLimit(parseInt(e.target.value) || 20)}
              className="w-20"
              min="1"
              max="100"
              disabled={autoProcessing}
            />
          </div>
          <Button
            onClick={() => fetchMessages(messageLimit)}
            disabled={loading || autoProcessing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", (loading || autoProcessing) && "animate-spin")} />
            {loading ? "Loading..." : "Manual Refresh"}
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
                  {processingStage || "Processing LinkedIn messages..."}
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
              Gemini AI Configuration
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
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI LinkedIn Summary
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
                      Set up your free Gemini API key to use AI-powered LinkedIn conversation summaries.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-processing info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">Auto-Processing Enabled</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    LinkedIn messages are automatically fetched and summarized when you visit this page
                    {!geminiApiKey && " (API key required for AI summaries)"}
                  </p>
                </div>
              </div>
            </div>

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
                    placeholder="E.g., 'Focus on business opportunities and networking', 'Identify potential collaborations', 'Summarize career advice and mentoring'"
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
            {showSummary && summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">LinkedIn Analysis Results</h3>
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
                  <span>💼 LinkedIn Messages • {messages.length} conversations analyzed</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}


    </div>
  );
};

export default LinkedInManagement;
