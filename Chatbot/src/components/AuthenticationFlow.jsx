import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, AlertCircle, ShieldAlert, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';

const AuthenticationFlow = ({ 
  profileOwnerData, 
  onUserAuthenticated, 
  onGuestAccess,
  onClose 
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState('username'); // 'username', 'password', 'error'
  const [errorType, setErrorType] = useState(''); // 'userNotFound', 'accessDenied'

  const fetchUser = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.ok ? await response.json() : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const verifyPassword = async (username, password) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-password`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        }
      );
      return response.ok;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const checkAccessPermission = (username) => {
    if (!profileOwnerData?.user) return false;
    
    // Owner always has access
    if (username === profileOwnerData.user.username) return true;
    
    // Check if access is restricted
    if (profileOwnerData.user.accessRestricted === false) return true;
    
    // Check access list
    const accessList = profileOwnerData.user.accessList || [];
    return accessList.includes(username);
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setErrorMessage('Please enter your ChatMate username');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userData = await fetchUser(username.trim());
      
      if (userData) {
        // Check access permission
        if (checkAccessPermission(username.trim())) {
          setCurrentStep('password');
        } else {
          setErrorType('accessDenied');
          setCurrentStep('error');
        }
      } else {
        setErrorType('userNotFound');
        setCurrentStep('error');
      }
    } catch (error) {
      console.error('Error validating username:', error);
      setErrorMessage('Error validating username. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const isPasswordValid = await verifyPassword(username.trim(), password.trim());
      
      if (isPasswordValid) {
        // Set cookie and trigger authentication
        Cookies.set('presentUserName', username.trim());
        onUserAuthenticated(username.trim());
      } else {
        setErrorMessage('Incorrect password. Please try again.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setErrorMessage('Error verifying password. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAccess = () => {
    onGuestAccess();
  };

  const handleTryAgain = () => {
    setCurrentStep('username');
    setUsername('');
    setPassword('');
    setErrorMessage('');
    setErrorType('');
  };

  const renderUsernameStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Enter your ChatMate username</h2>
      <form onSubmit={handleUsernameSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Your ChatMate username"
            disabled={isSubmitting}
          />
        </div>
        
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm flex items-center"
          >
            <span className="mr-2">⚠️</span> {errorMessage}
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>Continue</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>
      
      <div className="mt-4 text-center">
        <button 
          onClick={handleGuestAccess}
          className="text-gray-400 hover:text-gray-300 transition text-sm"
        >
          Continue as guest
        </button>
      </div>
    </motion.div>
  );

  const renderPasswordStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center justify-center mb-4 text-blue-500">
        <Lock className="w-12 h-12" />
      </div>
      <h3 className="text-xl font-bold text-center mb-3">Enter Your Password</h3>
      <p className="text-gray-300 text-center mb-6">
        Please enter your password for ChatMate username "{username}".
      </p>
      
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Your password"
            disabled={isSubmitting}
          />
        </div>
        
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm flex items-center"
          >
            <span className="mr-2">⚠️</span> {errorMessage}
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : (
            <>
              <span>Login</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>
      
      <div className="flex justify-between mt-4 text-sm">
        <button 
          onClick={handleGuestAccess}
          className="text-gray-400 hover:text-gray-300 transition"
        >
          Continue as guest
        </button>
        <button 
          onClick={handleTryAgain}
          className="text-blue-400 hover:text-blue-300 transition"
        >
          Try different username
        </button>
      </div>
    </motion.div>
  );

  const renderErrorStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-md bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
    >
      <div className="flex items-center justify-center mb-4 text-red-500">
        {errorType === 'userNotFound' ? (
          <AlertCircle className="w-12 h-12" />
        ) : (
          <ShieldAlert className="w-12 h-12" />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-center mb-3">
        {errorType === 'userNotFound' ? 'Username Not Found' : 'Access Denied'}
      </h3>
      
      <p className="text-gray-300 text-center mb-6">
        {errorType === 'userNotFound' ? (
          <>
            The username "{username}" is not registered on ChatMate. Please register at{" "}
            <a 
              href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              chat-matee.vercel.app
            </a>{" "}
            to use features like Task scheduling, or continue without an account.
          </>
        ) : (
          `You don't have permission to access ${profileOwnerData?.user?.name || 'this'} AI Assistant. Please request access to continue.`
        )}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleTryAgain}
          className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Try Different Username
        </button>
        <button
          onClick={handleGuestAccess}
          className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Continue Without Account
        </button>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      {currentStep === 'username' && renderUsernameStep()}
      {currentStep === 'password' && renderPasswordStep()}
      {currentStep === 'error' && renderErrorStep()}
    </motion.div>
  );
};

export default AuthenticationFlow;
