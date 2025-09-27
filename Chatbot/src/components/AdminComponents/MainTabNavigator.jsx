import React from "react";
import {
  Clock as ClockIcon,
  Mail,
  Users,
  Settings
} from "lucide-react";

const MainTabNavigator = ({ activeView, handleTabChange, userData, handleSelfTaskToggle, setShowCalendarScheduler, handleChatIntegration, handleEmailDashboard }) => {
  return (
    <div className="md:w-64 bg-white p-4 flex-shrink-0 border-r border-gray-200 shadow-sm">
      <nav>
        <ul className="space-y-2">
          {/* Navigation Items */}
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
          
          <li>
            <button
              onClick={() => handleTabChange("emails")}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                activeView === "emails"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Mail className="w-5 h-5" />
              Emails
            </button>
          </li>

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
              <Settings className="w-5 h-5" />
              Analytics
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MainTabNavigator;
