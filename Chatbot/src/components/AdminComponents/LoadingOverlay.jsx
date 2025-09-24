import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = () => (
  <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-10">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="p-3 rounded-full bg-purple-50 border border-purple-200"
    >
      <Loader2 className="w-8 h-8 text-purple-600" />
    </motion.div>
  </div>
);

export default LoadingOverlay

