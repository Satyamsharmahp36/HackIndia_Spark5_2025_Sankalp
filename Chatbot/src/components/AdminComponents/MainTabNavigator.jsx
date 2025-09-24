import React from "react";
import {
  Clock as ClockIcon
} from "lucide-react";

const MainTabNavigator = ({ activeView, handleTabChange, userData, handleSelfTaskToggle, setShowCalendarScheduler, handleChatIntegration, handleEmailDashboard }) => {
  return (
    <div className="md:w-64 bg-white p-4 flex-shrink-0 border-r border-gray-200 shadow-sm">
      <nav>
        <ul className="space-y-2">
          {/* Access Management and Visitor Analytics moved to main sidebar */}
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
