import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'react-toastify';

// Import all the functions from the regular AI service
import { 
  detectTaskRequest, 
  createTask, 
  extractConversationTopic,
  processMeetingState,
  parseMeetingDetailsResponse,
  updatePrompt 
} from './ai.jsx';

// MCP Service URLs
const EMAIL_SERVICE_URL = 'http://localhost:3000';
const LINKEDIN_SERVICE_URL = 'http://localhost:4000';
const WHATSAPP_SERVICE_URL = 'http://localhost:3002';
const X_SERVICE_URL = 'http://localhost:3001';

// Helper function to check if user is admin based on URL
function isAdminUser() {
  const currentURL = window.location.href;
  const currentPath = window.location.pathname;
  
  // Direct check for admin URL
  const isAdmin = currentURL.includes('/admin/chat/') || 
                 currentPath.includes('/admin/chat/') ||
                 currentURL.includes('admin') ||
                 currentPath.includes('admin');
  
  console.log('AdminAI - Simple admin check:');
  console.log('  URL:', currentURL);
  console.log('  Path:', currentPath);
  console.log('  Contains admin:', isAdmin);
  
  return isAdmin;
}

// Message scheduling functions
function parseScheduleTime(timeString) {
  const now = new Date();
  const lowerTimeString = timeString.toLowerCase().trim();
  
  // Relative time parsing (e.g., "5 mins", "2 hours", "30 minutes")
  const relativeMatch = lowerTimeString.match(/(\d+)\s*(min|mins|minute|minutes|hour|hours|hr|hrs|day|days)/);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2];
    
    let milliseconds = 0;
    switch (unit) {
      case 'min':
      case 'mins':
      case 'minute':
      case 'minutes':
        milliseconds = value * 60 * 1000;
        break;
      case 'hour':
      case 'hours':
      case 'hr':
      case 'hrs':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'day':
      case 'days':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
    }
    
    return {
      type: 'relative',
      delayMs: milliseconds,
      scheduledTime: new Date(now.getTime() + milliseconds)
    };
  }
  
  // Absolute time parsing (e.g., "at 3pm", "at 15:30", "at 9:00")
  const absoluteMatch = lowerTimeString.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (absoluteMatch) {
    let hours = parseInt(absoluteMatch[1]);
    const minutes = parseInt(absoluteMatch[2] || '0');
    const ampm = absoluteMatch[3];
    
    // Convert 12-hour to 24-hour format
    if (ampm) {
      if (ampm === 'pm' && hours !== 12) {
        hours += 12;
      } else if (ampm === 'am' && hours === 12) {
        hours = 0;
      }
    }
    
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    return {
      type: 'absolute',
      scheduledTime: scheduledTime,
      delayMs: scheduledTime.getTime() - now.getTime()
    };
  }
  
  return null;
}

// Store scheduled messages (in a real app, this would be in a database)
const scheduledMessages = new Map();

function scheduleMessage(recipient, message, scheduleInfo, userData) {
  const messageId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const scheduledMessage = {
    id: messageId,
    recipient,
    message,
    scheduleInfo,
    userData,
    createdAt: new Date(),
    status: 'scheduled'
  };
  
  scheduledMessages.set(messageId, scheduledMessage);
  
  // Set timeout for the message
  const timeoutId = setTimeout(async () => {
    try {
      console.log(`Executing scheduled message: ${messageId}`);
      
      // Determine if it's a group or individual message
      const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(recipient.trim());
      
      let result;
      if (isPhoneNumber) {
        result = await sendWhatsAppMessage(recipient.trim(), message);
      } else {
        try {
          result = await sendWhatsAppToGroup(recipient.trim(), message);
        } catch (groupError) {
          console.log('Failed to send to group, trying as contact:', groupError);
          result = await sendWhatsAppMessage(recipient.trim(), message);
        }
      }
      
      // Update status
      scheduledMessages.set(messageId, {
        ...scheduledMessage,
        status: 'sent',
        sentAt: new Date(),
        result: result
      });
      
      console.log(`Scheduled message sent successfully: ${messageId}`);
    } catch (error) {
      console.error(`Failed to send scheduled message: ${messageId}`, error);
      scheduledMessages.set(messageId, {
        ...scheduledMessage,
        status: 'failed',
        failedAt: new Date(),
        error: error.message
      });
    }
  }, scheduleInfo.delayMs);
  
  // Store timeout ID for potential cancellation
  scheduledMessages.set(messageId, {
    ...scheduledMessage,
    timeoutId
  });
  
  return messageId;
}

// Execute immediate message from LLM parsing
async function executeImmediateMessage(command, userData) {
  try {
    const { recipient, message, isGroup } = command;
    
    console.log('Executing immediate message:', { recipient, message, isGroup });
    
    // Determine if it's a phone number or group name
    const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(recipient.trim());
    
    let result;
    if (isPhoneNumber || !isGroup) {
      result = await sendWhatsAppMessage(recipient.trim(), message);
    } else {
      try {
        result = await sendWhatsAppToGroup(recipient.trim(), message);
      } catch (groupError) {
        console.log('Failed to send to group, trying as contact:', groupError);
        result = await sendWhatsAppMessage(recipient.trim(), message);
      }
    }
    
    console.log('Immediate message result:', result);
    
    if (result.success) {
      toast.success('WhatsApp message sent successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      // Handle different response formats
      const messageId = result.data?.messageId || result.message_id || result.data?.message_id || 'Unknown';
      
      return `✅ WhatsApp message sent successfully!\n\n📱 Recipient: ${recipient}\n💬 Message: ${message}\n📊 Message ID: ${messageId}`;
    } else {
      return `❌ Failed to send WhatsApp message\n\n📱 Recipient: ${recipient}\n💬 Message: ${message}\n❌ Error: ${result.message || 'Unknown error'}`;
    }
  } catch (error) {
    console.error('Error executing immediate message:', error);
    return `❌ Error sending WhatsApp message: ${error.message}`;
  }
}

// Execute scheduled message from LLM parsing
async function executeScheduledMessage(command, userData) {
  try {
    const { recipient, message, schedule, isGroup } = command;
    
    console.log('Executing scheduled message:', { recipient, message, schedule, isGroup });
    
    // Parse the schedule time
    const scheduleInfo = parseScheduleTime(schedule.time);
    
    if (!scheduleInfo) {
      return `❌ Invalid time format!\n\nCould not parse schedule time: "${schedule.time}"\n\nPlease use formats like:\n• "5 mins", "2 hours", "1 day"\n• "at 3pm", "at 15:30"`;
    }
    
    const messageId = scheduleMessage(recipient, message, scheduleInfo, userData);
    
    return `⏰ Message Scheduled Successfully!\n\n📱 Recipient: ${recipient}\n💬 Message: ${message}\n⏰ Schedule: ${schedule.description}\n🆔 Schedule ID: ${messageId}\n\n✅ Your message will be sent automatically!`;
  } catch (error) {
    console.error('Error executing scheduled message:', error);
    return `❌ Error scheduling WhatsApp message: ${error.message}`;
  }
}

function getScheduledMessagesList() {
  const messages = Array.from(scheduledMessages.values());
  
  if (messages.length === 0) {
    return "📋 No scheduled messages found.\n\nAll messages have been sent or there are no pending schedules.";
  }
  
  let response = "📋 Scheduled Messages:\n\n";
  
  messages.forEach((msg, index) => {
    const statusEmoji = {
      'scheduled': '⏰',
      'sent': '✅',
      'failed': '❌'
    }[msg.status] || '❓';
    
    const timeDescription = msg.scheduleInfo.type === 'relative' 
      ? `in ${msg.scheduleInfo.delayMs / (60 * 1000)} minutes` 
      : `at ${msg.scheduleInfo.scheduledTime.toLocaleString()}`;
    
    response += `${index + 1}. ${statusEmoji} ${msg.status.toUpperCase()}\n`;
    response += `   📱 To: ${msg.recipient}\n`;
    response += `   💬 Message: ${msg.message}\n`;
    response += `   ⏰ Schedule: ${timeDescription}\n`;
    response += `   🆔 ID: ${msg.id}\n\n`;
  });
  
  return response;
}

function cancelScheduledMessage(messageId) {
  const message = scheduledMessages.get(messageId);
  
  if (!message) {
    return `❌ Message not found!\n\nSchedule ID "${messageId}" does not exist.`;
  }
  
  if (message.status === 'sent') {
    return `❌ Cannot cancel sent message!\n\nMessage ID "${messageId}" has already been sent.`;
  }
  
  if (message.status === 'failed') {
    return `❌ Message already failed!\n\nMessage ID "${messageId}" failed to send and cannot be cancelled.`;
  }
  
  // Clear the timeout
  if (message.timeoutId) {
    clearTimeout(message.timeoutId);
  }
  
  // Update status
  scheduledMessages.set(messageId, {
    ...message,
    status: 'cancelled',
    cancelledAt: new Date()
  });
  
  return `✅ Message cancelled successfully!\n\n📱 Recipient: ${message.recipient}\n💬 Message: ${message.message}\n🆔 ID: ${messageId}\n\nThe scheduled message has been removed from the queue.`;
}

// Email Integration Functions
async function sendEmailViaMCP(to, subject, body, options = {}) {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/emails/${options.accountId || 'default'}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        cc: options.cc,
        bcc: options.bcc,
        isHtml: options.isHtml || false
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email via MCP:', error);
    throw error;
  }
}

