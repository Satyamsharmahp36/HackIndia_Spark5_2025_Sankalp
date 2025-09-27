import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Mail,
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
  AlertTriangle,
  Calendar,
  FileText,
  Brain,
  Sparkles,
  Copy,
  Check,
  AlertCircle,
  Settings,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";

const EmailManagement = ({ userData }) => {
  const [emails, setEmails] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [criticalEmails, setCriticalEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("critical"); // critical, unread, all
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  // AI and Auto-fetch related states
  const [autoFetchEnabled, setAutoFetchEnabled] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [emailLimit, setEmailLimit] = useState(20);
  const [processingStage, setProcessingStage] = useState("");

  // Auto-fetch interval
  const intervalRef = useRef(null);
  const fetchCountRef = useRef(0);

  // Get API key from environment or state
  const geminiApiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || apiKey;

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('email-gemini-api-key');
    const savedEmailLimit = localStorage.getItem('email-limit');
    const savedAutoFetch = localStorage.getItem('email-auto-fetch');

    if (savedApiKey && !import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
      setApiKey(savedApiKey);
    }

    if (savedEmailLimit) {
      setEmailLimit(parseInt(savedEmailLimit) || 20);
    }

    if (savedAutoFetch !== null) {
      setAutoFetchEnabled(JSON.parse(savedAutoFetch));
    }

    // Initial fetch
    fetchAndProcessEmails();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (apiKey && !import.meta.env.VITE_GOOGLE_GENAI_API_KEY) {
      localStorage.setItem('email-gemini-api-key', apiKey);
    }
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('email-limit', emailLimit.toString());
  }, [emailLimit]);

  useEffect(() => {
    localStorage.setItem('email-auto-fetch', JSON.stringify(autoFetchEnabled));
  }, [autoFetchEnabled]);

  // Setup auto-fetch interval
  useEffect(() => {
    if (autoFetchEnabled) {
      intervalRef.current = setInterval(() => {
        fetchAndProcessEmails();
      }, 20000); // 20 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [autoFetchEnabled, emailLimit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Main fetch and process function
  const fetchAndProcessEmails = async () => {
    if (aiProcessing) return; // Prevent overlapping operations

    fetchCountRef.current += 1;
    setLastFetchTime(new Date().toLocaleString());
    
    try {
      setLoading(true);
      setProcessingStage("📧 Fetching emails...");

      // Step 1: Fetch all emails
      const response = await axios.get(
        `http://localhost:3000/api/emails/Uikx_tZVTQywUxzAxhrc6g?limit=${emailLimit}`,
        { timeout: 10000 }
      );

      if (!response.data?.success) {
        throw new Error("Failed to fetch emails");
      }

      const fetchedEmails = response.data.data || [];
      setAllEmails(fetchedEmails);

      // Step 2: Filter unread emails first
      const unreadEmails = fetchedEmails.filter(email => !email.isRead);
      
      if (unreadEmails.length === 0) {
        setEmails(fetchedEmails);
        setCriticalEmails([]);
        setProcessingStage("");
        toast.info(`📧 Retrieved ${fetchedEmails.length} emails (${unreadEmails.length} unread)`);
        return;
      }

      setProcessingStage(`🔍 Processing ${unreadEmails.length} unread emails...`);

      // Step 3: AI-powered critical email detection
      if (geminiApiKey && unreadEmails.length > 0) {
        const criticalEmailsDetected = await detectCriticalEmails(unreadEmails);
        setCriticalEmails(criticalEmailsDetected);
        
        // Set filtered emails based on current filter
        if (filterType === "critical") {
          setEmails(criticalEmailsDetected);
        } else if (filterType === "unread") {
          setEmails(unreadEmails);
        } else {
          setEmails(fetchedEmails);
        }

        toast.success(
          `✨ Processed ${fetchedEmails.length} emails | ${unreadEmails.length} unread | ${criticalEmailsDetected.length} critical`,
          { autoClose: 4000 }
        );
      } else {
        setEmails(filterType === "unread" ? unreadEmails : fetchedEmails);
        
        if (!geminiApiKey) {
          toast.info(`📧 Retrieved ${fetchedEmails.length} emails (${unreadEmails.length} unread) - Set API key for AI filtering`);
        } else {
          toast.success(`📧 Retrieved ${fetchedEmails.length} emails (${unreadEmails.length} unread)`);
        }
      }

    } catch (error) {
      console.error("Error fetching/processing emails:", error);
      if (error.code === 'ECONNREFUSED') {
        toast.error("Email server is not running. Please start your server on port 3000.");
      } else {
        toast.error(`Error processing emails: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setProcessingStage("");
    }
  };

  // AI-powered critical email detection
  const detectCriticalEmails = async (unreadEmails) => {
    if (!geminiApiKey || unreadEmails.length === 0) {
      return [];
    }

    setAiProcessing(true);
    setProcessingStage("🤖 AI analyzing emails for critical content...");

    try {
      // Prepare email data for AI analysis
      const emailsForAnalysis = unreadEmails.map((email, index) => ({
        index,
        id: email.id,
        subject: email.subject,
        from: email.fromName || email.from,
        content: email.plainTextBody || email.preview,
        date: email.date
      }));

      const emailsText = emailsForAnalysis.map(email => 
        `Email ${email.index + 1}:
Subject: ${email.subject}
From: ${email.from}
Date: ${new Date(email.date).toLocaleDateString()}
Content: ${email.content.slice(0, 500)}...
---`
      ).join('\n\n');

      const prompt = `Analyze these ${unreadEmails.length} unread emails and identify ONLY the critically important ones that require immediate attention. Focus on:

CRITICAL CRITERIA:
1. **Deadlines & Time-sensitive content**: Emails mentioning specific dates, deadlines, "urgent", "asap", "by [date]", "before [time]"
2. **Important business/work communications**: Meeting requests, project updates, client communications, official notifications
3. **Financial & Legal matters**: Invoices, payment requests, legal notices, tax documents, bank notifications
4. **Emergency situations**: Security alerts, system outages, health emergencies, family emergencies
5. **Educational/Academic deadlines**: Assignment submissions, exam schedules, admission deadlines

EXCLUDE (Non-critical):
- Marketing emails & promotions
- Social media notifications
- Newsletters & subscriptions  
- Automated system emails (unless security/urgent)
- General announcements without deadlines
- Simple "thank you" or acknowledgment emails

Return ONLY the email numbers (1, 2, 3, etc.) that are CRITICAL, separated by commas. If none are critical, return "none".

Example response: "1, 3, 7" or "none"

Emails to analyze:
${emailsText}

Critical email numbers:`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topK: 10,
              topP: 0.8,
              maxOutputTokens: 100,
            },
          })
        }
      );

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!aiResponse || aiResponse.toLowerCase() === 'none') {
        return [];
      }

      // Parse AI response to get critical email indices
      const criticalIndices = aiResponse
        .split(',')
        .map(num => parseInt(num.trim()) - 1) // Convert to 0-based index
        .filter(index => !isNaN(index) && index >= 0 && index < unreadEmails.length);

      const criticalEmails = criticalIndices.map(index => ({
        ...unreadEmails[index],
        isCritical: true,
        criticalReason: 'AI-detected: Contains deadlines or critical information'
      }));

      return criticalEmails;

    } catch (error) {
      console.error("Error in AI email analysis:", error);
      toast.error(`AI analysis failed: ${error.message}`);
      return [];
    } finally {
      setAiProcessing(false);
    }
  };

  // Manual fetch function
  const fetchEmails = async () => {
    await fetchAndProcessEmails();
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
    localStorage.setItem('email-gemini-api-key', apiKey);
    setShowApiSettings(false);
    toast.success("API key saved successfully!");
  };

  // Filter emails based on search and filter criteria
  const filteredEmails = React.useMemo(() => {
    let emailsToFilter = [];
    
    switch (filterType) {
      case "critical":
        emailsToFilter = criticalEmails;
        break;
      case "unread":
        emailsToFilter = allEmails.filter(email => !email.isRead);
        break;
      case "all":
        emailsToFilter = allEmails;
        break;
      default:
        emailsToFilter = emails;
    }

    return emailsToFilter.filter((email) => {
      const searchFields = [
        email.subject,
        email.from,
        email.fromName,
        email.preview,
        email.plainTextBody
      ].filter(Boolean).join(' ').toLowerCase();
      
      return !searchTerm || searchFields.includes(searchTerm.toLowerCase());
    });
  }, [emails, allEmails, criticalEmails, searchTerm, filterType]);

  // Toggle email expansion
  const toggleEmailExpansion = (emailId) => {
    const newExpanded = new Set(expandedEmails);
    if (newExpanded.has(emailId)) {
      newExpanded.delete(emailId);
    } else {
      newExpanded.add(emailId);
    }
    setExpandedEmails(newExpanded);
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

  // Get status color for email
  const getStatusColor = (email) => {
    if (email.isCritical) return "bg-red-100 text-red-800";
    if (!email.isRead) return "bg-blue-100 text-blue-800";
    if (email.hasAttachments) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get status icon for email
  const getStatusIcon = (email) => {
    if (email.isCritical) return <AlertTriangle className="w-4 h-4" />;
    if (!email.isRead) return <EyeOff className="w-4 h-4" />;
    if (email.hasAttachments) return <Paperclip className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  // Get priority badge
  const getPriorityBadge = (email) => {
    if (email.isCritical) {
      return (
        <Badge className="bg-red-500 text-white animate-pulse">
          <Zap className="w-3 h-3 mr-1" />
          CRITICAL
        </Badge>
      );
    }
    if (!email.isRead) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          <EyeOff className="w-3 h-3 mr-1" />
          Unread
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with Enhanced Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Smart Email Management</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {filteredEmails.length} emails
          </Badge>
          {criticalEmails.length > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              🚨 {criticalEmails.length} Critical
            </Badge>
          )}
          {autoFetchEnabled && (
            <Badge variant="outline" className="border-green-500 text-green-700">
              ⚡ Auto-fetch ON
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
              AI Settings
            </Button>
          )}
          <Button
            onClick={() => setAutoFetchEnabled(!autoFetchEnabled)}
            variant={autoFetchEnabled ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Auto-fetch {autoFetchEnabled ? 'ON' : 'OFF'}
          </Button>
          <Button
            onClick={fetchEmails}
            disabled={loading || aiProcessing}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", (loading || aiProcessing) && "animate-spin")} />
            {loading || aiProcessing ? "Processing..." : "Manual Refresh"}
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {(loading || aiProcessing || processingStage) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-800">
                  {processingStage || "Processing emails..."}
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  AI is analyzing emails for critical content and deadlines
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auto-fetch Status */}
      {autoFetchEnabled && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Auto-fetch Active</p>
                  <p className="text-sm text-green-700">
                    Checking for new emails every 20 seconds • Last check: {lastFetchTime || "Starting..."}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-green-600">
                <p>Fetch #{fetchCountRef.current}</p>
                <p>Limit: {emailLimit}</p>
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
              AI Configuration
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
                Required for AI-powered critical email detection and deadline analysis
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Fetch Limit
              </label>
              <Input
                type="number"
                value={emailLimit}
                onChange={(e) => setEmailLimit(parseInt(e.target.value) || 20)}
                className="w-full"
                min="1"
                max="100"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveApiKey} className="bg-purple-600 hover:bg-purple-700">
                Save Settings
              </Button>
              <Button onClick={() => setShowApiSettings(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters ({filteredEmails.length})
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === "critical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("critical")}
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Critical ({criticalEmails.length})
                </Button>
                <Button
                  variant={filterType === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("unread")}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Unread ({allEmails.filter(e => !e.isRead).length})
                </Button>
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="flex items-center gap-2"
                >
                  <Inbox className="w-4 h-4" />
                  All ({allEmails.length})
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Email List */}
      <div className="space-y-3">
        {loading && filteredEmails.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading emails...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching and analyzing {emailLimit} emails</p>
            </div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {filterType === "critical" ? "No critical emails found" : "No emails found"}
              </h3>
              <p className="text-gray-500 mb-4">
                {filterType === "critical" 
                  ? "AI didn't detect any emails with deadlines or critical information" 
                  : searchTerm 
                    ? "Try adjusting your search criteria"
                    : "No emails available"}
              </p>
              {filterType === "critical" && !geminiApiKey && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-yellow-700">
                    Set up Gemini API key to enable AI-powered critical email detection
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEmails.map((email) => (
            <motion.div
              key={email.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  email.isCritical && "border-l-4 border-l-red-500 shadow-lg",
                  !email.isRead && !email.isCritical && "border-l-4 border-l-blue-500",
                  selectedEmail?.id === email.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedEmail(selectedEmail?.id === email.id ? null : email)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Email Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                            email.isCritical 
                              ? "bg-gradient-to-br from-red-500 to-red-600" 
                              : "bg-gradient-to-br from-blue-500 to-purple-600"
                          )}>
                            {email.isCritical ? (
                              <AlertTriangle className="w-5 h-5 text-white" />
                            ) : (
                              <User className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {email.fromName || email.from}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs px-2 py-1", getStatusColor(email))}
                              >
                                {getStatusIcon(email)}
                                <span className="ml-1">
                                  {email.isCritical ? "CRITICAL" : !email.isRead ? "Unread" : email.hasAttachments ? "Has Attachments" : "Read"}
                                </span>
                              </Badge>
                              {getPriorityBadge(email)}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{email.from}</p>
                            {email.isCritical && email.criticalReason && (
                              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {email.criticalReason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(email.date)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {email.wordCount} words • ~{email.estimatedReadTime} min read
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="mb-4">
                        <h3 className={cn(
                          "text-lg font-bold mb-2 leading-tight",
                          email.isCritical ? "text-red-900" : !email.isRead ? "text-blue-900" : "text-gray-900"
                        )}>
                          {email.isCritical && <AlertTriangle className="w-4 h-4 inline mr-2 text-red-500" />}
                          {email.subject}
                        </h3>
                      </div>

                      {/* Preview */}
                      <div className="mb-4">
                        <div className={cn(
                          "rounded-lg p-4 border-l-4",
                          email.isCritical 
                            ? "bg-red-50 border-red-200" 
                            : "bg-gray-50 border-blue-200"
                        )}>
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                            {email.preview}
                          </p>
                        </div>
                      </div>

                      {/* Email Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">From:</span>
                          <span>{email.fromName || email.from}</span>
                        </div>
                        {email.hasAttachments && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            <span>Attachments</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>Length:</span>
                          <span>{email.contentLength} chars</span>
                        </div>
                        {email.isCritical && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            <span>AI-Detected Critical</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedEmails.has(email.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-gray-200"
                        >
                          <div className="space-y-6">
                            {/* Full Content */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  email.isCritical ? "bg-red-500" : "bg-blue-500"
                                )}></div>
                                <h4 className="text-lg font-semibold text-gray-900">Email Content</h4>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {email.plainTextBody}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Enhanced Sender Details */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-gray-900">Sender Information</h4>
                              </div>
                              <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Name</label>
                                      <p className="text-gray-900 font-medium">{email.sender?.name || email.fromName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Email Address</label>
                                      <p className="text-gray-700 font-mono text-sm">{email.sender?.email || email.from}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Message ID</label>
                                      <p className="text-gray-700 font-mono text-sm">{email.id}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Content Stats</label>
                                      <p className="text-gray-700 text-sm">
                                        {email.wordCount} words • {email.contentLength} characters • {email.estimatedReadTime} min read
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Email Metadata */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-gray-900">Email Details</h4>
                              </div>
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-600">Received:</span>
                                    <p className="text-gray-900">{new Date(email.date).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <p className={cn(
                                      "font-medium",
                                      email.isCritical ? "text-red-600" : !email.isRead ? "text-blue-600" : "text-green-600"
                                    )}>
                                      {email.isCritical ? "🚨 Critical" : !email.isRead ? "📧 Unread" : "✅ Read"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Attachments:</span>
                                    <p className={cn(
                                      "font-medium",
                                      email.hasAttachments ? "text-orange-600" : "text-gray-500"
                                    )}>
                                      {email.hasAttachments ? "📎 Yes" : "No"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Expand/Collapse Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEmailExpansion(email.id);
                      }}
                      className="ml-2"
                    >
                      {expandedEmails.has(email.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Selected Email Details - keeping your existing selected email section */}
      {selectedEmail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className={cn(
            "border-2 shadow-lg",
            selectedEmail.isCritical 
              ? "border-red-200 bg-gradient-to-br from-red-50 to-orange-50"
              : "border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50"
          )}>
            <CardHeader className="bg-white border-b rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  selectedEmail.isCritical 
                    ? "bg-gradient-to-br from-red-500 to-red-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                )}>
                  {selectedEmail.isCritical ? (
                    <AlertTriangle className="w-4 h-4 text-white" />
                  ) : (
                    <Mail className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {selectedEmail.isCritical ? "Critical Email Details" : "Selected Email Details"}
                </span>
                {selectedEmail.isCritical && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    🚨 URGENT
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Email Header */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                      selectedEmail.isCritical 
                        ? "bg-gradient-to-br from-red-500 to-red-600"
                        : "bg-gradient-to-br from-blue-500 to-purple-600"
                    )}>
                      {selectedEmail.isCritical ? (
                        <AlertTriangle className="w-6 h-6 text-white" />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedEmail.subject}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-800">{selectedEmail.fromName}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600 text-sm">{selectedEmail.from}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedEmail.date).toLocaleString()}
                      </p>
                      {selectedEmail.isCritical && selectedEmail.criticalReason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-800 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-red-500" />
                            <strong>AI Analysis:</strong> {selectedEmail.criticalReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className={cn(
                    "px-6 py-3 border-b border-gray-200 rounded-t-lg",
                    selectedEmail.isCritical ? "bg-red-50" : "bg-gray-50"
                  )}>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        selectedEmail.isCritical ? "bg-red-500" : "bg-blue-500"
                      )}></div>
                      Email Content
                      {selectedEmail.isCritical && (
                        <Badge className="bg-red-500 text-white text-xs animate-pulse">
                          PRIORITY
                        </Badge>
                      )}
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="prose prose-gray max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-base">
                        {selectedEmail.plainTextBody}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Email Statistics */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 rounded-t-lg">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Email Statistics & Analysis
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{selectedEmail.wordCount}</div>
                        <div className="text-sm text-blue-700">Words</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{selectedEmail.contentLength}</div>
                        <div className="text-sm text-purple-700">Characters</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{selectedEmail.estimatedReadTime}</div>
                        <div className="text-sm text-green-700">Min Read</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedEmail.hasAttachments ? "Yes" : "No"}
                        </div>
                        <div className="text-sm text-orange-700">Attachments</div>
                      </div>
                      <div className={cn(
                        "text-center p-4 rounded-lg",
                        selectedEmail.isCritical 
                          ? "bg-red-50"
                          : selectedEmail.isRead ? "bg-gray-50" : "bg-blue-50"
                      )}>
                        <div className={cn(
                          "text-2xl font-bold",
                          selectedEmail.isCritical 
                            ? "text-red-600"
                            : selectedEmail.isRead ? "text-gray-600" : "text-blue-600"
                        )}>
                          {selectedEmail.isCritical ? "🚨" : selectedEmail.isRead ? "✅" : "📧"}
                        </div>
                        <div className={cn(
                          "text-sm",
                          selectedEmail.isCritical 
                            ? "text-red-700"
                            : selectedEmail.isRead ? "text-gray-700" : "text-blue-700"
                        )}>
                          {selectedEmail.isCritical ? "Critical" : selectedEmail.isRead ? "Read" : "Unread"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default EmailManagement;
