// whatsapp-service.js - WhatsApp Unipile Integration
import axios from 'axios';
import { config } from 'dotenv';

config();

export class WhatsAppService {
    constructor() {
        this.apiKey = process.env.UNIPILE_API_KEY;
        this.baseUrl = process.env.UNIPILE_BASE_URL;
        this.dsn = process.env.UNIPILE_DSN;
        this.whatsappAccountId = process.env.WHATSAPP_ACCOUNT_ID;
        this.apiVersion = '/api/v1';
        
        console.log('📱 WhatsApp Service Initialized');
        console.log(`   Base URL: ${this.baseUrl}`);
        console.log(`   Account ID: ${this.whatsappAccountId}`);
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

    // Get all WhatsApp accounts
    async getWhatsAppAccounts() {
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

            const whatsappAccounts = accounts.filter(account => 
                account.provider?.toLowerCase() === 'whatsapp'
            );

            return {
                success: true,
                accounts: whatsappAccounts.map(account => ({
                    id: account.id,
                    provider: account.provider,
                    identifier: account.identifier,
                    name: account.name || account.display_name,
                    status: account.status,
                    phoneNumber: account.phone_number || account.identifier,
                    isConnected: account.status === 'connected'
                })),
                total: whatsappAccounts.length
            };
        } catch (error) {
            throw new Error(`Failed to get WhatsApp accounts: ${error.message}`);
        }
    }

    // Get WhatsApp messages
    async getWhatsAppMessages(options = {}) {
        try {
            const params = {
                account_id: this.whatsappAccountId,
                limit: options.limit || 50,
                offset: options.offset || 0,
                ...(options.since && { since: options.since }),
                ...(options.until && { until: options.until }),
                ...(options.chat_type && { chat_type: options.chat_type }) // 'group' or 'individual'
            };

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

            return {
                success: true,
                messages: messages.map(msg => this.processWhatsAppMessage(msg)),
                total: response.data.total || messages.length
            };
        } catch (error) {
            throw new Error(`Failed to get WhatsApp messages: ${error.message}`);
        }
    }

    // Get Group Messages
    async getGroupMessages(groupId, options = {}) {
        try {
            const params = {
                account_id: this.whatsappAccountId,
                chat_id: groupId,
                limit: options.limit || 50,
                offset: options.offset || 0,
                ...(options.since && { since: options.since })
            };

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

            return {
                success: true,
                groupId: groupId,
                messages: messages.map(msg => this.processWhatsAppMessage(msg)),
                total: response.data.total || messages.length
            };
        } catch (error) {
            throw new Error(`Failed to get group messages: ${error.message}`);
        }
    }

