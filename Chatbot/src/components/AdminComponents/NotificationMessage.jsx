import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle } from 'lucide-react';

const NotificationMessage = ({ type, title, message }) => {
  const isSuccess = type === 'success';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
        isSuccess 
          ? 'bg-green-100 bg-opacity-20 border border-green-500'
          : 'bg-red-900 bg-opacity-20 border border-red-500'
      }`}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
      )}
      <div>
        <h3 className={`font-medium ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-300 mt-1">
          {message}
        </p>
      </div>
    </motion.div>
  );
};

export default NotificationMessage;