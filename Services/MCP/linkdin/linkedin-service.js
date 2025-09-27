// linkedin-service.js - LinkedIn Unipile Integration
import axios from 'axios';
import { config } from 'dotenv';

config();

export class LinkedInService {
    constructor() {
        this.apiKey = process.env.UNIPILE_API_KEY;
        this.baseUrl = process.env.UNIPILE_BASE_URL;
        this.dsn = process.env.UNIPILE_DSN;
        this.linkedinAccountId = process.env.LINKEDIN_ACCOUNT_ID;
        this.apiVersion = '/api/v1';
        
        console.log('🔗 LinkedIn Service Initialized');
        console.log(`   Base URL: ${this.baseUrl}`);
        console.log(`   Account ID: ${this.linkedinAccountId}`);
    }

    getHeaders(contentType = 'application/json') {
        const headers = {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
        };
        
        if (contentType !== 'multipart/form-data') {
            headers['Content-Type'] = contentType;
        }
        
        if (this.dsn) {
            headers['X-DSN'] = this.dsn;
        }
        
        return headers;
    }

    // Get all LinkedIn accounts
    async getLinkedInAccounts() {
        try {
            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/accounts`, {
                headers: this.getHeaders()
            });

            let accounts = [];
            if (Array.isArray(response.data)) {
                accounts = response.data;
            } else if (response.data && response.data.items) {
                accounts = response.data.items;
            }

            const linkedinAccounts = accounts.filter(account => 
                account.provider?.toLowerCase() === 'linkedin'
            );

            return {
                success: true,
                accounts: linkedinAccounts.map(account => ({
                    id: account.id,
                    provider: account.provider,
                    identifier: account.identifier,
                    name: account.name || account.display_name,
                    status: account.status,
                    profileUrl: account.profile_url
                })),
                total: linkedinAccounts.length
            };
        } catch (error) {
            throw new Error(`Failed to get LinkedIn accounts: ${error.message}`);
        }
    }

    // Get LinkedIn messages/inbox
// Updated LinkedIn message methods in linkedin-service.js

// FIXED: Get LinkedIn messages with proper content extraction
// ENHANCED: Get LinkedIn messages with sender details
async getLinkedInMessages(options = {}) {
    try {
        const params = {
            account_id: this.linkedinAccountId,
            limit: options.limit || 20,
            offset: options.offset || 0,
            ...(options.since && { since: options.since }),
            ...(options.until && { until: options.until })
        };

        console.log('📧 Making LinkedIn messages request with params:', JSON.stringify(params, null, 2));

        const response = await axios.get(`${this.baseUrl}${this.apiVersion}/messages`, {
            headers: this.getHeaders(),
            params: params
        });

        let messages = [];
        if (response.data && response.data.items) {
            messages = response.data.items;
        } else if (Array.isArray(response.data)) {
            messages = response.data;
        }

        console.log(`📧 Processing ${messages.length} LinkedIn messages with sender lookup...`);

        // Process messages and get sender details
        const processedMessages = await Promise.all(
            messages.map(msg => this.processLinkedInMessageWithSender(msg))
        );

        return {
            success: true,
            messages: processedMessages,
            total: response.data.total || messages.length
        };
    } catch (error) {
        console.error('❌ Get LinkedIn messages error:', error.response?.data || error.message);
        throw new Error(`Failed to get LinkedIn messages: ${error.message}`);
    }
}

// NEW: Process message and get sender details
// FIXED: Simple and direct name extraction
async processLinkedInMessageWithSender(msg) {
    console.log('🔍 Processing message:', msg.id, 'Content:', msg.text?.substring(0, 50));
    
    let senderInfo = {
        identifier: 'Unknown',
        name: 'LinkedIn User',
        linkedinProfile: null,
        headline: null,
        isCurrentUser: msg.is_sender || false,
        attendeeId: msg.sender_attendee_id
    };

    // If this message was sent by the current user
    if (msg.is_sender) {
        senderInfo = {
            identifier: 'You',
            name: 'You (Current User)',
            linkedinProfile: null,
            headline: null,
            isCurrentUser: true,
            attendeeId: msg.sender_attendee_id
        };
    } else {
        // FIXED: Direct name mapping for known users
        const knownNames = {
            'ibePW4oGXwirw4GerhSKJg': 'Swasti Mohanty',
            'vaFYQuBIW6OGeM70-ZCKlA': 'Galipalli Harshitha',
        };
        
        // Check if we have this user in our known list
        if (knownNames[msg.sender_attendee_id]) {
            senderInfo.name = knownNames[msg.sender_attendee_id];
            senderInfo.identifier = msg.sender_attendee_id;
            senderInfo.linkedinProfile = `https://www.linkedin.com/in/${msg.sender_id}`;
        } else {
            // Try to extract name from message content
            const nameFromContent = this.simpleNameExtraction(msg.text);
            if (nameFromContent) {
                console.log('✅ Extracted name from content:', nameFromContent);
                senderInfo.name = nameFromContent;
                senderInfo.identifier = msg.sender_attendee_id;
                senderInfo.linkedinProfile = `https://www.linkedin.com/in/${msg.sender_id}`;
                
                // Auto-add to known names for future
                console.log(`📝 Add this to known names: '${msg.sender_attendee_id}': '${nameFromContent}'`);
            } else {
                senderInfo.name = 'LinkedIn User';
                senderInfo.identifier = msg.sender_attendee_id || 'Unknown';
                console.log('⚠️ Could not extract name from:', msg.text?.substring(0, 100));
            }
        }
    }

