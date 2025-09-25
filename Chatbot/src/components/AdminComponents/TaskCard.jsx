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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    >
      <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all">
        <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {task.isSelfTask ? (
              <Clipboard className="w-5 h-5 text-purple-400" />
            ) : (
              <UserIcon className="w-5 h-5 text-blue-400" />
            )}

            <span className="text-foreground font-medium">
              {task.isSelfTask
                ? "Self Task"
                : task.presentUserData?.name || "Unknown User"}
            </span>

            <Badge variant="outline" className="text-xs">
              ID: {task.uniqueTaskId || "N/A"}
            </Badge>

            {task.isSelfTask && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-200">
                <ListChecks className="w-3 h-3" />
                Self Task
              </Badge>
            )}

            {task.isMeeting && task.isMeeting.title && (
              <Badge variant="secondary" className="text-xs bg-blue-100  text-blue-800 hover:bg-blue-200">
                <Calendar className="w-3 h-3" />
                Meeting
              </Badge>
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

            <Badge 
              variant={task.status === "completed" ? "default" : "secondary"}
              className={cn(
                "flex items-center gap-1",
                task.status === "completed" && "bg-green-100 text-green-800 hover:bg-green-200",
                task.status === "inprogress" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                task.status === "pending" && "bg-blue-100  text-blue-800 hover:bg-blue-200",
                task.status === "cancelled" && "bg-red-100 text-red-800 hover:bg-red-200"
              )}
            >
              {getStatusIcon(task.status)}
              <span>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </span>
            </Badge>
          </div>
        </div>

        {task.topicContext && (
          <p className="text-muted-foreground text-sm mb-2">
            <span className="text-foreground font-bold">Context:</span>{" "}
            {renderDescription(task.topicContext)}
          </p>
        )}

        {task.taskDescription && (
          <p className="text-muted-foreground text-sm mb-2">
            <span className="text-foreground font-bold">Description:</span>{" "}
            {renderDescription(task.taskDescription)}
          </p>
        )}

        <p className="text-muted-foreground text-sm mb-4">
          <span className="text-foreground font-bold">
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
                <h4 className="font-medium mb-1">
                  {task.isMeeting.title}
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-sm opacity-80">
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
                  <p className="text-sm mt-2 opacity-75">
                    {task.isMeeting.description}
                  </p>
                )}
                {task.isMeeting.status && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-2 text-xs",
                      task.isMeeting.status === "pending" && "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
                      task.isMeeting.status === "scheduled" && "bg-blue-100  text-blue-800 hover:bg-blue-200",
                      task.isMeeting.status === "completed" && "bg-green-100 text-green-800 hover:bg-green-200",
                      task.isMeeting.status === "cancelled" && "bg-red-100 text-red-800 hover:bg-red-200"
                    )}
                  >
                    {task.isMeeting.status.charAt(0).toUpperCase() +
                      task.isMeeting.status.slice(1)}
                  </Badge>
                )}
              </div>

              {/* Different buttons based on meeting status */}
              {task.isMeeting.status === "pending" && (
                <Button
                  onClick={() => handleScheduleMeeting(task)}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                  size="sm"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Button>
              )}

              {task.isMeeting.status === "scheduled" &&
                task.isMeeting.meetingLink && (
                  <Button
                    onClick={() =>
                      handleOpenMeetingLink(task.isMeeting.meetingLink)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Join Meeting
                  </Button>
                )}

              {task.isMeeting.status === "completed" && (
                <Button
                  onClick={() => handleViewMeetingDetails(task.isMeeting)}
                  variant="outline"
                  className="flex items-center gap-1 ml-2"
                  size="sm"
                >
                  <FileText className="w-4 h-4" />
                  Details
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExpandTask(task._id)}
              className="flex items-center gap-1"
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
            </Button>

            {!task.isSelfTask && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUserInfoClick}
                className="flex items-center gap-1"
              >
                <User className="w-4 h-4" /> User Info
              </Button>
            )}
           {task.isMeeting.status === "completed" &&(
             task.isMeeting.botActivated ? (
              <Button
                onClick={() =>
                  window.open(
                    `${import.meta.env.VITE_FRONTEND}/home/${
                      task.uniqueTaskId
                    }`,
                    "_blank"
                  )
                }
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                size="sm"
              >
                <Bot className="w-4 h-4" />
                Assist Bot
              </Button>
            ) : (
              <Button
                onClick={() => handleCreateBotAssistant(task)}
                disabled={creatingBot}
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
                size="sm"
              >
                <Bot className="w-4 h-4" />
                {creatingBot ? "Creating..." : "Get Bot"}
              </Button>
              )
            )}
          </div>

          <p className="text-xs text-muted-foreground">
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
              <div className="border-t border-border pt-4">
                <h4 className="text-foreground font-medium mb-2">Full Details</h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  {task.taskQuestion && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Message:
                      </span>{" "}
                      <span className="text-foreground">{task.taskQuestion}</span>
                    </div>
                  )}

                  {task.taskDescription && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Description:
                      </span>{" "}
                      <span className="text-foreground">
                        {task.taskDescription}
                      </span>
                    </div>
                  )}

                  {task.topicContext && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Context:
                      </span>{" "}
                      <span className="text-foreground">{task.topicContext}</span>
                    </div>
                  )}

                  {task.createdAt && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Created:
                      </span>{" "}
                      <span className="text-foreground">
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  )}

                  {task.updatedAt && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Updated:
                      </span>{" "}
                      <span className="text-foreground">
                        {formatDate(task.updatedAt)}
                      </span>
                    </div>
                  )}

                  {task.uniqueTaskId && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Task ID:
                      </span>{" "}
                      <span className="text-foreground">{task.uniqueTaskId}</span>
                    </div>
                  )}

                  {task.isMeeting && task.isMeeting.title && (
                    <div className="mb-3">
                      <span className="text-muted-foreground font-medium">
                        Meeting Type:
                      </span>{" "}
                      <span className="text-foreground">
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
              <div className="border-t border-border pt-4">
                <h4 className="text-foreground font-medium mb-2">
                  User Information
                </h4>
                <div className="bg-muted p-3 rounded-lg text-sm">
                  {task.presentUserData && (
                    <>
                      {task.presentUserData.name && (
                        <div className="mb-2">
                          <span className="text-muted-foreground font-medium">
                            Name:
                          </span>{" "}
                          <span className="text-foreground">
                            {task.presentUserData.name}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.email && (
                        <div className="mb-2">
                          <span className="text-muted-foreground font-medium">
                            Email:
                          </span>{" "}
                          <span className="text-foreground">
                            {task.presentUserData.email}
                          </span>
                        </div>
                      )}
                      {task.presentUserData.mobileNo && (
                        <div className="mb-2">
                          <span className="text-muted-foreground font-medium">
                            Mobile:
                          </span>{" "}
                          <span className="text-foreground">
                            {task.presentUserData.mobileNo}
                          </span>
                        </div>
                      )}
                      {userInfoLoading && (
                        <div className="mt-3 p-3 bg-muted rounded border border-border text-blue-600">
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
        </CardContent>
      </Card>
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