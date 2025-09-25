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

  const BackgroundParticles = () => {
    const particles = Array.from({ length: 30 }, (_, i) => ({
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
            className="absolute bg-blue-300/20 rounded-full"
            style={{
              width: `${particle.size}rem`,
              height: `${particle.size}rem`,
              left: `${particle.x}%`,
              top: `${particle.y}%`
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.4, 0.2],
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center overflow-hidden relative">
      <BackgroundParticles />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-purple-900/20 mix-blend-overlay"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          {/* AI Assistant Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-8 shadow-2xl"
          >
            <Bot className="w-12 h-12 text-white" />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4"
          >
            AI Assistant
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-blue-200 mb-12 max-w-3xl mx-auto"
          >
            Get answers to all your questions about projects, experience, and skills
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto"
          >
            {/* Instant Responses */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Responses</h3>
              <p className="text-blue-200">Get immediate answers to your questions</p>
            </div>

            {/* AI Powered */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Powered</h3>
              <p className="text-blue-200">Powered by advanced AI technology</p>
            </div>

            {/* Personalized */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Personalized</h3>
              <p className="text-blue-200">Tailored responses about your queries</p>
            </div>
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-md mx-auto"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-4">
                <UserCheck className="text-blue-400 mr-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter ChatMate username"
                  className="w-full bg-transparent text-white placeholder-blue-300 focus:outline-none"
                  disabled={isSubmitting}
                  required
                />
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center justify-center"
                >
                  <span className="mr-2">⚠️</span> {errorMessage}
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center space-x-2 font-medium text-lg shadow-lg"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span>Get Started</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-center mt-6 space-y-4"
              >
                <p className="text-blue-300">
                  Don't have an account?{" "}
                  <a 
                    href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline transition-colors"
                  >
                    Register here
                  </a>
                </p>
                
                <div className="border-t border-blue-400/20 pt-4">
                  <p className="text-blue-300 mb-2">Admin Access</p>
                  <a 
                    href="/admin" 
                    className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    Access Admin Portal
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