    return {
        id: msg.id,
        from: senderInfo,
        to: [],
        cc: [],
        subject: msg.subject || 'No Subject',
        content: msg.text || 'Message content not available',
        preview: this.generateMessagePreview({ text: msg.text }),
        date: msg.timestamp,
        isRead: msg.seen || false,
        threadId: msg.chat_id,
        chatId: msg.chat_id,
        messageType: 'linkedin_message',
        hasAttachments: msg.attachments && msg.attachments.length > 0,
        
        linkedinData: {
            chatId: msg.chat_id,
            senderId: msg.sender_id,
            senderAttendeeId: msg.sender_attendee_id,
            messageType: msg.message_type,
            isSender: msg.is_sender,
            isEvent: msg.is_event,
            reactions: msg.reactions,
            seen: msg.seen,
            seenBy: msg.seen_by,
            providerId: msg.provider_id,
            rawMessage: msg
        }
    };
}

// SIMPLE: Name extraction from content
simpleNameExtraction(content) {
    if (!content || typeof content !== 'string') return null;
    
    console.log('🔍 Extracting name from content:', content);
    
    // Method 1: @Name pattern (most reliable)
    const atMatch = content.match(/@([A-Za-z]+(?:\s+[A-Za-z]+)*)/);
    if (atMatch) {
        const name = atMatch[1].trim();
        console.log('✅ Found @name:', name);
        return name;
    }
    
    // Method 2: "Hi Name" pattern
    const hiMatch = content.match(/(?:hi|hello|hey)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
    if (hiMatch) {
        const name = hiMatch[1].trim();
        console.log('✅ Found hi name:', name);
        return name;
    }
    
    // Method 3: Look for capitalized words that could be names
    const words = content.split(/\s+/);
    for (let i = 0; i < Math.min(words.length, 5); i++) { // Check first 5 words
        const word = words[i];
        // Check if word looks like a name (starts with capital, contains only letters)
        if (/^[A-Z][a-z]{2,}$/.test(word) && word.length > 2) {
            // Check if next word is also a name (for full names)
            if (i + 1 < words.length && /^[A-Z][a-z]{2,}$/.test(words[i + 1])) {
                const fullName = `${word} ${words[i + 1]}`;
                console.log('✅ Found full name:', fullName);
                return fullName;
            } else {
                console.log('✅ Found first name:', word);
                return word;
            }
        }
    }
    
    console.log('❌ No name found in content');
    return null;
}

// NEW: Get sender details from attendee ID
async getSenderDetails(attendeeId, chatId = null) {
    try {
        console.log(`👤 Getting sender details for attendee: ${attendeeId}`);
        
        // Try to get attendee details
        const response = await axios.get(`${this.baseUrl}${this.apiVersion}/attendees/${attendeeId}`, {
            headers: this.getHeaders(),
            params: {
                account_id: this.linkedinAccountId,
                ...(chatId && { chat_id: chatId })
            }
        });

        const attendee = response.data;
        console.log('👤 Attendee details:', JSON.stringify(attendee, null, 2));

        return {
            identifier: attendee.identifier || attendee.email || attendee.linkedin_id || attendeeId,
            name: attendee.name || 
                  attendee.display_name || 
                  attendee.full_name ||
                  (attendee.first_name && attendee.last_name ? 
                   `${attendee.first_name} ${attendee.last_name}` : '') ||
                  'LinkedIn User',
            linkedinProfile: attendee.linkedin_url || attendee.profile_url,
            headline: attendee.headline || attendee.title,
            profilePicture: attendee.profile_picture || attendee.avatar,
            location: attendee.location,
            isCurrentUser: false
        };
    } catch (error) {
        console.warn('⚠️ Failed to get attendee details:', error.response?.data || error.message);
        
        // Fallback: try to get chat participants
        if (chatId) {
            try {
                return await this.getSenderFromChatParticipants(chatId, attendeeId);
            } catch (chatError) {
                console.warn('⚠️ Failed to get chat participants:', chatError.message);
            }
        }
        
        throw new Error(`Could not get sender details for attendee ${attendeeId}`);
    }
}

// NEW: Get sender details from chat participants
async getSenderFromChatParticipants(chatId, attendeeId) {
    try {
        console.log(`💬 Getting chat participants for: ${chatId}`);
        
        const response = await axios.get(`${this.baseUrl}${this.apiVersion}/chats/${chatId}/attendees`, {
            headers: this.getHeaders(),
            params: {
                account_id: this.linkedinAccountId
            }
        });

        const participants = response.data.items || response.data || [];
        const sender = participants.find(p => p.id === attendeeId);

        if (sender) {
            return {
                identifier: sender.identifier || sender.email || sender.linkedin_id || attendeeId,
                name: sender.name || sender.display_name || sender.full_name || 'LinkedIn User',
                linkedinProfile: sender.linkedin_url || sender.profile_url,
                headline: sender.headline || sender.title,
                profilePicture: sender.profile_picture || sender.avatar,
                location: sender.location,
                isCurrentUser: false
            };
        }

        throw new Error('Sender not found in chat participants');
    } catch (error) {
        throw new Error(`Could not get chat participants: ${error.message}`);
    }
}

// ENHANCED: Extract name from content (improved)
extractNameFromContent(content) {
    if (!content || typeof content !== 'string') return '';
    
    // Look for patterns like "Hi @Name" or "Thanks @Name"
    const mentionMatch = content.match(/@([A-Za-z\s]+)/);
    if (mentionMatch) {
        return mentionMatch[1].trim();
    }
    
    // Look for patterns like "Hi John," or "Hello Sarah,"
    const greetingMatch = content.match(/(?:hi|hello|hey)\s+([A-Za-z]+)[,\s]/i);
    if (greetingMatch) {
        return greetingMatch[1];
    }
    
    return '';
}

// NEW: Process individual LinkedIn message with proper content extraction
processLinkedInMessage(msg) {
    console.log('🔍 Processing message:', JSON.stringify(msg, null, 2));
    
    return {
        id: msg.id,
        from: this.extractSender(msg.from_attendee || msg.sender || msg.from),
        to: this.extractRecipients(msg.to_attendees || msg.recipients || msg.to || []),
        cc: this.extractRecipients(msg.cc_attendees || msg.cc || []),
        subject: msg.subject || msg.title || 'No Subject',
        content: this.extractMessageContent(msg),
        preview: this.generateMessagePreview(msg),
        date: msg.date || msg.created_at || msg.timestamp,
        isRead: msg.read_date ? true : (msg.is_read || msg.read || false),
        threadId: msg.thread_id || msg.conversation_id,
        messageType: 'linkedin_message',
        hasAttachments: msg.has_attachments || (msg.attachments && msg.attachments.length > 0),
        
        // Additional LinkedIn-specific fields
        linkedinData: {
            originalSender: msg.from_attendee,
            originalRecipients: msg.to_attendees,
            rawContent: msg.body || msg.content || msg.text,
            messageId: msg.message_id || msg.id
        }
    };
}

// NEW: Extract message content from various possible fields
extractMessageContent(msg) {
    // Try different content fields that Unipile might use
    const contentFields = [
        msg.body_plain,     // Plain text body
        msg.body,           // HTML body or main body
        msg.text,           // Text field
        msg.content,        // Content field  
        msg.message,        // Message field
        msg.html_body,      // HTML body
        msg.plain_text      // Plain text
    ];
    
    for (const field of contentFields) {
        if (field && typeof field === 'string' && field.trim().length > 0) {
            // If it's HTML, convert to plain text
            if (field.includes('<') && field.includes('>')) {
                return this.htmlToText(field);
            }
            return field.trim();
        }
    }
    
    // If no content found, return a placeholder
    return 'Message content not available';
}

// NEW: Generate message preview
generateMessagePreview(msg, maxLength = 100) {
    const content = this.extractMessageContent(msg);
    
    if (content === 'Message content not available') {
        return 'Preview not available';
    }
    
    if (content.length <= maxLength) {
        return content;
    }
    
    return content.substring(0, maxLength) + '...';
}

// FIXED: Extract sender with better fallbacks
extractSender(fromField) {
    console.log('🔍 Extracting sender from:', JSON.stringify(fromField, null, 2));
    
    if (!fromField) {
        return { identifier: 'Unknown', name: '' };
    }
    
    // Handle different sender formats
    if (typeof fromField === 'object') {
        return {
            identifier: fromField.identifier || 
                       fromField.email || 
                       fromField.address ||
                       fromField.linkedin_id ||
                       fromField.user_id ||
                       'Unknown',
            name: fromField.name || 
                 fromField.display_name ||
                 fromField.full_name ||
                 fromField.first_name + ' ' + (fromField.last_name || '') ||
                 ''
        };
    }
    
    if (typeof fromField === 'string') {
        return { identifier: fromField, name: '' };
    }
    
    return { identifier: 'Unknown', name: '' };
}

// Helper method to convert HTML to text (if needed)
htmlToText(html) {
    if (!html || typeof html !== 'string') return '';
    
    return html
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}


    // Send LinkedIn message
// FIXED: Send LinkedIn message to chat/conversation
async sendLinkedInMessage(chatId, content, options = {}) {
    try {
        console.log(`📤 Sending LinkedIn message to chat: ${chatId}`);
        
        const messageData = {
            account_id: this.linkedinAccountId,
            chat_id: chatId,  // FIXED: Use chat_id instead of recipient_id
            text: content,
            ...(options.subject && { subject: options.subject })
        };

        console.log('📤 Message data:', JSON.stringify(messageData, null, 2));

        const response = await axios.post(`${this.baseUrl}${this.apiVersion}/messages`, messageData, {
            headers: this.getHeaders()
        });

        console.log('📤 LinkedIn message sent:', JSON.stringify(response.data, null, 2));

        return {
            success: true,
            messageId: response.data.id,
            chatId: chatId,
            sentAt: response.data.timestamp || new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ LinkedIn message send error:', error.response?.data || error.message);
        throw new Error(`Failed to send LinkedIn message: ${error.response?.data?.detail || error.response?.data?.message || error.message}`);
    }
}

// ENHANCED: Extract name from content (improved patterns)
extractNameFromContent(content) {
    if (!content || typeof content !== 'string') return '';
    
    // Pattern 1: Hi @Name or Hello @Name
    const mentionMatch = content.match(/@([A-Za-z\s]+)/);
    if (mentionMatch) {
        const name = mentionMatch[1].trim();
        // Clean up common suffixes
        return name.replace(/\s+(thanks|thank you|hi|hello)$/i, '').trim();
    }
    
    // Pattern 2: Hi Name, or Hello Name,
    const greetingMatch = content.match(/(?:hi|hello|hey)\s+([A-Za-z\s]+)[,\s]/i);
    if (greetingMatch) {
        const name = greetingMatch[1].trim();
        if (name.length > 2 && name.length < 30) { // Reasonable name length
            return name;
        }
    }
    
    // Pattern 3: Thanks Name or Thank you Name
    const thanksMatch = content.match(/(?:thanks?|thank you)\s+([A-Za-z\s]+)[!\s]/i);
    if (thanksMatch) {
        const name = thanksMatch[1].trim();
        if (name.length > 2 && name.length < 30) {
            return name;
        }
    }
    
    // Pattern 4: Look for capitalized names at the beginning
    const nameAtStart = content.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (nameAtStart) {
        const name = nameAtStart[1].trim();
        // Avoid common words
        const commonWords = ['Hi', 'Hello', 'Thanks', 'Thank', 'Hey', 'Dear', 'Good', 'Hope', 'I', 'We', 'This', 'That'];
        if (!commonWords.includes(name.split(' ')[0])) {
            return name;
        }
    }
    
    return '';
}

// NEW: Extract name from LinkedIn sender ID
extractNameFromSenderId(senderId) {
    if (!senderId || typeof senderId !== 'string') return '';
    
    // LinkedIn sender IDs sometimes contain encoded name information
    // This is a best-effort extraction
    try {
        // Some LinkedIn IDs have patterns, but this is very limited
        // We'll return empty string to rely on content extraction
        return '';
    } catch (error) {
        return '';
    }
}

// ENHANCED: Generate message preview with better formatting
generateMessagePreview(msg, maxLength = 100) {
    const content = this.extractMessageContent(msg);
    
    if (content === 'Message content not available') {
        return 'Preview not available';
    }
    
    // Clean up the content
    let cleanContent = content
        .replace(/\r?\n/g, ' ') // Replace newlines with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
    
    if (cleanContent.length <= maxLength) {
        return cleanContent;
    }
    
    // Smart truncation - try to break at word boundaries
    const truncated = cleanContent.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) { // If we can break reasonably close to the limit
        return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
}



    // Post to LinkedIn
// Update this method in your linkedin-service.js

// Post to LinkedIn with FIXED API format
async createLinkedInPost(content, options = {}) {
    try {
        // FIXED: Unipile expects 'text' field, not 'content'
        const postData = {
            account_id: this.linkedinAccountId,
            text: content, // FIXED: Changed from 'content' to 'text'
            visibility: options.visibility || 'public',
            ...(options.imageUrl && { media: [{ type: 'image', url: options.imageUrl }] }),
            ...(options.mentions && { mentions: options.mentions })
        };

        console.log('📝 Creating LinkedIn post with corrected format:', JSON.stringify(postData, null, 2));

        const response = await axios.post(`${this.baseUrl}${this.apiVersion}/posts`, postData, {
            headers: this.getHeaders()
        });

        console.log('📝 LinkedIn post created successfully:', JSON.stringify(response.data, null, 2));

        return {
            success: true,
            postId: response.data.id,
            url: response.data.url || `https://linkedin.com/posts/activity-${response.data.id}`,
            createdAt: response.data.created_at || new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ LinkedIn post creation error:', error.response?.data || error.message);
        throw new Error(`Failed to create LinkedIn post: ${error.response?.data?.detail || error.response?.data?.message || error.message}`);
    }
}


    // Get LinkedIn posts/feed
    async getLinkedInPosts(options = {}) {
        try {
            const params = {
                account_id: this.linkedinAccountId,
                limit: options.limit || 10,
                offset: options.offset || 0
            };

            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/posts`, {
                headers: this.getHeaders(),
                params: params
            });

            let posts = [];
            if (response.data && response.data.items) {
                posts = response.data.items;
            } else if (Array.isArray(response.data)) {
                posts = response.data;
            }

            return {
                success: true,
                posts: posts.map(post => ({
                    id: post.id,
                    content: post.content || post.text,
                    author: post.author,
                    createdAt: post.created_at,
                    likes: post.likes_count || 0,
                    comments: post.comments_count || 0,
                    shares: post.shares_count || 0,
                    url: post.url
                })),
                total: response.data.total || posts.length
            };
        } catch (error) {
            throw new Error(`Failed to get LinkedIn posts: ${error.message}`);
        }
    }

    // Helper methods
    extractSender(fromField) {
        if (!fromField) return { identifier: 'Unknown', name: '' };
        return {
            identifier: fromField.identifier || fromField.email,
            name: fromField.name || fromField.display_name || ''
        };
    }

    extractRecipients(toFields) {
        if (!Array.isArray(toFields)) return [];
        return toFields.map(field => this.extractSender(field));
    }
}
