import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="p-3 rounded-full bg-blue-100 bg-opacity-50"
    >
      <Loader2 className="w-10 h-10 text-blue-400" />
    </motion.div>
  </div>
);

export default LoadingOverlay

