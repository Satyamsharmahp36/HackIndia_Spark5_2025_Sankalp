import React from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Clipboard,
  User as UserIcon,
  Calendar,
  RefreshCw,
  CheckCircle,
  Clock as ClockIcon,
  ExternalLink,
  FileText,
  User,
} from "lucide-react";

const TaskListItem = ({
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
  return (
    <motion.div
      key={task.uniqueTaskId || task._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow hover:border-gray-600 transition-all p-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`}
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">
                {task.isSelfTask
                  ? "Self Task"
                  : task.presentUserData?.name || "Unknown User"}
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

            <p className="text-gray-400 text-sm mt-1 line-clamp-1">
              {task.taskQuestion}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {task.isMeeting && task.isMeeting.status === "scheduled" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                task.isMeeting.meetingLink
                  ? handleOpenMeetingLink(task.isMeeting.meetingLink)
                  : handleViewMeetingDetails(task.isMeeting)
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              {task.isMeeting.meetingLink ? (
                <>
                  <ExternalLink className="w-3 h-3" />
                  Join
                </>
              ) : (
                <>
                  <FileText className="w-3 h-3" />
                  Details
                </>
              )}
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleExpandTask(task._id)}
            className="bg-gray-700 hover:bg-gray-600 transition-colors px-2 py-1 rounded text-xs"
          >
            {expandedTask === task._id ? "Less" : "More"}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {expandedTask === task._id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 overflow-hidden"
          >
            <div className="border-t border-gray-700 pt-3">
              {task.taskDescription && (
                <p className="text-gray-400 text-sm mb-2">
                  <span className="text-gray-300 font-bold">Description:</span>{" "}
                  {task.taskDescription}
                </p>
              )}

              {task.isMeeting && task.isMeeting.title && (
                <div
                  className={`rounded-lg p-3 my-2 border ${getMeetingCardStyle(
                    task.isMeeting.status
                  )}`}
                >
                  <h4 className="text-white font-medium mb-1">
                    {task.isMeeting.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> {task.isMeeting.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <ClockIcon className="w-4 h-4" /> {task.isMeeting.time}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTaskStatus(task)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  disabled={creatingBot}
                >
                  <RefreshCw className="w-4 h-4" />
                  Toggle Status
                </motion.button>

                {!task.isSelfTask && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleViewUserDetails(task)}
                    className="bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1 rounded-lg text-sm flex items-center gap-1"
                  >
                    <User className="w-4 h-4" /> User Info
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

TaskListItem.propTypes = {
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

export default TaskListItem; 