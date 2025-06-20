import React from "react";
import { Search, Filter, ChevronDown, List, Grid, Calendar, Clipboard, CheckCircle, Clock as ClockIcon } from "lucide-react";

const TaskControls = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sortOrder,
  setSortOrder,
  viewMode,
  handleViewModeToggle,
  taskCategories,
  handleCategoryToggle,
}) => (
  <div className="mb-4 flex flex-col gap-3">
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="inprogress">In Progress</option>
            <option value="pending">Pending</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-4 pr-10 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        <button
          onClick={handleViewModeToggle}
          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-gray-300 hover:text-white transition-colors"
          title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
        >
          {viewMode === "grid" ? (
            <List className="w-5 h-5" />
          ) : (
            <Grid className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>

    {/* Category Filter Pills */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCategoryToggle("all")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
          ${taskCategories.all ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
      >
        All Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("meetings")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
          ${taskCategories.meetings ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
      >
        <Calendar className="w-3 h-3" /> Meetings
      </button>
      <button
        onClick={() => handleCategoryToggle("selfTasks")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
          ${taskCategories.selfTasks ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
      >
        <Clipboard className="w-3 h-3" /> Self Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("completed")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
          ${taskCategories.completed ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
      >
        <CheckCircle className="w-3 h-3" /> Completed
      </button>
      <button
        onClick={() => handleCategoryToggle("pending")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors
          ${taskCategories.pending ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
      >
        <ClockIcon className="w-3 h-3" /> Pending
      </button>
    </div>
  </div>
);

export default TaskControls; 