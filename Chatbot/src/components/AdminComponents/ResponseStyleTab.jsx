import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Settings, Info, Save, X } from 'lucide-react';

const ResponseStyleTab = ({ 
  responseStyleContent, 
  setResponseStyleContent, 
  updateResponseStyle, 
  clearResponseStyle,
  isLoading 
}) => {
  const styleTemplates = [
    { name: "Professional", desc: "Formal, precise responses with authoritative tone" },
    { name: "Friendly", desc: "Casual, warm tone with conversational style" },
    { name: "Concise", desc: "Brief, direct responses without unnecessary details" },
    { name: "Educational", desc: "Explanatory style with examples and definitions" },
    { name: "Creative", desc: "Imaginative responses with metaphors and analogies" },
    { name: "Technical", desc: "Detailed technical explanations with terminology" }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-y-auto shadow-lg">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-white font-medium flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-purple-400" />
            Response Style Configuration
          </h3>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="w-4 h-4 mr-1" />
            Last updated: Today
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 overflow-y-auto shadow-lg max-h-72 flex flex-col">
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
            <h3 className="text-white font-medium flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-400" />
              Quick Templates
            </h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto">
            {styleTemplates.map((template, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setResponseStyleContent(prevContent => 
                  `${template.name.toUpperCase()} STYLE: ${template.desc}. ${prevContent ? '\n\nAdditional instructions: ' + prevContent : ''}`
                )}
                className="bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-lg p-3 cursor-pointer transition-all"
              >
                <div className="font-medium text-white mb-1">{template.name}</div>
                <div className="text-sm text-gray-400">{template.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="p-2 bg-gray-900 bg-opacity-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 mb-3">
            <div className="flex items-start mb-2">
              <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <p>Define how you want the AI model to respond. You can specify behaviors like being funny, concise, or strict about certain topics.</p>
            </div>
          </div>
          <textarea
            value={responseStyleContent}
            onChange={(e) => setResponseStyleContent(e.target.value)}
            className="w-full p-3 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 rounded-lg h-48 resize-none font-mono text-sm border border-gray-700"
            placeholder="Define how you want the AI to respond (e.g., funny, precise, strict, etc.)..."
          />
        </div>
      </div>
      
      <div className="flex space-x-4">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={updateResponseStyle}
          disabled={isLoading}
          className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all font-medium flex items-center justify-center"
        >
          <Save className="w-5 h-5 mr-2" />
          <span>{isLoading ? 'Saving...' : 'Save Response Style'}</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={clearResponseStyle}
          disabled={isLoading}
          className="py-4 px-6 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 shadow-lg hover:shadow-red-500/30 transition-all font-medium flex items-center justify-center"
        >
          <X className="w-5 h-5 mr-2" />
          <span>{isLoading ? 'Clearing...' : 'Clear'}</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ResponseStyleTab;