    // Get WhatsApp Groups/Chats
    async getWhatsAppChats(options = {}) {
        try {
            const params = {
                account_id: this.whatsappAccountId,
                limit: options.limit || 50,
                chat_type: options.type || 'all' // 'group', 'individual', 'all'
            };

            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/chats`, {
                headers: this.getHeaders(),
                params: params
            });

            let chats = [];
            if (response.data && response.data.items) {
                chats = response.data.items;
            } else if (Array.isArray(response.data)) {
                chats = response.data;
            }

            return {
                success: true,
                chats: chats.map(chat => ({
                    id: chat.id,
                    name: chat.name || chat.title,
                    type: chat.type || chat.chat_type,
                    isGroup: chat.type === 'group' || chat.chat_type === 'group' || chat.type === 1 || (chat.participants && chat.participants.length > 2),
                    participants: chat.participants || [],
                    participantCount: chat.participant_count || (chat.participants ? chat.participants.length : 0),
                    lastMessage: chat.last_message,
                    lastActivity: chat.last_activity || chat.updated_at,
                    unreadCount: chat.unread_count || 0,
                    phoneNumber: chat.phone_number,
                    profilePicture: chat.profile_picture
                })),
                total: response.data.total || chats.length
            };
        } catch (error) {
            throw new Error(`Failed to get WhatsApp chats: ${error.message}`);
        }
    }

    // Send WhatsApp message
// FIXED: Try multiple endpoints for WhatsApp messaging
async sendWhatsAppMessage(chatId, content, options = {}) {
    try {
        console.log(`📤 Attempting to send WhatsApp message to chat: ${chatId}`);
        
        // Try different endpoint variations for WhatsApp
        const endpointsToTry = [
            {
                url: `${this.baseUrl}${this.apiVersion}/whatsapp/messages`,
                data: {
                    account_id: this.whatsappAccountId,
                    chat_id: chatId,
                    text: content,
                    message_type: 'text'
                }
            },
            {
                url: `${this.baseUrl}${this.apiVersion}/messages/whatsapp`,
                data: {
                    account_id: this.whatsappAccountId,
                    chat_id: chatId,
                    text: content
                }
            },
            {
                url: `${this.baseUrl}${this.apiVersion}/chats/${chatId}/messages`,
                data: {
                    account_id: this.whatsappAccountId,
                    text: content,
                    type: 'text'
                }
            },
            {
                url: `${this.baseUrl}${this.apiVersion}/send`,
                data: {
                    account_id: this.whatsappAccountId,
                    chat_id: chatId,
                    message: content,
                    type: 'text'
                }
            }
        ];

        let lastError;
        
        for (const attempt of endpointsToTry) {
            try {
                console.log(`🔄 Trying WhatsApp endpoint: ${attempt.url}`);
                console.log(`📤 With data:`, JSON.stringify(attempt.data, null, 2));
                
                const response = await axios.post(attempt.url, attempt.data, {
                    headers: this.getHeaders()
                });

                console.log('✅ WhatsApp message sent successfully:', JSON.stringify(response.data, null, 2));

                return {
                    success: true,
                    messageId: response.data.id,
                    chatId: chatId,
                    sentAt: response.data.timestamp || new Date().toISOString(),
                    endpoint: attempt.url
                };
            } catch (error) {
                console.warn(`⚠️ Failed with ${attempt.url}:`, error.response?.status, error.response?.data?.message || error.message);
                lastError = error;
                continue;
            }
        }
        
        // If all endpoints fail, throw the last error
        throw lastError;
    } catch (error) {
        console.error('❌ All WhatsApp message send attempts failed:', error.response?.data || error.message);
        throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.detail || error.response?.data?.message || error.message}`);
    }
}

// ALTERNATIVE: Check WhatsApp capabilities
async checkWhatsAppCapabilities() {
    try {
        console.log('🔍 Checking WhatsApp account capabilities...');
        
        const response = await axios.get(`${this.baseUrl}${this.apiVersion}/accounts/${this.whatsappAccountId}`, {
            headers: this.getHeaders()
        });
        
        const account = response.data;
        
        return {
            success: true,
            accountId: account.id,
            provider: account.provider,
            status: account.status,
            capabilities: account.capabilities || [],
            permissions: account.permissions || [],
            canSendMessages: account.can_send_messages,
            canReadMessages: account.can_read_messages,
            restrictions: account.restrictions || [],
            supportedFeatures: account.supported_features || []
        };
    } catch (error) {
        throw new Error(`Failed to check WhatsApp capabilities: ${error.message}`);
    }
}

