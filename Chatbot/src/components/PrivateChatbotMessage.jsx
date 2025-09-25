import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivateChatbotMessage = ({ username }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          This Chatbot Isn't Public
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          The AI assistant for <span className="font-semibold text-gray-900">@{username}</span> is not publicly accessible. 
          Only authorized users can chat with this assistant.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> If you have access to this chatbot through the admin panel, 
            you can find it in the "Accessible Chatbots" section.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivateChatbotMessage;

