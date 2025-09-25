import React from "react";
import { Search, Filter, ChevronDown, List, Grid, Calendar, Clipboard, CheckCircle, Clock as ClockIcon, RefreshCw } from "lucide-react";

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
  onRefresh,
  isRefreshing,
  lastRefreshTime,
}) => (
  <div className="mb-4 flex flex-col gap-3">
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="inprogress">In Progress</option>
            <option value="pending">Pending</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        </div>

        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-background border border-border rounded-lg pl-4 pr-10 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        </div>

        <button
          onClick={handleViewModeToggle}
          className="bg-background hover:bg-accent p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border"
          title={viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
        >
          {viewMode === "grid" ? (
            <List className="w-5 h-5" />
          ) : (
            <Grid className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="bg-background hover:bg-accent p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh Tasks"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>

    {/* Category Filter Pills */}
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCategoryToggle("all")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors border
          ${taskCategories.all ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-accent border-border"}`}
      >
        All Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("meetings")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors border
          ${taskCategories.meetings ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-accent border-border"}`}
      >
        <Calendar className="w-3 h-3" /> Meetings
      </button>
      <button
        onClick={() => handleCategoryToggle("selfTasks")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors border
          ${taskCategories.selfTasks ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-accent border-border"}`}
      >
        <Clipboard className="w-3 h-3" /> Self Tasks
      </button>
      <button
        onClick={() => handleCategoryToggle("completed")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors border
          ${taskCategories.completed ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-accent border-border"}`}
      >
        <CheckCircle className="w-3 h-3" /> Completed
      </button>
      <button
        onClick={() => handleCategoryToggle("pending")}
        className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors border
          ${taskCategories.pending ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground hover:bg-accent border-border"}`}
      >
        <ClockIcon className="w-3 h-3" /> Pending
      </button>
    </div>

    {/* Refresh Status Indicator */}
    {lastRefreshTime && (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
        <span>
          {isRefreshing 
            ? 'Refreshing tasks...' 
            : `Last updated: ${lastRefreshTime.toLocaleTimeString()}`
          }
        </span>
      </div>
    )}
  </div>
);

export default TaskControls; 