// MOCK: Generate message preview without actually sending
async generateMessagePreview(chatId, content, options = {}) {
    return {
        success: true,
        messageId: `preview_${Date.now()}`,
        chatId: chatId,
        content: content,
        sentAt: new Date().toISOString(),
        note: 'This is a preview - message not actually sent due to API limitations'
    };
}


    // Send message to phone number
    async sendMessageToNumber(phoneNumber, content, options = {}) {
        try {
            // First, try to find or create chat with this number
            const messageData = {
                account_id: this.whatsappAccountId,
                phone_number: phoneNumber,
                text: content,
                ...(options.mediaUrl && { media_url: options.mediaUrl }),
                ...(options.mediaType && { media_type: options.mediaType })
            };

            console.log('📤 Sending WhatsApp message to number:', phoneNumber);

            const response = await axios.post(`${this.baseUrl}${this.apiVersion}/messages/send`, messageData, {
                headers: this.getHeaders()
            });

            return {
                success: true,
                messageId: response.data.id,
                phoneNumber: phoneNumber,
                sentAt: response.data.timestamp || new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ WhatsApp message to number failed:', error.response?.data || error.message);
            throw new Error(`Failed to send message to ${phoneNumber}: ${error.response?.data?.detail || error.message}`);
        }
    }

    // Post WhatsApp Status
    async postWhatsAppStatus(content, options = {}) {
        try {
            const statusData = {
                account_id: this.whatsappAccountId,
                text: content,
                type: 'status',
                ...(options.mediaUrl && { media_url: options.mediaUrl }),
                ...(options.mediaType && { media_type: options.mediaType }),
                ...(options.backgroundColor && { background_color: options.backgroundColor }),
                ...(options.duration && { duration: options.duration }) // in seconds
            };

            console.log('📤 Posting WhatsApp status:', JSON.stringify(statusData, null, 2));

            const response = await axios.post(`${this.baseUrl}${this.apiVersion}/stories`, statusData, {
                headers: this.getHeaders()
            });

            return {
                success: true,
                statusId: response.data.id,
                postedAt: response.data.timestamp || new Date().toISOString()
            };
        } catch (error) {
            console.error('❌ WhatsApp status post error:', error.response?.data || error.message);
            throw new Error(`Failed to post WhatsApp status: ${error.response?.data?.detail || error.message}`);
        }
    }

    // Process individual WhatsApp message
// Add these methods to your WhatsApp service class

// Enhanced message processing with decoding
processWhatsAppMessage(msg) {
    console.log('🔍 Processing WhatsApp message:', msg.id);
    
    // Decode the message content and extract real names
    const decodedInfo = this.decodeWhatsAppMessage(msg);
    
    return {
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        senderName: decodedInfo.senderName || this.extractSenderName(msg),
        senderPhone: this.extractPhoneNumber(msg.sender_id),
        content: decodedInfo.decodedContent || msg.text || msg.body || 'Media message',
        messageType: this.getMessageType(msg),
        timestamp: msg.timestamp || msg.date,
        isFromMe: msg.is_sender || msg.from_me,
        isRead: msg.read || msg.seen,
        isGroup: this.isGroupMessage(msg),
        groupName: decodedInfo.groupName || msg.group_name || msg.chat_name,
        hasMedia: !!(msg.media_url || msg.attachment || msg.media),
        mediaType: msg.media_type,
        mediaUrl: msg.media_url,
        replyTo: msg.reply_to_message_id,
        reactions: msg.reactions || [],
        
        // Decoded information
        decodedData: {
            isReaction: decodedInfo.isReaction,
            reactionEmoji: decodedInfo.reactionEmoji,
            isSystemMessage: decodedInfo.isSystemMessage,
            systemAction: decodedInfo.systemAction,
            actualSenderName: decodedInfo.actualSenderName,
            pushName: decodedInfo.pushName
        },
        
        // Raw data for debugging
        whatsappData: {
            originalMessage: msg,
            chatType: msg.chat_type,
            participantCount: msg.participant_count,
            decodedOriginal: decodedInfo.originalData
        }
    };
}

// NEW: Decode WhatsApp message content and extract real information
decodeWhatsAppMessage(msg) {
    const result = {
        decodedContent: msg.text,
        senderName: 'Unknown Contact',
        groupName: null,
        isReaction: false,
        reactionEmoji: null,
        isSystemMessage: false,
        systemAction: null,
        actualSenderName: null,
        pushName: null,
        originalData: null
    };

    try {
        // Parse the original JSON data if available
        if (msg.original && typeof msg.original === 'string') {
            const originalData = JSON.parse(msg.original);
            result.originalData = originalData;
            
            // Extract push name (actual sender name)
            if (originalData.pushName) {
                result.actualSenderName = originalData.pushName;
                result.pushName = originalData.pushName;
                result.senderName = originalData.pushName;
            }
            
            // Handle reaction messages
            if (originalData.message && originalData.message.reactionMessage) {
                result.isReaction = true;
                result.reactionEmoji = originalData.message.reactionMessage.text;
                
                // Decode reaction content
                const reactionText = msg.text || '';
                const placeholderMatch = reactionText.match(/\{\{([^}]+)\}\}/);
                if (placeholderMatch) {
                    result.decodedContent = `${result.actualSenderName || 'Someone'} reacted ${result.reactionEmoji}`;
                }
            }
            
            // Handle system messages (user left, joined, etc.)
            if (originalData.messageStubType) {
                result.isSystemMessage = true;
                
                switch (originalData.messageStubType) {
                    case 32: // User left group
                        result.systemAction = 'left_group';
                        result.decodedContent = `${result.actualSenderName || 'Someone'} left the chat`;
                        break;
                    case 27: // User added to group
                        result.systemAction = 'added_to_group';
                        result.decodedContent = `${result.actualSenderName || 'Someone'} was added to the group`;
                        break;
                    case 28: // User removed from group
                        result.systemAction = 'removed_from_group';
                        result.decodedContent = `${result.actualSenderName || 'Someone'} was removed from the group`;
                        break;
                    default:
                        result.decodedContent = `System message: ${originalData.messageStubType}`;
                }
            }
        }
        
        // If we couldn't decode from original, try to extract from placeholder patterns
        if (!result.actualSenderName && msg.text) {
            const placeholderMatch = msg.text.match(/\{\{([^}]+)\}\}/);
            if (placeholderMatch) {
                // This is a placeholder - try to resolve it from attendee mapping
                result.decodedContent = this.resolvePlaceholder(msg.text, placeholderMatch[1]);
            }
        }
        
    } catch (error) {
        console.warn('Failed to decode WhatsApp message:', error.message);
    }

    return result;
}

