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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Fetch messages from the LinkedIn API
  const fetchMessages = async (limit = 20) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:4000/api/linkedin/messages?limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.success) {
        setMessages(response.data.data || []);
        toast.success(`💼 Retrieved ${response.data.data?.length || 0} LinkedIn messages`);
      } else {
        toast.error("Failed to fetch LinkedIn messages");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn messages:", error);
      toast.error("Error fetching LinkedIn messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages based on search and filter criteria
  const filteredMessages = React.useMemo(() => {
    const messageArray = Array.isArray(messages) ? messages : [];
    
    return messageArray.filter((message) => {
      const matchesSearch = 
        message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.from?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.preview?.toLowerCase().includes(searchTerm.toLowerCase());

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
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Limit:</label>
            <Input
              type="number"
              value={messageLimit}
              onChange={(e) => setMessageLimit(parseInt(e.target.value) || 20)}
              className="w-20"
              min="1"
              max="100"
            />
          </div>
          <Button
            onClick={() => fetchMessages(messageLimit)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            {loading ? "Loading..." : "Fetch Messages"}
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search LinkedIn messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="flex items-center gap-2"
                >
                  <Inbox className="w-4 h-4" />
                  All
                </Button>
                <Button
                  variant={filterType === "unread" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("unread")}
                  className="flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Unread
                </Button>
                <Button
                  variant={filterType === "important" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("important")}
                  className="flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  With Attachments
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Loading LinkedIn messages...</p>
              <p className="text-sm text-gray-500 mt-1">Fetching {messageLimit} messages</p>
            </div>
          </div>
        ) : filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Linkedin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Click 'Fetch Messages' to load LinkedIn messages"}
              </p>
              {!searchTerm && filterType === "all" && (
                <Button
                  onClick={() => fetchMessages(messageLimit)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  Fetch LinkedIn Messages
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  !message.isRead && "border-l-4 border-l-blue-500",
                  selectedMessage?.id === message.id && "ring-2 ring-blue-500"
                )}
                onClick={() => setSelectedMessage(selectedMessage?.id === message.id ? null : message)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Message Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                            message.from?.isCurrentUser 
                              ? "bg-gradient-to-br from-green-500 to-green-600" 
                              : "bg-gradient-to-br from-blue-500 to-blue-600"
                          )}>
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">
                                {message.from?.name || 'Unknown Sender'}
                              </span>
                              <Badge 
                                variant="secondary" 
                                className={cn("text-xs px-2 py-1", getStatusColor(message))}
                              >
                                {getStatusIcon(message)}
                                <span className="ml-1">
                                  {!message.isRead ? "Unread" : message.hasAttachments ? "Has Attachments" : message.from?.isCurrentUser ? "You" : "Read"}
                                </span>
                              </Badge>
                              {message.from?.isCurrentUser && (
                                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                                  Sent by You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {message.from?.linkedinProfile && (
                                <a 
                                  href={message.from.linkedinProfile} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  LinkedIn Profile
                                </a>
                              )}
                              {message.from?.headline && (
                                <span className="text-sm text-gray-500 truncate">
                                  • {message.from.headline}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-2">
                          <div className="flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(message.date)}
                          </div>
                        </div>
                      </div>

                      {/* Subject */}
                      {message.subject && message.subject !== "No Subject" && (
                        <div className="mb-3">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                            {message.subject}
                          </h3>
                        </div>
                      )}

                      {/* Message Content */}
                      <div className="mb-4">
                        <div className={cn(
                          "rounded-xl p-4 border shadow-sm",
                          message.from?.isCurrentUser 
                            ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200"
                        )}>
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              message.from?.isCurrentUser ? "bg-green-500" : "bg-blue-500"
                            )}></div>
                            <div className="flex-1">
                              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content || message.preview || 'No message content available'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Thread ID:</span>
                          <span className="font-mono">{message.threadId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>Type:</span>
                          <span className="capitalize">{message.messageType?.replace('_', ' ')}</span>
                        </div>
                        {message.hasAttachments && (
                          <div className="flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            <span>Attachments</span>
                          </div>
                        )}
                        {message.linkedinData?.reactions?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span>Reactions: {message.linkedinData.reactions.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Expanded Content */}
                      {expandedMessages.has(message.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 pt-6 border-t border-gray-200"
                        >
                          <div className="space-y-6">
                            {/* Message Details */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-gray-900">Message Details</h4>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Message ID</label>
                                    <p className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded">
                                      {message.id}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Chat ID</label>
                                    <p className="text-gray-900 font-mono text-xs bg-gray-100 p-2 rounded">
                                      {message.chatId}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Timestamp</label>
                                    <p className="text-gray-900">
                                      {new Date(message.date).toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Read Status</label>
                                    <p className={cn(
                                      "font-medium",
                                      !message.isRead ? "text-blue-600" : "text-gray-600"
                                    )}>
                                      {!message.isRead ? 'Unread' : 'Read'}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Message Type</label>
                                    <p className="text-gray-900 capitalize">{message.messageType?.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <label className="font-medium text-gray-600 block mb-1">Attachments</label>
                                    <p className="text-gray-900">{message.hasAttachments ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Sender Information */}
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
                                      <p className="text-gray-900 font-medium">{message.from?.name || 'Unknown'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Identifier</label>
                                      <p className="text-gray-700 font-mono text-sm">{message.from?.identifier || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Attendee ID</label>
                                      <p className="text-gray-700 font-mono text-sm">{message.from?.attendeeId || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Headline</label>
                                      <p className="text-gray-900">{message.from?.headline || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-1">Current User</label>
                                      <p className={cn(
                                        "font-medium",
                                        message.from?.isCurrentUser ? "text-green-600" : "text-gray-600"
                                      )}>
                                        {message.from?.isCurrentUser ? 'Yes' : 'No'}
                                      </p>
                                    </div>
                                    {message.from?.linkedinProfile && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 block mb-1">Profile</label>
                                        <a 
                                          href={message.from.linkedinProfile} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                          View Profile
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* LinkedIn Raw Data */}
                            {message.linkedinData && (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                  <h4 className="text-lg font-semibold text-gray-900">LinkedIn Data</h4>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Sender ID</label>
                                      <p className="text-gray-900 font-mono text-xs">{message.linkedinData.senderId}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Provider ID</label>
                                      <p className="text-gray-900 font-mono text-xs">{message.linkedinData.providerId}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Seen Status</label>
                                      <p className="text-gray-900">{message.linkedinData.seen ? 'Seen' : 'Not Seen'}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Is Sender</label>
                                      <p className="text-gray-900">{message.linkedinData.isSender ? 'Yes' : 'No'}</p>
                                    </div>
                                    {message.linkedinData.reactions?.length > 0 && (
                                      <div className="md:col-span-2">
                                        <label className="font-medium text-gray-600 block mb-1">Reactions</label>
                                        <div className="flex gap-2 flex-wrap">
                                          {message.linkedinData.reactions.map((reaction, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {reaction.value}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Full Message Content */}
                            <div>
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <h4 className="text-lg font-semibold text-gray-900">Full Message Content</h4>
                              </div>
                              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                                <div className="prose prose-sm max-w-none">
                                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                    {message.content || 'No message content available'}
                                  </p>
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
                        toggleMessageExpansion(message.id);
                      }}
                      className="ml-2"
                    >
                      {expandedMessages.has(message.id) ? (
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

      
    </div>
  );
};

export default LinkedInManagement;