async function getEmailAccounts() {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/emails/accounts`);
    if (!response.ok) throw new Error('Failed to get email accounts');
    return await response.json();
  } catch (error) {
    console.error('Error getting email accounts:', error);
    return { success: false, error: error.message };
  }
}

async function getRecentEmails(accountId, limit = 10) {
  try {
    const response = await fetch(`${EMAIL_SERVICE_URL}/api/emails/${accountId}?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get recent emails');
    return await response.json();
  } catch (error) {
    console.error('Error getting recent emails:', error);
    return { success: false, error: error.message };
  }
}

// LinkedIn Integration Functions
async function sendLinkedInMessage(chatId, content, options = {}) {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        content,
        subject: options.subject
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send LinkedIn message via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending LinkedIn message via MCP:', error);
    throw error;
  }
}

// Enhanced LinkedIn post generation with multiple types
async function generateLinkedInPost(brief, type = 'professional', options = {}) {
  try {
    console.log('Generating LinkedIn post with:', { brief, type, options });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/auto-create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brief,
        type,
        postImmediately: options.postImmediately || false,
        enhancement: options.enhancement || 'improve',
        visibility: options.visibility || 'public'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to generate LinkedIn post via MCP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('LinkedIn post generation result:', result);
    return result;
  } catch (error) {
    console.error('Error generating LinkedIn post via MCP:', error);
    if (error.name === 'AbortError') {
      throw new Error('LinkedIn post generation timed out. Please try again.');
    }
    throw error;
  }
}

// Quick post generation (one-liner to enhanced post)
async function generateQuickLinkedInPost(message, autoPost = false) {
  try {
    console.log('Generating quick LinkedIn post with:', { message, autoPost });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/quick-post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        autoPost
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to generate quick LinkedIn post via MCP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Quick LinkedIn post generation result:', result);
    return result;
  } catch (error) {
    console.error('Error generating quick LinkedIn post via MCP:', error);
    if (error.name === 'AbortError') {
      throw new Error('Quick LinkedIn post generation timed out. Please try again.');
    }
    throw error;
  }
}

// Create LinkedIn post directly
async function createLinkedInPost(content, options = {}) {
  try {
    console.log('Creating LinkedIn post with:', { content: content.substring(0, 100) + '...', options });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        visibility: options.visibility || 'public',
        imageUrl: options.imageUrl,
        mentions: options.mentions
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to create LinkedIn post via MCP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('LinkedIn post creation result:', result);
    return result;
  } catch (error) {
    console.error('Error creating LinkedIn post via MCP:', error);
    if (error.name === 'AbortError') {
      throw new Error('LinkedIn post creation timed out. Please try again.');
    }
    throw error;
  }
}

// Enhance existing post content
async function enhanceLinkedInPost(content, enhancement = 'improve') {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        enhancement
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to enhance LinkedIn post via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error enhancing LinkedIn post via MCP:', error);
    throw error;
  }
}

// Generate specific post types
async function generateAchievementPost(achievement, details = {}) {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/achievement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        achievement,
        details
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate achievement post via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating achievement post via MCP:', error);
    throw error;
  }
}

async function generateHackIndiaPost(status = 'finalist') {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/hackindia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate HackIndia post via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating HackIndia post via MCP:', error);
    throw error;
  }
}

async function generateInsightPost(topic, insight, context = {}) {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic,
        insight,
        context
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate insight post via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating insight post via MCP:', error);
    throw error;
  }
}

async function generateEngagementPost(question, context = '') {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/ai/posts/engagement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        context
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate engagement post via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating engagement post via MCP:', error);
    throw error;
  }
}

// Get LinkedIn messages with enhanced filtering
async function getLinkedInMessages(limit = 20, options = {}) {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(options.offset && { offset: options.offset.toString() }),
      ...(options.since && { since: options.since }),
      ...(options.until && { until: options.until })
    });

    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/messages?${params}`);
    if (!response.ok) throw new Error('Failed to get LinkedIn messages');
    return await response.json();
  } catch (error) {
    console.error('Error getting LinkedIn messages:', error);
    return { success: false, error: error.message };
  }
}

// Get unread LinkedIn messages
async function getUnreadLinkedInMessages(limit = 20) {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/messages/unread?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get unread LinkedIn messages');
    return await response.json();
  } catch (error) {
    console.error('Error getting unread LinkedIn messages:', error);
    return { success: false, error: error.message };
  }
}

// Get LinkedIn message summary and analytics
async function getLinkedInMessageSummary() {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/messages/summary`);
    if (!response.ok) throw new Error('Failed to get LinkedIn message summary');
    return await response.json();
  } catch (error) {
    console.error('Error getting LinkedIn message summary:', error);
    return { success: false, error: error.message };
  }
}

// Get LinkedIn accounts
async function getLinkedInAccounts() {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/accounts`);
    if (!response.ok) throw new Error('Failed to get LinkedIn accounts');
    return await response.json();
  } catch (error) {
    console.error('Error getting LinkedIn accounts:', error);
    return { success: false, error: error.message };
  }
}

// Get LinkedIn posts
async function getLinkedInPosts(limit = 10) {
  try {
    const response = await fetch(`${LINKEDIN_SERVICE_URL}/api/linkedin/posts?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get LinkedIn posts');
    return await response.json();
  } catch (error) {
    console.error('Error getting LinkedIn posts:', error);
    return { success: false, error: error.message };
  }
}

