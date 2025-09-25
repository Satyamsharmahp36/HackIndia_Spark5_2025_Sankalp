import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';
import WelcomeScreen from './WelcomeScreen';
import AdminChatLayout from './AdminChatLayout';
import PublicChatLayout from './PublicChatLayout';
import PrivateChatbotMessage from './PrivateChatbotMessage';

const HomePage = ({ onLogout, isOwner = false }) => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { 
    userData, 
    refreshUserData,
    refreshPresentUserData,
    isInitialized
  } = useAppContext();

  // Simplified state management
  const [profileOwnerData, setProfileOwnerData] = useState(null);
  const [profileOwnerName, setProfileOwnerName] = useState('');
  const [isProfileOwnerLoaded, setIsProfileOwnerLoaded] = useState(false);
  
  // Authentication state
  const [isVisitorAuthenticated, setIsVisitorAuthenticated] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [isOwnerAuthenticated, setIsOwnerAuthenticated] = useState(false);
  
  // UI state
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [isChatbotPublic, setIsChatbotPublic] = useState(true);
  const [checkingPublicStatus, setCheckingPublicStatus] = useState(true);

  // Fetch profile owner data
  const fetchProfileOwner = async (username) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfileOwnerData(data);
        setProfileOwnerName(data.user?.name || username);
        setIsProfileOwnerLoaded(true);
        await refreshUserData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching profile owner data:', error);
      return false;
    }
  };

  // Check if chatbot is public
  const checkChatbotPublicStatus = async (username) => {
    try {
      setCheckingPublicStatus(true);
      // For now, assume all chatbots are public since the endpoint doesn't exist
      // In the future, this could check a user's public/private setting
      setIsChatbotPublic(true);
    } catch (error) {
      console.error('Error checking chatbot public status:', error);
      setIsChatbotPublic(true);
    } finally {
      setCheckingPublicStatus(false);
    }
  };

  // Initialize profile owner data with debouncing
  useEffect(() => {
    let timeoutId;
    
    const initializeProfileOwner = async () => {
      if (username) {
        // Check if chatbot is public first
        await checkChatbotPublicStatus(username);
        await fetchProfileOwner(username);
      } else if (userData) {
        setProfileOwnerData(userData);
        setProfileOwnerName(userData.user?.name || '');
        setIsProfileOwnerLoaded(true);
      }
    };

    if (isInitialized) {
      // Debounce the initialization to prevent rapid calls
      timeoutId = setTimeout(() => {
        initializeProfileOwner();
      }, 100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [username, userData?.user?.username, isInitialized]); // Only depend on specific fields

  // Check if user is already authenticated
  useEffect(() => {
    const presentUserName = Cookies.get('presentUserName');
    const userName = Cookies.get('userName');
    
    if (presentUserName) {
      setIsVisitorAuthenticated(true);
      setVisitorName(presentUserName);
    }
    
    // Check if the current user is the profile owner
    if (isOwner || (userName && username && userName === username)) {
      setIsOwnerAuthenticated(true);
      setShowWelcomeScreen(false);
      setShowChatInterface(true);
    }
  }, [username, isOwner]);

  // Initialize visitor as authenticated automatically and start chat
  useEffect(() => {
    if (profileOwnerData?.user && !isVisitorAuthenticated && !isOwnerAuthenticated) {
      setVisitorName('Guest');
      setIsVisitorAuthenticated(true);
      // Automatically start the chat
      setShowChatInterface(true);
      setShowWelcomeScreen(false);
      trackVisitor();
    }
  }, [profileOwnerData, isVisitorAuthenticated, isOwnerAuthenticated]);

  // Track visitor analytics
  const trackVisitor = async () => {
    try {
      if (!profileOwnerData?.user?.username) return;
      
      const visitorNameToTrack = visitorName || 'Guest';
      const visitorUsername = visitorName || `guest-${Math.random().toString(36).substring(2, 10)}`;
      const isVerified = isVisitorAuthenticated;
      
      // Uncomment when backend is ready
      // await fetch(`${import.meta.env.VITE_BACKEND}/track-visitor`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     profileOwnerUsername: profileOwnerData.user.username,
      //     visitorUsername,
      //     visitorName: visitorNameToTrack,
      //     isVerified
      //   })
      // });
    } catch (error) {
      console.error('Error tracking visitor:', error);
    }
  };

  // Event handlers
  const handleUserAuthenticated = (username) => {
    setVisitorName(username);
    setIsVisitorAuthenticated(true);
    refreshPresentUserData();
  };

  const handleGuestAccess = () => {
    setVisitorName('Guest');
    setIsVisitorAuthenticated(true);
  };

  const handleStartChat = () => {
    setShowChatInterface(true);
    setShowWelcomeScreen(false);
    trackVisitor();
  };

  const handleBackToWelcome = () => {
    setShowChatInterface(false);
    setShowWelcomeScreen(true);
    navigate('/');
  };

  const handleLogout = async () => {
    // Clear all cookies
    Cookies.remove('presentUserName');
    Cookies.remove('userName');
    
    // Clear context state
    await refreshPresentUserData();
    
    // Clear local state
    setIsVisitorAuthenticated(false);
    setIsOwnerAuthenticated(false);
    setVisitorName('');
    setShowChatInterface(false);
    setShowWelcomeScreen(true);
    
    // Clear local storage
    localStorage.clear();
    
    // Navigate to home page
    navigate('/');
    
    if (onLogout) {
      onLogout();
    }
  };

  const navigateToHome = () => {
    navigate('/');
  };

  // Loading state
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

  // Check if chatbot is not public and show private message
  if (!checkingPublicStatus && !isChatbotPublic && username) {
    return <PrivateChatbotMessage username={username} />;
  }

  // Main render logic
  if (showChatInterface) {
    // Determine which layout to show based on authentication
    if (isOwnerAuthenticated) {
      // Owner gets admin layout with sidebar
      return <AdminChatLayout onLogout={handleLogout} />;
    } else {
      // Visitors get public layout
      return (
        <PublicChatLayout
          profileOwnerData={profileOwnerData}
          visitorName={visitorName}
          onBackToWelcome={handleBackToWelcome}
        />
      );
    }
  }

  return (
    <>
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToHome}
          className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        >
          <span className="text-sm font-medium px-2">← Home</span>
        </motion.button>
      </div>

      {/* Main Content */}
      <WelcomeScreen
        profileOwnerName={profileOwnerName}
        isAuthenticated={isVisitorAuthenticated}
        visitorName={visitorName}
        onStartChat={handleStartChat}
      />
    </>
  );
};

export default HomePage;