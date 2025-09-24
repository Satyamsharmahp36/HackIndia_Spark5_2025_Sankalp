import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Save, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAppContext } from '../Appcontext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

const DailyWorkflow = ({ onRefresh }) => {
  const { userData, refreshUserData } = useAppContext();
  const [dailyTasks, setDailyTasks] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (userData?.user?.username) {
      fetchDailyTasks();
    }
  }, [userData?.user?.username]); // Only depend on username, not the entire userData object

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
      className="mb-6"
    >
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-medium text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Daily Workflow
            </CardTitle>
            
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              <span>Last updated: {loading ? 'Loading...' : formatDate(lastUpdated)}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
      
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <Textarea
                value={dailyTasks}
                onChange={(e) => setDailyTasks(e.target.value)}
                className="w-full h-40 resize-none"
                placeholder="Enter today's workflow, meetings, or tasks here..."
              />
              
              <div className="flex justify-end mt-4">
                <Button
                  onClick={updateDailyTasks}
                  disabled={updating}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center gap-2"
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
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DailyWorkflow;