import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Unlock, Brain, Clipboard, MessageSquare, Users, RefreshCw } from 'lucide-react';
import apiService from '../../services/apiService';
import { useAppContext } from '../../Appcontext';

import AuthenticationScreen from './AuthenticationScreen';
import DataManagementTab from './DataManagementTab';
import ResponseStyleTab from './ResponseStyleTab';
import ContributionsTab from './ContributionsTab';
import TabNavigation from './TabNavigation';
import NotificationMessage from './NotificationMessage';
import LoadingOverlay from './LoadingOverlay';

const Memory = ({ onClose, userData: propUserData }) => {
  const { userData: contextUserData, refreshUserData } = useAppContext();
  
  // Use prop userData if provided, otherwise fall back to context
  const userData = propUserData || contextUserData;
  
  const [passwordInput, setPasswordInput] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [promptContent, setPromptContent] = useState('');
  const [responseStyleContent, setResponseStyleContent] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('prompt'); 
  const [contributions, setContributions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const scrollbarStyles = `
    .scrollbar-thin::-webkit-scrollbar {
      width: 6px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;
  
  const checkPassword = () => {
    // For now, we'll skip authentication in the sidebar version
    // You can add password protection later if needed
    setAuthenticated(true);
    setPromptContent(userData.user.prompt || '');
    setResponseStyleContent(userData.user.userPrompt || '');
    loadContributions();
  };
  
  const loadContributions = (status = '') => {
    setIsLoading(true);
    try {
      const filteredContributions = status 
        ? userData.user.contributions.filter(contribution => contribution.status === status)
        : userData.user.contributions || [];
      
      setContributions(filteredContributions);
    } catch (err) {
      setError('Failed to load contributions');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updatePrompt = async () => {
    setIsLoading(true);
    try {
      await apiService.updatePrompt(promptContent, userData.user.username);
      await refreshUserData();
      setSuccessMessage('Prompt updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update prompt');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const updateResponseStyle = async () => {
    setIsLoading(true);
    try {
      await apiService.updateUserPrompt(responseStyleContent, userData.user.username);
      await refreshUserData();
      setSuccessMessage('Response style updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(`Failed to update response style: ${err.message || 'Unknown error'}`);
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearPrompt = async () => {
    if (window.confirm('Are you sure you want to clear the prompt?')) {
      setIsLoading(true);
      try {
        await apiService.clearPrompt(userData.user.username);
        await refreshUserData();
        setPromptContent('');
        setSuccessMessage('Prompt cleared successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Failed to clear prompt');
        setTimeout(() => setError(''), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearResponseStyle = async () => {
    if (window.confirm('Are you sure you want to clear the response style?')) {
      setIsLoading(true);
      try {
        await apiService.clearUserPrompt(userData.user.username);
        await refreshUserData();
        setResponseStyleContent('');
        setSuccessMessage('Response style cleared successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError(`Failed to clear response style: ${err.message || 'Unknown error'}`);
        setTimeout(() => setError(''), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const updateContributionStatus = async (id, status) => {
    setIsLoading(true);
    try {
      await apiService.updateContributionStatus(id, status, userData.user.username);
      await refreshUserData();
      loadContributions(statusFilter);
      setSuccessMessage(`Contribution ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update contribution');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    loadContributions(status);
  };
  
  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      
      if (userData.user) {
        if (userData.user.prompt) setPromptContent(userData.user.prompt);
        if (userData.user.userPrompt) setResponseStyleContent(userData.user.userPrompt);
        if (userData.user.contributions) {
          const filtered = statusFilter 
            ? userData.user.contributions.filter(c => c.status === statusFilter)
            : userData.user.contributions;
          setContributions(filtered);
        }
      }
      
      setSuccessMessage('Data refreshed successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (userData.user) {
      setPromptContent(userData.user.prompt || '');
      setResponseStyleContent(userData.user.userPrompt || '');
      
      if (activeTab === 'contributions') {
        loadContributions(statusFilter);
      }
    }
  }, [userData?.user]);

  useEffect(() => {
    if (authenticated && userData?.user) {
      setPromptContent(userData.user.prompt || '');
      setResponseStyleContent(userData.user.userPrompt || '');
      loadContributions(statusFilter);
    }
  }, [authenticated, userData?.user]);

  const handleSortChange = (order) => {
    setSortOrder(order);
    
    const sortedContributions = [...contributions];
    
    sortedContributions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      
      if (order === 'newest') {
        return dateB - dateA; 
      } else {
        return dateA - dateB; 
      }
    });
    
    setContributions(sortedContributions);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full"
    >
      <style>{scrollbarStyles}</style>

      <div className="w-full h-full flex flex-col">
        {!authenticated ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Memory</h3>
              <p className="text-gray-600 mb-4">Manage your AI's memory and data</p>
              <button
                onClick={checkPassword}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Access Memory
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <TabNavigation 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userData={userData}
            />
            
            <div className="flex-1 overflow-y-auto p-6 relative scrollbar-thin">
              {(isLoading || refreshing) && <LoadingOverlay />}
              
              {error && (
                <NotificationMessage
                  type="error"
                  title="Error"
                  message={error}
                />
              )}
              
              {successMessage && (
                <NotificationMessage
                  type="success"
                  title="Success"
                  message={successMessage}
                />
              )}
              
              {activeTab === 'prompt' && (
                <DataManagementTab 
                  promptContent={promptContent}
                  setPromptContent={setPromptContent}
                  updatePrompt={updatePrompt}
                  clearPrompt={clearPrompt}
                  isLoading={isLoading}
                  userData={userData}
                />
              )}
              
              {activeTab === 'responseStyle' && (
                <ResponseStyleTab 
                  responseStyleContent={responseStyleContent}
                  setResponseStyleContent={setResponseStyleContent}
                  updateResponseStyle={updateResponseStyle}
                  clearResponseStyle={clearResponseStyle}
                  isLoading={isLoading}
                  userData={userData}
                />
              )}
              
              {activeTab === 'contributions' && (
                <ContributionsTab 
                  contributions={userData?.user?.contributions}
                  statusFilter={statusFilter}
                  sortOrder={sortOrder}
                  handleFilterChange={handleFilterChange}
                  handleSortChange={handleSortChange}
                  updateContributionStatus={updateContributionStatus}
                  refreshAllData={refreshAllData}
                  refreshing={refreshing}
                  userData={userData}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Memory;
