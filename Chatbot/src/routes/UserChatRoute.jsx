import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HomePage from '../components/HomePage';
import React from 'react';

import { useAppDispatch } from '../app/hooks/useAppDispatch';
import { setUserData } from '../app/features/user/userSlice';

const Loader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-800">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
    />
  </div>
);

const UserChatRoute = () => {
  const { username } = useParams();
  const dispatch = useAppDispatch();

  const [loading, setLoading]   = React.useState(true);
  const [exists,  setExists]    = React.useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const r = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${username}`);
        if (!ignore) {
          if (r.ok) {
            const d = await r.json();
            dispatch(setUserData(d));
            setExists(true);
          }
        }
      } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore=true; };
  }, [username, dispatch]);

  if (loading)        return <Loader />;
  if (!exists)        return <Navigate to="/" />;
  return <HomePage />;
};

export default UserChatRoute;
