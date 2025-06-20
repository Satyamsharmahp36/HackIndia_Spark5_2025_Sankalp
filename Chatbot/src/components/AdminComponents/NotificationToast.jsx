import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X } from "lucide-react";

const NotificationToast = ({ notification, setNotification }) => (
  <AnimatePresence>
    {notification && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
          notification.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {notification.type === "success" ? (
          <CheckCircle className="w-5 h-5 text-white" />
        ) : (
          <AlertCircle className="w-5 h-5 text-white" />
        )}
        <p className="text-white font-medium">{notification.message}</p>
        <button
          onClick={() => setNotification(null)}
          className="text-white hover:text-gray-200 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

export default NotificationToast; 