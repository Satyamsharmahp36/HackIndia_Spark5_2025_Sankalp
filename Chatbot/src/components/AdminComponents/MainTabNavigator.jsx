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
  Slack,
  Mail
} from "lucide-react";

const MainTabNavigator = ({ activeView, handleTabChange, userData, handleSelfTaskToggle, setShowCalendarScheduler, handleChatIntegration, handleEmailDashboard }) => {
  return (
    <div className="md:w-64 bg-white p-4 flex-shrink-0 border-r border-gray-200 shadow-sm">
      <nav>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleTabChange("access")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "access"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
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
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
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

      <div className="mt-8 pt-4 border-t border-gray-200">
        <li>
          <button
            onClick={() => handleTabChange("reminders")}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
              activeView === "reminders"
                ? "bg-blue-100 text-blue-700 border border-blue-200"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <ClockIcon className="w-5 h-5" />
            Reminders
          </button>
        </li>
      </div>
    </div>
  );
};

export default MainTabNavigator;
