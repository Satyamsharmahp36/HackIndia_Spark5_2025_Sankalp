import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import AdminChatLayout from './AdminChatLayout';
import { useAppContext } from '../Appcontext';
import Cookies from 'js-cookie';

const AdminChatRoute = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminUserData, setAdminUserData] = useState(null);
  const { userData, refreshUserData, isInitialized, setUserName, setPresentUserName } = useAppContext();

  const handleLogout = () => {
    // Clear all cookies
    Cookies.remove('userName');
    Cookies.remove('presentUserName');
    
    // Clear context state
    setUserName('');
    setPresentUserName('');
    
    // Clear local storage
    localStorage.clear();
    
    // Navigate to home page
    navigate('/');
  };

  useEffect(() => {
    const verifyAdminAccess = async () => {
      try {
        console.log('Verifying admin access for:', username);
        console.log('Current userData:', userData);
        console.log('isInitialized:', isInitialized);
        
        // Always try to fetch user data directly for admin verification
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${username}`);
        const data = await response.json();
        
        console.log('API response:', data);
        
        if (response.ok) {
          setUserExists(true);
          setAdminUserData(data); // Store the user data
          // Check if this is an admin user (has password field)
          if (data.user?.password) {
            setIsAuthorized(true);
            console.log('Admin access granted');
          } else {
            setIsAuthorized(false);
            console.log('No admin privileges - no password field');
          }
        } else {
          setUserExists(false);
          console.log('User not found');
        }
      } catch (error) {
        console.error('Error verifying admin access:', error);
        setUserExists(false);
      } finally {
        setLoading(false);
      }
    };
    
    // Don't wait for isInitialized, verify immediately
    verifyAdminAccess();
  }, [username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
        <p className="ml-4 text-purple-200">Verifying admin access...</p>
      </div>
    );
  }

  if (!userExists) {
    return <Navigate to="/admin" />;
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4">Access Denied</h1>
          <p className="text-red-200 mb-6">You don't have admin privileges for this account.</p>
          <a 
            href="/admin" 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return <AdminChatLayout adminUserData={adminUserData} onLogout={handleLogout} />;
};

export default AdminChatRoute;
