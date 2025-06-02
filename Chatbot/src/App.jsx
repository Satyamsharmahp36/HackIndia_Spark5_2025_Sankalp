import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import HomePage from './components/HomePage';
import UserVerificationPage from './components/UserVerificationPage';
import { useAppContext } from './Appcontext'; // Adjust path as needed

const UserChatRoute = ({ onUserVerified }) => {
  const { username } = useParams();
  const [loading, setLoading] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const { setMain, main } = useAppContext();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${username}`);
        const data = await response.json();
        
        if (response.ok) {
          // Set username in cookies instead of sessionStorage
          Cookies.set('userName', username);
          onUserVerified(data);
          setUserExists(true);
          // Trigger AppContext refetch
          setMain(!main);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [username, setMain, main]);
  
  if (loading) {
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
  
  if (!userExists) {
    return <Navigate to="/" />;
  }
  
  return <HomePage />;
};

// Create the main App component that contains routing logic
const AppContent = () => {
  const [showChat, setShowChat] = useState(false);
  const [userName, setUserName] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { userData, setMain, main } = useAppContext();
  
  useEffect(() => {
    // Check if user is already logged in via cookies
    const cookieUserName = Cookies.get('userName');
    
    if (cookieUserName && userData) {
      setUserName(cookieUserName);
      setShowChat(true);
    }
  }, [userData]);
  
  const handleGetStarted = (name) => {
    setUserName(name);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setShowChat(true);
      setIsTransitioning(false);
    }, 1000);
  };
  
  const handleUserVerified = (verifiedUserData) => {
    setShowChat(true);
  };
  
  const handleLogout = () => {
    // Clear cookies instead of storage
    Cookies.remove('userName');
    
    setShowChat(false);
    setUserName('');
    // Trigger AppContext refetch to clear data
    setMain(!main);
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
                  key="home-verification"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <UserVerificationPage 
                    onUserVerified={handleUserVerified}
                    onGetStarted={handleGetStarted}
                  />
                </motion.div>
              } 
            />
            
            <Route 
              path="home/:username" 
              element={<UserChatRoute onUserVerified={handleUserVerified} />} 
            />
          </Routes>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main App component that wraps everything with a single BrowserRouter
const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;