// WhatsApp Integration Functions
async function sendWhatsAppMessage(phoneNumber, content, options = {}) {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/messages/send-to-number`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber,
        content,
        mediaUrl: options.mediaUrl,
        mediaType: options.mediaType
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp message via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp message via MCP:', error);
    throw error;
  }
}

async function sendWhatsAppToGroup(groupName, content, options = {}) {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/groups/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupName,
        content,
        replyToMessageId: options.replyToMessageId
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send WhatsApp group message via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending WhatsApp group message via MCP:', error);
    throw error;
  }
}

async function postWhatsAppStatus(content, options = {}) {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/status/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        mediaUrl: options.mediaUrl,
        mediaType: options.mediaType,
        backgroundColor: options.backgroundColor,
        duration: options.duration || 86400
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post WhatsApp status via MCP');
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting WhatsApp status via MCP:', error);
    throw error;
  }
}

async function getWhatsAppMessages(limit = 20) {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/messages?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to get WhatsApp messages');
    return await response.json();
  } catch (error) {
    console.error('Error getting WhatsApp messages:', error);
    return { success: false, error: error.message };
  }
}

async function getWhatsAppGroups() {
  try {
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/api/whatsapp/groups`);
    if (!response.ok) throw new Error('Failed to get WhatsApp groups');
    return await response.json();
  } catch (error) {
    console.error('Error getting WhatsApp groups:', error);
    return { success: false, error: error.message };
  }
}

// X (Twitter) Integration Functions
async function createXPost(content, options = {}) {
  try {
    console.log('Creating X post with:', { content: content.substring(0, 100) + '...', options });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${X_SERVICE_URL}/api/x/posts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: content,
        enhanceWithAI: options.enhanceWithAI !== false // Default to true
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to create X post via MCP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('X post creation result:', result);
    return result;
  } catch (error) {
    console.error('Error creating X post via MCP:', error);
    if (error.name === 'AbortError') {
      throw new Error('X post creation timed out. Please try again.');
    }
    throw error;
  }
}

async function previewXContent(content) {
  try {
    console.log('Previewing X content:', content.substring(0, 100) + '...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${X_SERVICE_URL}/api/x/posts/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: content
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to preview X content via MCP: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('X content preview result:', result);
    return result;
  } catch (error) {
    console.error('Error previewing X content via MCP:', error);
    if (error.name === 'AbortError') {
      throw new Error('X content preview timed out. Please try again.');
    }
    throw error;
  }
}

// Enhanced AI function for admin with MCP integrations
export async function getAdminAnswer(question, userData, presentData, conversationHistory = []) {
  console.log('getAdminAnswer called with:', { question, userData, presentData });
  try {
    // Check if user is admin based on URL
    const isAdmin = isAdminUser();
    console.log('Is admin user?', isAdmin);
    
    if (!isAdmin) {
      return "Access denied. Admin features are only available to authorized administrators.";
    }

    // Use environment variable for Gemini API key
    const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return "No Gemini API key available.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Check for MCP-related commands
    const lowerQuestion = question.toLowerCase();
    
    // Email commands
    if (lowerQuestion.includes('send email') || lowerQuestion.includes('email to')) {
      return await handleEmailCommand(question, userData, genAI);
    }
    
    // LinkedIn commands
    if (lowerQuestion.includes('linkedin') || lowerQuestion.includes('linkedin post')) {
      return await handleLinkedInCommand(question, userData, genAI);
    }
    
    // X (Twitter) commands
    if (lowerQuestion.includes('twitter') || lowerQuestion.includes('x post') || lowerQuestion.includes('tweet')) {
      return await handleXCommand(question, userData, genAI);
    }
    
    // WhatsApp commands - more flexible matching for LLM parsing
    const isWhatsAppCommand = lowerQuestion.includes('whatsapp') || 
        lowerQuestion.includes('whats app') || 
        (lowerQuestion.includes('message') && lowerQuestion.includes('anshul')) ||
        (lowerQuestion.includes('send') && lowerQuestion.includes('message')) ||
        (lowerQuestion.includes('text') && lowerQuestion.includes('anshul')) ||
        // Detect message commands (let LLM handle parsing)
        lowerQuestion.includes('message') ||
        lowerQuestion.includes('send') ||
        // Detect scheduling commands
        lowerQuestion.includes('in ') ||
        lowerQuestion.includes('at ') ||
        // Detect list/cancel commands
        lowerQuestion.includes('scheduled') ||
        lowerQuestion.includes('pending') ||
        lowerQuestion.includes('cancel');
    
    console.log('AdminAI - WhatsApp command check:', {
      question: lowerQuestion,
      hasWhatsapp: lowerQuestion.includes('whatsapp'),
      hasMessageAnshul: lowerQuestion.includes('message') && lowerQuestion.includes('anshul'),
      hasSendMessage: lowerQuestion.includes('send') && lowerQuestion.includes('message'),
      hasTextAnshul: lowerQuestion.includes('text') && lowerQuestion.includes('anshul'),
      matchesMessagePattern: /^message\s+\w+.*\s+\w+/.test(lowerQuestion),
      isWhatsAppCommand: isWhatsAppCommand
    });
    
    if (isWhatsAppCommand) {
      console.log('AdminAI - WhatsApp command detected:', question);
      return await handleWhatsAppCommand(question, userData, genAI);
    }
    
    // MCP service status
    if (lowerQuestion.includes('mcp status') || lowerQuestion.includes('service status')) {
      return await checkMCPStatus();
    }
    
    // Get recent messages from all services
    if (lowerQuestion.includes('recent messages') || lowerQuestion.includes('check messages')) {
      return await getRecentMessagesFromAllServices();
    }
    
    // List scheduled messages
    if (lowerQuestion.includes('scheduled messages') || lowerQuestion.includes('pending messages')) {
      return getScheduledMessagesList();
    }
    
    // Cancel scheduled message
    if (lowerQuestion.includes('cancel message') || lowerQuestion.includes('delete message')) {
      const cancelMatch = question.match(/cancel message\s+(.+)/i);
      if (cancelMatch) {
        return cancelScheduledMessage(cancelMatch[1].trim());
      }
    }

    // If it's a regular task request, use the normal flow but with admin enhancements
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = question.match(urlPattern) || [];

    const recentMessages = conversationHistory.slice(-6);  
    const formattedHistory = recentMessages.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const conversationTopic = await extractConversationTopic(
      conversationHistory, 
      question, 
      userData
    );

    // Process any meeting-related states
    const meetingState = processMeetingState(question, conversationHistory);
    
    // Normal task detection flow
    const taskDetection = await detectTaskRequest(question, userData, formattedHistory);
    
    // Handle meeting confirmations and task creation (same as regular AI)
    if (meetingState.type === "meetingConfirmed" || meetingState.type === "finalConfirmation" || taskDetection.isTask) {
      // Use the same logic as regular AI for tasks and meetings
      return await handleRegularTaskFlow(question, userData, presentData, conversationHistory, taskDetection, meetingState, conversationTopic, urls);
    }

    // Enhanced admin prompt with MCP capabilities
    const approvedContributions = userData.contributions?.filter(contribution => 
     contribution.status === "approved") || [];
    const contributionsKnowledgeBase = approvedContributions.length > 0 ? 
     `This is my personal knowledge base of verified information. you can use this to answer the questions
${approvedContributions.map((c, index) => `[${index + 1}] Question: ${c.question}\nAnswer: ${c.answer}`).join('\n\n')}` : 
     'No specific approved contributions yet.';
   
    const userName = userData?.name || userData?.user?.name || 'the user';
    const prompt = `
You are ${userName}'s personal AI assistant with ADMIN PRIVILEGES and MCP integrations. You have access to:

🔧 ADMIN FEATURES:
- Email management (send emails, check accounts, get recent emails)
- LinkedIn integration (AI-powered post generation, content enhancement, analytics)
- WhatsApp integration (send messages, post status, manage groups)
- Service status monitoring

📧 EMAIL COMMANDS:
- "Send email to [email] about [subject]"
- "Check my emails"
- "Get recent emails"

💼 LINKEDIN COMMANDS:
📝 Post Creation:
- "Create LinkedIn post about [topic]" - AI-enhanced professional posts
- "Quick post [message]" - One-liner to enhanced post
- "HackIndia post [status]" - HackIndia-specific achievement posts
- "Achievement post [achievement]" - Professional achievement posts
- "Insight post about [topic]" - Thought leadership content
- "Engagement post [question]" - Question-based engagement posts

📤 Publishing:
- "Post this to LinkedIn: [content]" - Publish content directly
- "Enhance LinkedIn post [content]" - Improve existing content

📊 Analytics & Management:
- "Check LinkedIn messages" - View recent messages
- "Unread LinkedIn messages" - See unread messages with priority
- "LinkedIn summary" - Message analytics and insights
- "My LinkedIn posts" - View your published posts
- "LinkedIn accounts" - Manage connected accounts

📱 WHATSAPP COMMANDS:
- "Send WhatsApp message to [number/group]"
- "Post WhatsApp status about [topic]"
- "Check WhatsApp messages"
- "List WhatsApp groups"

🐦 X (TWITTER) COMMANDS:
- "Create X post about [topic]" - AI-enhanced tweets
- "Tweet about [content]" - Quick tweet creation
- "Post to X [content]" - Direct posting
- "Quick tweet [message]" - Fast tweet posting
- "Preview X [content]" - Preview enhanced content
- "HackIndia tweet [status]" - HackIndia-specific tweets

🔍 SYSTEM COMMANDS:
- "MCP status" - Check all service statuses
- "Recent messages" - Get messages from all platforms

Answer based on the following details. Also answer the question's in person like instead of AI the ${userName} is answering questions.
If a you don't have data for any information say "I don't have that information. If you have answers to this, please contribute."
Answer questions in a bit elaborate manner and can also add funny things if needed.
Also note if question is like :- Do you know abotu this cors issue in deployment , then it mean's this question is asked from ${userName} , not from AI , so answers on the bases of ${userName}
data not by the AI's knowledge . 

Here's ${userName}'s latest data:
${userData.prompt || 'No specific context provided'}

And this is daily task of user ${userData.dailyTasks?.content || 'No daily tasks'}

${conversationHistory.length > 0 ? 'RECENT CONVERSATION HISTORY:\n' + formattedHistory + '\n\n' : ''}

${conversationTopic ? `Current conversation topic: ${conversationTopic}\n\n` : ''}

Current question: ${question}

${contributionsKnowledgeBase}

When providing links, give plain URLs like https://github.com/xxxx/

This is the way I want the responses to be ${userData.userPrompt || 'Professional and helpful'}

IMPORTANT: 
- Maintain context from the conversation history when answering follow-up questions
- If the user asks about MCP services, provide specific information about available integrations
- As an admin, you can help with multi-platform communication and content management
- Always mention your admin capabilities when relevant
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.8,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
   
  } catch (error) {
    console.error("Error generating admin answer:", error);
   
    if (error.message.includes('API key')) {
      return "There was an issue with the API key. Please check your Gemini API configuration.";
    }
   
    return "Sorry, I couldn't generate a response at this time. Please try again.";
  }
}

// Handle email commands
async function handleEmailCommand(question, userData, genAI) {
  try {
    // Parse email command
    const emailMatch = question.match(/send email to ([^\s]+@[^\s]+) about (.+)/i);
    
    if (emailMatch) {
      const [, email, subject] = emailMatch;
      
      // Get email accounts first
      const accountsResponse = await getEmailAccounts();
      if (!accountsResponse.success || !accountsResponse.data || accountsResponse.data.length === 0) {
        return "No email accounts configured. Please set up email accounts in the MCP email service.";
      }
      
      const accountId = accountsResponse.data[0].id; // Use first available account
      
      // Generate email body using AI
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const bodyPrompt = `Generate a professional email body about: ${subject}`;
      const bodyResult = await model.generateContent(bodyPrompt);
      const emailBody = bodyResult.response.text();
      
      // Send email
      await sendEmailViaMCP(email, subject, emailBody, { accountId, isHtml: false });
      
      toast.success(`Email sent to ${email} successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });
      
      return `✅ Email sent successfully to ${email} about "${subject}". The email body was generated using AI and sent via the MCP email service.`;
    }
    
    // Check emails command
    if (question.toLowerCase().includes('check my emails') || question.toLowerCase().includes('recent emails')) {
      const accountsResponse = await getEmailAccounts();
      if (!accountsResponse.success || !accountsResponse.data || accountsResponse.data.length === 0) {
        return "No email accounts configured.";
      }
      
      const accountId = accountsResponse.data[0].id;
      const emailsResponse = await getRecentEmails(accountId, 5);
      
      if (!emailsResponse.success) {
        return `Failed to get emails: ${emailsResponse.error}`;
      }
      
      const emails = emailsResponse.data;
      let response = `📧 Recent Emails (${emails.length}):\n\n`;
      
      emails.forEach((email, index) => {
        response += `${index + 1}. From: ${email.fromName || email.from}\n`;
        response += `   Subject: ${email.subject}\n`;
        response += `   Date: ${new Date(email.date).toLocaleString()}\n`;
        response += `   Preview: ${email.preview?.substring(0, 100)}...\n\n`;
      });
      
      return response;
    }
    
    return "Email command not recognized. Try: 'Send email to [email] about [subject]' or 'Check my emails'";
  } catch (error) {
    console.error('Error handling email command:', error);
    return `Error with email command: ${error.message}`;
  }
}

