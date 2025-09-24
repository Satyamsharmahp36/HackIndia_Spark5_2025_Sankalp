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
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">All Contributions</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={sortOrder}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>   
      
      <div className="space-y-4 max-h-[calc(60vh-100px)] overflow-y-auto pr-2">
        {contributions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <motion.div 
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [0.98, 1, 0.98]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex justify-center mb-4"
            >
              <User className="w-16 h-16 text-gray-400" />
            </motion.div>
            <p className="text-gray-600 text-lg font-medium">No contributions found</p>
            <p className="text-gray-500 text-sm mt-2">User submissions will appear here</p>
          </div>
        ) : (
          contributions.map((contribution, index) => (
            <div 
              key={contribution._id || index}
              className={`border rounded-lg overflow-hidden bg-white ${
                contribution.status === 'approved' 
                  ? 'border-green-200 bg-green-50' 
                  : contribution.status === 'rejected'
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-yellow-200 bg-yellow-50'
              }`}
            >
              <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="bg-purple-100 rounded-full p-1.5">
                    <User className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="font-medium text-gray-900 text-sm">{contribution.name}</span>
                    <div className="text-xs text-gray-500">
                      {contribution.createdAt 
                        ? new Date(contribution.createdAt).toLocaleDateString() + ' • ' + 
                          new Date(contribution.createdAt).toLocaleTimeString()
                        : 'Date not available'}
                    </div>
                  </div>
                </div>
                <div>
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      contribution.status === 'approved'
                        ? 'bg-green-100 text-green-700' 
                        : contribution.status === 'rejected'
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {contribution.status === 'approved' ? '✓ Approved' : 
                    contribution.status === 'rejected' ? '× Rejected' : 
                    '○ Pending'}
                  </span>
                </div>
              </div>
              
              <div className="p-3 space-y-3">
                <div className="border-l-2 border-purple-400 pl-3 py-1">
                  <div className="text-xs text-purple-600 mb-1 font-medium">Question</div>
                  <div className="text-gray-900 text-sm">{contribution.question}</div>
                </div>
                
                <div className="border-l-2 border-green-400 pl-3 py-1 bg-gray-50 rounded-r">
                  <div className="text-xs text-green-600 mb-1 font-medium">Contribution</div>
                  <div className="text-gray-900 text-sm whitespace-pre-wrap">{contribution.answer}</div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 flex justify-end space-x-2 border-t border-gray-100">
                {contribution.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateContributionStatus(contribution._id, 'approved')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    
                    <button
                      onClick={() => updateContributionStatus(contribution._id, 'rejected')}
                      className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center space-x-1 text-sm"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </>
                )}
                
                {contribution.status !== 'pending' && (
                  <button
                    onClick={() => updateContributionStatus(contribution._id, 'pending')}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1 text-sm"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Reset to Pending</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {contributions.length > 5 && (
        <div className="flex justify-center py-2 bg-gray-50 rounded border border-gray-200">
          <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
          <span className="ml-2 text-gray-600 text-sm">Loading more...</span>
        </div>
      )}
    </div>
  );
};

export default ContributionsTab;