import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X ,Lock, Unlock} from 'lucide-react';
import apiService from '../services/apiService';
import { useAppContext } from '../Appcontext';

import AuthenticationScreen from './AdminComponents/AuthenticationScreen';
import DataManagementTab from './AdminComponents/DataManagementTab';
import ResponseStyleTab from './AdminComponents/ResponseStyleTab';
import ContributionsTab from './AdminComponents/ContributionsTab';
import TabNavigation from './AdminComponents/TabNavigation';
import NotificationMessage from './AdminComponents/NotificationMessage';
import LoadingOverlay from './AdminComponents/LoadingOverlay';

const AdminModal = ({ isOpen, onClose, onPromptUpdated, password }) => {
  const { userData, refreshUserData } = useAppContext();
  
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
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1f2937; /* gray-800 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: #4b5563; /* gray-600 */
    border-radius: 10px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* gray-500 */
  }
  
  * {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #1f2937; 
  }
`;
  
  const checkPassword = () => {
    if (passwordInput === password) {
      setAuthenticated(true);
      setPromptContent(userData.user.prompt || '');
      setResponseStyleContent(userData.user.userPrompt || '');
      loadContributions();
    } else {
      setError('Invalid password');
      setTimeout(() => setError(''), 3000);
    }
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
      if (typeof onPromptUpdated === 'function') {
        onPromptUpdated();
      }
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
      
      if (typeof onPromptUpdated === 'function') {
        onPromptUpdated();
      }
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
        if (typeof onPromptUpdated === 'function') {
          onPromptUpdated();
        }
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
        
        if (typeof onPromptUpdated === 'function') {
          onPromptUpdated();
        }
      } catch (err) {
        setError(`Failed to clear response style: ${err.message || 'Unknown error'}`);
        setTimeout(() => setError(''), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const updateContributionStatuse = async (id, status) => {
    setIsLoading(true);
    try {
      await apiService.updateContributionStatus(id, status, userData.user.username);
      await refreshUserData();
      loadContributions(statusFilter);
      setSuccessMessage(`Contribution ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
      if (typeof onPromptUpdated === 'function') {
        onPromptUpdated();
      }
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
  
  const handleClose = () => {
    setAuthenticated(false);
    setPasswordInput('');
    setPromptContent('');
    setResponseStyleContent('');
    setError('');
    setSuccessMessage('');
    setActiveTab('prompt');
    onClose();
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
      
      if (typeof onPromptUpdated === 'function') {
        onPromptUpdated();
      }
    } catch (err) {
      setError('Failed to refresh data. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    if (authenticated && userData.user) {
      setPromptContent(userData.user.prompt || '');
      console.log("Setting response style content to:", userData.user.userPrompt);
      setResponseStyleContent(userData.user.userPrompt || '');
      
      if (activeTab === 'contributions') {
        loadContributions(statusFilter);
      }
    }
  }, [userData.user, authenticated]);

  useEffect(() => {
    if (isOpen && authenticated) {
      setPromptContent(userData.user.prompt || '');
      setResponseStyleContent(userData.user.userPrompt || '');
      loadContributions(statusFilter);
    }
  }, [isOpen, authenticated]);

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
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <style>{scrollbarStyles}</style>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-blue-500 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center">
            {authenticated ? (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Unlock className="w-6 h-6 mr-3 text-white" />
              </motion.div>
            ) : (
              <Lock className="w-6 h-6 mr-3 text-white" />
            )}
            Admin Dashboard
          </h2>
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors bg-blue-700 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col">
          {!authenticated ? (
            <AuthenticationScreen 
              passwordInput={passwordInput}
              setPasswordInput={setPasswordInput}
              checkPassword={checkPassword}
              error={error}
            />
          ) : (
            <div className="flex flex-col h-full">
              <TabNavigation 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userData={userData}
              />
              
              <div className="flex-1 overflow-y-auto p-6 relative">
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
                  />
                )}
                
                {activeTab === 'responseStyle' && (
                  <ResponseStyleTab 
                    responseStyleContent={responseStyleContent}
                    setResponseStyleContent={setResponseStyleContent}
                    updateResponseStyle={updateResponseStyle}
                    clearResponseStyle={clearResponseStyle}
                    isLoading={isLoading}
                  />
                )}
                
                {activeTab === 'contributions' && (
                  <ContributionsTab 
                    contributions={userData?.user?.contributions}
                    statusFilter={statusFilter}
                    sortOrder={sortOrder}
                    handleFilterChange={handleFilterChange}
                    handleSortChange={handleSortChange}
                    updateContributionStatus={updateContributionStatuse}
                    refreshAllData={refreshAllData}
                    refreshing={refreshing}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminModal;