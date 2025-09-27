import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Lock, Bot, ArrowRight, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';

const ChatMateLoginModal = ({ isOpen, onClose, onLogin, chatbotOwner }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Verify the user credentials
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username.trim()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        // Verify the password matches
        if (data.user?.password === password.trim()) {
          // Set user session
          Cookies.set('presentUserName', username.trim(), { expires: 7 });
          Cookies.set('userName', username.trim(), { expires: 7 });
          
          // Call the login callback with user data
          onLogin(data);
          onClose();
        } else {
          setError('Invalid password. Please try again.');
          setTimeout(() => setError(''), 3000);
        }
      } else {
        setError('User not found. Please check your username.');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error authenticating user:', error);
      setError('Error connecting to server. Please try again.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">ChatMate Login</h2>
              <p className="text-sm text-gray-500">Access {chatbotOwner}'s AI Assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0">ℹ️</div>
            <p className="text-sm text-blue-800 leading-relaxed">
              Please login with your ChatMate credentials to access this AI assistant. 
              This helps the AI provide personalized responses based on your profile.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ChatMate Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter your ChatMate username"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-4 h-4" />
                </motion.div>
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Authenticating...' : 'Access AI Assistant'}</span>
            </motion.button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Don't have a ChatMate account?{' '}
              <a 
                href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                Register here
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatMateLoginModal;

