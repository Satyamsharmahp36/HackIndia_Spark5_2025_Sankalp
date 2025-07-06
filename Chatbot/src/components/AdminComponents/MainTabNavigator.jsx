import React from "react";
import {
  Calendar,
  User as UserIcon,
  Clock as ClockIcon,
  Plus,
  ListChecks,
  Activity,
  Settings,
  MessageCircle,
  Users,
  Slack
} from "lucide-react";

const MainTabNavigator = ({ activeView, handleTabChange, userData, handleSelfTaskToggle, setShowCalendarScheduler, handleChatIntegration }) => {
  return (
    <div className="md:w-64 bg-gray-900 p-4 flex-shrink-0 border-r border-gray-700">
      <nav>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleTabChange("tasks")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "tasks"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <ListChecks className="w-5 h-5" />
              Task Management
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("workflow")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "workflow"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Activity className="w-5 h-5" />
              Daily Workflow
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("access")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "access"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Users className="w-5 h-5" />
              Access Management
            </button>
          </li>
          <li>
            <button
              onClick={() => handleTabChange("analytics")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "analytics"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              <Activity className="w-5 h-5" />
              Visitor Analytics
            </button>
            {/* <button
              onClick={() => handleTabChange("prompt")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "prompt"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
                <Settings className="w-4 h-4" />
                Dataset
            </button>
            <button
              onClick={() => handleTabChange("responseStyle")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "responseStyle"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
                <MessageCircle className="w-4 h-4" />
               Response Style
           
            </button>
            <button
              onClick={() => handleTabChange("contributions")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "contributions"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
                <Users className="w-4 h-4" />
               Other's Contributions
            </button> */}
          </li>
        </ul>
      </nav>

      <div className="mt-8 pt-4 border-t border-gray-700">
        <h3 className="text-gray-400 text-sm font-medium mb-3">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            onClick={handleSelfTaskToggle}
            className="w-full px-4 py-2 bg-purple-800 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Self Task
          </button>
          <button
            onClick={() => setShowCalendarScheduler(true)}
            className="w-full px-4 py-2 bg-blue-800 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Calendar className="w-4 h-4" />
            Schedule Meeting
          </button>
          <button
            onClick={handleChatIntegration}
            className="w-full px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <Slack className="w-4 h-4" />
            Chat Integration
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainTabNavigator;
