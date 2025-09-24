import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock, Save, X } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const DataManagementTab = ({ promptContent, setPromptContent, updatePrompt, clearPrompt, isLoading }) => {
  const { userData, refreshUserData } = useAppContext();

  const handleUpdate = async () => {
    await updatePrompt();
    await refreshUserData(); // Refresh context after update
  };

  const handleClear = async () => {
    await clearPrompt();
    await refreshUserData(); // Refresh context after clearing
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg ">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center ">
          <h3 className="text-gray-700 font-medium flex items-center">
            <Bot className="w-4 h-4 mr-2 text-purple-600" />
            Enter Data
          </h3>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: Today
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            className="w-full p-3 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded border-0 h-96  resize-none text-sm"
            placeholder="Enter your Data here..."
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleUpdate}
          disabled={isLoading}
          className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium flex items-center justify-center text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
        
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium flex items-center justify-center text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          <span>{isLoading ? 'Clearing...' : 'Clear'}</span>
        </button>
      </div>
    </div>
  );
};

export default DataManagementTab;