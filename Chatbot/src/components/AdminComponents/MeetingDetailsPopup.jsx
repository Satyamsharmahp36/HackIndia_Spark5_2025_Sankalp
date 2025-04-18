import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, BookOpen, FileAudio, Calendar, Clock } from 'lucide-react';

const MeetingDetailsPopup = ({ meeting, onClose }) => {
  const [activeTab, setActiveTab] = useState('minutes');

  const tabs = [
    { id: 'minutes', label: 'Meeting Minutes', icon: <FileText className="w-4 h-4" />, content: meeting.meetingMinutes },
    { id: 'summary', label: 'Meeting Summary', icon: <BookOpen className="w-4 h-4" />, content: meeting.meetingSummary },
    { id: 'transcript', label: 'Raw Transcript', icon: <FileAudio className="w-4 h-4" />, content: meeting.meetingRawData }
  ];

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  const popupVariants = {
    hidden: { scale: 0.9, opacity: 0, y: 20 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 30
      } 
    }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        variants={popupVariants}
        className="bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{meeting.title}</h2>
            <div className="flex items-center mt-2 text-gray-400 text-sm gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{meeting.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{meeting.time} • {meeting.duration}</span>
              </div>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900/50 border-b border-gray-800">
          <div className="flex px-4">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-4 flex items-center gap-2 text-sm font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
                whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    layoutId="activeTab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-950/50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabContentVariants}
            >
              {tabs.find(tab => tab.id === activeTab)?.content ? (
                <div className="prose prose-invert max-w-none">
                  {activeTab === 'minutes' || activeTab === 'summary' ? (
                    <div className="markdown-content rounded-lg bg-gray-900/30 p-6 border border-gray-800 shadow-inner text-white" 
                         dangerouslySetInnerHTML={{ __html: formatContent(tabs.find(tab => tab.id === activeTab)?.content, activeTab) }} />
                  ) : (
                    <pre className="whitespace-pre-wrap text-white text-sm font-mono bg-gray-900/30 p-6 rounded-lg border border-gray-800 shadow-inner">
                      {tabs.find(tab => tab.id === activeTab)?.content}
                    </pre>
                  )}
                </div>
              ) : (
                <div className="text-center py-16 text-white bg-gray-900/30 rounded-lg border border-gray-800">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-lg font-medium mb-2">No Content Available</p>
                    <p className="text-sm text-gray-300">No {activeTab} content available for this meeting.</p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const formatContent = (content, contentType) => {
  if (!content) return '';
  
  if (contentType === 'summary' && content.includes('**Adjusted Transcript:**')) {
    const formattedSummary = content
      .replace(/\*\*(.*?):\*\*/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1:</h3>')
      .replace(/\*\*List of Changes:\*\*/g, '<h3 class="text-lg font-bold text-white mt-4 mb-2">List of Changes:</h3>')
      .replace(/\*   (.*)/g, '<li class="ml-4 mb-1 text-white">$1</li>')
      .replace(/(<li class="ml-4 mb-1 text-white">.*?<\/li>)+/gs, match => `<ul class="list-disc space-y-1 my-4">${match}</ul>`)
      .replace(/(^|<\/h3>|<\/ul>)([^<]*?)($|<h3|<ul)/gm, (match, p1, p2, p3) => {
        if (p2.trim()) {
          return `${p1}<p class="mb-4 text-white">${p2.trim()}</p>${p3}`;
        }
        return match;
      });
    
    return formattedSummary;
  }
  
  let formatted = content
    // Headers
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white">$1</h1>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-white">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-white">$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4 class="text-base font-bold mt-3 mb-2 text-white">$1</h4>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="text-white">$1</em>')
    // Lists
    .replace(/^\* (.*$)/gm, '<li class="ml-4 mb-1 text-white">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-1 text-white">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4 mb-1 text-white"><span class="font-medium text-white">$1.</span> $2</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mb-4 text-white">')
    // Code blocks
    .replace(/```(.*?)\n([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-4 rounded-md my-4 overflow-x-auto text-sm font-mono">$2</pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-gray-800 text-white px-1 py-0.5 rounded text-sm font-mono">$1</code>');
  
  formatted = formatted
    .replace(/(<li class="ml-4 mb-1 text-white">\d+\. .*?<\/li>)+/gs, match => `<ol class="list-decimal space-y-1 my-4">${match}</ol>`)
    .replace(/(<li class="ml-4 mb-1 text-white">.*?<\/li>)+/gs, match => `<ul class="list-disc space-y-1 my-4">${match}</ul>`);
  
  formatted = `<p class="mb-4 text-white">${formatted}</p>`;
  
  formatted = formatted.replace(/<\/p><p class="mb-4 text-white"><\/p><p class="mb-4 text-white">/g, '</p><p class="mb-4 text-white">');
  
  return formatted;
};

export default MeetingDetailsPopup;