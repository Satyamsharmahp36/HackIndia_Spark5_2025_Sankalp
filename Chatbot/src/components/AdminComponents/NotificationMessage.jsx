import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const NotificationMessage = ({ type, title, message }) => {
  const isError = type === 'error';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isError 
          ? 'bg-red-900 bg-opacity-20 border-l-4 border-red-500 text-red-300' 
          : 'bg-green-900 bg-opacity-20 border-l-4 border-green-500 text-green-300'
      } rounded-lg p-4 mb-6 flex items-center`}
    >
      {isError ? (
        <AlertTriangle className="w-6 h-6 mr-3 text-red-400 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-6 h-6 mr-3 text-green-400 flex-shrink-0" />
      )}
      <div>
        <h4 className={`font-medium ${isError ? 'text-red-300' : 'text-green-300'}`}>{title}</h4>
        <p className={`text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>{message}</p>
      </div>
    </motion.div>
  );
};

export default NotificationMessage