import { useState } from 'react';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import UserChatRoute from './routes/UserChatRoute';
import UserVerificationPage from './components/UserVerificationPage';
import { useAppDispatch } from './app/hooks/useAppDispatch';
import { clearUser } from './app/features/user/userSlice';

const TransitionAnimation = () => (
  <motion.div
    key="transition"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 flex items-center justify-center bg-gray-900 z-50"
  >
    <motion.div
      animate={{ scale: [1, 1.2, 0], rotate: [0, 180] }}
      transition={{ duration: 1 }}
      className="bg-blue-500 rounded-full p-4"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none">
          <path d="M21 12a9 9 0 1 1-9-9" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 7v5l3 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </motion.div>
  </motion.div>
);

const App = () => {
  const [transitioning, setTransitioning] = React.useState(false);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-900">
          <AnimatePresence mode="wait">
            {transitioning ? (
              <TransitionAnimation />
            ) : (
              <Routes>
                <Route
                  path="/"
                  element={
                    <motion.div
                      key="verify"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <UserVerificationPage setTransitioning={setTransitioning} />
                    </motion.div>
                  }
                />
                <Route path="home/:username" element={<UserChatRoute />} />
              </Routes>
            )}
          </AnimatePresence>
        </div>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
