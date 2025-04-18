import React from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertTriangle, Unlock } from 'lucide-react';

const AuthenticationScreen = ({ passwordInput, setPasswordInput, checkPassword, error }) => {
  return (
    <div className="p-8 space-y-6 flex flex-col items-center overflow-y-auto">
      <motion.div 
        animate={{ 
          boxShadow: ["0 0 0 rgba(59, 130, 246, 0)", "0 0 15px rgba(59, 130, 246, 0.5)", "0 0 0 rgba(59, 130, 246, 0)"] 
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="border-2 border-blue-500 p-6 rounded-xl bg-blue-900 bg-opacity-20 max-w-md w-full"
      >
        <motion.div className="flex justify-center mb-6">
          <Lock className="w-16 h-16 text-blue-400" />
        </motion.div>
        <p className="text-blue-300 text-center text-lg mb-2">
          Administrator Access Required
        </p>
        <p className="text-gray-400 text-center text-sm">
          Please enter your admin credentials to continue
        </p>
      </motion.div>
      
      <div className="space-y-4 w-full max-w-md">
        <div className="space-y-2">
          <label className="block text-gray-300 text-sm font-medium">Admin Password</label>
          <div className="relative">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full p-4 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white pl-10"
              placeholder="Enter admin password"
            />
            <Lock className="w-5 h-5 text-gray-500 absolute left-3 top-4" />
          </div>
        </div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-3 text-red-300 flex items-center"
          >
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            {error}
          </motion.div>
        )}
        
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={checkPassword}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/30 font-medium flex items-center justify-center space-x-2"
        >
          <Unlock className="w-5 h-5" />
          <span>Authenticate</span>
        </motion.button>
      </div>
    </div>
  );
};

export default AuthenticationScreen;