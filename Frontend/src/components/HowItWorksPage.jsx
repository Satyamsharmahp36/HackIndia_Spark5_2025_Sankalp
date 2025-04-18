import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Settings, 
  UserPlus, 
  Key, 
  BookOpen, 
  HelpCircle, 
  Shield, 
  Scroll
} from 'lucide-react';

function ChatMateDocumentation() {
  const [activeSection, setActiveSection] = useState(null);

  const handleClick = () => {
    window.open('http://localhost:5173/', '_blank');
  };

  const documentationSections = [
    {
      icon: <UserPlus className="w-8 h-8 text-blue-500" />,
      title: "Registration Process",
      steps: [
        "Click 'Get Started' on the homepage",
        "Enter unique User ID (username)",
        "Create a strong password",
        "Password is crucial for editing dataset",
        "Unique User ID allows others to ask questions about you"
      ]
    },
    {
      icon: <Key className="w-8 h-8 text-purple-500" />,
      title: "Gemini Key Setup",
      steps: [
        "Find the Gemini Key input box",
        "Click info button for import instructions",
        "Adding Gemini Key provides privacy protection",
        "Ensures secure access to your AI assistant"
      ]
    },
    {
      icon: <Settings className="w-8 h-8 text-green-500" />,
      title: "User Profile Configuration",
      steps: [
        "After login, enter your full name",
        "Click settings button",
        "Enter password to access settings",
        "Navigate to 'User Data' section",
        "Add details for AI to use",
        "Save your preferences"
      ]
    },
    {
      icon: <BookOpen className="w-8 h-8 text-yellow-500" />,
      title: "Contribution Management",
      steps: [
        "Access contribution section",
        "View unanswered questions",
        "Contribute answers with options:",
        "- Approved: Verified contributions",
        "- Pending: Awaiting review",
        "- Rejected: Inappropriate content"
      ]
    },
    {
      icon: <Shield className="w-8 h-8 text-red-500" />,
      title: "Privacy and Data Management",
      steps: [
        "Clear chat history",
        "Control saved information",
        "Manage Gemini Key settings",
        "Review user contributions",
        "Maintain control over AI interactions"
      ]
    }
  ];

  const renderSectionSteps = (section) => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ 
        opacity: activeSection === section.title ? 1 : 0, 
        height: activeSection === section.title ? 'auto' : 0 
      }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      {activeSection === section.title && (
        <ul className="pl-4 space-y-1 text-gray-300 text-sm">
          {section.steps.map((step, index) => (
            <li key={index} className="flex items-center space-x-2">
              <Scroll className="w-4 h-4 text-blue-400" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );

  return (
    <div className="bg-gray-900 text-white max-h-[40vw] rounded-2xl flex flex-col overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 pt-4"
      >
        <h1 className="text-3xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          ChatMate Documentation
        </h1>
        <p className="text-sm text-gray-400 text-center mb-4">
          Comprehensive Guide to Using Your AI Assistant
        </p>
      </motion.div>

      <div className="flex-grow overflow-y-auto px-4 scrollbar-hide">
        <div className="space-y-3 pb-4">
          {documentationSections.map((section, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-gray-800 rounded-xl overflow-hidden"
            >
              <div 
                onClick={() => setActiveSection(activeSection === section.title ? null : section.title)}
                className="flex items-center p-4 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <div className="mr-3">{section.icon}</div>
                <h2 className="text-base font-semibold flex-grow">{section.title}</h2>
                <HelpCircle 
                  className={`w-5 h-5 ${
                    activeSection === section.title 
                    ? 'text-blue-500' 
                    : 'text-gray-500'
                  }`} 
                />
              </div>
              {renderSectionSteps(section)}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="p-4 text-center bg-gray-800"
      >
        <h2 className="text-xl font-bold mb-2">Ready to Explore ChatMate?</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-white font-semibold text-base hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
        >
          Start Your Journey
        </motion.button>
      </motion.div>
    </div>
  );
}

export default ChatMateDocumentation;