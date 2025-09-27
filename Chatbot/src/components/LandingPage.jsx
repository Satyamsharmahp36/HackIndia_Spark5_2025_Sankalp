import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Bot, ArrowRight, Sparkles, Zap, UserCheck, Shield } from 'lucide-react';

const LandingPage = () => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

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
        // Navigate directly to the public chat
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

  const BackgroundImage = () => {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/screen.jpg)',
            filter: 'brightness(0.3) contrast(1.2)'
          }}
        />
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundImage />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          {/* Minimalist Landing Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            {/* Simple Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4"
              >
                <Bot className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Assistant</h1>
              <p className="text-gray-400 text-sm">Enter a ChatMate username to get started</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter ChatMate username"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-300"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg flex items-center gap-2"
                >
                  <span>⚠️</span> {errorMessage}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-8 pt-6 border-t border-white/10 space-y-4"
            >
              <p className="text-gray-400 text-sm">
                Don't have an account?{" "}
                <a 
                  href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  Register here
                </a>
              </p>
              
              <div className="pt-4 border-t border-white/10">
                <a 
                  href="/admin" 
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Admin Access
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
