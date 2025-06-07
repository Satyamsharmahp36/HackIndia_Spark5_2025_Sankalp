import React from 'react';
import { motion } from 'framer-motion';
import { User, RefreshCw, Filter, ChevronDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAppContext } from '../../Appcontext';

const ContributionsTab = ({
  contributions,
  statusFilter,
  sortOrder,
  handleFilterChange,
  handleSortChange,
  updateContributionStatus,
  refreshAllData,
  refreshing
}) => {
  const { userData } = useAppContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-800 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-white flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-400" />
          User Contributions
        </h3>
        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 0.95 }}
            whileTap={{ scale: 0.85 }}
            onClick={refreshAllData}
            disabled={refreshing}
            className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-700 text-lg border-gray-700 text-white px-2 py-1 rounded-full transition-colors shadow-lg hover:shadow-blue-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </motion.button>
          
          <div className="relative group">
            <div className="flex items-center space-x-3 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
              <Filter className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border-none p-1 text-center text-white bg-gray-800 rounded focus:outline-none text-sm font-medium cursor-pointer appearance-none w-full"
              >
                <option value="">All Contributions</option>
                <option value="pending">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          
          <div className="relative group">
            <div className="flex items-center space-x-3 bg-gray-900 rounded-full px-4 py-2 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
              <Clock className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <select
                value={sortOrder}
                onChange={(e) => handleSortChange(e.target.value)}
                className="border-none p-1 text-center text-white bg-gray-800 rounded focus:outline-none text-sm font-medium cursor-pointer appearance-none w-full"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>   
      
      <div className="space-y-4 max-h-[calc(60vh-100px)] overflow-y-auto pr-2">
        {contributions.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 bg-opacity-50 rounded-lg border border-gray-700">
            <motion.div 
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              <User className="w-16 h-16 text-gray-600" />
            </motion.div>
            <p className="text-gray-400 text-lg font-medium">No contributions found</p>
            <p className="text-gray-500 text-sm mt-2">User submissions will appear here</p>
          </div>
        ) : (
          contributions.map((contribution, index) => (
            <motion.div 
              key={contribution._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-xl overflow-hidden shadow-lg ${
                contribution.status === 'approved' 
                  ? 'border-green-600 bg-gradient-to-r from-gray-900 to-green-900 bg-opacity-10' 
                  : contribution.status === 'rejected'
                    ? 'border-red-600 bg-gradient-to-r from-gray-900 to-red-900 bg-opacity-10'
                    : 'border-yellow-600 bg-gradient-to-r from-gray-900 to-yellow-900 bg-opacity-10'
              } ${index === contributions.length - 1 ? 'mb-4' : ''}`}
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-900 bg-opacity-30 rounded-full p-2">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="font-medium text-white">{contribution.name}</span>
                    <div className="text-xs text-gray-400 mt-1">
                      {contribution.createdAt 
                        ? new Date(contribution.createdAt).toLocaleDateString() + ' • ' + 
                          new Date(contribution.createdAt).toLocaleTimeString()
                        : 'Date not available'}
                    </div>
                  </div>
                </div>
                <div>
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      contribution.status === 'approved'
                        ? 'bg-green-900 bg-opacity-30 text-green-300 border border-green-600' 
                        : contribution.status === 'rejected'
                          ? 'bg-red-900 bg-opacity-30 text-red-300 border border-red-600'
                          : 'bg-yellow-900 bg-opacity-30 text-yellow-300 border border-yellow-600'
                    }`}
                  >
                    {contribution.status === 'approved' ? '✓ Approved' : 
                    contribution.status === 'rejected' ? '× Rejected' : 
                    '○ Pending'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="border-l-4 border-blue-500 pl-4 py-1">
                  <div className="text-xs text-blue-400 mb-1 font-semibold uppercase tracking-wider">Question</div>
                  <div className="text-white">{contribution.question}</div>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4 py-1 bg-gray-800 bg-opacity-40 rounded-r-lg">
                  <div className="text-xs text-green-400 mb-1 font-semibold uppercase tracking-wider">Contribution</div>
                  <div className="text-white whitespace-pre-wrap">{contribution.answer}</div>
                </div>
              </div>
              
              <div className="bg-opacity-100 p-3 flex justify-end space-x-3 border-t border-gray-700">
                {contribution.status === 'pending' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateContributionStatus(contribution._id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-green-500/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateContributionStatus(contribution._id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-red-500/20"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </motion.button>
                  </>
                )}
                
                {contribution.status !== 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => updateContributionStatus(contribution._id, 'pending')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 shadow-lg"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Reset to Pending</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
      
      {contributions.length > 5 && (
        <div className="flex justify-center py-3 mt-2 bg-gray-800 bg-opacity-30 rounded-lg">
          <motion.div
            animate={{ 
              rotate: 360,
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <RefreshCw className="w-6 h-6 text-blue-400" />
          </motion.div>
          <span className="ml-2 text-gray-400">Loading more...</span>
        </div>
      )}
    </div>
  );
};

export default ContributionsTab;