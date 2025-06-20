import React from "react";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks,
  Clipboard,
  User as UserIcon,
  Calendar,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  User,
  Bot,
  ExternalLink,
  FileText,
  CheckCircle,
  Clock as ClockIcon,
} from "lucide-react";
import TaskCard from "./TaskCard";
import TaskListItem from "./TaskListItem";

const TaskList = ({
  loading,
  error,
  sortedTasks,
  viewMode,
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
  tasks,
}) => {
  // Render grid or list view for tasks
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (!sortedTasks || sortedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-800 p-6 rounded-full mb-4">
          <ListChecks className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-white mb-2">No tasks found</h3>
        <p className="text-gray-400 max-w-md">
          No tasks match your current filters. Try adjusting your search or filters, or create a new task.
        </p>
      </div>
    );
  }

  return viewMode === "grid" ? (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.uniqueTaskId || task._id}
          task={task}
          expandedTask={expandedTask}
          expandedUser={expandedUser}
          userDescriptions={userDescriptions}
          handleExpandTask={handleExpandTask}
          handleViewUserDetails={handleViewUserDetails}
          handleOpenMeetingLink={handleOpenMeetingLink}
          handleViewMeetingDetails={handleViewMeetingDetails}
          handleScheduleMeeting={handleScheduleMeeting}
          handleCreateBotAssistant={handleCreateBotAssistant}
          toggleTaskStatus={toggleTaskStatus}
          creatingBot={creatingBot}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getMeetingCardStyle={getMeetingCardStyle}
          renderDescription={renderDescription}
          setExpandedTask={setExpandedTask}
          setExpandedUser={setExpandedUser}
          setUserDescriptions={setUserDescriptions}
          userData={userData}
        />
      ))}
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {sortedTasks.map((task) => (
        <TaskListItem
          key={task.uniqueTaskId || task._id}
          task={task}
          expandedTask={expandedTask}
          expandedUser={expandedUser}
          userDescriptions={userDescriptions}
          handleExpandTask={handleExpandTask}
          handleViewUserDetails={handleViewUserDetails}
          handleOpenMeetingLink={handleOpenMeetingLink}
          handleViewMeetingDetails={handleViewMeetingDetails}
          handleScheduleMeeting={handleScheduleMeeting}
          handleCreateBotAssistant={handleCreateBotAssistant}
          toggleTaskStatus={toggleTaskStatus}
          creatingBot={creatingBot}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon}
          getMeetingCardStyle={getMeetingCardStyle}
          renderDescription={renderDescription}
          setExpandedTask={setExpandedTask}
          setExpandedUser={setExpandedUser}
          setUserDescriptions={setUserDescriptions}
          userData={userData}
        />
      ))}
    </div>
  );
};

TaskList.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.any,
  sortedTasks: PropTypes.array,
  viewMode: PropTypes.string,
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
  tasks: PropTypes.array,
};

// TaskCard and TaskListItem components would be defined here, using the code previously in AdminPanel.jsx
// For brevity, you can copy the renderTaskCard and renderTaskListItem logic here, converting them to components.

export default TaskList; 