import React, { useState } from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clipboard,
  User as UserIcon,
  ListChecks,
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  ExternalLink,
  FileText,
  ChevronUp,
  ChevronDown,
  User,
  Bot,
} from "lucide-react";

const TaskCard = ({
  task,
  expandedTask,
  expandedUser,
  userDescriptions,
  handleExpandTask,
  handleViewUserDetails,
  handleOpenMeetingLink,
  handleViewMeetingDetails,
  handleScheduleMeeting,
  handleCreateBotAssistant,
  toggleTaskStatus,
  creatingBot,
  formatDate,
  getStatusColor,
  getStatusIcon,
  getMeetingCardStyle,
  renderDescription,
  setExpandedTask,
  setExpandedUser,
  setUserDescriptions,
  userData,
}) => {
  const [userInfoLoading, setUserInfoLoading] = useState(false);
  const [userInfoError, setUserInfoError] = useState("");

  const handleUserInfoClick = async () => {
    if (expandedUser === task._id) {
      handleViewUserDetails(task);
      return;
    }
    setUserInfoLoading(true);
    setUserInfoError("");
    try {
      await handleViewUserDetails(task);
    } catch (err) {
      setUserInfoError("Failed to generate user description.");
    } finally {
      setUserInfoLoading(false);
    }
  };

  return (
    <motion.div
      key={task.uniqueTaskId || task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-lg hover:border-gray-600 transition-all"
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {task.isSelfTask ? (
              <Clipboard className="w-5 h-5 text-purple-400" />
            ) : (
              <UserIcon className="w-5 h-5 text-blue-400" />
            )}

            <span className="text-white font-medium">
              {task.isSelfTask
                ? "Self Task"
                : task.presentUserData?.name || "Unknown User"}
            </span>

            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
              ID: {task.uniqueTaskId || "N/A"}
            </span>

            {task.isSelfTask && (
              <span className="text-xs text-purple-300 bg-purple-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ListChecks className="w-3 h-3" />
                Self Task
              </span>
            )}

            {task.isMeeting && task.isMeeting.title && (
              <span className="text-xs text-blue-300 bg-blue-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Meeting
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleTaskStatus(task)}
              className="p-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              title="Toggle Status"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-2 py-1 rounded-full text-xs text-white flex items-center gap-1 ${getStatusColor(
                task.status
              )}`}
            >
              {getStatusIcon(task.status)}
              <span>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </motion.button>
          </div>
        </div>

        {task.topicContext && (
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-gray-300 font-bold">Context:</span>{" "}
            {renderDescription(task.topicContext)}
          </p>
        )}

        {task.taskDescription && (
          <p className="text-gray-400 text-sm mb-2">
            <span className="text-gray-300 font-bold">Description:</span>{" "}
            {renderDescription(task.taskDescription)}
          </p>
        )}

        <p className="text-gray-400 text-sm mb-4">
          <span className="text-gray-300 font-bold">
            {task.isSelfTask ? "Task Message:" : "User Message:"}
          </span>{" "}
          {task.taskQuestion}
        </p>

        {task.isMeeting && task.isMeeting.title && (
          <div
            className={`rounded-lg p-3 mb-4 border ${getMeetingCardStyle(
              task.isMeeting.status
            )}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white font-medium mb-1">
                  {task.isMeeting.title}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {task.isMeeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" /> {task.isMeeting.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" /> {task.isMeeting.duration}{" "}
                    min
                  </span>
                </div>
                {task.isMeeting.description && (
                  <p className="text-gray-400 text-sm mt-2">
                    {task.isMeeting.description}
                  </p>
                )}
                {task.isMeeting.status && (
                  <span
                    className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full 
                    ${
                      task.isMeeting.status === "pending"
                        ? "bg-yellow-900 text-yellow-300"
                        : task.isMeeting.status === "scheduled"
                        ? "bg-blue-900 text-blue-300"
                        : "bg-green-900 text-green-300"
                    }`}
                  >
                    {task.isMeeting.status.charAt(0).toUpperCase() +
                      task.isMeeting.status.slice(1)}
                  </span>
                )}
              </div>

              {/* Different buttons based on meeting status */}
              {task.isMeeting.status === "pending" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleScheduleMeeting(task)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </motion.button>
              )}

              {task.isMeeting.status === "scheduled" &&
                task.isMeeting.meetingLink && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      handleOpenMeetingLink(task.isMeeting.meetingLink)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Meeting
                  </motion.button>
                )}

              {task.isMeeting.status === "completed" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleViewMeetingDetails(task.isMeeting)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 ml-2"
                >
                  <FileText className="w-4 h-4" />
                  Details
                </motion.button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExpandTask(task._id)}
              className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
            >
              {expandedTask === task._id ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> More
                </>
              )}
            </motion.button>

            {!task.isSelfTask && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleUserInfoClick}
                className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-lg text-sm flex items-center gap-1"
              >
                <User className="w-4 h-4" /> User Info
              </motion.button>
            )}
           {task.isMeeting.status === "completed" &&(
             task.isMeeting.botActivated ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_FRONTEND}/home/${
                      task.uniqueTaskId
                    }`,
                    "_blank"
                  )
                }
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <Bot className="w-4 h-4" />
                Assist Bot
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCreateBotAssistant(task)}
                disabled={creatingBot}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <Bot className="w-4 h-4" />
                {creatingBot ? "Creating..." : "Get Bot"}
              </motion.button>
              )
            )}
          </div>

          <p className="text-xs text-gray-500">
            Created: {formatDate(task.createdAt)}
          </p>
        </div>

        <AnimatePresence>
          {expandedTask === task._id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-gray-300 font-medium mb-2">Full Details</h4>
                <div className="bg-gray-900 p-3 rounded-lg text-sm">
                  {task.taskQuestion && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Message:
                      </span>{" "}
                      <span className="text-gray-300">{task.taskQuestion}</span>
                    </div>
                  )}

                  {task.taskDescription && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Description:
                      </span>{" "}
                      <span className="text-gray-300">
                        {task.taskDescription}
                      </span>
                    </div>
                  )}

                  {task.topicContext && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Context:
                      </span>{" "}
                      <span className="text-gray-300">{task.topicContext}</span>
                    </div>
                  )}

                  {task.createdAt && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Created:
                      </span>{" "}
                      <span className="text-gray-300">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  )}

                  {task.updatedAt && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Updated:
                      </span>{" "}
                      <span className="text-gray-300">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  )}

                  {task.uniqueTaskId && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Task ID:
                      </span>{" "}
                      <span className="text-gray-300">{task.uniqueTaskId}</span>
                    </div>
                  )}

                  {task.isMeeting && task.isMeeting.title && (
                    <div className="mb-3">
                      <span className="text-gray-400 font-medium">
                        Meeting Type:
                      </span>{" "}
                      <span className="text-gray-300">
                        {task.isMeeting.meetingType || "Standard"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {expandedUser === task._id && !task.isSelfTask && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 overflow-hidden"
            >
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-gray-300 font-medium mb-2">
                  User Information
                </h4>
                <div className="bg-gray-900 p-3 rounded-lg text-sm">
                  {task.presentUserData && (
                    <>
                      {task.presentUserData.name && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Name:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.name}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.email && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Email:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.email}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.mobileNo && (
                        <div className="mb-2">
                          <span className="text-gray-400 font-medium">
                            Mobile:
                          </span>{" "}
                          <span className="text-gray-300">
                            {task.presentUserData.mobileNo}
                          </span>
                        </div>
                      )}
                      {userInfoLoading && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700 text-blue-400">
                          Loading user description...
                        </div>
                      )}
                      {userInfoError && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-red-700 text-red-400">
                          {userInfoError}
                        </div>
                      )}
                      {userDescriptions[task._id] && !userInfoLoading && !userInfoError && (
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                          <span className="text-gray-400 font-medium block mb-2">
                            AI-Generated User Profile:
                          </span>
                          <p className="text-gray-300 whitespace-pre-line">
                            {userDescriptions[task._id]}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  expandedTask: PropTypes.any,
  expandedUser: PropTypes.any,
  userDescriptions: PropTypes.object,
  handleExpandTask: PropTypes.func,
  handleViewUserDetails: PropTypes.func,
  handleOpenMeetingLink: PropTypes.func,
  handleViewMeetingDetails: PropTypes.func,
  handleScheduleMeeting: PropTypes.func,
  handleCreateBotAssistant: PropTypes.func,
  toggleTaskStatus: PropTypes.func,
  creatingBot: PropTypes.bool,
  formatDate: PropTypes.func,
  getStatusColor: PropTypes.func,
  getStatusIcon: PropTypes.func,
  getMeetingCardStyle: PropTypes.func,
  renderDescription: PropTypes.func,
  setExpandedTask: PropTypes.func,
  setExpandedUser: PropTypes.func,
  setUserDescriptions: PropTypes.func,
  userData: PropTypes.object,
};

export default TaskCard; 