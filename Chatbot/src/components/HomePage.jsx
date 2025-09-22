import React, { useState, useEffect, useMemo } from 'react';
import VisitorAnalytics from './AdminComponents/VisitorAnalytics';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import { 
  ArrowRight, 
  Bot, 
  Sparkles, 
  MessageSquare, 
  User, 
  ChevronRight, 
  LogOut,
  Home,
  AlertCircle,
  ArrowLeft,
  Lock,
  ShieldAlert,
  Activity,
  Settings,
  Users
} from 'lucide-react';
import ChatBot from './ChatBot';
import AdminPanel from './AdminPanel';

const HomePage = ({ onLogout }) => {
  const { username } = useParams(); 
  const navigate = useNavigate();
  const { 
    userData, 
    userName, 
    setUserName,
    presentUserData, 
    presentUserName,
    setPresentUserName,
    refreshUserData,
    refreshPresentUserData,
    isInitialized
  } = useAppContext();
  
  const [showVisitorAnalytics, setShowVisitorAnalytics] = useState(false);
  const [profileOwnerData, setProfileOwnerData] = useState(null);
  const [profileOwnerName, setProfileOwnerName] = useState('');
  const [isProfileOwnerLoaded, setIsProfileOwnerLoaded] = useState(false);
  const [isPresentUserAuthenticated, setIsPresentUserAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showChatBot, setShowChatBot] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tempUserData, setTempUserData] = useState(null);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

  const backgroundBubbles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      width: Math.random() * 300 + 50,
      height: Math.random() * 300 + 50,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      yMovement: Math.random() * 30 - 15,
      xMovement: Math.random() * 30 - 15,
      duration: Math.random() * 10 + 10,
    }));
  }, []);

  const fetchProfileOwner = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setProfileOwnerData(data);
        setProfileOwnerName(data.user?.name || username);
        setIsProfileOwnerLoaded(true);
        setIsUserDataLoaded(true);
        await refreshUserData(); // Refresh context after setting local state
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching profile owner data:', error);
      return false;
    }
  };

  const fetchPresentUser = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      if (response.ok) {
        setTempUserData(data);
        await refreshPresentUserData(); // Refresh present user data in context
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching present user data:', error);
      return false;
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

      const data = await response.json();
      return response.ok;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
    // Check if user is already authenticated via context
      if (presentUserName && presentUserData) {
      setIsPresentUserAuthenticated(true);
    }

    if (username) {
        const success = await fetchProfileOwner(username);
        if (success) {
          await refreshUserData(); // Ensure context is updated after successful fetch
          setIsUserDataLoaded(true);
        }
    } else if (userData) {
      setProfileOwnerData(userData);
      setProfileOwnerName(userData.user?.name || '');
      setIsProfileOwnerLoaded(true);
        setIsUserDataLoaded(true);
        await refreshUserData(); // Refresh context to ensure it's up to date
    }
    };

    initializeData();
  }, [username, userData?.user?.username, presentUserName]);

  const handlePresentUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!presentUserName.trim()) {
      setErrorMessage('Please enter your ChatMate username');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userExists = await fetchPresentUser(presentUserName.trim());
      
      if (userExists) {
        // Check if the user has access permission
        if (checkAccessPermission(presentUserName.trim())) {
          setShowPasswordModal(true);
        } else {
          // User exists but doesn't have access permission
          setShowAccessDeniedModal(true);
        }
      } else {
        setShowUserNotFoundModal(true);
      }
    } catch (error) {
      console.error('Error validating present username:', error);
      setErrorMessage('Error validating username. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setPasswordError('Please enter your password');
      setTimeout(() => setPasswordError(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const isPasswordValid = await verifyPassword(presentUserName.trim(), password.trim());
      
      if (isPasswordValid) {
        // Set cookie and trigger context update
        Cookies.set('presentUserName', presentUserName.trim());
        await refreshPresentUserData(); // Wait for context to update
        
        setIsPresentUserAuthenticated(true);
        setShowPasswordModal(false);
      } else {
        setPasswordError('Incorrect password. Please try again.');
        setTimeout(() => setPasswordError(''), 3000);
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      setPasswordError('Error verifying password. Please try again.');
      setTimeout(() => setPasswordError(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkAccessPermission = (username) => {
    if (!profileOwnerData || !profileOwnerData.user) {
      return false;
    }
    
    if (username === profileOwnerData.user.username) {
      return true;
    }
    if (profileOwnerData.user.accessRestricted == false) {
      return true;
    }
    console.log(profileOwnerData.user);
    const accessList = profileOwnerData.user.accessList || [];
    console.log(accessList);
    return accessList.includes(username);
  };

  const trackVisitor = async () => {
    try {
      if (!profileOwnerData?.user?.username) return;
      
      const visitorName = presentUserData?.user?.name || presentUserName || 'Guest';
      const visitorUsername = presentUserData?.user?.username || presentUserName || `guest-${Math.random().toString(36).substring(2, 10)}`;
      const isVerified = !!(presentUserData && !presentUserData.user?.isGuest);
      
      await fetch(
        `${import.meta.env.VITE_BACKEND}/track-visitor`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileOwnerUsername: profileOwnerData.user.username,
            visitorUsername,
            visitorName,
            isVerified
          })
        }
      );
    } catch (error) {
      console.error('Error tracking visitor:', error);
    }
  };

  const handleGetStarted = () => {
    setShowChatBot(true);
    trackVisitor();
  };

  const refetchUserData = async () => {
    try {
      await refreshUserData(); // Wait for the refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure state updates
      return userData; // Return the updated userData
    } catch (error) {
      console.error('Error refetching user data:', error);
      throw error;
    }
  };

  const continueWithoutAccount = () => {
    console.log(checkAccessPermission(presentUserName.trim()));
    if (!checkAccessPermission(presentUserName.trim())) {
      // User exists but doesn't have access permission
      setShowAccessDeniedModal(true);
      return;
    }  
    setShowUserNotFoundModal(false);
    setShowPasswordModal(false);
    
    // Create guest user cookie (this won't trigger context since it's not a real user)
    // We'll handle guest users locally in this component
    setIsPresentUserAuthenticated(true);
  };

  const skipPassword = () => {
    setShowPasswordModal(false);
    
    setPresentUserName('');
    setErrorMessage('Please enter a two-word name to continue as guest');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const tryDifferentUsername = () => {
    setShowUserNotFoundModal(false);
    setShowPasswordModal(false);
    setShowAccessDeniedModal(false);
  };

  const handleLogout = async () => {
    // Remove cookies and refresh context
    Cookies.remove('presentUserName');
    await refreshPresentUserData(); // Wait for context to update
    
    if (onLogout) {
      onLogout();
    }
    
    setIsPresentUserAuthenticated(false);
    setShowChatBot(false);
    setPresentUserName('');
  };

  const navigateToHome = () => {
    navigate('/');
  };

  const renderHomeButton = () => (
    <button
      type="button"
      onClick={() => setShowAdminPanel(true)}
      className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
    >
      <Home className="w-5 h-5" />
    </button>
  );

  const renderPasswordModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex items-center justify-center mb-4 text-blue-500">
          <Lock className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Enter Your Password</h3>
        <p className="text-gray-300 text-center mb-6">
          Please enter your password for ChatMate username "{presentUserName}".
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
          
          {passwordError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm flex items-center"
            >
              <span className="mr-2">⚠️</span> {passwordError}
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
            onClick={skipPassword}
            className="text-gray-400 hover:text-gray-300 transition"
          >
            Continue as guest
          </button>
          <button 
            onClick={tryDifferentUsername}
            className="text-blue-400 hover:text-blue-300 transition"
          >
            Try different username
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderUserNotFoundModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex items-center justify-center mb-4 text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Username Not Found</h3>
        <p className="text-gray-300 text-center mb-6">
          The username "{presentUserName}" is not registered on ChatMate. Please register at{" "}
          <a 
            href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            chat-matee.vercel.app
          </a>{" "}
          to use features like Task scheduling, or continue without an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={tryDifferentUsername}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Try Different Username
          </button>
          <button
            onClick={continueWithoutAccount}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Continue Without Account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderAccessDeniedModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex items-center justify-center mb-4 text-yellow-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Access Denied</h3>
        <p className="text-gray-300 text-center mb-6">
          You don't have permission to access {profileOwnerName}'s AI Assistant. Please request access from {profileOwnerName} to continue.
        </p>
        <div className="flex justify-center">
          <button
            onClick={tryDifferentUsername}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Try Different Username
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const chatBotView = (
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-slate-500 to-slate-800 relative">
      <div className="absolute top-4 left-4 z-50">
        {/* <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToHome}
          className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button> */}
      </div>
      
      <ChatBot />

      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}
    </div>
  );
  
  const homeView = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full">
          {backgroundBubbles.map((bubble) => (
            <motion.div
              key={bubble.id}
              className="absolute rounded-full bg-blue-500 opacity-10"
              style={{
                width: bubble.width,
                height: bubble.height,
                left: bubble.left,
                top: bubble.top,
              }}
              animate={{
                y: [0, bubble.yMovement],
                x: [0, bubble.xMovement],
              }}
              transition={{
                duration: bubble.duration,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>
      
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToHome}
          className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>
      
      <div className="flex gap-3 absolute top-4 right-4 z-50">
        {renderHomeButton()}
      </div>

      <div className="container mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute opacity-20 w-32 h-32 rounded-full border-4 border-blue-500"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative z-10 bg-gradient-to-r from-blue-600 to-blue-400 p-5 rounded-full shadow-xl"
            >
              <Bot className="w-10 h-10 text-white" />
            </motion.div>
          </div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-4"
          >
            {profileOwnerName ? `${profileOwnerName}'s AI Assistant` : "AI Assistant"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
          >
            {profileOwnerName 
              ? `Get answers to all your questions about ${profileOwnerName}'s projects, experience, and skills`
              : "Get answers to all your questions about projects, experience, and skills"}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
        >
          {[
            { icon: <MessageSquare className="w-8 h-8" />, title: "Instant Responses", desc: "Get immediate answers to your questions" },
            { icon: <Sparkles className="w-8 h-8" />, title: "AI Powered", desc: "Powered by advanced AI technology" },
            { icon: <User className="w-8 h-8" />, title: "Personalized", desc: "Tailored responses about your queries" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, scale: 1.03 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg"
            >
              <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full max-w-md bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
        >
          {!isPresentUserAuthenticated ? (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Enter your ChatMate username</h2>
              <form onSubmit={handlePresentUserSubmit} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={presentUserName}
                    onChange={(e) => setPresentUserName(e.target.value)}
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
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center"
              >
                <Bot className="w-8 h-8 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold">
                Hello, <span className="text-blue-400">{presentUserData?.user?.name || presentUserName}</span>!
              </h2>
              <p className="text-gray-300">
                Ready to start chatting with{profileOwnerName ? ` ${profileOwnerName}'s` : ""} AI Assistant?
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
        
{showAdminPanel && (
          <AdminPanel 
            onClose={() => setShowAdminPanel(false)} 
          />
        )}

        {showUserNotFoundModal && renderUserNotFoundModal()}
        {showPasswordModal && renderPasswordModal()}
        {showAccessDeniedModal && renderAccessDeniedModal()}
      </div>
    </motion.div>
  );

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <p className="ml-4 text-xl">Loading...</p>
      </div>
    );
  }

  return showChatBot ? chatBotView : homeView;
};

HomePage.propTypes = {
  onLogout: PropTypes.func
};

export default HomePage;