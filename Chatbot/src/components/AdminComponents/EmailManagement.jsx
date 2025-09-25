import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "react-toastify";

const EmailManagement = ({ userData }) => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, unread, important
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState(new Set());

  // Fetch emails from the API
  const fetchEmails = async () => {
    if (!userData?.user?.username) {
      toast.error("User data not available");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_EMAIL_BACKEND}/api/emails/Uikx_tZVTQywUxzAxhrc6g?limit=20`
      );

      if (response.data?.success) {
        setEmails(response.data.data || []);
        toast.success(`📧 Retrieved ${response.data.data?.length || 0} emails`);
      } else {
        toast.error("Failed to fetch emails");
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Error fetching emails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [userData?.user?.username]);

  // Filter emails based on search and filter criteria
  const filteredEmails = emails.filter((email) => {
    const matchesSearch = 
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.fromName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.preview?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "unread" && !email.isRead) ||
      (filterType === "important" && email.hasAttachments);

    return matchesSearch && matchesFilter;
  });

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
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get status color for email
  const getStatusColor = (email) => {
    if (!email.isRead) return "bg-blue-100 text-blue-800";
    if (email.hasAttachments) return "bg-yellow-100 text-yellow-800";
    return "bg-gray-100 text-gray-800";
  };

  // Get status icon for email
  const getStatusIcon = (email) => {
    if (!email.isRead) return <EyeOff className="w-4 h-4" />;
    if (email.hasAttachments) return <Paperclip className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Email Management</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {emails.length} emails
          </Badge>
        </div>
        <Button
          onClick={fetchEmails}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search emails..."
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
                  <Star className="w-4 h-4" />
                  With Attachments
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Email List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading emails...</span>
          </div>
        ) : filteredEmails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No emails found</p>
              <p className="text-sm text-gray-500 mt-1">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "No emails available"}
              </p>
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
                  !email.isRead && "border-l-4 border-l-blue-500",
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
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
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
                                  {!email.isRead ? "Unread" : email.hasAttachments ? "Has Attachments" : "Read"}
                                </span>
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{email.from}</p>
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
                          "text-lg font-bold text-gray-900 mb-2 leading-tight",
                          !email.isRead && "text-blue-900"
                        )}>
                          {email.subject}
                        </h3>
                      </div>

                      {/* Preview */}
                      <div className="mb-4">
                        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-200">
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
                          <span>Content Length:</span>
                          <span>{email.contentLength} chars</span>
                        </div>
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
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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

                            {/* Sender Details */}
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
                                    <span className="font-medium text-gray-600">Sent:</span>
                                    <p className="text-gray-900">{new Date(email.date).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Status:</span>
                                    <p className={cn(
                                      "font-medium",
                                      !email.isRead ? "text-blue-600" : "text-green-600"
                                    )}>
                                      {!email.isRead ? "Unread" : "Read"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-600">Attachments:</span>
                                    <p className={cn(
                                      "font-medium",
                                      email.hasAttachments ? "text-orange-600" : "text-gray-500"
                                    )}>
                                      {email.hasAttachments ? "Yes" : "No"}
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

      {/* Selected Email Details */}
      {selectedEmail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg">
            <CardHeader className="bg-white border-b border-blue-200 rounded-t-lg">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Selected Email Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Email Header */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
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
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 rounded-t-lg">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Email Content
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

                {/* Email Statistics */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 rounded-t-lg">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Email Statistics
                    </h4>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
