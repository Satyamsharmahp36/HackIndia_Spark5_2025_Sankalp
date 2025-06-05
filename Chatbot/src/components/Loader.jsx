import { motion } from 'framer-motion';

const Loader = ({ fullScreen = true }) => {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : ''} flex items-center justify-center bg-gray-800`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );
};

export default Loader;
