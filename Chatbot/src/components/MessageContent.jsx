import React, { useState, useEffect } from 'react';

const MessageContent = ({ content }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
  
    const convertUrlsToLinks = (text) => {
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
  
    return <div>{convertUrlsToLinks(content)}</div>;
  };

  export default MessageContent;