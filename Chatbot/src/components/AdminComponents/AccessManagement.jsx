import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Users,
  UserPlus,
  UserMinus,
  User,
  UserCheck,
  Search,
  Trash,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader,
  Shield,
  Info,
  Globe,
  Lock,
} from "lucide-react";

const AccessManagement = ({ onClose, userData, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("user-access");
  const [userAccess, setUserAccess] = useState([]);
  const [currentUserID, setCurrentUserID] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupUsername, setGroupUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [groupsWithAccess, setGroupsWithAccess] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [groupToRemove, setGroupToRemove] = useState(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [accessRestricted, setAccessRestricted] = useState(false);
  const [isTogglingRestriction, setIsTogglingRestriction] = useState(false);

  // Fetch user access data and groups
  useEffect(() => {
    if (userData?.user?._id) {
      setCurrentUserID(userData.user._id);
      fetchAccessData(userData.user._id);
      fetchRestrictionStatus(userData.user._id);
    }
  }, [userData?.user?._id]); // Only depend on user ID, not entire userData object

  const fetchAccessData = async (userId) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/access-management`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUserAccess(data.accessList || []);
        setGroups(data.groups || []);

        // Fetch groups with access
        const groupAccessResponse = await fetch(
          `${
            import.meta.env.VITE_BACKEND
          }/access-management/groups-with-access`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
          }
        );

        const groupAccessData = await groupAccessResponse.json();
        if (groupAccessResponse.ok) {
          setGroupsWithAccess(groupAccessData.groupsWithAccess || []);
        }
      } else {
        showMessage("error", data.msg || "Failed to fetch access data");
      }
    } catch (error) {
      console.error("Error fetching access data:", error);
      showMessage("error", "Failed to load access data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestrictionStatus = async (userId) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/restriction-status?userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setAccessRestricted(data.accessRestricted);
      } else {
        console.error("Failed to fetch restriction status:", data.msg);
      }
    } catch (error) {
      console.error("Error fetching restriction status:", error);
    }
  };

  // New function to toggle restriction
  const toggleRestriction = async () => {
    setIsTogglingRestriction(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/access-management/toggle-restriction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserID,
            isRestricted: !accessRestricted,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setAccessRestricted(data.accessRestricted);
        showMessage(
          "success",
          `Access ${
            data.accessRestricted
              ? "restricted to specified users"
              : "open to everyone"
          }`
        );
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to toggle restriction");
      }
    } catch (error) {
      console.error("Error toggling restriction:", error);
      showMessage("error", "Failed to update access settings");
    } finally {
      setIsTogglingRestriction(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/users/search?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSearchResults(data);
      } else {
        console.error("Search failed:", data.msg);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addUserAccess = async () => {
    if (!newUsername.trim()) {
      showMessage("error", "Please enter a username");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/access-management/individual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: newUsername.trim(),
            userId: currentUserID,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUserAccess(data);
        setNewUsername("");
        showMessage("success", "User access added successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to add user access");
      }
    } catch (error) {
      console.error("Error adding user access:", error);
      showMessage("error", "Failed to add user access. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const removeUserAccess = async (username) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/individual/${encodeURIComponent(username)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserID }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUserAccess(data);
        showMessage("success", "User access removed successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to remove user access");
      }
    } catch (error) {
      console.error("Error removing user access:", error);
      showMessage("error", "Failed to remove user access. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const addGroupAccess = async (groupName) => {
    setIsAddingGroup(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/access-management/group-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName,
            userId: currentUserID,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUserAccess(data.accessList);
        setGroupsWithAccess(data.groupsWithAccess);
        showMessage(
          "success",
          `Group "${groupName}" access added successfully`
        );
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to add group access");
      }
    } catch (error) {
      console.error("Error adding group access:", error);
      showMessage("error", "Failed to add group access. Please try again.");
    } finally {
      setIsAddingGroup(false);
    }
  };

  const removeGroupAccess = async (groupName) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/group-access/${encodeURIComponent(groupName)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserID }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setUserAccess(data.accessList);
        setGroupsWithAccess(data.groupsWithAccess);
        showMessage(
          "success",
          `Group "${groupName}" access removed successfully`
        );
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to remove group access");
      }
    } catch (error) {
      console.error("Error removing group access:", error);
      showMessage("error", "Failed to remove group access. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) {
      showMessage("error", "Please enter a group name");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/access-management/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName: newGroupName.trim(),
            userId: currentUserID,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setGroups(data);
        setNewGroupName("");
        showMessage("success", "Group created successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to create group");
      }
    } catch (error) {
      console.error("Error creating group:", error);
      showMessage("error", "Failed to create group. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteGroup = async (groupName) => {
    // Check if group has access first
    if (groupsWithAccess.includes(groupName)) {
      setGroupToRemove(groupName);
      setShowConfirmDialog(true);
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/groups/${encodeURIComponent(groupName)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserID }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setGroups(data);
        if (selectedGroup?.groupName === groupName) {
          setSelectedGroup(null);
        }
        showMessage("success", "Group deleted successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to delete group");
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      showMessage("error", "Failed to delete group. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const addUserToGroup = async () => {
    if (!selectedGroup) {
      showMessage("error", "Please select a group first");
      return;
    }

    if (!groupUsername.trim()) {
      showMessage("error", "Please enter a username");
      return;
    }

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/groups/${encodeURIComponent(
          selectedGroup.groupName
        )}/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: groupUsername.trim(),
            userId: currentUserID,
          }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Update the groups list with the updated group
        const updatedGroups = groups.map((group) =>
          group.groupName === selectedGroup.groupName ? data : group
        );
        setGroups(updatedGroups);
        setSelectedGroup(data);
        setGroupUsername("");

        // If this group has access, update the access list with the new user
        if (groupsWithAccess.includes(selectedGroup.groupName)) {
          const accessUpdateResponse = await fetch(
            `${
              import.meta.env.VITE_BACKEND
            }/access-management/update-access-from-group`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                groupName: selectedGroup.groupName,
                userId: currentUserID,
              }),
            }
          );

          const accessData = await accessUpdateResponse.json();
          if (accessUpdateResponse.ok) {
            setUserAccess(accessData.accessList);
          }
        }

        showMessage("success", "User added to group successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to add user to group");
      }
    } catch (error) {
      console.error("Error adding user to group:", error);
      showMessage("error", "Failed to add user to group. Please try again.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const removeUserFromGroup = async (username) => {
    if (!selectedGroup) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND
        }/access-management/groups/${encodeURIComponent(
          selectedGroup.groupName
        )}/users/${encodeURIComponent(username)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUserID }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        // Update the groups list with the updated group
        const updatedGroups = groups.map((group) =>
          group.groupName === selectedGroup.groupName ? data : group
        );
        setGroups(updatedGroups);
        setSelectedGroup(data);

        // If this group has access, update the access list by removing this user
        if (groupsWithAccess.includes(selectedGroup.groupName)) {
          const accessUpdateResponse = await fetch(
            `${
              import.meta.env.VITE_BACKEND
            }/access-management/update-access-from-group`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                groupName: selectedGroup.groupName,
                userId: currentUserID,
              }),
            }
          );

          const accessData = await accessUpdateResponse.json();
          if (accessUpdateResponse.ok) {
            setUserAccess(accessData.accessList);
          }
        }

        showMessage("success", "User removed from group successfully");
        if (onUpdate) onUpdate();
      } else {
        showMessage("error", data.msg || "Failed to remove user from group");
      }
    } catch (error) {
      console.error("Error removing user from group:", error);
      showMessage(
        "error",
        "Failed to remove user from group. Please try again."
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmRemoveGroup = async () => {
    if (!groupToRemove) return;

    try {
      // First remove group access
      await removeGroupAccess(groupToRemove);

      // Then delete the group
      await deleteGroup(groupToRemove);

      setShowConfirmDialog(false);
      setGroupToRemove(null);
    } catch (error) {
      console.error("Error in group removal process:", error);
      showMessage("error", "An error occurred during group removal");
    }
  };
  const handleClose = () => {
    console.log("Close button clicked");
    onClose();
  };


  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const filteredGroups = groups.filter((group) =>
    group.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading overlay component
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
      <div className="flex flex-col items-center">
        <Loader className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="mt-2 text-white">Loading...</p>
      </div>
    </div>
  );

  // Confirmation dialog component
  const ConfirmDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700 shadow-xl">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
          Remove Group Access First
        </h3>
        <p className="text-gray-300 mb-6">
          The group "{groupToRemove}" currently has access privileges. Would you
          like to remove its access and then delete the group?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmRemoveGroup}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center"
          >
            <Trash className="w-4 h-4 mr-1" />
            Remove & Delete
          </button>
        </div>
      </div>
    </div>
  );

  // Group badge component to show in access list
  const GroupBadge = ({ groupName }) => (
    <div className="flex items-center bg-indigo-100 px-2 py-1 rounded-md text-xs border border-indigo-200">
      <Users className="w-3 h-3 mr-1 text-indigo-600" />
      <span className="text-indigo-700">{groupName}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {showConfirmDialog && <ConfirmDialog />}

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl w-full border border-gray-200 shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold flex items-center text-gray-900">
            <Users className="w-6 h-6 mr-3 text-purple-600" />
            Access Management
          </h2>
          <p className="text-gray-600 mt-2">Manage user access and group permissions</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("user-access")}
            className={`flex-1 py-4 px-6 text-center transition-colors ${
              activeTab === "user-access"
                ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
            disabled={isLoading}
          >
            <div className="flex items-center justify-center">
              <UserCheck className="w-5 h-5 mr-2" />
              <span className="font-medium">User Access</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-4 px-6 text-center transition-colors ${
              activeTab === "groups"
                ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50"
                : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
            disabled={isLoading}
          >
            <div className="flex items-center justify-center">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-medium">Groups</span>
            </div>
          </button>
        </div>

        {/* Message alert */}
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mx-6 mt-4 p-3 rounded-lg flex items-center ${
              message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {message.type === "error" ? (
              <AlertCircle className="w-5 h-5 mr-2" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </motion.div>
        )}

        <div className="mx-6 mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              {accessRestricted ? (
                <Lock className="w-6 h-6 mr-3 text-purple-600" />
              ) : (
                <Globe className="w-6 h-6 mr-3 text-green-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Access Restriction</h3>
                <p className="text-gray-600 mt-1">
                  {accessRestricted
                    ? "Access is restricted to specified users/groups"
                    : "Access is open to everyone"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleRestriction}
              disabled={isTogglingRestriction}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                accessRestricted ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                  accessRestricted ? "translate-x-6" : "translate-x-1"
                }`}
              />
              {isTogglingRestriction && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <Loader className="w-3 h-3 text-white animate-spin" />
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main content with loading state */}
        <div className="p-8 relative">
          {isLoading && <LoadingOverlay />}

          {activeTab === "user-access" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => {
                      setNewUsername(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base"
                    placeholder="Enter username to add access"
                    disabled={isActionLoading}
                  />

                  {/* User search results dropdown */}
                  {newUsername.trim() && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-2 text-center text-gray-600">
                          <Loader className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Searching...
                        </div>
                      ) : (
                        searchResults.map((user) => (
                          <div
                            key={user._id}
                            className="p-2 hover:bg-gray-50 cursor-pointer flex items-center"
                            onClick={() => {
                              setNewUsername(user.username);
                              setSearchResults([]);
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.username}</div>
                              <div className="text-xs text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={addUserAccess}
                  disabled={isActionLoading || !newUsername.trim()}
                  className="py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {isActionLoading ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-5 h-5 mr-2" />
                  )}
                  <span>Add User</span>
                </motion.button>
              </div>

              {/* Group Access Section */}
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="font-semibold text-lg text-gray-900">Group Access</h3>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  {groupsWithAccess.length > 0 ? (
                    groupsWithAccess.map((groupName) => (
                      <div
                        key={groupName}
                        className="flex items-center bg-purple-100 px-4 py-2 rounded-lg text-sm text-purple-700 border border-purple-200"
                      >
                        <Users className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="font-medium">{groupName}</span>
                        <button
                          onClick={() => removeGroupAccess(groupName)}
                          disabled={isActionLoading}
                          className="ml-3 text-purple-600 hover:text-red-600 p-1 rounded-full hover:bg-purple-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">
                      No groups have been added to access list yet.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="bg-white border border-gray-300 rounded-lg py-2 px-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all flex-1"
                    onChange={(e) => addGroupAccess(e.target.value)}
                    value=""
                    disabled={isAddingGroup || groups.length === 0}
                  >
                    <option value="" disabled>
                      Select a group to add access
                    </option>
                    {groups
                      .filter(
                        (group) => !groupsWithAccess.includes(group.groupName)
                      )
                      .map((group) => (
                        <option key={group.groupName} value={group.groupName}>
                          {group.groupName} ({group.users?.length || 0} members)
                        </option>
                      ))}
                  </select>

                  {isAddingGroup && (
                    <Loader className="w-5 h-5 animate-spin text-blue-500" />
                  )}
                </div>

                <div className="mt-2 flex items-center">
                  <Info className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    Adding a group will grant access to all members in that group.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden relative">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-medium text-lg text-gray-900">User Access List</h3>
                  <div className="text-sm text-gray-600">
                    {userAccess.length} user{userAccess.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {userAccess.length === 0 ? (
                  <div className="p-8 text-center text-gray-600">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users have been granted access yet.</p>
                    <p className="text-sm mt-1">
                      Add users or groups above to grant access to your
                      assistant.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {userAccess.map((username, idx) => {
                      // Find which groups this user belongs to (from groups with access)
                      const userGroups = groups
                        .filter(
                          (group) =>
                            groupsWithAccess.includes(group.groupName) &&
                            group.users.includes(username)
                        )
                        .map((group) => group.groupName);

                      return (
                        <li
                          key={`user-access-${username}-${idx}`}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-violet-600 flex items-center justify-center mr-3">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{username}</div>
                              {userGroups.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {userGroups.map((groupName) => (
                                    <GroupBadge
                                      key={groupName}
                                      groupName={groupName}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeUserAccess(username)}
                            disabled={isActionLoading}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="flex items-center mt-2 text-sm text-gray-600">
                <Info className="w-4 h-4 mr-2" />
                <p>
                  Users with access can view and interact with your assistant.
                </p>
              </div>
            </div>
          )}

          {activeTab === "groups" && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg py-3 px-12 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base"
                    placeholder="Search groups..."
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Groups List */}
                <div className="lg:w-1/3 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-gray-900">Your Groups</h3>
                    <div className="text-sm text-gray-600">
                      {filteredGroups.length} group
                      {filteredGroups.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="flex-1 bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        placeholder="New group name..."
                        disabled={isActionLoading}
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={createGroup}
                        disabled={isActionLoading || !newGroupName.trim()}
                        className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isActionLoading ? (
                          <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {filteredGroups.length === 0 ? (
                    <div className="p-8 text-center text-gray-600">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No groups found</p>
                      <p className="text-sm mt-1">Create a new group above</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                      {filteredGroups.map((group) => (
                        <li
                          key={group.groupName}
                          onClick={() => setSelectedGroup(group)}
                          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            selectedGroup?.groupName === group.groupName
                              ? "bg-purple-50 border-r-4 border-purple-600"
                              : ""
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-10 h-10 rounded-full ${
                                groupsWithAccess.includes(group.groupName)
                                  ? "bg-gradient-to-r from-green-500 to-teal-500"
                                  : "bg-gradient-to-r from-purple-500 to-indigo-500"
                              } flex items-center justify-center mr-3`}
                            >
                              <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {group.groupName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {group.users?.length || 0} member
                                {group.users?.length !== 1 ? "s" : ""}
                                {groupsWithAccess.includes(group.groupName) && (
                                  <span className="ml-2 text-green-600 flex items-center">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Has Access
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGroup(group.groupName);
                            }}
                            disabled={isActionLoading}
                            className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Group Details */}
                <div className="lg:w-2/3 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                  {selectedGroup ? (
                    <>
                      <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-xl text-gray-900">
                            {selectedGroup.groupName}
                          </h3>
                          {groupsWithAccess.includes(
                            selectedGroup.groupName
                          ) && (
                            <span className="ml-3 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full flex items-center border border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Has Access
                            </span>
                          )}
                        </div>

                        {groupsWithAccess.includes(selectedGroup.groupName) ? (
                          <button
                            onClick={() =>
                              removeGroupAccess(selectedGroup.groupName)
                            }
                            disabled={isActionLoading}
                            className="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium flex items-center disabled:opacity-70 border border-red-200"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Remove Access
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              addGroupAccess(selectedGroup.groupName)
                            }
                            disabled={isActionLoading}
                            className="py-2 px-4 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors text-sm font-medium flex items-center disabled:opacity-70 border border-green-200"
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Grant Access
                          </button>
                        )}
                      </div>

                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={groupUsername}
                            onChange={(e) => {
                              setGroupUsername(e.target.value);
                              searchUsers(e.target.value);
                            }}
                            className="flex-1 bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-900 placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                            placeholder="Add user to group..."
                            disabled={isActionLoading}
                          />
                          {groupUsername.trim() && searchResults.length > 0 && (
                            <div className="absolute top-52 z-10 mt-1 w-120 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {isSearching ? (
                                <div className="p-2 text-center text-gray-600">
                                  <Loader className="w-4 h-4 animate-spin mx-auto mb-2" />
                                  Searching...
                                </div>
                              ) : (
                                searchResults.map((user) => (
                                  <div
                                    key={user._id}
                                    className="p-2 hover:bg-gray-50 cursor-pointer flex items-center"
                                    onClick={() => {
                                      setGroupUsername(user.username);
                                      setSearchResults([]);
                                    }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                                      <User className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {user.username}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {user.email}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={addUserToGroup}
                            disabled={isActionLoading || !groupUsername.trim()}
                            className="py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isActionLoading ? (
                              <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                              <UserPlus className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>

                      {selectedGroup.users?.length > 0 ? (
                        <ul className="divide-y divide-gray-200 max-h-80 overflow-y-auto">
                          {selectedGroup.users.map((username, idx) => (
                            <li
                              key={`group-user-${username}-${idx}`}
                              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="font-semibold text-gray-900">{username}</div>
                              </div>
                              <button
                                onClick={() => removeUserFromGroup(username)}
                                disabled={isActionLoading}
                                className="p-2 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="p-8 text-center text-gray-600">
                          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No users in this group</p>
                          <p className="text-sm mt-1">
                            Add users above to include them in this group
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-gray-600 h-full flex flex-col items-center justify-center">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-semibold text-lg">
                        Select a group to view details
                      </p>
                      <p className="text-sm mt-2 max-w-md">
                        Create a new group or select an existing one to manage
                        members and access permissions
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccessManagement;
