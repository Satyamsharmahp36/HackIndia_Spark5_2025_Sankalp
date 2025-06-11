import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '../Appcontext';

const DailyWorkflow = ({ onRefresh }) => {
  const { userData, refreshUserData } = useAppContext();
  const [dailyTasks, setDailyTasks] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDailyTasks();
  }, [userData]);

  const fetchDailyTasks = async () => {
    if (!userData || !userData.user || !userData.user.username) return;
    
    setLoading(true);
    try {
      console.log("Fetching daily tasks for user:", userData.user.username);
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/daily-tasks/${userData.user.username}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily tasks');
      }
      
      const data = await response.json();
      console.log("Response data:", data);
      setDailyTasks(data.content);
      setLastUpdated(data.lastUpdated);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      toast.error('Failed to fetch daily workflow');
    } finally {
      setLoading(false);
    }
  };
  
  const updateDailyTasks = async () => {
    if (!userData || !userData.user || !userData.user.username) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-daily-tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: dailyTasks,
          username: userData.user.username
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update daily tasks');
      }
      
      const data = await response.json();
      setLastUpdated(data.dailyTasks.lastUpdated);
      await refreshUserData();
      if (onRefresh) onRefresh();
      toast.success('Daily workflow updated successfully');
    } catch (error) {
      console.error('Error updating daily tasks:', error);
      toast.error('Failed to update daily workflow');
    } finally {
      setUpdating(false);
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'Never updated';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg mb-6"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-medium text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-400" />
          Daily Workflow
        </h3>
        
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Last updated: {loading ? 'Loading...' : formatDate(lastUpdated)}</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          <textarea
            value={dailyTasks}
            onChange={(e) => setDailyTasks(e.target.value)}
            className="w-full h-40 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter today's workflow, meetings, or tasks here..."
          />
          
          <div className="flex justify-end mt-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={updateDailyTasks}
              disabled={updating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center gap-2"
            >
              {updating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Daily Workflow
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default DailyWorkflow;