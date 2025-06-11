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
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto shadow-lg">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-white font-medium flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-400" />
            Enter Data
          </h3>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            Last updated: Today
          </div>
        </div>
        <div className="p-1">
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-lg h-64 resize-none font-mono text-sm"
            placeholder="Enter your Data here..."
            disabled={isLoading}
          />
        </div>
      </div>
      
      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleUpdate}
          disabled={isLoading}
          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClear}
          disabled={isLoading}
          className="py-4 px-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 shadow-lg hover:shadow-red-500/30 transition-all font-medium flex items-center justify-center"
        >
          <X className="w-5 h-5 mr-2" />
          <span>{isLoading ? 'Clearing...' : 'Clear'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default DataManagementTab;