import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

const PromotionPopup = ({ 
  isOpen, 
  onClose, 
  onSignup, 
  isPro = false, 
  totalUsers = 1, 
  maxUsers = 100 
}) => {
  const [remaining, setRemaining] = useState(maxUsers - totalUsers);
  const [copied, setCopied] = useState(false);
  const shareLink = "https://chatmatefrontend.vercel.app/";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const popupVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { delay: 0.1 } }
  };

  const titleVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { delay: 0.2 } }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  const proFeatures = [
    "Personal deployed link",
    "Task scheduling", 
    "To-list Integration",
    "Chat history tracking",
    "Multi-language Support",
    "Priority support"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className={`relative w-full max-w-md rounded-xl p-6 ${
              isPro ? 'bg-gradient-to-br from-blue-900/90 to-purple-900/90' : 'bg-gradient-to-br from-gray-800/90 to-gray-900/90'
            } border ${isPro ? 'border-purple-500' : 'border-blue-500'} shadow-xl backdrop-blur-lg`}
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              className="flex items-center mb-4 space-x-2"
              variants={titleVariants}
            >
              <Sparkles className={`w-6 h-6 ${isPro ? 'text-purple-400' : 'text-blue-400'}`} />
              <h2 className="text-2xl font-bold text-white">
                Special Offer!
              </h2>
            </motion.div>
            
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-lg text-gray-200">
                ChatMate is offering <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">FREE Pro subscription</span> for the first {maxUsers} users!
              </p>
              
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-gray-300">
                  <span className="text-xl font-bold text-white">{totalUsers}</span> out of <span className="text-xl font-bold text-white">{maxUsers}</span> spots already claimed!
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full" 
                    style={{ width: `${(totalUsers/maxUsers) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-gray-300">
                Why stay with the free version when you can get Pro for free? Share with your friends and family!
              </p>
              
              <div className="px-2">
                <motion.p 
                  className="text-white font-medium mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Get access to all Pro features:
                </motion.p>
                
                <motion.ul 
                  className="space-y-2"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {proFeatures.map((feature, index) => (
                    <motion.li 
                      key={index}
                      variants={itemVariants}
                      className="flex items-center text-gray-200"
                    >
                      <Check className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
              
              <div className="pt-2">
                <div className="flex items-center mb-4">
                  <p className="text-gray-300 text-sm mr-2">
                    Share link:
                  </p>
                  <div 
                    className="flex items-center bg-gray-800/50 rounded-lg px-3 py-1 flex-grow cursor-pointer hover:bg-gray-700/50 transition-colors"
                    onClick={copyToClipboard}
                  >
                    <span className="text-blue-300 font-medium text-sm truncate mr-2">{shareLink}</span>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="text-gray-400 hover:text-white"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </motion.div>
                  </div>
                </div>
                
                <motion.button
                  onClick={onSignup}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-3 px-6 rounded-lg ${
                    isPro 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
                  } text-white font-bold transition-all duration-300`}
                >
                  Get Pro for FREE
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PromotionPopup;