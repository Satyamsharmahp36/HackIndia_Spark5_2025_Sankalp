import React, { useState, useEffect } from "react";
import { X, Plus, Mail, User } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const EmailDashboard = ({ isOpen, onClose, userData }) => {
  const [profiles, setProfiles] = useState([]); // [{email, token}]
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [query, setQuery] = useState("newer_than:7d");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    if (isOpen && userData?.user) {
      let googleProfiles = userData.user.googleProfiles || [];
      // If main email is not in googleProfiles, add it as needsAuth
      const mainEmail = userData.user.email;
      const alreadyInProfiles = googleProfiles.some(p => p.email === mainEmail);
      let allProfiles = [...googleProfiles];
      if (!alreadyInProfiles && mainEmail) {
        allProfiles = [{ email: mainEmail, needsAuth: true }, ...allProfiles];
      }
      setProfiles(allProfiles);
    }
  }, [isOpen, userData]);

  const fetchProfiles = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND}/gmail-profiles?username=${userData.user.username}`);
      let googleProfiles = res.data.profiles || [];
      // If main email is not in googleProfiles, add it as needsAuth
      const mainEmail = userData.user.email;
      const alreadyInProfiles = googleProfiles.some(p => p.email === mainEmail);
      let allProfiles = [...googleProfiles];
      if (!alreadyInProfiles && mainEmail) {
        allProfiles = [{ email: mainEmail, needsAuth: true }, ...allProfiles];
      }
      setProfiles(allProfiles);
    } catch (err) {
      toast.error("Failed to fetch Gmail profiles");
    }
  };

  const handleLoginMainEmail = () => {
    window.open(`${import.meta.env.VITE_BACKEND}/user/verify-email?username=${userData.user.username}`, "_blank");
    toast.info("Complete Google login in the new tab, then refresh profiles.");
  };

  const handleFetchMessages = async () => {
    if (!selectedProfile) return;
    setLoading(true);
    setMessages([]);
    setSelectedMessage(null);
    setMessageContent("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND}/gmail-messages`,
        {
          params: {
            email: selectedProfile.email,
            query,
          },
        }
      );
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error("Failed to fetch emails");
    }
    setLoading(false);
  };

  const handleSelectMessage = async (msg) => {
    setSelectedMessage(msg);
    setContentLoading(true);
    setMessageContent("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND}/gmail-message-content`,
        {
          params: {
            email: selectedProfile.email,
            messageId: msg.id,
          },
        }
      );
      setMessageContent(res.data.text || "[No plain text content]");
    } catch (err) {
      toast.error("Failed to fetch email content");
    }
    setContentLoading(false);
  };

  // Helper to check if a profile is the main email
  const isMainEmail = (profile) => profile.email === userData.user.email;

  return isOpen ? (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-80 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-5xl max-h-[98vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Mail className="w-6 h-6 text-purple-400" />
            <span className="text-lg font-bold text-white">Email Dashboard</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-900 border-r border-gray-700 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-300 font-semibold">Profiles</span>
              <button
                onClick={handleLoginMainEmail}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1"
                title="Add new Gmail profile"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {/* Main email at the top, visually separated */}
              {profiles.filter(isMainEmail).map((profile) => (
                <div key={profile.email} className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 mb-2">
                  <User className="w-4 h-4 text-blue-400" />
                  <span className="truncate text-white font-semibold">{profile.email} (Primary)</span>
                  {profile.needsAuth && (
                    <button
                      onClick={handleLoginMainEmail}
                      className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                    >
                      Login
                    </button>
                  )}
                </div>
              ))}
              {/* Divider */}
              <div className="border-b border-gray-600 my-2" />
              {/* Other profiles */}
              {profiles.filter((profile) => !isMainEmail(profile)).map((profile) => (
                <button
                  key={profile.email}
                  onClick={() => setSelectedProfile(profile)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full text-left ${
                    selectedProfile?.email === profile.email
                      ? "bg-purple-700 text-white"
                      : "bg-gray-800 text-gray-300"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span className="truncate">{profile.email}</span>
                </button>
              ))}
            </div>
            <button
              onClick={fetchProfiles}
              className="mt-4 text-xs text-purple-400 hover:underline"
            >
              Refresh Profiles
            </button>
          </div>
          {/* Main Content */}
          <div className="flex-1 p-4 overflow-auto">
            {selectedProfile ? (
              <>
                {/* Query/filter bar */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white flex-1"
                    placeholder="Search query (e.g. newer_than:7d, from:xyz@gmail.com)"
                  />
                  <button
                    onClick={handleFetchMessages}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
                  >
                    Fetch Emails
                  </button>
                </div>
                {/* Email list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loading ? (
                    <div className="text-gray-400">Loading emails...</div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg border border-gray-700 bg-gray-900 cursor-pointer ${
                          selectedMessage?.id === msg.id
                            ? "border-purple-500"
                            : ""
                        }`}
                        onClick={() => handleSelectMessage(msg)}
                      >
                        <div className="text-sm text-gray-300">
                          <span className="font-bold">ID:</span> {msg.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          Thread: {msg.threadId}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Email content */}
                {selectedMessage && (
                  <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-4">
                    <div className="font-bold text-purple-400 mb-2">
                      Email Content
                    </div>
                    {contentLoading ? (
                      <div className="text-gray-400">Loading content...</div>
                    ) : (
                      <pre className="text-gray-200 whitespace-pre-wrap">
                        {messageContent}
                      </pre>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-400">
                Select a profile to view emails.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default EmailDashboard; 