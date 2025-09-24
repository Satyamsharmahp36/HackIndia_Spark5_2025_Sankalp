import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Clock, Settings, Info, Save, X } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const ResponseStyleTab = ({ 
  responseStyleContent, 
  setResponseStyleContent, 
  updateResponseStyle, 
  clearResponseStyle,
  isLoading 
}) => {
  const { userData, refreshUserData } = useAppContext();

  const styleTemplates = [
    { name: "Professional", desc: "Formal, precise responses with authoritative tone" },
    { name: "Friendly", desc: "Casual, warm tone with conversational style" },
    { name: "Concise", desc: "Brief, direct responses without unnecessary details" },
    { name: "Educational", desc: "Explanatory style with examples and definitions" },
    { name: "Creative", desc: "Imaginative responses with metaphors and analogies" },
    { name: "Technical", desc: "Detailed technical explanations with terminology" }
  ];

  const handleUpdate = async () => {
    await updateResponseStyle();
    await refreshUserData(); // Refresh context after update
  };

  const handleClear = async () => {
    await clearResponseStyle();
    await refreshUserData(); // Refresh context after clearing
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-gray-700 font-medium flex items-center">
            <MessageCircle className="w-4 h-4 mr-2 text-purple-600" />
            Response Style Configuration
          </h3>
          <div className="flex items-center text-xs text-gray-400">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: Today
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Settings className="w-4 h-4 mr-2 text-purple-600" />
              Quick Templates
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {styleTemplates.map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setResponseStyleContent(prevContent => 
                    `${template.name.toUpperCase()} STYLE: ${template.desc}. ${prevContent ? '\n\nAdditional instructions: ' + prevContent : ''}`
                  )}
                  className="text-left p-3 bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded transition-colors"
                >
                  <div className="font-medium text-gray-900 text-sm mb-1">{template.name}</div>
                  <div className="text-xs text-gray-600">{template.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-start text-xs text-gray-600 mb-2">
              <Info className="w-3 h-3 text-purple-600 mr-2 flex-shrink-0 mt-0.5" />
              <p>Define how you want the AI model to respond. You can specify behaviors like being funny, concise, or strict about certain topics.</p>
            </div>
            <textarea
              value={responseStyleContent}
              onChange={(e) => setResponseStyleContent(e.target.value)}
              className="w-full p-3 bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 rounded border-0 h-32 resize-none text-sm"
              placeholder="Define how you want the AI to respond (e.g., funny, precise, strict, etc.)..."
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button
          onClick={handleUpdate}
          disabled={isLoading}
          className="flex-1 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-medium flex items-center justify-center text-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          <span>{isLoading ? 'Saving...' : 'Save Response Style'}</span>
        </button>
        
        <button
          onClick={handleClear}
          disabled={isLoading}
          className="py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors font-medium flex items-center justify-center text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          <span>{isLoading ? 'Clearing...' : 'Clear'}</span>
        </button>
      </div>
    </div>
  );
};

export default ResponseStyleTab;