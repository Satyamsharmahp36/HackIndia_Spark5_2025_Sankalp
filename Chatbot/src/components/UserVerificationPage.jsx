/* UserVerificationPage.jsx */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { UserCheck, Sparkles, Info, ChevronRight } from 'lucide-react';

import { useAppDispatch } from '../app/hooks/useAppDispatch';   // <–– correct path!
import {
  verifyVisitor,        // async thunk (password flow)
  loginGuest,            // action for guest flow if you expose it
} from '../app/features/user/authSlice';     // <–– correct path!

/* ------------------------------------------------------------------ */

const UserVerificationPage = ({ onUserVerified /* optional now */ }) => {
  const [username, setUsername]   = useState('');
  const [localError, setLocalError] = useState('');

  const dispatch   = useAppDispatch();
  const navigate   = useNavigate();

  /* handleSubmit ➜ just fire redux thunk */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    if (!u) {
      setLocalError('Please enter a ChatMate username');
      return;
    }

    try {
      /* thunk returns a promise with unwrap() */
      const data = await dispatch(verifyVisitor(u)).unwrap();
      onUserVerified?.(data);               // optional side-effect
      navigate(`/home/${u}`);               // route push
    } catch (err) {
      // err.message comes from thunk’s rejectWithValue / throw
      setLocalError(err?.message || 'User not found, please try again.');
    }
  };

  /* ---------------------------------------------------------------- */

  /* little particle background helper – unchanged */
  const BackgroundParticles = () => {
    const parts = React.useMemo(
      () => Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 2,
      })),
      []
    );

    return (
      <motion.div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {parts.map((p) => (
          <motion.div
            key={p.id}
            className="absolute bg-purple-300/30 rounded-full"
            style={{
              width: `${p.size}rem`,
              height: `${p.size}rem`,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
              translateX: ['-50%', '50%', '-50%'],
              translateY: ['-50%', '50%', '-50%'],
            }}
            transition={{
              duration: 5 + p.delay,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    );
  };

  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#120312] via-[#200a22] to-[#331d3d] flex items-center justify-center relative overflow-hidden">
      <BackgroundParticles />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-indigo-900/10 to-blue-900/20 mix-blend-overlay" />
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-[#1a0a1f]/60 backdrop-blur-xl border border-purple-900/40 p-8 rounded-3xl shadow-2xl shadow-purple-900/50">
          {/* ---- Title block ---- */}
          <div className="text-center mb-8">
            <motion.h1
              className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mb-2 flex items-center justify-center gap-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="text-pink-400 animate-pulse" />
              ChatMate
              <Sparkles className="text-pink-400 animate-pulse" />
            </motion.h1>
            <motion.p
              className="text-lg text-purple-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your Personal Chat Assistant
            </motion.p>
          </div>

          {/* ---- Form ---- */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center bg-purple-900/30 border border-purple-700/40 rounded-lg p-3 mb-2">
                <UserCheck className="text-pink-400 mr-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter ChatMate username"
                  className="w-full bg-transparent text-purple-100 placeholder-purple-300 focus:outline-none"
                  required
                />
              </div>
              <div className="flex items-center text-xs text-purple-300 mb-4">
                <Info className="w-4 h-4 mr-2 text-pink-400" />
                Enter the ChatMate username of the assistant you want to talk to
              </div>
            </motion.div>

            {localError && (
              <motion.div
                className="text-pink-400 text-sm flex items-center justify-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                ⚠️ {localError}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-pink-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 hover:from-purple-800 hover:to-pink-800"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Continue <ChevronRight className="w-5 h-5" />
            </motion.button>
          </form>

          {/* ---- Register link ---- */}
          <motion.div
            className="text-center mt-6 text-purple-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Don't have an account?{' '}
            <a
              href={import.meta.env.VITE_FRONTEND_TWO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 hover:underline"
            >
              Register here
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

/* prop now optional */
UserVerificationPage.propTypes = {
  onUserVerified: PropTypes.func,
};

export default UserVerificationPage;
