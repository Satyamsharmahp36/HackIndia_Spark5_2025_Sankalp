import React, { useState, useEffect } from "react";
import { Mic, Send, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";
import { motion } from "framer-motion";

// Utility function from utils.ts
const cn = (...inputs) => {
  return twMerge(clsx(inputs));
};

const AIVoice = ({ 
  isListening, 
  onMicClick, 
  transcript, 
  onSend, 
  onCancel 
}) => {
  // Debug logs
  console.log("AIVoice component rendered");
  console.log("isListening:", isListening);
  console.log("transcript:", transcript);
  
  // Track if we've received any transcript
  const [hasReceivedTranscript, setHasReceivedTranscript] = useState(false);
  // Track animation for voice bars
  const [barHeights, setBarHeights] = useState(Array(48).fill(20));
  
  // Update when transcript changes
  useEffect(() => {
    if (transcript && transcript.trim() !== '') {
      setHasReceivedTranscript(true);
    }
  }, [transcript]);
  
  // Animate the voice bars when listening
  useEffect(() => {
    let animationFrame;
    
    const animateBars = () => {
      if (isListening) {
        setBarHeights(prev => prev.map(() => 20 + Math.random() * 80));
        animationFrame = requestAnimationFrame(animateBars);
      }
    };
    
    if (isListening) {
      animationFrame = requestAnimationFrame(animateBars);
    } else {
      setBarHeights(Array(48).fill(20));
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isListening]);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let intervalId;

    if (isListening) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [isListening]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };



  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute -top-48 left-2 right-2 bg-white rounded-xl shadow-lg border border-purple-100 z-10 p-4"
    >
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 rounded-xl flex items-center justify-center transition-colors",
            isListening
              ? "bg-none"
              : "bg-none hover:bg-black/5 dark:hover:bg-white/5"
          )}
          type="button"
          onClick={onMicClick}
        >
          {isListening ? (
            <div
              className="w-6 h-6 rounded-sm animate-spin bg-purple-600 cursor-pointer pointer-events-auto"
              style={{ animationDuration: "3s" }}
            />
          ) : (
            <Mic className="w-6 h-6 text-purple-600" />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm transition-opacity duration-300",
            isListening
              ? "text-gray-700"
              : "text-gray-400"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {barHeights.map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                isListening
                  ? "bg-purple-500"
                  : "bg-gray-200"
              )}
              style={{
                height: isListening ? `${height}%` : '20%',
                transition: 'height 0.1s ease-in-out',
              }}
            />
          ))}
        </div>

        <p className="h-4 text-xs text-gray-700">
          {isListening 
            ? (hasReceivedTranscript 
                ? "Voice detected! Keep speaking..." 
                : "Listening... (speak now)") 
            : "Click to speak"}
        </p>

        {isListening && (
          <div className="mt-4 w-full max-w-md">
            <p className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg min-h-[60px] flex items-center justify-center">
              {transcript 
                ? transcript 
                : (isListening 
                    ? (hasReceivedTranscript 
                        ? "Processing your speech..." 
                        : "Waiting for your voice... (speak clearly)") 
                    : "Click the microphone to start speaking")}
            </p>
            <div className="flex justify-end mt-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCancel}
                className="p-2 rounded-lg bg-white text-gray-500 border border-gray-200 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span className="text-xs">Cancel</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSend}
                disabled={!transcript.trim()}
                className={`p-2 rounded-lg flex items-center gap-1 ${transcript.trim() ? "bg-purple-600 text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
              >
                <Send className="w-4 h-4" />
                <span className="text-xs">Send</span>
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AIVoice;
