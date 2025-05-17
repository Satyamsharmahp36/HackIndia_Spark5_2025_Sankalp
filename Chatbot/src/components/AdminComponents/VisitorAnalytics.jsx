import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  User, 
  Calendar, 
  BarChart2, 
  Clock, 
  Eye, 
  Shield, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp,
  X,
  Search
} from 'lucide-react';
import PropTypes from 'prop-types';

const VisitorAnalytics = ({ userData, onClose }) => {
  const [visitors, setVisitors] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    verifiedVisitors: 0,
    unverifiedVisitors: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllVisitors, setShowAllVisitors] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('lastVisit');
  const [sortOrder, setSortOrder] = useState('desc');
  
  useEffect(() => {
    if (!userData?.user?.username) return;
    
    const fetchVisitors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND}/visitors/${userData.user.username}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );
        
        const data = await response.json();
        console.log(data);
        if (response.ok) {
          setVisitors(data.visitors || []);
          setAnalytics(data.analytics || {
            totalVisits: 0,
            uniqueVisitors: 0,
            verifiedVisitors: 0,
            unverifiedVisitors: 0
          });
        } else {
          setError(data.message || 'Failed to fetch visitors');
        }
      } catch (error) {
        console.error('Error fetching visitors:', error);
        setError('Error connecting to server');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVisitors();
  }, [userData]);
  
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  const filteredVisitors = visitors
    .filter(visitor => 
      visitor.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'visitCount') {
        return sortOrder === 'asc' 
          ? a.visitCount - b.visitCount 
          : b.visitCount - a.visitCount;
      } else if (sortBy === 'lastVisit') {
        return sortOrder === 'asc'
          ? new Date(a.lastVisit) - new Date(b.lastVisit)
          : new Date(b.lastVisit) - new Date(a.lastVisit);
      } else if (sortBy === 'firstVisit') {
        return sortOrder === 'asc'
          ? new Date(a.firstVisit) - new Date(b.firstVisit)
          : new Date(b.firstVisit) - new Date(a.firstVisit);
      } else {
        return sortOrder === 'asc'
          ? a.username.localeCompare(b.username)
          : b.username.localeCompare(a.username);
      }
    });
  
  const displayVisitors = showAllVisitors ? filteredVisitors : filteredVisitors.slice(0, 5);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto text-white"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 text-white">
          <div className="flex items-center gap-2">
            <Users className="text-blue-400" />
            <h2 className="text-xl font-bold">Visitor Analytics</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {isLoading ? (
            <div className="p-8 flex justify-center items-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className="p-4">
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gray-700 p-4 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Eye className="text-blue-400 w-5 h-5" />
                    <h3 className="font-medium text-gray-300">Total Visits</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.totalVisits}</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gray-700 p-4 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users className="text-purple-400 w-5 h-5" />
                    <h3 className="font-medium text-gray-300">Unique Visitors</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.uniqueVisitors}</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gray-700 p-4 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="text-green-400 w-5 h-5" />
                    <h3 className="font-medium text-gray-300">Verified</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.verifiedVisitors}</p>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-gray-700 p-4 rounded-lg text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ShieldAlert className="text-yellow-400 w-5 h-5" />
                    <h3 className="font-medium text-gray-300">Guests</h3>
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.unverifiedVisitors}</p>
                </motion.div>
              </div>
              
              {/* Chart Placeholder - Could be replaced with a real chart */}
              <div className="bg-gray-900 rounded-lg p-4 mb-6 h-48 flex items-center justify-center">
                <BarChart2 className="w-12 h-12 text-gray-600" />
                <span className="ml-2 text-gray-500">Visitor activity visualization could go here</span>
              </div>
              
              {/* Visitors List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="text-blue-400 w-5 h-5" />
                    Recent Visitors
                  </h3>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search visitors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-full py-1 pl-9 pr-3 text-sm w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {visitors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No visitors yet</p>
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-800">
                          <th 
                            className="p-3 text-left cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('username')}
                          >
                            <div className="flex items-center gap-1">
                              Visitor
                              {sortBy === 'username' && (
                                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="p-3 text-left cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('visitCount')}
                          >
                            <div className="flex items-center gap-1">
                              Visits
                              {sortBy === 'visitCount' && (
                                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="p-3 text-left cursor-pointer hover:bg-gray-700 hidden md:table-cell"
                            onClick={() => handleSort('firstVisit')}
                          >
                            <div className="flex items-center gap-1">
                              First Visit
                              {sortBy === 'firstVisit' && (
                                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th 
                            className="p-3 text-left cursor-pointer hover:bg-gray-700"
                            onClick={() => handleSort('lastVisit')}
                          >
                            <div className="flex items-center gap-1">
                              Last Visit
                              {sortBy === 'lastVisit' && (
                                sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayVisitors.map((visitor, index) => (
                          <motion.tr 
                            key={visitor.username + index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-t border-gray-800 hover:bg-gray-800 transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-2">
                                  {visitor.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium">{visitor.name}</p>
                                  <p className="text-xs text-gray-400">{visitor.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-gray-400" />
                                {visitor.visitCount}
                              </div>
                            </td>
                            <td className="p-3 hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{formatDate(visitor.firstVisit)}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{formatDate(visitor.lastVisit)}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {visitor.isVerified ? (
                                <span className="bg-green-900 text-green-300 text-xs py-1 px-2 rounded-full flex items-center justify-center w-20 mx-auto">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Verified
                                </span>
                              ) : (
                                <span className="bg-yellow-900 text-yellow-300 text-xs py-1 px-2 rounded-full flex items-center justify-center w-20 mx-auto">
                                  <User className="w-3 h-3 mr-1" />
                                  Guest
                                </span>
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredVisitors.length > 5 && (
                      <div className="p-3 text-center">
                        <button
                          onClick={() => setShowAllVisitors(!showAllVisitors)}
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mx-auto"
                        >
                          {showAllVisitors ? (
                            <>
                              <span>Show Less</span>
                              <ChevronUp className="w-4 h-4" />
                            </>
                          ) : (
                            <>
                              <span>Show All ({filteredVisitors.length} visitors)</span>
                              <ChevronDown className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

VisitorAnalytics.propTypes = {
  userData: PropTypes.shape({
    user: PropTypes.shape({
      username: PropTypes.string
    })
  }),
  onClose: PropTypes.func.isRequired
};

export default VisitorAnalytics;