// Enhanced LinkedIn command handler
async function handleLinkedInCommand(question, userData, genAI) {
  try {
    const lowerQuestion = question.toLowerCase();
    
    // Create LinkedIn post commands
    if (lowerQuestion.includes('create linkedin post') || lowerQuestion.includes('linkedin post about')) {
      const postMatch = question.match(/create linkedin post about (.+)/i) || 
                       question.match(/linkedin post about (.+)/i);
      
      if (postMatch) {
        const [, topic] = postMatch;
        
        // Determine post type based on content
        let postType = 'professional';
        if (lowerQuestion.includes('achievement') || lowerQuestion.includes('won') || lowerQuestion.includes('success')) {
          postType = 'achievement';
        } else if (lowerQuestion.includes('insight') || lowerQuestion.includes('thought') || lowerQuestion.includes('opinion')) {
          postType = 'insight';
        } else if (lowerQuestion.includes('question') || lowerQuestion.includes('ask')) {
          postType = 'engagement';
        }
        
        const result = await generateLinkedInPost(topic, postType, { postImmediately: true });
        
        if (result.success) {
          const postedStatus = result.data.posted ? 
            `\n\n🚀 **POSTED TO LINKEDIN!**\n🔗 Post URL: ${result.data.postUrl}\n📊 Post ID: ${result.data.postId}` : 
            `\n\nWould you like me to post this to LinkedIn? Use "post this to LinkedIn" to publish it.`;
            
          toast.success('LinkedIn post generated successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
          
          return `✅ LinkedIn ${postType} post generated successfully!${postedStatus}\n\n📝 Enhanced Content:\n${result.data.enhancedContent}\n\n💡 Improvements: ${result.data.improvements.join(', ')}\n\n📊 Character count: ${result.data.wordCount} words\n\n🎯 Post Type: ${postType}`;
        } else {
          return `Failed to generate LinkedIn post: ${result.message}`;
        }
      }
    }
    
    // Quick post command
    if (lowerQuestion.includes('quick post') || lowerQuestion.includes('post this')) {
      const quickMatch = question.match(/quick post (.+)/i) || 
                        question.match(/post this (.+)/i);
      
      if (quickMatch) {
        const [, message] = quickMatch;
        
        const result = await generateQuickLinkedInPost(message, true);
        
        if (result.success) {
          toast.success('Quick LinkedIn post generated!', {
            position: "top-right",
            autoClose: 3000,
          });
          
          return `✅ Quick LinkedIn post generated!\n\n📝 Enhanced Content:\n${result.data.enhancedContent}\n\n💡 Improvements: ${result.data.improvements.join(', ')}\n\n📊 Character count: ${result.data.characterCount}\n\nUse "post this to LinkedIn" to publish it.`;
        } else {
          return `Failed to generate quick post: ${result.message}`;
        }
      }
    }
    
    // Post immediately command
    if (lowerQuestion.includes('post this to linkedin') || lowerQuestion.includes('post to linkedin')) {
      // Extract content from the question or use the last generated content
      const contentMatch = question.match(/post this to linkedin[:\s]*(.+)/i);
      if (contentMatch) {
        const [, content] = contentMatch;
        const result = await createLinkedInPost(content.trim());
        
        if (result.success) {
          toast.success('LinkedIn post published successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
          
          return `✅ LinkedIn post published successfully!\n\n📝 Content: ${content}\n\n🔗 Post URL: ${result.data.url}\n\n📊 Post ID: ${result.data.postId}\n\nYour post is now live on LinkedIn!`;
        } else {
          return `Failed to post to LinkedIn: ${result.message}`;
        }
      } else {
        return `Please provide the content to post. Example: "Post this to LinkedIn: [your content]"`;
      }
    }
    
    // Generate specific post types
    if (lowerQuestion.includes('hackindia post') || lowerQuestion.includes('hackindia')) {
      const statusMatch = question.match(/hackindia post (.+)/i);
      const status = statusMatch ? statusMatch[1] : 'finalist';
      
      const result = await generateHackIndiaPost(status);
      
      // Post to LinkedIn immediately after generation
      if (result.success) {
        const postResult = await createLinkedInPost(result.data.content);
        if (postResult.success) {
          result.data.posted = true;
          result.data.postId = postResult.data.postId;
          result.data.postUrl = postResult.data.url;
        }
      }
      
      if (result.success) {
        const postedStatus = result.data.posted ? 
          `\n\n🚀 **POSTED TO LINKEDIN!**\n🔗 Post URL: ${result.data.postUrl}\n📊 Post ID: ${result.data.postId}` : 
          `\n\nUse "post this to LinkedIn" to publish it.`;
          
        return `✅ HackIndia ${status} post generated!${postedStatus}\n\n📝 Content:\n${result.data.content}\n\n📊 Word count: ${result.data.metadata.wordCount}\n\n🎯 Engagement score: ${result.data.metadata.estimatedEngagement.level}\n\n💡 Suggested media: ${result.data.suggestedMedia.join(', ')}`;
      } else {
        return `Failed to generate HackIndia post: ${result.message}`;
      }
    }
    
    if (lowerQuestion.includes('achievement post')) {
      const achievementMatch = question.match(/achievement post (.+)/i);
      if (achievementMatch) {
        const [, achievement] = achievementMatch;
        const result = await generateAchievementPost(achievement);
        
        if (result.success) {
          return `✅ Achievement post generated!\n\n📝 Content:\n${result.data.content}\n\n📊 Word count: ${result.data.metadata.wordCount}\n\n🎯 Engagement score: ${result.data.metadata.estimatedEngagement.level}\n\nUse "post this to LinkedIn" to publish it.`;
        } else {
          return `Failed to generate achievement post: ${result.message}`;
        }
      }
    }
    
    if (lowerQuestion.includes('insight post')) {
      const insightMatch = question.match(/insight post about (.+)/i);
      if (insightMatch) {
        const [, topic] = insightMatch;
        const result = await generateInsightPost(topic, `My thoughts on ${topic}`);
        
        if (result.success) {
          return `✅ Insight post generated!\n\n📝 Content:\n${result.data.content}\n\n📊 Word count: ${result.data.metadata.wordCount}\n\n🎯 Engagement score: ${result.data.metadata.estimatedEngagement.level}\n\nUse "post this to LinkedIn" to publish it.`;
        } else {
          return `Failed to generate insight post: ${result.message}`;
        }
      }
    }
    
    if (lowerQuestion.includes('engagement post') || lowerQuestion.includes('question post')) {
      const questionMatch = question.match(/engagement post (.+)/i) || 
                           question.match(/question post (.+)/i);
      if (questionMatch) {
        const [, questionText] = questionMatch;
        const result = await generateEngagementPost(questionText);
        
        if (result.success) {
          return `✅ Engagement post generated!\n\n📝 Content:\n${result.data.content}\n\n📊 Word count: ${result.data.metadata.wordCount}\n\n🎯 Expected responses: ${result.data.metadata.expectedResponses}\n\nUse "post this to LinkedIn" to publish it.`;
        } else {
          return `Failed to generate engagement post: ${result.message}`;
        }
      }
    }
    
    // Enhance existing content
    if (lowerQuestion.includes('enhance') && lowerQuestion.includes('linkedin')) {
      const enhanceMatch = question.match(/enhance linkedin post (.+)/i);
      if (enhanceMatch) {
        const [, content] = enhanceMatch;
        const result = await enhanceLinkedInPost(content);
        
        if (result.success) {
          return `✅ LinkedIn post enhanced!\n\n📝 Enhanced Content:\n${result.data.enhancedContent}\n\n💡 Improvements: ${result.data.improvements.join(', ')}\n\nUse "post this to LinkedIn" to publish it.`;
        } else {
          return `Failed to enhance post: ${result.message}`;
        }
      }
    }
    
    // Check LinkedIn messages command
    if (lowerQuestion.includes('linkedin messages') || lowerQuestion.includes('check linkedin')) {
      const messagesResponse = await getLinkedInMessages(5);
      
      if (!messagesResponse.success) {
        return `Failed to get LinkedIn messages: ${messagesResponse.error}`;
      }
      
      const messages = messagesResponse.data;
      let response = `💼 Recent LinkedIn Messages (${messages.length}):\n\n`;
      
      messages.forEach((message, index) => {
        response += `${index + 1}. From: ${message.from?.name || 'Unknown'}\n`;
        response += `   Subject: ${message.subject || 'No Subject'}\n`;
        response += `   Date: ${new Date(message.date).toLocaleString()}\n`;
        response += `   Preview: ${message.content?.substring(0, 100)}...\n\n`;
      });
      
      return response;
    }
    
    // Check unread messages
    if (lowerQuestion.includes('unread linkedin') || lowerQuestion.includes('linkedin unread')) {
      const unreadResponse = await getUnreadLinkedInMessages(10);
      
      if (!unreadResponse.success) {
        return `Failed to get unread LinkedIn messages: ${unreadResponse.error}`;
      }
      
      const messages = unreadResponse.data;
      let response = `📬 Unread LinkedIn Messages (${messages.length}):\n\n`;
      
      messages.forEach((message, index) => {
        response += `${index + 1}. From: ${message.from}\n`;
        response += `   Subject: ${message.subject}\n`;
        response += `   Priority: ${message.priority}\n`;
        response += `   Preview: ${message.preview}\n\n`;
      });
      
      return response;
    }
    
    // LinkedIn message summary
    if (lowerQuestion.includes('linkedin summary') || lowerQuestion.includes('linkedin analytics')) {
      const summaryResponse = await getLinkedInMessageSummary();
      
      if (!summaryResponse.success) {
        return `Failed to get LinkedIn summary: ${summaryResponse.error}`;
      }
      
      const data = summaryResponse.data;
      return `📊 LinkedIn Message Summary:\n\n📈 Total Messages: ${data.totalMessages}\n📬 Unread: ${data.unreadCount}\n👥 Unique Senders: ${data.uniqueSenders}\n\n📋 Categories:\n• Networking: ${data.categories.networking}\n• Job Opportunities: ${data.categories.job}\n• Collaboration: ${data.categories.collaboration}\n• Sales: ${data.categories.sales}\n\n🚨 Urgent Messages: ${data.urgentMessages}\n\nRecent Activity:\n${data.recentActivity.map((msg, i) => `${i+1}. ${msg.from}: ${msg.subject}`).join('\n')}`;
    }
    
    // Get LinkedIn accounts
    if (lowerQuestion.includes('linkedin accounts') || lowerQuestion.includes('linkedin account')) {
      const accountsResponse = await getLinkedInAccounts();
      
      if (!accountsResponse.success) {
        return `Failed to get LinkedIn accounts: ${accountsResponse.error}`;
      }
      
      const accounts = accountsResponse.data;
      let response = `🔗 LinkedIn Accounts (${accounts.length}):\n\n`;
      
      accounts.forEach((account, index) => {
        response += `${index + 1}. ${account.name}\n`;
        response += `   Status: ${account.status}\n`;
        response += `   Provider: ${account.provider}\n`;
        response += `   Profile: ${account.profileUrl || 'N/A'}\n\n`;
      });
      
      return response;
    }
    
    // Get LinkedIn posts
    if (lowerQuestion.includes('my linkedin posts') || lowerQuestion.includes('linkedin posts')) {
      const postsResponse = await getLinkedInPosts(5);
      
      if (!postsResponse.success) {
        return `Failed to get LinkedIn posts: ${postsResponse.error}`;
      }
      
      const posts = postsResponse.data;
      let response = `📝 Recent LinkedIn Posts (${posts.length}):\n\n`;
      
      posts.forEach((post, index) => {
        response += `${index + 1}. ${post.content?.substring(0, 100)}...\n`;
        response += `   Likes: ${post.likes} | Comments: ${post.comments} | Shares: ${post.shares}\n`;
        response += `   Date: ${new Date(post.createdAt).toLocaleString()}\n\n`;
      });
      
      return response;
    }
    
    return `LinkedIn command not recognized. Available commands:\n\n📝 Post Creation:\n• "Create LinkedIn post about [topic]"\n• "Quick post [message]"\n• "HackIndia post [status]"\n• "Achievement post [achievement]"\n• "Insight post about [topic]"\n• "Engagement post [question]"\n\n📤 Publishing:\n• "Post this to LinkedIn: [content]"\n\n📊 Analytics:\n• "Check LinkedIn messages"\n• "Unread LinkedIn messages"\n• "LinkedIn summary"\n• "My LinkedIn posts"\n• "LinkedIn accounts"\n\n🔧 Enhancement:\n• "Enhance LinkedIn post [content]"`;
  } catch (error) {
    console.error('Error handling LinkedIn command:', error);
    return `Error with LinkedIn command: ${error.message}`;
  }
}

// LLM-powered WhatsApp command parser
async function parseWhatsAppCommandWithLLM(question, genAI) {
  try {
    const prompt = `
You are an intelligent WhatsApp command parser. Parse the following user command and extract the relevant information.

User Command: "${question}"

Please analyze this command and return a JSON response with the following structure:

For IMMEDIATE messages:
{
  "type": "immediate",
  "recipient": "name or phone number",
  "message": "message content",
  "isGroup": true/false
}

For SCHEDULED messages:
{
  "type": "scheduled", 
  "recipient": "name or phone number",
  "message": "message content",
  "schedule": {
    "type": "relative|absolute",
    "time": "5 mins|2 hours|at 3pm|at 15:30",
    "description": "human readable time"
  },
  "isGroup": true/false
}

For LIST/CANCEL commands:
{
  "type": "list" // or "cancel"
}

IMPORTANT RULES:
1. If the command mentions scheduling (in X mins, at X time), use "scheduled" type
2. Extract the EXACT recipient name/group name as mentioned
3. Extract the EXACT message content as intended - do NOT include scheduling words in the message
4. Set isGroup to true if recipient sounds like a group name (multiple words, group indicators)
5. If unclear, prefer individual message over group
6. Return ONLY valid JSON, no additional text
7. For scheduling commands, separate the message content from the time specification

Examples:
- "message anshul saying hello" → {"type":"immediate","recipient":"anshul","message":"hello","isGroup":false}
- "send message to teen tigada kam bigada saying hello all" → {"type":"immediate","recipient":"teen tigada kam bigada","message":"hello all","isGroup":true}
- "message john saying meeting reminder in 5 mins" → {"type":"scheduled","recipient":"john","message":"meeting reminder","schedule":{"type":"relative","time":"5 mins","description":"in 5 minutes"},"isGroup":false}
- "send a message to anshul in 1 min" → {"type":"scheduled","recipient":"anshul","message":"Hello from admin!","schedule":{"type":"relative","time":"1 min","description":"in 1 minute"},"isGroup":false}
- "message anshul hello in 1 min" → {"type":"scheduled","recipient":"anshul","message":"hello","schedule":{"type":"relative","time":"1 min","description":"in 1 minute"},"isGroup":false}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('LLM WhatsApp parsing result:', text);
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('Parsed WhatsApp command:', parsed);
      return parsed;
    }
    
    throw new Error('No valid JSON found in LLM response');
  } catch (error) {
    console.error('LLM parsing failed:', error);
    return null;
  }
}

// Handle WhatsApp commands
async function handleWhatsAppCommand(question, userData, genAI) {
  try {
    console.log('Processing WhatsApp command:', question);
    
    // First, try LLM-powered parsing
    const llmParsed = await parseWhatsAppCommandWithLLM(question, genAI);
    
    if (llmParsed) {
      console.log('Using LLM parsed result:', llmParsed);
      
      // Handle different command types
      if (llmParsed.type === 'immediate') {
        return await executeImmediateMessage(llmParsed, userData);
      } else if (llmParsed.type === 'scheduled') {
        return await executeScheduledMessage(llmParsed, userData);
      } else if (llmParsed.type === 'list') {
        return getScheduledMessagesList();
      } else if (llmParsed.type === 'cancel') {
        // Extract message ID from the command if provided
        const cancelMatch = question.match(/cancel.*?([a-zA-Z0-9_-]+)/i);
        if (cancelMatch) {
          return cancelScheduledMessage(cancelMatch[1]);
        }
        return "Please provide a message ID to cancel: 'cancel message [message-id]'";
      }
    }
    
    // Fallback to regex parsing if LLM fails
    console.log('LLM parsing failed, falling back to regex parsing');
    
    // Smart parsing for different message formats
    let recipient = null;
    let message = null;
    
    // Pattern 1: "message the group [group name] saying [message]"
    let match = question.match(/message the group (.+?) saying (.+)/i);
    if (match) {
      [, recipient, message] = match;
    } else {
      // Pattern 2: "message [group name] saying [message]"
      match = question.match(/message (.+?) saying (.+)/i);
      if (match) {
        [, recipient, message] = match;
      } else {
        // Pattern 3: "message [group name] [message]" - be more careful with this one
        match = question.match(/message (.+?) (.+)/i);
        if (match) {
          const [, potentialRecipient, potentialMessage] = match;
          
          // If the potential message is very short (1-2 words), it might be part of the recipient
          const messageWords = potentialMessage.trim().split(/\s+/);
          if (messageWords.length <= 2) {
            // Treat everything as recipient, use a default message
            recipient = potentialRecipient + ' ' + potentialMessage;
            message = 'Hello from admin!';
          } else {
            // Use the first part as recipient, rest as message
            recipient = potentialRecipient;
            message = potentialMessage;
          }
        }
      }
    }
    
    // Fallback patterns for other formats
    if (!recipient || !message) {
      const patterns = [
        /send whatsapp message to (.+?) saying (.+)/i,
        /message (.+?) on whatsapp (.+)/i,
        /send (.+?) to (.+?) on whatsapp/i,
        /whatsapp (.+?) to (.+)/i,
        /text (.+?) saying (.+)/i
      ];
      
      for (const pattern of patterns) {
        const match = question.match(pattern);
        if (match) {
          if (pattern.source.includes('send (.+?) to (.+?) on whatsapp')) {
            [, message, recipient] = match;
          } else {
            [, recipient, message] = match;
          }
          break;
        }
      }
    }
    
    // Special handling for "message anshul on whatsapp"
    if (question.toLowerCase().includes('message anshul') && !recipient) {
      recipient = 'anshul';
      message = 'Hello from admin! How are you doing?';
    }
    
    console.log('WhatsApp command parsing result:', { recipient, message, question });
    
    // Check if this is a scheduled message command
    const scheduleMatch = question.match(/(send|message)\s+(.+?)\s+(?:saying|with|message)\s+(.+?)\s+(?:in|at)\s+(.+)/i);
    if (scheduleMatch) {
      const [, action, recipient, message, timeString] = scheduleMatch;
      const scheduleInfo = parseScheduleTime(timeString);
      
      if (scheduleInfo) {
        const messageId = scheduleMessage(recipient.trim(), message.trim(), scheduleInfo, userData);
        
        const timeDescription = scheduleInfo.type === 'relative' 
          ? `in ${timeString}` 
          : `at ${scheduleInfo.scheduledTime.toLocaleTimeString()}`;
        
        return `⏰ Message Scheduled Successfully!\n\n📱 Recipient: ${recipient.trim()}\n💬 Message: ${message.trim()}\n⏰ Schedule: ${timeDescription}\n🆔 Schedule ID: ${messageId}\n\n✅ Your message will be sent automatically!`;
      } else {
        return `❌ Invalid time format!\n\nPlease use formats like:\n• "send message to John saying hello in 5 mins"\n• "message Sarah saying meeting at 3pm"\n• "send message to team saying reminder in 2 hours"`;
      }
    }
    
    if (recipient && message) {
      console.log('Extracted recipient:', recipient, 'message:', message);
      
      // Check if it's a phone number or group name
      const isPhoneNumber = /^\+?[\d\s\-\(\)]+$/.test(recipient.trim());
      
      let result;
      if (isPhoneNumber) {
        result = await sendWhatsAppMessage(recipient.trim(), message);
      } else {
        // Try to send to group first, then fall back to contact
        try {
          result = await sendWhatsAppToGroup(recipient.trim(), message);
        } catch (groupError) {
          console.log('Failed to send to group, trying as contact:', groupError);
          // For contacts, we might need a phone number
          result = await sendWhatsAppMessage(recipient.trim(), message);
        }
      }
      
      console.log('WhatsApp command result:', result);
      
      if (result.success) {
        toast.success('WhatsApp message sent successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        // Handle different response formats
        const messageId = result.data?.messageId || result.message_id || result.data?.message_id || 'Unknown';
        
        return `✅ WhatsApp message sent successfully to ${recipient}!\n\n📱 Message: ${message}\n📊 Message ID: ${messageId}`;
      } else {
        return `Failed to send WhatsApp message: ${result.message}. Please check if the WhatsApp MCP service is running on port 3002.`;
      }
    }
    
    // Post WhatsApp status command
    const statusMatch = question.match(/post whatsapp status about (.+)/i);
    
    if (statusMatch) {
      const [, topic] = statusMatch;
      
      const result = await postWhatsAppStatus(topic);
      
      if (result.success) {
        toast.success('WhatsApp status posted successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        return `✅ WhatsApp status posted successfully!\n\n📱 Status: ${topic}\n\n📊 Status ID: ${result.data.statusId}`;
      } else {
        return `Failed to post WhatsApp status: ${result.message}`;
      }
    }
    
    // Check WhatsApp messages command
    if (question.toLowerCase().includes('whatsapp messages') || question.toLowerCase().includes('check whatsapp')) {
      const messagesResponse = await getWhatsAppMessages(5);
      
      if (!messagesResponse.success) {
        return `Failed to get WhatsApp messages: ${messagesResponse.error}`;
      }
      
      const messages = messagesResponse.data;
      let response = `📱 Recent WhatsApp Messages (${messages.length}):\n\n`;
      
      messages.forEach((message, index) => {
        response += `${index + 1}. From: ${message.senderName || 'Unknown'}\n`;
        response += `   Group: ${message.isGroup ? message.groupName || 'Yes' : 'No'}\n`;
        response += `   Date: ${new Date(message.timestamp).toLocaleString()}\n`;
        response += `   Message: ${message.content?.substring(0, 100)}...\n\n`;
      });
      
      return response;
    }
    
    // List WhatsApp groups command
    if (question.toLowerCase().includes('whatsapp groups') || question.toLowerCase().includes('list groups')) {
      const groupsResponse = await getWhatsAppGroups();
      
      if (!groupsResponse.success) {
        return `Failed to get WhatsApp groups: ${groupsResponse.error}`;
      }
      
      const groups = groupsResponse.data;
      let response = `📱 WhatsApp Groups (${groups.length}):\n\n`;
      
      groups.forEach((group, index) => {
        response += `${index + 1}. ${group.name}\n`;
        response += `   Participants: ${group.participantCount || 'Unknown'}\n`;
        response += `   Last Activity: ${group.lastActivity ? new Date(group.lastActivity).toLocaleString() : 'Unknown'}\n\n`;
      });
      
      return response;
    }
    
    return "WhatsApp command not recognized. Try: 'Send WhatsApp message to [number/group] saying [message]', 'Post WhatsApp status about [topic]', 'Check WhatsApp messages', or 'List WhatsApp groups'";
  } catch (error) {
    console.error('Error handling WhatsApp command:', error);
    return `Error with WhatsApp command: ${error.message}`;
  }
}

// Check MCP service status
async function checkMCPStatus() {
  const services = [
    { name: 'Email Service', url: EMAIL_SERVICE_URL, endpoint: '/health' },
    { name: 'LinkedIn Service', url: LINKEDIN_SERVICE_URL, endpoint: '/' },
    { name: 'WhatsApp Service', url: WHATSAPP_SERVICE_URL, endpoint: '/' },
    { name: 'X (Twitter) Service', url: X_SERVICE_URL, endpoint: '/health' }
  ];
  
  let response = '🔧 MCP Service Status:\n\n';
  
  for (const service of services) {
    try {
      const result = await fetch(`${service.url}${service.endpoint}`, { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (result.ok) {
        response += `✅ ${service.name}: Online\n`;
      } else {
        response += `❌ ${service.name}: Error (${result.status})\n`;
      }
    } catch (error) {
      response += `❌ ${service.name}: Offline\n`;
    }
  }
  
  response += '\n💡 Available integrations:\n';
  response += '📧 Email: Send emails, check accounts, get recent emails\n';
  response += '💼 LinkedIn: AI-powered post generation, content enhancement, analytics, message management\n';
  response += '📱 WhatsApp: Send messages, post status, manage groups\n';
  response += '🐦 X (Twitter): AI-enhanced tweet creation, content preview, HackIndia posts\n';
  
  response += '\n🚀 LinkedIn Features:\n';
  response += '• AI-enhanced post generation (achievement, insight, engagement)\n';
  response += '• Quick post creation from one-liners\n';
  response += '• Content enhancement and optimization\n';
  response += '• Message analytics and management\n';
  response += '• HackIndia-specific post templates\n';
  
  response += '\n🐦 X (Twitter) Features:\n';
  response += '• AI-enhanced tweet creation with emojis and hashtags\n';
  response += '• Content preview before posting\n';
  response += '• Quick tweet posting\n';
  response += '• HackIndia-specific tweet templates\n';
  response += '• Character count optimization (280 limit)\n';
  
  return response;
}

// Get recent messages from all services
async function getRecentMessagesFromAllServices() {
  let response = '📬 Recent Messages from All Platforms:\n\n';
  
  // Get email messages
  try {
    const accountsResponse = await getEmailAccounts();
    if (accountsResponse.success && accountsResponse.data && accountsResponse.data.length > 0) {
      const emailsResponse = await getRecentEmails(accountsResponse.data[0].id, 3);
      if (emailsResponse.success) {
        response += `📧 Recent Emails (${emailsResponse.data.length}):\n`;
        emailsResponse.data.forEach((email, index) => {
          response += `  ${index + 1}. ${email.fromName || email.from}: ${email.subject}\n`;
        });
        response += '\n';
      }
    }
  } catch (error) {
    response += '📧 Email Service: Unavailable\n\n';
  }
  
  // Get LinkedIn messages
  try {
    const linkedinResponse = await getLinkedInMessages(3);
    if (linkedinResponse.success) {
      response += `💼 Recent LinkedIn Messages (${linkedinResponse.data.length}):\n`;
      linkedinResponse.data.forEach((message, index) => {
        response += `  ${index + 1}. ${message.from?.name || 'Unknown'}: ${message.subject || 'No Subject'}\n`;
      });
      response += '\n';
    }
  } catch (error) {
    response += '💼 LinkedIn Service: Unavailable\n\n';
  }
  
  // Get WhatsApp messages
  try {
    const whatsappResponse = await getWhatsAppMessages(3);
    if (whatsappResponse.success) {
      response += `📱 Recent WhatsApp Messages (${whatsappResponse.data.length}):\n`;
      whatsappResponse.data.forEach((message, index) => {
        response += `  ${index + 1}. ${message.senderName || 'Unknown'}: ${message.content?.substring(0, 50)}...\n`;
      });
      response += '\n';
    }
  } catch (error) {
    response += '📱 WhatsApp Service: Unavailable\n\n';
  }
  
  return response;
}

// Handle X (Twitter) commands
async function handleXCommand(question, userData, genAI) {
  try {
    const lowerQuestion = question.toLowerCase();
    
    // Create X post commands
    if (lowerQuestion.includes('create x post') || lowerQuestion.includes('tweet about') || lowerQuestion.includes('post to x')) {
      const postMatch = question.match(/create x post about (.+)/i) || 
                       question.match(/tweet about (.+)/i) ||
                       question.match(/post to x (.+)/i);
      
      if (postMatch) {
        const [, content] = postMatch;
        
        const result = await createXPost(content, { enhanceWithAI: true });
        
        if (result.success) {
          toast.success('X post created successfully!', {
            position: "top-right",
            autoClose: 3000,
          });
          
          return `✅ X post created successfully!\n\n🐦 Content: ${result.data.content}\n\n📊 Tweet ID: ${result.data.tweetId}\n\n🔗 View: https://x.com/yourusername/status/${result.data.tweetId}`;
        } else {
          return `Failed to create X post: ${result.message}`;
        }
      }
    }
    
    // Quick tweet command
    if (lowerQuestion.includes('quick tweet') || lowerQuestion.includes('tweet this')) {
      const quickMatch = question.match(/quick tweet (.+)/i) || 
                        question.match(/tweet this (.+)/i);
      
      if (quickMatch) {
        const [, content] = quickMatch;
        
        const result = await createXPost(content, { enhanceWithAI: true });
        
        if (result.success) {
          toast.success('Quick tweet posted!', {
            position: "top-right",
            autoClose: 3000,
          });
          
          return `✅ Quick tweet posted!\n\n🐦 Content: ${result.data.content}\n\n📊 Tweet ID: ${result.data.tweetId}`;
        } else {
          return `Failed to post quick tweet: ${result.message}`;
        }
      }
    }
    
    // Preview content command
    if (lowerQuestion.includes('preview x') || lowerQuestion.includes('preview tweet')) {
      const previewMatch = question.match(/preview x (.+)/i) || 
                          question.match(/preview tweet (.+)/i);
      
      if (previewMatch) {
        const [, content] = previewMatch;
        
        const result = await previewXContent(content);
        
        if (result.success) {
          return `📝 X Post Preview:\n\n🔸 Original: ${content}\n\n🔸 Enhanced: ${result.data.enhancedContent}\n\n📊 Character count: ${result.data.characterCount}/280\n\nUse "create x post" to publish it.`;
        } else {
          return `Failed to preview content: ${result.message}`;
        }
      }
    }
    
    // HackIndia X post command
    if (lowerQuestion.includes('hackindia tweet') || lowerQuestion.includes('hackindia x')) {
      const statusMatch = question.match(/hackindia tweet (.+)/i) || 
                         question.match(/hackindia x (.+)/i);
      const status = statusMatch ? statusMatch[1] : 'finalist';
      
      const hackIndiaContent = `Excited to share that our team has made it to the ${status} round of HackIndia! 🚀 Building something amazing and can't wait to showcase our innovation. #HackIndia #Innovation #Tech`;
      
      const result = await createXPost(hackIndiaContent, { enhanceWithAI: true });
      
      if (result.success) {
        toast.success('HackIndia tweet posted!', {
          position: "top-right",
          autoClose: 3000,
        });
        
        return `✅ HackIndia ${status} tweet posted!\n\n🐦 Content: ${result.data.content}\n\n📊 Tweet ID: ${result.data.tweetId}\n\n🔗 View: https://x.com/yourusername/status/${result.data.tweetId}`;
      } else {
        return `Failed to post HackIndia tweet: ${result.message}`;
      }
    }
    
    return `X command not recognized. Available commands:\n\n🐦 Post Creation:\n• "Create X post about [topic]"\n• "Tweet about [content]"\n• "Post to X [content]"\n• "Quick tweet [message]"\n• "Tweet this [content]"\n\n📝 Preview:\n• "Preview X [content]"\n• "Preview tweet [content]"\n\n🏆 Special:\n• "HackIndia tweet [status]"\n• "HackIndia X [status]"`;
  } catch (error) {
    console.error('Error handling X command:', error);
    return `Error with X command: ${error.message}`;
  }
}

// Handle regular task flow (same as regular AI)
async function handleRegularTaskFlow(question, userData, presentData, conversationHistory, taskDetection, meetingState, conversationTopic, urls) {
  // This would contain the same logic as the regular AI service for handling tasks and meetings
  // For now, we'll redirect to the regular AI service for these cases
  const { getAnswer } = await import('./ai.jsx');
  return await getAnswer(question, userData, presentData, conversationHistory);
}

// Test function to verify WhatsApp service
export async function testWhatsAppService() {
  try {
    console.log('Testing WhatsApp service connection...');
    const response = await fetch(`${WHATSAPP_SERVICE_URL}/`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('WhatsApp service is running:', data);
      return { success: true, data };
    } else {
      console.log('WhatsApp service responded with status:', response.status);
      return { success: false, error: `Service returned status ${response.status}` };
    }
  } catch (error) {
    console.error('WhatsApp service test failed:', error);
    return { success: false, error: error.message };
  }
}

// Export the updatePrompt function as well
export { updatePrompt };
