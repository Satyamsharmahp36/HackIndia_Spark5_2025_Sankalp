import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
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
  Plus,
  Users,
  Hash,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Load saved groups from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('whatsapp-groups');
    if (saved) {
      try {
        const groups = JSON.parse(saved);
        setSavedGroups(groups);
        if (groups.length > 0) {
          setCurrentGroup(groups[0]);
        }
      } catch (error) {
        console.error("Error parsing saved groups:", error);
        localStorage.removeItem('whatsapp-groups');
      }
    }
  }, []);

  // Save groups to localStorage whenever savedGroups changes
  useEffect(() => {
    localStorage.setItem('whatsapp-groups', JSON.stringify(savedGroups));
  }, [savedGroups]);

  // Fetch messages from the API
  const fetchMessages = async (groupName, limit = 50) => {
    if (!groupName) {
      toast.error("Please select or add a group");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        'http://localhost:3002/api/whatsapp/groups/messages/fetch',
        {
          groupName: groupName,
          limit: limit
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.success) {
        // FIX: Extract messages from the correct nested structure
        const messagesData = response.data.data?.messages || [];
        setMessages(messagesData);
        toast.success(`📱 Retrieved ${messagesData.length} messages`);
      } else {
        toast.error("Failed to fetch WhatsApp messages");
        setMessages([]); // Reset messages on failure
      }
    } catch (error) {
      console.error("Error fetching WhatsApp messages:", error);
      toast.error("Error fetching WhatsApp messages");
      setMessages([]); // Reset messages on error
    } finally {
      setLoading(false);
    }
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
    toast.success("Group added successfully");
  };

  // Remove group
  const removeGroup = (groupId) => {
    setSavedGroups(prev => prev.filter(group => group.id !== groupId));
    if (currentGroup?.id === groupId) {
      setCurrentGroup(null);
      setMessages([]);
    }
    toast.success("Group removed");
  };

  // FIX: Add proper error handling and ensure messages is always an array
  const filteredMessages = React.useMemo(() => {
    // Ensure messages is always an array
    const messageArray = Array.isArray(messages) ? messages : [];
    
    return messageArray.filter((message) => {
      const matchesSearch = 
        message.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.senderPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.actualSenderName?.toLowerCase().includes(searchTerm.toLowerCase());

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
    if (message.isRead === 0) return "bg-green-100 text-green-800";
    if (message.isImportant) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get status icon for message
  const getStatusIcon = (message) => {
    if (message.isRead === 0) return <EyeOff className="w-4 h-4" />;
    if (message.isImportant) return <Star className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">WhatsApp Management</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {Array.isArray(messages) ? messages.length : 0} messages
          </Badge>
          {currentGroup && (
            <Badge variant="outline" className="border-green-300 text-green-700">
              {currentGroup.name}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => currentGroup && fetchMessages(currentGroup.name, currentGroup.limit)}
          disabled={loading || !currentGroup}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Rest of the component remains the same but with updated field mappings */}
      {/* Group Management section - keeping existing code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            WhatsApp Groups
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
                    placeholder="Enter WhatsApp group name..."
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
                    max="1000"
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

          {/* Saved Groups */}
          <div className="space-y-2">
            {savedGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No WhatsApp groups added yet</p>
                <p className="text-sm">Add a group to start fetching messages</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedGroups.map((group) => (
                  <Card 
                    key={group.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      currentGroup?.id === group.id && "ring-2 ring-green-500 bg-green-50"
                    )}
                    onClick={() => setCurrentGroup(group)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Hash className="w-4 h-4 text-green-600" />
                            <h3 className="font-semibold text-gray-900 truncate">
                              {group.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">
                            Limit: {group.limit} messages
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
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Group
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter Bar - keeping existing code with currentGroup check */}
      {currentGroup && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
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
                Filters
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
                    <Star className="w-4 h-4" />
                    Important
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Messages List - Updated to match API response structure */}
      {currentGroup && (
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Loading messages...</p>
                <p className="text-sm text-gray-500 mt-1">Fetching from {currentGroup.name}</p>
              </div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== "all" 
                    ? "Try adjusting your search or filter criteria"
                    : "Click 'Fetch Messages' to load messages from the group"}
                </p>
                {!searchTerm && filterType === "all" && (
                  <Button
                    onClick={() => fetchMessages(currentGroup.name, currentGroup.limit)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Fetch Messages Now
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
                    message.isRead === 0 && "border-l-4 border-l-green-500",
                    selectedMessage?.id === message.id && "ring-2 ring-green-500"
                  )}
                  onClick={() => setSelectedMessage(selectedMessage?.id === message.id ? null : message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Message Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-900 truncate">
                                  {message.senderName || message.actualSenderName || 'Unknown Sender'}
                                </span>
                                <Badge 
                                  variant="secondary" 
                                  className={cn("text-xs px-2 py-1", getStatusColor(message))}
                                >
                                  {getStatusIcon(message)}
                                  <span className="ml-1">
                                    {message.isRead === 0 ? "Unread" : message.isImportant ? "Important" : "Read"}
                                  </span>
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {message.senderPhone || 'No contact info'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(message.timestamp)}
                            </div>
                            <p className="text-xs">{message.timeAgo}</p>
                          </div>
                        </div>

                        {/* Message Content */}
                        <div className="mb-4">
                          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                  {message.content || 'No message content available'}
                                </p>
                                {message.messageType === 'reaction' && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-lg">{message.reactionEmoji}</span>
                                    <span className="text-xs text-gray-500">Reaction</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Group:</span>
                            <span>{currentGroup.name}</span>
                          </div>
                          {message.messageType && (
                            <div className="flex items-center gap-1">
                              <span>Type:</span>
                              <span className="capitalize">{message.messageType}</span>
                            </div>
                          )}
                          {message.hasMedia && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              <span>Media</span>
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
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
                                      <label className="font-medium text-gray-600 block mb-1">Timestamp</label>
                                      <p className="text-gray-900">
                                        {message.formattedTime || new Date(message.timestamp).toLocaleString()}
                                      </p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Message Type</label>
                                      <p className="text-gray-900 capitalize">{message.messageType}</p>
                                    </div>
                                    <div>
                                      <label className="font-medium text-gray-600 block mb-1">Read Status</label>
                                      <p className="text-gray-900">{message.isRead === 0 ? 'Unread' : 'Read'}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Sender Information */}
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  <h4 className="text-lg font-semibold text-gray-900">Sender Information</h4>
                                </div>
                                <div className="bg-gradient-to-r from-gray-50 to-green-50 border border-gray-200 rounded-lg p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 block mb-1">Name</label>
                                        <p className="text-gray-900 font-medium">{message.senderName || message.actualSenderName || 'Unknown'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 block mb-1">Phone</label>
                                        <p className="text-gray-700 font-mono text-sm">{message.senderPhone || 'N/A'}</p>
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 block mb-1">Push Name</label>
                                        <p className="text-gray-900">{message.pushName || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600 block mb-1">Time Ago</label>
                                        <p className="text-gray-700">{message.timeAgo}</p>
                                      </div>
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
      )}

      {/* No Group Selected */}
      {!currentGroup && savedGroups.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Select a WhatsApp group to view messages</p>
            <p className="text-sm text-gray-500 mt-1">Click on any group above to start fetching messages</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppManagement;
