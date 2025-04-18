import React, { useState } from 'react';
import { Plus, X, CheckCircle, AlertTriangle, User, HelpCircle, Loader2, Send, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';

const ContributionForm = ({ 
  isOpen, 
  onClose, 
  lastQuestion,
  onContriUpdated
}) => {
  const [name, setName] = useState(() => {
    return sessionStorage.getItem('presentUserName') || '';
  });
  const [question, setQuestion] = useState(lastQuestion || '');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitStatus, setSubmitStatus] = useState(''); 
  
  const handleSubmit = async (e) => {
    onContriUpdated();
    e.preventDefault();
    if (!name.trim() || !question.trim() || !answer.trim()) {
      setSubmitMessage('Please fill all fields');
      setSubmitStatus('error');
      setTimeout(() => setSubmitMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await apiService.submitContribution(name, question, answer, sessionStorage.getItem('userName'));
      setSubmitMessage(result.message);
      setSubmitStatus('success');
      setTimeout(() => {
        if (submitStatus === 'success') {
          onClose();
        }
      }, 2000);
    } catch (error) {
      setSubmitMessage('Failed to submit contribution');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="min-h-screen py-8 flex items-center justify-center w-full">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-2xl border border-blue-500 w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Plus className="w-5 h-5 mr-2 text-white" />
              Knowledge Contribution
            </h2>
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors bg-blue-700 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="bg-blue-900 bg-opacity-30 border-b border-blue-500 px-6 py-3 flex items-start">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-blue-200 text-sm">
              Help improve this AI by contributing your knowledge. Your submissions will be reviewed before being added to the assistant's knowledge base.
            </p>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(100vh-250px)]" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4B5563 #111827' }}>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {submitMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${
                    submitStatus === 'success' 
                      ? 'bg-green-900 bg-opacity-20 border border-green-500 text-green-300' 
                      : 'bg-red-900 bg-opacity-20 border border-red-500 text-red-300'
                  } rounded-lg p-3 flex items-center shadow-lg`}
                >
                  {submitStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  )}
                  {submitMessage}
                </motion.div>
              )}
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Your Name</label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white shadow-inner"
                    placeholder="Enter your name"
                    disabled={sessionStorage.getItem('presentUserName')}
                  />
                </div>
                {sessionStorage.getItem('presentUserName') && (
                  <p className="text-xs text-gray-400 mt-1 ml-2">Name auto-filled from your homepage entry</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Question</label>
                <div className="relative">
                  <HelpCircle className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full pl-10 pr-4 text-lg py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white shadow-inner"
                    placeholder="What question would you like to answer ?"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-1">Your Contribution</label>
                <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden shadow-inner">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full text-lg p-4 bg-transparent focus:outline-none text-white h-32 resize-none"
                    placeholder="Share correct information or additional details that would improve the AI's knowledge..."
                  />
                  <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 flex justify-between text-xs text-gray-400">
                    <span>Be clear, concise, and accurate</span>
                    <span>{answer.length} characters</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
  
          <div className="p-6 pt-2 bg-gray-900 border-t border-gray-800">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
              <span>Submit Contribution</span>
            </motion.button>
            
            <div className="pt-2 flex justify-center">
              <p className="text-xs text-gray-500 text-center max-w-sm">
                By submitting, you agree that your contribution may be used to improve the AI assistant's responses.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContributionForm;