import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';
import AdminAuthPage from './components/AdminAuthPage';
import AdminChatRoute from './components/AdminChatRoute';
import { useAppContext } from './Appcontext';

const UserChatRoute = ({ onUserVerified }) => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { setUserName, refreshUserData, isInitialized } = useAppContext();
  
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${username}`);
        const data = await response.json();
        
        if (response.ok) {
          // Check if current user is the owner of this profile
          const currentUserName = Cookies.get('userName');
          if (currentUserName === username) {
            setIsOwner(true);
            setUserName(username); // This will trigger context update
          }
          
          onUserVerified(data);
          setUserExists(true);
        }
      } catch (error) {
        console.error('Error verifying user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (isInitialized) {
      verifyUser();
    }
  }, [username, setUserName, isInitialized]);
  
  if (!isInitialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  if (!userExists) {
    return <Navigate to="/" />;
  }
  
  return <HomePage isOwner={isOwner} />;
};

const AppContent = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { 
    userData, 
    userName,
    setUserName,
    refreshUserData,
    isInitialized 
  } = useAppContext();
  
  useEffect(() => {
    const initializeApp = async () => {
      if (!isInitialized) return;
      
      const cookieUserName = Cookies.get('userName');
      if (cookieUserName && !userName) {
        setUserName(cookieUserName);
      }
    };

    initializeApp();
  }, [isInitialized, userName, setUserName]);
  
  const handleGetStarted = async (name) => {
    setIsTransitioning(true);
    setUserName(name);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 1000);
  };
  
  const handleUserVerified = async (verifiedUserData) => {
    await refreshUserData();
  };
  
  const handleLogout = async () => {
    Cookies.remove('userName');
    setUserName(null);
  };

  const TransitionAnimation = () => (
    <motion.div
      key="transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 0], rotate: [0, 180] }}
        transition={{ duration: 1 }}
        className="bg-blue-500 rounded-full p-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 7V12L15 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </motion.div>
    </motion.div>
  );

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-800">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <AnimatePresence mode="wait">
        {isTransitioning ? (
          <TransitionAnimation />
        ) : (
          <Routes>            
            <Route 
              path="/" 
              element={
                <motion.div
                  key="landing-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LandingPage />
                </motion.div>
              } 
            />
            
            <Route 
              path="home/:username" 
              element={<UserChatRoute onUserVerified={handleUserVerified} />} 
            />
            
            <Route 
              path="admin" 
              element={
                <motion.div
                  key="admin-auth"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AdminAuthPage />
                </motion.div>
              } 
            />
            
            <Route 
              path="admin/chat/:username" 
              element={<AdminChatRoute />} 
            />
          </Routes>
        )}
      </AnimatePresence>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;