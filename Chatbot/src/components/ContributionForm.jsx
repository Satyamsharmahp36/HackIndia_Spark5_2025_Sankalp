import React, { useState } from 'react';
import { Plus, X, CheckCircle, AlertTriangle, User, HelpCircle, Loader2, Send, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '../services/apiService';
import { useAppContext } from '../Appcontext';

const ContributionForm = ({ 
  isOpen, 
  onClose, 
  lastQuestion,
  onContriUpdated
}) => {
  const { userData ,presentUserData,refreshUserData} = useAppContext();
  const [name, setName] = useState(() => {
    return presentUserData?.user?.username;
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
      const result = await apiService.submitContribution(name, question, answer, userData?.user?.username);
      await refreshUserData();
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Knowledge Contribution</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800 leading-relaxed">
              Help improve this AI by contributing your knowledge. Your submissions will be reviewed before being added to the assistant's knowledge base.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {submitMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-lg p-3 flex items-center gap-2 ${
                submitStatus === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {submitStatus === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm font-medium">{submitMessage}</span>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Enter your name"
                  disabled={presentUserData?.user?.username}
                />
              </div>
              {presentUserData?.user?.username && (
                <p className="text-xs text-gray-500 mt-1">Name auto-filled from your profile</p>
              )}
            </div>
            
            {/* Question Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <div className="relative">
                <HelpCircle className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
                  placeholder="What question would you like to answer?"
                />
              </div>
            </div>
            
            {/* Contribution Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Contribution</label>
              <div className="relative">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 resize-none h-24"
                  placeholder="Share correct information or additional details that would improve the AI's knowledge..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {answer.length} characters
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Be clear, concise, and accurate</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Submitting...' : 'Submit Contribution'}</span>
          </motion.button>
          
          <p className="text-xs text-gray-500 text-center mt-3 leading-relaxed">
            By submitting, you agree that your contribution may be used to improve the AI assistant's responses.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ContributionForm;