// NEW: Resolve placeholder IDs to actual names
resolvePlaceholder(originalText, placeholderId) {
    // You can maintain a mapping of placeholder IDs to real names
    // This would need to be built over time or fetched from attendee API
    
    const knownPlaceholders = {
        'q8Tc7g6XVAyZcCxnlQXY3A': 'Siddharth S',
        '842ulsvOX2uAWjf8d6Z57Q': 'Unknown User',
        'a2zMgZNxVn6X95iVNTfd0g': 'Rahul issar',
        // Add more as you discover them
    };
    
    const actualName = knownPlaceholders[placeholderId] || 'Unknown User';
    
    // Replace placeholder with actual name
    return originalText.replace(`{{${placeholderId}}}`, actualName);
}

// NEW: Extract phone number from sender ID
extractPhoneNumber(senderId) {
    if (!senderId) return null;
    
    // WhatsApp sender IDs are in format: "919876543210@s.whatsapp.net"
    const phoneMatch = senderId.match(/(\d+)@s\.whatsapp\.net/);
    return phoneMatch ? `+${phoneMatch[1]}` : senderId;
}

// NEW: Determine message type
getMessageType(msg) {
    if (msg.is_event) {
        if (msg.event_type === 1) return 'reaction';
        if (msg.event_type === 7) return 'system_event';
        return 'event';
    }
    
    if (msg.media_url || msg.attachment) return 'media';
    
    return 'text';
}

// NEW: Check if message is from group
isGroupMessage(msg) {
    // WhatsApp group IDs end with @g.us
    return msg.chat_provider_id && msg.chat_provider_id.includes('@g.us');
}

// Enhanced sender name extraction
extractSenderName(msg) {
    // Try different fields for sender name
    return msg.sender_name || 
           msg.from_name || 
           msg.participant_name ||
           msg.contact_name ||
           this.extractPhoneNumber(msg.sender_id) ||
           'Unknown Contact';
}


    // Extract sender name from message data
    extractSenderName(msg) {
        return msg.sender_name || 
               msg.from_name || 
               msg.participant_name ||
               msg.contact_name ||
               msg.sender_phone ||
               msg.from_phone ||
               'Unknown Contact';
    }
}
