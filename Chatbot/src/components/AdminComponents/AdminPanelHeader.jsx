import React from "react";
import { Settings, RefreshCw, X } from "lucide-react";

const AdminPanelHeader = ({
  username,
  renderTaskSchedulingButton,
  handleRefreshUserData,
  refreshing,
  onClose,
}) => (
  <div className="border-b border-gray-700 p-4 flex justify-between items-center">
    <div className="flex items-center gap-3">
      <div className="bg-blue-600 p-2 rounded-lg">
        <Settings className="w-6 h-6 text-white" />
      </div>
      <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
      <span className="bg-green-700 text-green-100 text-xs px-2 py-0.5 rounded-full">
        {username}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {renderTaskSchedulingButton && renderTaskSchedulingButton()}
      <button
        onClick={handleRefreshUserData}
        disabled={refreshing}
        className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        title="Refresh Data"
      >
        <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
      </button>
      <button
        onClick={onClose}
        className="p-2 text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
        title="Close Panel"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  </div>
);

export default AdminPanelHeader; 