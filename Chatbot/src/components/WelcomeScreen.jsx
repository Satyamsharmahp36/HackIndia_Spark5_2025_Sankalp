import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Bot, 
  Sparkles, 
  MessageSquare, 
  User 
} from 'lucide-react';

const WelcomeScreen = ({ 
  profileOwnerName, 
  isAuthenticated, 
  visitorName, 
  onStartChat,
  onShowAuth 
}) => {
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

  const features = [
    { 
      icon: <MessageSquare className="w-8 h-8" />, 
      title: "Instant Responses", 
      description: "Get immediate answers to your questions" 
    },
    { 
      icon: <Sparkles className="w-8 h-8" />, 
      title: "AI Powered", 
      description: "Powered by advanced AI technology" 
    },
    { 
      icon: <User className="w-8 h-8" />, 
      title: "Personalized", 
      description: "Tailored responses about your queries" 
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col relative"
    >
      {/* Animated Background */}
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

      {/* Main Content */}
      <div className="container mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Logo Animation */}
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

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-4"
          >
            {profileOwnerName ? `${profileOwnerName}'s AI Assistant` : "AI Assistant"}
          </motion.h1>

          {/* Description */}
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

        {/* Features Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.03 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg"
            >
              <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full w-fit mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full max-w-md"
        >
          {!isAuthenticated ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShowAuth}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-3 text-lg"
            >
              <User className="w-6 h-6" />
              <span>Get Started</span>
            </motion.button>
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
                Hello, <span className="text-blue-400">{visitorName}</span>!
              </h2>
              
              <p className="text-gray-300">
                Ready to start chatting with{profileOwnerName ? ` ${profileOwnerName}'s` : ""} AI Assistant?
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStartChat}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-2"
              >
                <span>Start Chatting</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
