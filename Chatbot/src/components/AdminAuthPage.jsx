import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, User, Lock, ArrowRight, Bot, Settings, Database, Users } from 'lucide-react';
import Cookies from 'js-cookie';
import { useAppContext } from '../Appcontext';

const AdminAuthPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const { setUserName, refreshUserData } = useAppContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First verify the user exists
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
          // Set username in cookies
          Cookies.set('userName', username.trim());
          
          // Trigger AppContext refetch
          await refreshUserData();
          
          // Navigate to the admin chat
          navigate(`/admin/chat/${username.trim()}`);
        } else {
          setErrorMessage('Invalid password. Please try again.');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      } else {
        setErrorMessage('User not found. Please check your username.');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error authenticating admin:', error);
      setErrorMessage('Error connecting to server. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const BackgroundParticles = () => {
    const particles = Array.from({ length: 25 }, (_, i) => ({
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
            className="absolute bg-purple-300/20 rounded-full"
            style={{
              width: `${particle.size}rem`,
              height: `${particle.size}rem`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
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

  const adminFeatures = [
    {
      icon: <Database className="w-6 h-6" />,
      title: "Data Management",
      description: "Manage user data and prompts"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "User Analytics",
      description: "Track visitor interactions"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "System Settings",
      description: "Configure AI responses"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center overflow-hidden relative">
      <BackgroundParticles />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-blue-900/20 mix-blend-overlay"></div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          {/* Admin Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mx-auto w-24 h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-2xl"
          >
            <Shield className="w-12 h-12 text-white" />
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 mb-4"
          >
            Admin Portal
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-purple-200 mb-12 max-w-3xl mx-auto"
          >
            Access your AI assistant with full administrative controls and management tools
          </motion.p>

          {/* Admin Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto"
          >
            {adminFeatures.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-200">{feature.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="max-w-md mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Admin Login</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-purple-200 text-sm font-medium">Username</label>
                  <div className="flex items-center bg-white/10 border border-white/20 rounded-xl p-4">
                    <User className="text-purple-400 mr-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full bg-transparent text-white placeholder-purple-300 focus:outline-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-purple-200 text-sm font-medium">Password</label>
                  <div className="flex items-center bg-white/10 border border-white/20 rounded-xl p-4">
                    <Lock className="text-purple-400 mr-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-white placeholder-purple-300 focus:outline-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
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
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center space-x-2 font-medium text-lg shadow-lg"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <span>Access Admin Panel</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-center mt-6"
              >
                <p className="text-purple-300">
                  Need help?{" "}
                  <a 
                    href="/" 
                    className="text-purple-400 hover:underline transition-colors"
                  >
                    Back to Home
                  </a>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;
