import React from "react";
import { Settings, RefreshCw, X } from "lucide-react";

const AdminPanelHeader = ({
  username,
  renderTaskSchedulingButton,
  handleRefreshUserData,
  refreshing,
  isRefreshing,
  lastRefreshTime,
  onClose,
}) => (
  <div className="border-b border-gray-200 p-4 flex justify-between items-center bg-gray-50">
    <div className="flex items-center gap-3">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Settings className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Admin Dashboard</h2>
      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full border border-green-200">
        {username}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {renderTaskSchedulingButton && renderTaskSchedulingButton()}
      
      {/* Auto-refresh indicator */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span>
          {lastRefreshTime 
            ? `Last updated: ${lastRefreshTime.toLocaleTimeString()}`
            : 'Auto-refresh enabled'
          }
        </span>
      </div>
      
      <button
        onClick={handleRefreshUserData}
        disabled={refreshing || isRefreshing}
        className="p-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
        title="Manual Refresh"
      >
        <RefreshCw className={`w-5 h-5 ${(refreshing || isRefreshing) ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={onClose}
        className="p-2 text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
        title="Close Panel"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

export default AdminPanelHeader; 