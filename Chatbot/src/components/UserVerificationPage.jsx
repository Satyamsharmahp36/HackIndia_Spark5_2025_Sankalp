import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { UserCheck, Sparkles, Info, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext'

const UserVerificationPage = ({ onUserVerified }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { refreshUserData } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setErrorMessage('Please enter a ChatMate username');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${username.trim()}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        // Set username in cookies
        Cookies.set('userName', username.trim());
        
        // Trigger AppContext refetch using the new helper function
        refreshUserData();
        
        // Call the verification callback
        onUserVerified(data);
        
        // Navigate to the user's home page
        navigate(`home/${username.trim()}`);
      } else {
        setErrorMessage('User not found. Please try a different username.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error validating username:', error);
      setErrorMessage('Error connecting to server. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackgroundParticles = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 2
    }));

    return (
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute bg-purple-300/30 rounded-full"
            style={{
              width: `${particle.size}rem`,
              height: `${particle.size}rem`,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              translateX: ['-50%', '50%', '-50%'],
              translateY: ['-50%', '50%', '-50%']
            }}
            transition={{
              duration: 5 + particle.delay,
              repeat: Infinity,
              repeatType: "loop",
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120312] via-[#200a22] to-[#331d3d] flex items-center justify-center overflow-hidden relative">
      <BackgroundParticles />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-blue-900/20 mix-blend-overlay"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#1a0a1f]/60 backdrop-blur-xl border border-purple-900/40 p-8 rounded-3xl shadow-2xl shadow-purple-900/50">
          <div className="text-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2 flex items-center justify-center gap-3"
            >
              <Sparkles className="text-pink-400 animate-pulse" />
              ChatMate
              <Sparkles className="text-pink-400 animate-pulse" />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-purple-300"
            >
              Your Personal Chat Assistant
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center bg-purple-900/30 border border-purple-700/40 rounded-lg p-3 mb-2">
                <UserCheck className="text-pink-400 mr-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter ChatMate username"
                  className="w-full bg-transparent text-purple-100 placeholder-purple-300 focus:outline-none"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex items-center text-xs text-purple-300 mb-4">
                <Info className="w-4 h-4 mr-2 text-pink-400" />
                <span>Enter the ChatMate username of the assistant you want to talk to</span>
              </div>
            </motion.div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-pink-400 text-sm flex items-center justify-center"
              >
                <span className="mr-2">⚠️</span> {errorMessage}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-700 to-pink-700 text-white p-3 rounded-lg hover:from-purple-800 hover:to-pink-800 transition-all flex items-center justify-center space-x-2"
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
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-purple-300">
              Don't have an account?{" "}
              <a 
                href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-400 hover:underline transition-colors"
              >
                Register here
              </a>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

UserVerificationPage.propTypes = {
  onUserVerified: PropTypes.func.isRequired
};

export default UserVerificationPage;