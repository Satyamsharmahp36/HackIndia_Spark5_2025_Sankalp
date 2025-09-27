import React from 'react';
import ReactMarkdown from 'react-markdown';

const MessageContent = ({ content, text }) => {
    // Use either content or text prop, with fallback
    const messageText = content || text || '';
    
    // Custom components for markdown rendering
    const components = {
      // Style links
      a: ({ href, children, ...props }) => (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
          {...props}
        >
          {children}
        </a>
      ),
      // Style bold text
      strong: ({ children, ...props }) => (
        <strong className="font-bold" {...props}>
          {children}
        </strong>
      ),
      // Style italic text
      em: ({ children, ...props }) => (
        <em className="italic" {...props}>
          {children}
        </em>
      ),
      // Style lists
      ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside space-y-1 my-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
          {children}
        </ol>
      ),
      // Style list items
      li: ({ children, ...props }) => (
        <li className="ml-2" {...props}>
          {children}
        </li>
      ),
      // Style paragraphs
      p: ({ children, ...props }) => (
        <p className="mb-2 last:mb-0" {...props}>
          {children}
        </p>
      ),
      // Style code blocks
      code: ({ children, ...props }) => (
        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      ),
      // Style blockquotes
      blockquote: ({ children, ...props }) => (
        <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props}>
          {children}
        </blockquote>
      ),
      // Style headers
      h1: ({ children, ...props }) => (
        <h1 className="text-xl font-bold mb-2" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }) => (
        <h2 className="text-lg font-bold mb-2" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }) => (
        <h3 className="text-base font-bold mb-1" {...props}>
          {children}
        </h3>
      ),
    };
  
    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown components={components}>
          {messageText}
        </ReactMarkdown>
      </div>
    );
  };

  export default MessageContent;