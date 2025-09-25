import React from 'react';
import { Settings, MessageCircle, User } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const TabNavigation = ({ activeTab, setActiveTab, userData: propUserData }) => {
  const { userData: contextUserData } = useAppContext();
  
  // Use prop userData if provided, otherwise fall back to context
  const userData = propUserData || contextUserData;
  
  console.log('[TabNavigation] propUserData:', propUserData);
  console.log('[TabNavigation] contextUserData:', contextUserData);
  console.log('[TabNavigation] final userData:', userData);
  console.log('[TabNavigation] userData?.user?.name:', userData?.user?.name);

  return (
    <div className="flex border-b border-gray-200 bg-gray-50 px-4">
      <button
        onClick={() => setActiveTab('prompt')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'prompt'
            ? 'border-b-2 border-purple-600 text-purple-700 bg-purple-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>{userData?.user?.name || 'User'}'s data</span>
        </div>
      </button>
      <button
        onClick={() => setActiveTab('responseStyle')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'responseStyle'
            ? 'border-b-2 border-purple-600 text-purple-700 bg-purple-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-4 h-4" />
          <span>Response Style</span>
        </div>
      </button>
      <button
        onClick={() => setActiveTab('contributions')}
        className={`px-6 py-4 text-sm font-medium transition-all ${
          activeTab === 'contributions'
            ? 'border-b-2 border-purple-600 text-purple-700 bg-purple-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
        } rounded-t-lg`}
      >
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span>User Contributions</span>
        </div>
      </button>
    </div>
  );
};

export default TabNavigation;