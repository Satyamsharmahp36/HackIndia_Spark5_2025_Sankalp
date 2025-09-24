import React, { useState, useEffect } from 'react';

const MessageContent = ({ content, text }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Use either content or text prop, with fallback
    const messageText = content || text || '';
  
    const convertUrlsToLinks = (text) => {
      // Check if text is defined and is a string
      if (!text || typeof text !== 'string') {
        return text || '';
      }
      
      return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
          const linkText = part.includes('linkedin.com') 
            ? 'LinkedIn Profile' 
            : 'Link';
          
          return (
            <a 
              key={index} 
              href={part} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-400 hover:underline"
            >
              {linkText}
            </a>
          );
        }
        return part;
      });
    };
  
    return <div>{convertUrlsToLinks(messageText)}</div>;
  };

  export default MessageContent;