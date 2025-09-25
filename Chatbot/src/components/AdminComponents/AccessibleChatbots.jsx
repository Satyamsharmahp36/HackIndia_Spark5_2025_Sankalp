import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageCircle, 
  ExternalLink, 
  Search, 
  X,
  Bot,
  User,
  Globe,
  Lock,
  Loader2
} from 'lucide-react';
import ChatbotChatView from './ChatbotChatView';

const AccessibleChatbots = ({ onClose, currentUserData }) => {
  const [accessibleChatbots, setAccessibleChatbots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [selectedChatbot, setSelectedChatbot] = useState(null);

  useEffect(() => {
    fetchAccessibleChatbots();
  }, [currentUserData]);

  const fetchAccessibleChatbots = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Mock data for accessible chatbots (simulating backend response)
      const mockChatbots = [
        {
          username: 'satyam',
          name: 'Satyam Sharma',
          description: 'Computer Science student with expertise in React, Node.js, and AI development',
          isPublic: true
        },
        {
          username: 'alex',
          name: 'Alex Johnson',
          description: 'Full-stack developer specializing in Python and machine learning',
          isPublic: false
        },
        {
          username: 'maria',
          name: 'Maria Garcia',
          description: 'UI/UX designer with experience in modern web applications',
          isPublic: true
        },
        {
          username: 'david',
          name: 'David Chen',
          description: 'DevOps engineer and cloud architecture specialist',
          isPublic: false
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAccessibleChatbots(mockChatbots);
    } catch (error) {
      console.error('Error fetching accessible chatbots:', error);
      setError('Error loading accessible chatbots');
    } finally {
      setLoading(false);
    }
  };

  const handleChatbotClick = (chatbot) => {
    // Show chat interface for the selected chatbot
    setSelectedChatbot(chatbot);
  };

  const handleBackToList = () => {
    setSelectedChatbot(null);
  };

  const filteredChatbots = accessibleChatbots.filter(chatbot =>
    chatbot.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chatbot.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If a chatbot is selected, show the chat interface
  if (selectedChatbot) {
    return (
      <ChatbotChatView
        chatbot={selectedChatbot}
        onBack={handleBackToList}
        currentUserData={currentUserData}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Accessible Chatbots</h2>
            <p className="text-sm text-gray-500">Chat with other people's AI assistants</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chatbots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading accessible chatbots...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Chatbots</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchAccessibleChatbots}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredChatbots.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No chatbots found' : 'No accessible chatbots'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'You don\'t have access to any other chatbots yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredChatbots.map((chatbot) => (
              <motion.div
                key={chatbot.username}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleChatbotClick(chatbot)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {chatbot.name || chatbot.username}'s AI Assistant
                      </h3>
                      <p className="text-sm text-gray-500">@{chatbot.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {chatbot.isPublic ? (
                        <Globe className="w-4 h-4 text-green-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="text-xs text-gray-500">
                        {chatbot.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                {chatbot.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {chatbot.description}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AccessibleChatbots;
