import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Bot, Sparkles, MessageSquare, User, ChevronRight, LogOut,
  Home, AlertCircle, ArrowLeft, Lock, ShieldAlert
} from 'lucide-react';

import ChatBot from './ChatBot';
import AdminPanel from './AdminPanel';
import VisitorAnalytics from './AdminComponents/VisitorAnalytics';

import { useAppDispatch } from '../app/hooks/useAppDispatch';
import { useAppSelector } from '../app/hooks/useAppSelector';
import {
  loginGuest,
  logout,
  clearError,
  setUserData,
  verifyVisitor,
} from '../app/features/user/authSlice';

/* ---------- component ---------- */
const HomePage = ({ userData: routeUserData, onLogout }) => {
  /* ---------- routing ---------- */
  const { username } = useParams();
  const navigate = useNavigate();

  /* ---------- redux ---------- */
  const dispatch = useAppDispatch();
  const {
    name,
    data,
    isAuth,
    status,
    error,
  } = useAppSelector((s) => s.auth);

  /* ---------- local UI state ---------- */
  const [inputUser, setInputUser] = useState('');
  const [password, setPassword] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  const [profileOwnerData, setProfileOwnerData] = useState(routeUserData || null);
  const [profileOwnerName, setProfileOwnerName] = useState(
    routeUserData?.user?.name || username || ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showChatBot, setShowChatBot] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUserNotFoundModal, setShowUserNotFoundModal] = useState(false);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  /* ---------- decorative bubbles ---------- */
  const backgroundBubbles = useMemo(
    () =>
      [...Array(20)].map((_, i) => ({
        id: i,
        width: Math.random() * 300 + 50,
        height: Math.random() * 300 + 50,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        yMovement: Math.random() * 30 - 15,
        xMovement: Math.random() * 30 - 15,
        duration: Math.random() * 10 + 10,
      })),
    []
  );

  /* ---------- helpers ---------- */
  const fetchProfileOwner = async (u) => {
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${u}`);
      if (!r.ok) return false;
      const d = await r.json();
      setProfileOwnerData(d);
      setProfileOwnerName(d.user?.name || u);
      return true;
    } catch {
      return false;
    }
  };

  const fetchPresentUser = async (u) => {
    const r = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${u}`);
    if (!r.ok) return false;
    const d = await r.json();
    setTempUserData(d);
    return true;
  };

  const verifyPassword = async (u, p) => {
    const r = await fetch(`${import.meta.env.VITE_BACKEND}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p }),
    });
    return r.ok;
  };

  const checkAccess = (u) => {
    if (!profileOwnerData?.user) return false;
    if (u === profileOwnerData.user.username) return true;
    if (profileOwnerData.user.accessRestricted === false) return true;
    return (profileOwnerData.user.accessList || []).includes(u);
  };

  /* ---------- first load ---------- */
  useEffect(() => {
    if (username) fetchProfileOwner(username);
    else if (routeUserData) setProfileOwnerData(routeUserData);
  }, [username, routeUserData]);

  /* ---------- present-user form submit ---------- */
  const handlePresentSubmit = async (e) => {
    e.preventDefault();
    if (!inputUser.trim()) {
      setErrorMessage('Please enter your ChatMate username');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await fetchPresentUser(inputUser.trim());
      if (!ok) {
        setShowUserNotFoundModal(true);
      } else if (!checkAccess(inputUser.trim())) {
        setShowAccessDeniedModal(true);
      } else {
        setShowPasswordModal(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- password modal submit ---------- */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError('Please enter your password');
      setTimeout(() => setPasswordError(''), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await verifyPassword(inputUser.trim(), password.trim());
      if (ok) {
        dispatch(setUserData({ 
          name: inputUser.trim(), 
          data: tempUserData 
        }));
        setShowPasswordModal(false);
      } else {
        setPasswordError('Incorrect password');
        setTimeout(() => setPasswordError(''), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- guest flow ---------- */
  const continueWithoutAccount = () => {
    if (!checkAccess(inputUser.trim())) {
      setShowAccessDeniedModal(true);
      return;
    }
    const guestData = {
      user: { name: inputUser.trim(), username: inputUser.trim(), isGuest: true },
    };
    dispatch(loginGuest({ 
      name: inputUser.trim(), 
      data: guestData 
    }));
    setShowUserNotFoundModal(false);
  };

  const skipPassword = () => {
    setShowPasswordModal(false);
    setInputUser('');
    setErrorMessage('Please enter a two-word name to continue as guest');
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const tryDifferentUsername = () => {
    setShowUserNotFoundModal(false);
    setShowAccessDeniedModal(false);
    setShowPasswordModal(false);
    setInputUser('');
    setPassword('');
    setErrorMessage('');
    setPasswordError('');
  };

  /* ---------- logout ---------- */
  const handleLogout = () => {
    dispatch(logout());
    setShowChatBot(false);
    onLogout?.();
  };

  /* ---------- refetch (using verifyVisitor thunk) ---------- */
  const refetchUserData = () => {
    if (name) {
      dispatch(verifyVisitor(name));
    }
  };

  /* ---------- visitor tracking ---------- */
  const trackVisitor = async () => {
    if (!profileOwnerData?.user?.username) return;
    const visitorName = data?.user?.name || name || 'Guest';
    const visitorUsername =
      data?.user?.username ||
      name ||
      `guest-${Math.random().toString(36).slice(2, 10)}`;
    const verified = !!data && !data.user?.isGuest;

    await fetch(`${import.meta.env.VITE_BACKEND}/track-visitor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileOwnerUsername: profileOwnerData.user.username,
        visitorUsername,
        visitorName,
        isVerified: verified,
      }),
    });
  };

  const handleGetStarted = () => {
    setShowChatBot(true);
    trackVisitor();
  };

  /* ---------- navigation helpers ---------- */
  const navigateToHome = () => navigate('/');

  const renderHomeButton = () => (
    <button
      type="button"
      onClick={() => setShowAdminPanel(true)}
      className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full shadow-lg"
    >
      <Home className="w-5 h-5" />
    </button>
  );

  /* -------- Password Modal -------- */
  const renderPasswordModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex justify-center mb-4 text-blue-500">
          <Lock className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Enter Your Password</h3>
        <p className="text-gray-300 text-center mb-6">
          Please enter your password for ChatMate username "{inputUser}".
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              placeholder="Your password"
              className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-white"
            />
          </div>

          {passwordError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm flex items-center"
            >
              ⚠️ {passwordError}
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white rounded-lg flex justify-center items-center gap-2"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                Login <ChevronRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>

        <div className="flex justify-between mt-4 text-sm">
          <button onClick={skipPassword} className="text-gray-400">
            Continue as guest
          </button>
          <button onClick={() => setShowPasswordModal(false)} className="text-blue-400">
            Try different username
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ---------- UserNotFound Modal ---------- */
  const renderUserNotFoundModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex items-center justify-center mb-4 text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Username Not Found</h3>
        <p className="text-gray-300 text-center mb-6">
          The username "{inputUser}" is not registered on ChatMate. Please register at{" "}
          <a 
            href={`${import.meta.env.VITE_FRONTEND_TWO}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            chat-matee.vercel.app
          </a>{" "}
          to use features like Task scheduling, or continue without an account.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={tryDifferentUsername}
            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Try Different Username
          </button>
          <button
            onClick={continueWithoutAccount}
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Continue Without Account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderAccessDeniedModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700"
      >
        <div className="flex items-center justify-center mb-4 text-yellow-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-center mb-3">Access Denied</h3>
        <p className="text-gray-300 text-center mb-6">
          You don't have permission to access {profileOwnerName}'s AI Assistant. Please request access from {profileOwnerName} to continue.
        </p>
        <div className="flex justify-center">
          <button
            onClick={tryDifferentUsername}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            Try Different Username
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ---------- main return ---------- */
  return showChatBot ? (
    /* ---- ChatBot View ---- */
    <div className="h-screen flex items-center justify-center bg-gradient-to-r from-slate-500 to-slate-800 relative">
      <div className="absolute top-4 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={navigateToHome}
          className="text-white bg-blue-600 p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>
      </div>

      <ChatBot
        userName={name}
        userData={profileOwnerData}
        onRefetchUserData={refetchUserData}
        presentUserData={data}
      />

      <div className="absolute top-4 right-4 flex gap-3">
        {renderHomeButton()}
        <button
          onClick={handleLogout}
          className="text-white bg-red-500 p-2 rounded-full"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {showAdminPanel && (
        <AdminPanel userData={profileOwnerData} onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  ) : (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col"
  >
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full">
        {backgroundBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            className="absolute rounded-full bg-blue-500 opacity-10"
            style={{
              width: bubble.width,
              height: bubble.height,
              left: bubble.left,
              top: bubble.top,
            }}
            animate={{
              y: [0, bubble.yMovement],
              x: [0, bubble.xMovement],
            }}
            transition={{
              duration: bubble.duration,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>
    </div>
    
     <div className="absolute top-4 left-4 z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={navigateToHome}
        className="text-white bg-blue-600 hover:bg-blue-700 p-2 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>
    </div>
    
    <div className="flex gap-3 absolute top-4 right-4 z-50">
      {renderHomeButton()}
    </div>

    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute opacity-20 w-32 h-32 rounded-full border-4 border-blue-500"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative z-10 bg-gradient-to-r from-blue-600 to-blue-400 p-5 rounded-full shadow-xl"
          >
            <Bot className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600 mb-4"
        >
          {profileOwnerName ? `${profileOwnerName}'s AI Assistant` : "AI Assistant"}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto"
        >
          {profileOwnerName 
            ? `Get answers to all your questions about ${profileOwnerName}'s projects, experience, and skills`
            : "Get answers to all your questions about projects, experience, and skills"}
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
      >
        {[
          { icon: <MessageSquare className="w-8 h-8" />, title: "Instant Responses", desc: "Get immediate answers to your questions" },
          { icon: <Sparkles className="w-8 h-8" />, title: "AI Powered", desc: "Powered by advanced AI technology" },
          { icon: <User className="w-8 h-8" />, title: "Personalized", desc: "Tailored responses about your queries" }
        ].map((feature, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5, scale: 1.03 }}
            className="bg-gray-800 bg-opacity-50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg"
          >
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full w-fit mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-400">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-md bg-gray-800 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-xl"
      >
        {!isAuth ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-center">Enter your ChatMate username</h2>
            <form onSubmit={handlePresentSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inputUser}
                  onChange={(e) => setInputUser(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-3 px-10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Your ChatMate username"
                  disabled={isSubmitting}
                />
              </div>
              
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center"
                >
                  <span className="mr-2">⚠️</span> {errorMessage}
                </motion.div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center space-x-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <span>Continue</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full flex items-center justify-center"
            >
              <Bot className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold">
              Hello, <span className="text-blue-400">{name}</span>!
            </h2>
            <p className="text-gray-300">
              Ready to start chatting with{profileOwnerName ? ` ${profileOwnerName}'s` : ""} AI Assistant?
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all font-medium flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>
      
      {showAdminPanel && (
        <AdminPanel 
          userData={profileOwnerData} 
          onClose={() => setShowAdminPanel(false)} 
        />
      )}

      {showUserNotFoundModal && renderUserNotFoundModal()}
      {showPasswordModal && renderPasswordModal()}
      {showAccessDeniedModal && renderAccessDeniedModal()}
    </div>
  </motion.div>
  );
};

/* ---------- prop-types ---------- */
HomePage.propTypes = {
  userData: PropTypes.shape({
    user: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      username: PropTypes.string,
    }),
  }),
  onLogout: PropTypes.func,
};

export default HomePage;