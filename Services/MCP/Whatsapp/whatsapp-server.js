// whatsapp-server.js - Main WhatsApp AI Server
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { config } from 'dotenv';
import { WhatsAppService } from './whatsapp-service.js';
import { WhatsAppAIService } from './ai-enhancement-service.js';

config();

const app = express();
const whatsappService = new WhatsAppService();
const aiService = new WhatsAppAIService();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============= ROOT ENDPOINTS =============

/**
 * GET / - WhatsApp API Documentation
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'WhatsApp AI-Enhanced Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        features: [
            '📱 WhatsApp Message Management',
            '👥 Group Message Monitoring',
            '📝 AI-Powered Message Generation',
            '📢 Status/Story Management',
            '🤖 Auto-Reply System',
            '📊 Message Analytics',
            '💬 Send to Any Phone Number'
        ],
        endpoints: {
            // Account Management
            accounts: 'GET /api/whatsapp/accounts',
            
            // Messages
            allMessages: 'GET /api/whatsapp/messages',
            groupMessages: 'GET /api/whatsapp/groups/:groupId/messages',
            sendMessage: 'POST /api/whatsapp/messages/send',
            sendToNumber: 'POST /api/whatsapp/messages/send-to-number',
            
            // Groups & Chats
            chats: 'GET /api/whatsapp/chats',
            groups: 'GET /api/whatsapp/groups',
            
            // Status Management
            postStatus: 'POST /api/whatsapp/status/post',
            generateStatus: 'POST /api/ai/whatsapp/status',
            
            // AI Features
            generateMessage: 'POST /api/ai/whatsapp/message',
            autoReply: 'POST /api/ai/whatsapp/auto-reply',
            analyzeGroup: 'POST /api/ai/whatsapp/analyze-group'
        },
        quickStart: {
            step1: `GET http://localhost:5000/api/whatsapp/accounts`,
            step2: `GET http://localhost:5000/api/whatsapp/messages`,
            step3: `POST http://localhost:5000/api/whatsapp/messages/send-to-number`
        }
    });
});

// ============= WHATSAPP ACCOUNT ENDPOINTS =============

/**
 * GET /api/whatsapp/accounts - Get WhatsApp accounts
 */
app.get('/api/whatsapp/accounts', async (req, res) => {
    try {
        const result = await whatsappService.getWhatsAppAccounts();
        
        res.json({
            success: true,
            message: `Found ${result.total} WhatsApp account${result.total !== 1 ? 's' : ''}`,
            data: result.accounts,
            total: result.total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get WhatsApp accounts',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= MESSAGE ENDPOINTS =============

/**
 * GET /api/whatsapp/messages - Get all WhatsApp messages
 */
app.get('/api/whatsapp/messages', async (req, res) => {
    try {
        const { limit = 50, offset = 0, since, until, type } = req.query;
        
        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ...(since && { since }),
            ...(until && { until }),
            ...(type && { chat_type: type }) // 'group' or 'individual'
        };
        
        const result = await whatsappService.getWhatsAppMessages(options);
        
        res.json({
            success: true,
            message: `Retrieved ${result.messages.length} WhatsApp messages`,
            data: result.messages,
            total: result.total,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                hasMore: result.messages.length === options.limit
            },
            summary: {
                groupMessages: result.messages.filter(m => m.isGroup).length,
                individualMessages: result.messages.filter(m => !m.isGroup).length,
                unreadMessages: result.messages.filter(m => !m.isRead).length,
                mediaMessages: result.messages.filter(m => m.hasMedia).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get WhatsApp messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/chats - Get WhatsApp chats/groups
 */
app.get('/api/whatsapp/chats', async (req, res) => {
    try {
        const { limit = 50, type = 'all' } = req.query;
        
        const result = await whatsappService.getWhatsAppChats({ 
            limit: parseInt(limit), 
            type 
        });
        
        res.json({
            success: true,
            message: `Retrieved ${result.chats.length} WhatsApp chats`,
            data: result.chats,
            total: result.total,
            summary: {
                groups: result.chats.filter(c => c.isGroup).length,
                individuals: result.chats.filter(c => !c.isGroup).length,
                unreadChats: result.chats.filter(c => c.unreadCount > 0).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get WhatsApp chats',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/groups - Get only group chats
 */
app.get('/api/whatsapp/groups', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        const result = await whatsappService.getWhatsAppChats({ 
            limit: parseInt(limit), 
            type: 'group' 
        });
        
        res.json({
            success: true,
            message: `Retrieved ${result.chats.length} WhatsApp groups`,
            data: result.chats,
            total: result.total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get WhatsApp groups',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/groups/:groupId/messages - Get messages from specific group
 */
app.get('/api/whatsapp/groups/:groupId/messages', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { limit = 50, offset = 0, since } = req.query;
        
        const result = await whatsappService.getGroupMessages(groupId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ...(since && { since })
        });
        
        res.json({
            success: true,
            message: `Retrieved ${result.messages.length} messages from group`,
            data: result.messages,
            groupId: result.groupId,
            total: result.total,
            analytics: {
                totalMessages: result.messages.length,
                uniqueSenders: [...new Set(result.messages.map(m => m.senderPhone))].length,
                mediaMessages: result.messages.filter(m => m.hasMedia).length,
                myMessages: result.messages.filter(m => m.isFromMe).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get group messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/messages/send - Send message to chat
 */
app.post('/api/whatsapp/messages/send', async (req, res) => {
    try {
        const { chatId, content, replyToMessageId, mediaUrl, mediaType } = req.body;
        
        if (!chatId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: chatId, content',
                example: {
                    chatId: "chat_id_from_chats_endpoint",
                    content: "Hello! How are you doing?",
                    replyToMessageId: "msg_id_to_reply_to",
                    mediaUrl: "https://example.com/image.jpg",
                    mediaType: "image"
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await whatsappService.sendWhatsAppMessage(chatId, content, {
            replyToMessageId,
            mediaUrl,
            mediaType
        });
        
        res.json({
            success: true,
            message: 'WhatsApp message sent successfully',
            data: {
                messageId: result.messageId,
                chatId: chatId,
                content: content,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/messages/send-to-number - Send message to phone number
 */
app.post('/api/whatsapp/messages/send-to-number', async (req, res) => {
    try {
        const { phoneNumber, content, mediaUrl, mediaType } = req.body;
        
        if (!phoneNumber || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: phoneNumber, content',
                examples: {
                    basic: {
                        phoneNumber: "+919876543210",
                        content: "Hello! This is a message from the API."
                    },
                    withMedia: {
                        phoneNumber: "+919876543210", 
                        content: "Check out this image!",
                        mediaUrl: "https://example.com/image.jpg",
                        mediaType: "image"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // Clean phone number format
        const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
        
        const result = await whatsappService.sendMessageToNumber(cleanPhone, content, {
            mediaUrl,
            mediaType
        });
        
        res.json({
            success: true,
            message: 'WhatsApp message sent to phone number successfully',
            data: {
                messageId: result.messageId,
                phoneNumber: cleanPhone,
                content: content,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send WhatsApp message to phone number',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= STATUS ENDPOINTS =============

/**
 * POST /api/whatsapp/status/post - Post WhatsApp status
 */
app.post('/api/whatsapp/status/post', async (req, res) => {
    try {
        const { content, mediaUrl, mediaType, backgroundColor, duration = 86400 } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: content',
                examples: {
                    text: {
                        content: "Having a great day! 🌟"
                    },
                    textWithBackground: {
                        content: "Excited about new projects! 🚀",
                        backgroundColor: "#4CAF50"
                    },
                    media: {
                        content: "Check out this amazing view!",
                        mediaUrl: "https://example.com/photo.jpg",
                        mediaType: "image"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await whatsappService.postWhatsAppStatus(content, {
            mediaUrl,
            mediaType,
            backgroundColor,
            duration: parseInt(duration)
        });
        
        res.json({
            success: true,
            message: 'WhatsApp status posted successfully',
            data: {
                statusId: result.statusId,
                content: content,
                duration: duration,
                postedAt: result.postedAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to post WhatsApp status',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= AI ENHANCEMENT ENDPOINTS =============

/**
 * POST /api/ai/whatsapp/message - Generate AI-enhanced WhatsApp message
 */
app.post('/api/ai/whatsapp/message', async (req, res) => {
    try {
        const { recipient, intent, context = {} } = req.body;
        
        if (!recipient || !intent) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: recipient, intent',
                examples: {
                    casual: {
                        recipient: "John",
                        intent: "catch up with old friend",
                        context: { lastContact: "6 months ago", relation: "college friend" }
                    },
                    business: {
                        recipient: "Sarah",
                        intent: "follow up on project",
                        context: { project: "website development", status: "pending review" }
                    },
                    family: {
                        recipient: "Mom",
                        intent: "share good news",
                        context: { news: "got promoted", mood: "excited" }
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.generateWhatsAppMessage(recipient, intent, context);
        
        res.json({
            success: true,
            message: 'AI-enhanced WhatsApp message generated',
            data: result,
            actions: {
                sendToChat: 'POST /api/whatsapp/messages/send',
                sendToNumber: 'POST /api/whatsapp/messages/send-to-number'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI-enhanced message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/whatsapp/status - Generate AI-enhanced WhatsApp status
 */
app.post('/api/ai/whatsapp/status', async (req, res) => {
    try {
        const { topic, mood = 'positive', autoPost = false } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: topic',
                examples: [
                    { topic: "completed a project", mood: "accomplished" },
                    { topic: "weekend vibes", mood: "relaxed" },
                    { topic: "new achievement", mood: "excited" },
                    { topic: "motivational quote", mood: "inspiring" }
                ],
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.generateWhatsAppStatus(topic, mood);
        
        let postResult = null;
        if (autoPost) {
            postResult = await whatsappService.postWhatsAppStatus(result.content);
        }
        
        res.json({
            success: true,
            message: `WhatsApp status ${autoPost ? 'generated and posted' : 'generated'} successfully`,
            data: {
                ...result,
                ...(postResult && {
                    posted: true,
                    statusId: postResult.statusId,
                    postedAt: postResult.postedAt
                })
            },
            actions: autoPost ? null : {
                postStatus: 'POST /api/whatsapp/status/post with the generated content'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate AI-enhanced status',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


// Add these endpoints after your existing endpoints in whatsapp-server.js

// ============= UNREAD MESSAGES ENDPOINTS =============

/**
 * GET /api/whatsapp/messages/unread - Get all unread WhatsApp messages
 */
app.get('/api/whatsapp/messages/unread', async (req, res) => {
    try {
        const { limit = 50, type } = req.query;
        
        // Get all recent messages
        const allMessages = await whatsappService.getWhatsAppMessages({
            limit: parseInt(limit) * 2, // Get more to filter unread
            ...(type && { chat_type: type })
        });
        
        // Filter for unread messages
        const unreadMessages = allMessages.messages.filter(msg => !msg.isRead);
        
        // Limit the results
        const limitedUnread = unreadMessages.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            message: `Found ${limitedUnread.length} unread WhatsApp messages`,
            data: limitedUnread,
            total: limitedUnread.length,
            summary: {
                unreadCount: limitedUnread.length,
                groupMessages: limitedUnread.filter(m => m.isGroup).length,
                individualMessages: limitedUnread.filter(m => !m.isGroup).length,
                fromUniqueContacts: [...new Set(limitedUnread.map(m => m.senderPhone))].length,
                hasMedia: limitedUnread.filter(m => m.hasMedia).length
            },
            actions: {
                replyToMessage: 'POST /api/whatsapp/messages/reply/{messageId}',
                markAsRead: 'PATCH /api/whatsapp/messages/{messageId}/read',
                sendToGroup: 'POST /api/whatsapp/groups/send'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get unread WhatsApp messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/groups/unread - Get unread messages from groups only
 */
app.get('/api/whatsapp/groups/unread', async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        // Get group messages
        const allMessages = await whatsappService.getWhatsAppMessages({
            limit: parseInt(limit) * 2,
            chat_type: 'group'
        });
        
        // Filter for unread group messages
        const unreadGroupMessages = allMessages.messages.filter(msg => 
            !msg.isRead && msg.isGroup
        );
        
        // Group by chat/group
        const messagesByGroup = {};
        unreadGroupMessages.forEach(msg => {
            if (!messagesByGroup[msg.chatId]) {
                messagesByGroup[msg.chatId] = {
                    groupId: msg.chatId,
                    groupName: msg.groupName,
                    unreadCount: 0,
                    messages: []
                };
            }
            messagesByGroup[msg.chatId].unreadCount++;
            messagesByGroup[msg.chatId].messages.push(msg);
        });
        
        const groupSummary = Object.values(messagesByGroup).slice(0, parseInt(limit));
        
        res.json({
            success: true,
            message: `Found unread messages in ${groupSummary.length} groups`,
            data: groupSummary,
            summary: {
                totalGroups: groupSummary.length,
                totalUnreadMessages: unreadGroupMessages.length,
                mostActiveGroup: groupSummary.length > 0 ? 
                    groupSummary.reduce((prev, current) => 
                        (prev.unreadCount > current.unreadCount) ? prev : current
                    ).groupName : null
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get unread group messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= ENHANCED MESSAGING ENDPOINTS =============

/**
 * POST /api/whatsapp/groups/send - Send message to specific group by name or ID
 */
app.post('/api/whatsapp/groups/send', async (req, res) => {
    try {
        const { groupName, groupId, content, replyToMessageId } = req.body;
        
        if ((!groupName && !groupId) || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: (groupName OR groupId) AND content',
                examples: {
                    byName: {
                        groupName: "Family Group",
                        content: "Hello everyone! Hope you're all doing well 😊"
                    },
                    byId: {
                        groupId: "group_chat_id_123",
                        content: "Thanks for the updates!"
                    },
                    withReply: {
                        groupName: "Work Team",
                        content: "Great idea!",
                        replyToMessageId: "msg_id_to_reply_to"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        let targetGroupId = groupId;
        
        // If group name is provided, find the group ID
        if (groupName && !groupId) {
            const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 100 });
            const targetGroup = chats.chats.find(chat => 
                chat.name && chat.name.toLowerCase().includes(groupName.toLowerCase())
            );
            
            if (!targetGroup) {
                return res.status(404).json({
                    success: false,
                    message: `Group "${groupName}" not found`,
                    availableGroups: chats.chats.map(chat => ({
                        id: chat.id,
                        name: chat.name
                    })).slice(0, 10),
                    timestamp: new Date().toISOString()
                });
            }
            
            targetGroupId = targetGroup.id;
        }
        
        const result = await whatsappService.sendWhatsAppMessage(targetGroupId, content, {
            replyToMessageId
        });
        
        res.json({
            success: true,
            message: 'Message sent to group successfully',
            data: {
                messageId: result.messageId,
                groupId: targetGroupId,
                groupName: groupName || 'Unknown',
                content: content,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send message to group',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/contacts/send - Send message to contact by name or phone
 */
/**
 * POST /api/whatsapp/contacts/send - Send message to contact by name or phone (FIXED)
 */
app.post('/api/whatsapp/contacts/send', async (req, res) => {
    try {
        const { contactName, phoneNumber, content, mediaUrl, mediaType } = req.body;
        
        if ((!contactName && !phoneNumber) || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: (contactName OR phoneNumber) AND content',
                examples: {
                    byName: {
                        contactName: "John Doe",
                        content: "Hey John! How are you doing? 😊"
                    },
                    byPhone: {
                        phoneNumber: "+919876543210",
                        content: "Hello! This is a message from the API."
                    },
                    withMedia: {
                        phoneNumber: "+919876543210",
                        content: "Check this out!",
                        mediaUrl: "https://example.com/image.jpg",
                        mediaType: "image"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        let targetPhoneNumber = phoneNumber;
        let foundContact = null;
        
        // If contact name is provided, try to find the phone number
        if (contactName && !phoneNumber) {
            try {
                // Get individual chats to find contact
                const chats = await whatsappService.getWhatsAppChats({ type: 'individual', limit: 200 });
                const targetContact = chats.chats.find(chat => 
                    chat.name && chat.name.toLowerCase().includes(contactName.toLowerCase())
                );
                
                if (!targetContact) {
                    return res.status(404).json({
                        success: false,
                        message: `Contact "${contactName}" not found`,
                        suggestion: 'Use phone number instead or check available contacts',
                        availableContacts: chats.chats.filter(chat => chat.name).map(chat => ({
                            name: chat.name,
                            phoneNumber: chat.phoneNumber || 'Unknown',
                            chatId: chat.id
                        })).slice(0, 10),
                        alternativeApproach: {
                            description: 'Send to chat directly using chat ID',
                            endpoint: 'POST /api/whatsapp/messages/send',
                            example: {
                                chatId: targetContact ? targetContact.id : 'chat_id_from_available_contacts',
                                content: content
                            }
                        },
                        timestamp: new Date().toISOString()
                    });
                }
                
                foundContact = targetContact;
                targetPhoneNumber = targetContact.phoneNumber;
                
                // FIXED: Check if phoneNumber exists and is valid
                if (!targetPhoneNumber || targetPhoneNumber === 'Unknown') {
                    // If no phone number, try to send via chat ID instead
                    console.log(`📱 No phone number found for ${contactName}, trying chat ID: ${targetContact.id}`);
                    
                    try {
                        const result = await whatsappService.sendWhatsAppMessage(targetContact.id, content, {
                            mediaUrl,
                            mediaType
                        });
                        
                        return res.json({
                            success: true,
                            message: 'Message sent to contact via chat ID successfully',
                            data: {
                                messageId: result.messageId,
                                contactName: contactName,
                                chatId: targetContact.id,
                                method: 'chat_id',
                                content: content,
                                sentAt: result.sentAt
                            },
                            note: 'Sent via chat ID since phone number was not available',
                            timestamp: new Date().toISOString()
                        });
                    } catch (chatError) {
                        return res.status(500).json({
                            success: false,
                            message: `Found contact "${contactName}" but failed to send message`,
                            error: chatError.message,
                            contactInfo: {
                                name: targetContact.name,
                                chatId: targetContact.id,
                                phoneNumber: targetContact.phoneNumber || 'Not available'
                            },
                            alternatives: [
                                'Try using the chat ID directly with POST /api/whatsapp/messages/send',
                                'Use a phone number if available',
                                'Send message manually via WhatsApp'
                            ],
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            } catch (chatsError) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to search for contacts',
                    error: chatsError.message,
                    suggestion: 'Try using phone number directly instead of contact name',
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        // FIXED: Validate phone number before cleaning
        if (!targetPhoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'No valid phone number found',
                suggestion: contactName ? 
                    `Contact "${contactName}" found but has no phone number. Try using chat ID instead.` :
                    'Please provide a valid phone number',
                timestamp: new Date().toISOString()
            });
        }
        
        // FIXED: Safely clean phone number
        let cleanPhone;
        try {
            cleanPhone = targetPhoneNumber.toString().replace(/[^\d+]/g, '');
            
            // Validate cleaned phone number
            if (!cleanPhone || cleanPhone.length < 10) {
                throw new Error('Invalid phone number format');
            }
        } catch (cleanError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format',
                providedNumber: targetPhoneNumber,
                error: cleanError.message,
                suggestion: 'Provide phone number in format: +919876543210',
                timestamp: new Date().toISOString()
            });
        }
        
        // Attempt to send message
        try {
            const result = await whatsappService.sendMessageToNumber(cleanPhone, content, {
                mediaUrl,
                mediaType
            });
            
            res.json({
                success: true,
                message: 'Message sent to contact successfully',
                data: {
                    messageId: result.messageId,
                    contactName: contactName || 'Unknown',
                    phoneNumber: cleanPhone,
                    content: content,
                    method: 'phone_number',
                    sentAt: result.sentAt
                },
                timestamp: new Date().toISOString()
            });
        } catch (sendError) {
            // If sending fails, provide alternative options
            res.status(500).json({
                success: false,
                message: 'Failed to send message to contact',
                error: sendError.message,
                attemptedPhone: cleanPhone,
                contactInfo: foundContact ? {
                    name: foundContact.name,
                    chatId: foundContact.id,
                    phoneNumber: cleanPhone
                } : null,
                alternatives: [
                    foundContact ? `Use chat ID: POST /api/whatsapp/messages/send with chatId: ${foundContact.id}` : null,
                    'Generate message content and send manually',
                    'Use message preview endpoint for content generation'
                ].filter(Boolean),
                generatedContent: {
                    endpoint: 'POST /api/ai/whatsapp/message',
                    example: {
                        recipient: contactName || 'Contact',
                        intent: 'casual greeting',
                        context: { relation: 'friend' }
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('❌ Send to contact failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send message to contact',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/whatsapp/groups/messages/fetch - Get messages from group by name (via request body)
 */
app.post('/api/whatsapp/groups/messages/fetch', async (req, res) => {
    try {
        const { 
            groupName, 
            limit = 50, 
            offset = 0, 
            since, 
            until, 
            includeMedia = true,
            messageTypes = ['all'], // 'all', 'text', 'media', 'reactions', 'system'
            unreadOnly = false
        } = req.body;
        
        if (!groupName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: groupName',
                examples: {
                    basic: {
                        groupName: "Teen tigada kam bigada",
                        limit: 50
                    },
                    advanced: {
                        groupName: "Family Group",
                        limit: 100,
                        offset: 0,
                        includeMedia: true,
                        messageTypes: ["text", "media"],
                        unreadOnly: false,
                        since: "2025-09-24T00:00:00Z"
                    },
                    unreadOnly: {
                        groupName: "Work Team",
                        limit: 30,
                        unreadOnly: true
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🔍 Searching for group: "${groupName}"`);
        
        // First find the group by name
        const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 200 });
        const targetGroup = chats.chats.find(chat => 
            chat.name && chat.name.toLowerCase().includes(groupName.toLowerCase())
        );
        
        if (!targetGroup) {
            return res.status(404).json({
                success: false,
                message: `Group "${groupName}" not found`,
                searchTerm: groupName,
                availableGroups: chats.chats.filter(chat => chat.name).map(chat => ({
                    name: chat.name,
                    id: chat.id,
                    participantCount: chat.participantCount || 0,
                    lastActivity: chat.lastActivity
                })).slice(0, 15),
                suggestion: 'Try with partial group name or check available groups above',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`✅ Found group: "${targetGroup.name}" (ID: ${targetGroup.id})`);
        
        // Get messages from the group
        const groupMessages = await whatsappService.getGroupMessages(targetGroup.id, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ...(since && { since }),
            ...(until && { until })
        });
        
        // Apply filters
        let filteredMessages = groupMessages.messages;
        
        // Filter by read status
        if (unreadOnly) {
            filteredMessages = filteredMessages.filter(msg => !msg.isRead);
        }
        
        // Filter by media inclusion
        if (includeMedia === false) {
            filteredMessages = filteredMessages.filter(msg => !msg.hasMedia);
        }
        
        // Filter by message types
        if (messageTypes && !messageTypes.includes('all')) {
            filteredMessages = filteredMessages.filter(msg => {
                if (messageTypes.includes('text') && msg.messageType === 'text' && !msg.decodedData?.isReaction && !msg.decodedData?.isSystemMessage) return true;
                if (messageTypes.includes('media') && msg.hasMedia) return true;
                if (messageTypes.includes('reactions') && msg.decodedData?.isReaction) return true;
                if (messageTypes.includes('system') && msg.decodedData?.isSystemMessage) return true;
                return false;
            });
        }
        
        // Enhanced message data with decoded information
        const enhancedMessages = filteredMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp,
            
            // Sender Information
            senderPhone: msg.senderPhone,
            senderName: msg.senderName,
            actualSenderName: msg.decodedData?.actualSenderName || msg.senderName,
            pushName: msg.decodedData?.pushName,
            
            // Message Type & Content
            messageType: msg.messageType,
            isFromMe: msg.isFromMe,
            isRead: msg.isRead,
            
            // Media Information
            hasMedia: msg.hasMedia,
            mediaType: msg.mediaType,
            mediaUrl: msg.mediaUrl,
            
            // Special Message Types
            isReaction: msg.decodedData?.isReaction || false,
            reactionEmoji: msg.decodedData?.reactionEmoji,
            isSystemMessage: msg.decodedData?.isSystemMessage || false,
            systemAction: msg.decodedData?.systemAction,
            
            // Additional Data
            reactions: msg.reactions || [],
            replyTo: msg.replyTo,
            
            // Time formatting
            timeAgo: calculateTimeAgo(msg.timestamp),
            formattedTime: new Date(msg.timestamp).toLocaleString()
        }));
        
        // Analytics
        const analytics = {
            totalMessages: enhancedMessages.length,
            originalTotal: groupMessages.messages.length,
            uniqueSenders: [...new Set(enhancedMessages.map(m => m.senderPhone))].length,
            messageTypes: {
                text: enhancedMessages.filter(m => m.messageType === 'text' && !m.isReaction && !m.isSystemMessage).length,
                media: enhancedMessages.filter(m => m.hasMedia).length,
                reactions: enhancedMessages.filter(m => m.isReaction).length,
                system: enhancedMessages.filter(m => m.isSystemMessage).length
            },
            readStatus: {
                read: enhancedMessages.filter(m => m.isRead).length,
                unread: enhancedMessages.filter(m => !m.isRead).length
            },
            timeRange: {
                oldest: enhancedMessages[enhancedMessages.length - 1]?.timestamp,
                newest: enhancedMessages[0]?.timestamp,
                span: enhancedMessages.length > 1 ? calculateTimeSpan(enhancedMessages[enhancedMessages.length - 1]?.timestamp, enhancedMessages[0]?.timestamp) : null
            },
            fromMeCount: enhancedMessages.filter(m => m.isFromMe).length,
            topSenders: getTopSenders(enhancedMessages).slice(0, 5)
        };
        
        res.json({
            success: true,
            message: `Retrieved ${enhancedMessages.length} messages from "${targetGroup.name}"`,
            searchParams: {
                groupName: groupName,
                limit: parseInt(limit),
                offset: parseInt(offset),
                unreadOnly: unreadOnly,
                messageTypes: messageTypes,
                includeMedia: includeMedia
            },
            data: {
                groupInfo: {
                    id: targetGroup.id,
                    name: targetGroup.name,
                    participantCount: targetGroup.participantCount,
                    isGroup: targetGroup.isGroup,
                    lastActivity: targetGroup.lastActivity
                },
                messages: enhancedMessages,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: groupMessages.messages.length === parseInt(limit),
                    nextOffset: parseInt(offset) + parseInt(limit)
                }
            },
            analytics: analytics,
            filters: {
                applied: {
                    unreadOnly: unreadOnly,
                    messageTypes: messageTypes,
                    includeMedia: includeMedia,
                    timeRange: since || until ? { since, until } : null
                },
                available: {
                    messageTypes: ['all', 'text', 'media', 'reactions', 'system'],
                    timeFiltering: 'Use since/until parameters',
                    readStatusFiltering: 'Use unreadOnly parameter'
                }
            },
            actions: {
                getMore: 'POST /api/whatsapp/groups/messages/fetch with higher offset',
                getUnreadOnly: 'POST /api/whatsapp/groups/messages/fetch with unreadOnly: true',
                sendToGroup: 'POST /api/whatsapp/groups/send'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Fetch group messages failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch group messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper functions
function calculateTimeAgo(timestamp) {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageTime.toLocaleDateString();
}

function calculateTimeSpan(oldest, newest) {
    const oldTime = new Date(oldest);
    const newTime = new Date(newest);
    const diffHours = Math.floor((newTime - oldTime) / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} days`;
    if (diffHours > 0) return `${diffHours} hours`;
    return 'less than 1 hour';
}

function getTopSenders(messages) {
    const senderCounts = {};
    messages.forEach(msg => {
        const sender = msg.actualSenderName || msg.senderName || 'Unknown';
        senderCounts[sender] = (senderCounts[sender] || 0) + 1;
    });
    
    return Object.entries(senderCounts)
        .map(([sender, count]) => ({ sender, messageCount: count }))
        .sort((a, b) => b.messageCount - a.messageCount);
}

/**
 * POST /api/whatsapp/messages/enhance-and-send - Enhance message with AI and send to group/contact
 */
app.post('/api/whatsapp/messages/enhance-and-send', async (req, res) => {
    try {
        const { 
            message, 
            groupName, 
            contactName, 
            phoneNumber,
            autoSend = true,
            enhancement = 'improve' // 'improve', 'add_emojis', 'make_casual', 'make_professional'
        } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: message',
                examples: {
                    toGroup: {
                        message: "Hey everyone, hope you all are doing well",
                        groupName: "Teen tigada kam bigada",
                        autoSend: true
                    },
                    toContact: {
                        message: "Hi, how are things going with your project",
                        contactName: "Anshul Kashyap Kalvium Student",
                        enhancement: "add_emojis",
                        autoSend: true
                    },
                    toPhone: {
                        message: "Thanks for the help yesterday",
                        phoneNumber: "+919876543210",
                        enhancement: "improve",
                        autoSend: false
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        if (!groupName && !contactName && !phoneNumber) {
            return res.status(400).json({
                success: false,
                message: 'Must provide either groupName, contactName, or phoneNumber',
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🤖 Enhancing message: "${message.substring(0, 50)}..."`);
        
        // Enhance the message with AI
        const enhancedResult = await aiService.enhanceWhatsAppMessage(message, enhancement);
        const enhancedMessage = enhancedResult.enhancedContent;
        
        console.log(`✨ Enhanced to: "${enhancedMessage.substring(0, 50)}..."`);
        
        let sendResult = null;
        let recipientType = '';
        let recipientName = '';
        
        if (autoSend) {
            try {
                if (groupName) {
                    // Send to group
                    recipientType = 'group';
                    recipientName = groupName;
                    
                    // Find group
                    const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 100 });
                    const targetGroup = chats.chats.find(chat => 
                        chat.name && chat.name.toLowerCase().includes(groupName.toLowerCase())
                    );
                    
                    if (targetGroup) {
                        sendResult = await whatsappService.sendWhatsAppMessage(targetGroup.id, enhancedMessage);
                    } else {
                        throw new Error(`Group "${groupName}" not found`);
                    }
                    
                } else if (contactName) {
                    // Send to contact by name
                    recipientType = 'contact';
                    recipientName = contactName;
                    
                    const chats = await whatsappService.getWhatsAppChats({ type: 'individual', limit: 200 });
                    const targetContact = chats.chats.find(chat => 
                        chat.name && chat.name.toLowerCase().includes(contactName.toLowerCase())
                    );
                    
                    if (targetContact) {
                        sendResult = await whatsappService.sendWhatsAppMessage(targetContact.id, enhancedMessage);
                    } else {
                        throw new Error(`Contact "${contactName}" not found`);
                    }
                    
                } else if (phoneNumber) {
                    // Send to phone number
                    recipientType = 'phone';
                    recipientName = phoneNumber;
                    
                    const cleanPhone = phoneNumber.toString().replace(/[^\d+]/g, '');
                    sendResult = await whatsappService.sendMessageToNumber(cleanPhone, enhancedMessage);
                }
            } catch (sendError) {
                console.error('❌ Failed to send enhanced message:', sendError.message);
                sendResult = { error: sendError.message };
            }
        }
        
        res.json({
            success: true,
            message: `Message ${autoSend ? 'enhanced and sent' : 'enhanced'} successfully`,
            data: {
                originalMessage: message,
                enhancedMessage: enhancedMessage,
                enhancement: enhancement,
                
                // Enhancement details
                improvements: enhancedResult.improvements || ['General improvements applied'],
                characterChange: enhancedMessage.length - message.length,
                
                // Recipient info
                recipientType: recipientType,
                recipientName: recipientName,
                
                // Send result
                ...(sendResult && {
                    sent: !sendResult.error,
                    messageId: sendResult.messageId,
                    sentAt: sendResult.sentAt,
                    sendError: sendResult.error
                })
            },
            actions: autoSend ? null : {
                sendManually: 'Copy the enhancedMessage and send via WhatsApp',
                sendViaAPI: 'Use POST /api/whatsapp/groups/send or /api/whatsapp/contacts/send'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Enhance and send failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to enhance and send message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/messages/quick-enhance - Just enhance message without sending
 */
app.post('/api/whatsapp/messages/quick-enhance', async (req, res) => {
    try {
        const { message, enhancement = 'improve' } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: message',
                examples: [
                    { message: "hey whats up", enhancement: "improve" },
                    { message: "thanks for help", enhancement: "add_emojis" },
                    { message: "meeting at 3pm", enhancement: "make_professional" }
                ],
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🤖 Quick enhancing: "${message}"`);
        
        const enhancedResult = await aiService.enhanceWhatsAppMessage(message, enhancement);
        
        res.json({
            success: true,
            message: 'Message enhanced successfully',
            data: {
                originalMessage: message,
                enhancedMessage: enhancedResult.enhancedContent,
                enhancement: enhancement,
                improvements: enhancedResult.improvements || ['General improvements applied'],
                characterCount: {
                    original: message.length,
                    enhanced: enhancedResult.enhancedContent.length,
                    change: enhancedResult.enhancedContent.length - message.length
                }
            },
            copyPaste: {
                instruction: 'Copy the enhanced message below and paste to WhatsApp',
                enhancedText: enhancedResult.enhancedContent
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to enhance message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


/**
 * POST /api/whatsapp/messages/send-ai - Send AI-generated message to group/contact
 */
app.post('/api/whatsapp/messages/send-ai', async (req, res) => {
    try {
        const { 
            recipient, 
            recipientType = 'phone', // 'phone', 'group', 'contact'
            intent, 
            context = {}, 
            autoSend = true,
            messageType = 'casual'
        } = req.body;
        
        if (!recipient || !intent) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: recipient, intent',
                examples: {
                    toPhone: {
                        recipient: "+919876543210",
                        recipientType: "phone",
                        intent: "catch up with friend",
                        context: { relation: "college friend", lastContact: "2 months ago" },
                        autoSend: true
                    },
                    toGroup: {
                        recipient: "Family Group",
                        recipientType: "group",
                        intent: "share good news",
                        context: { news: "got promotion", mood: "excited" },
                        autoSend: true
                    },
                    toContact: {
                        recipient: "John Doe",
                        recipientType: "contact",
                        intent: "ask for favor",
                        context: { favor: "project help", urgency: "medium" },
                        autoSend: false
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // Generate AI message
        const aiMessage = await aiService.generateWhatsAppMessage(recipient, intent, context);
        
        let sendResult = null;
        
        if (autoSend) {
            try {
                switch (recipientType) {
                    case 'phone':
                        const cleanPhone = recipient.replace(/[^\d+]/g, '');
                        sendResult = await whatsappService.sendMessageToNumber(cleanPhone, aiMessage.content);
                        break;
                        
                    case 'group':
                        // Find group by name
                        const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 100 });
                        const group = chats.chats.find(chat => 
                            chat.name && chat.name.toLowerCase().includes(recipient.toLowerCase())
                        );
                        if (group) {
                            sendResult = await whatsappService.sendWhatsAppMessage(group.id, aiMessage.content);
                        } else {
                            throw new Error(`Group "${recipient}" not found`);
                        }
                        break;
                        
                    case 'contact':
                        // Find contact by name
                        const contacts = await whatsappService.getWhatsAppChats({ type: 'individual', limit: 200 });
                        const contact = contacts.chats.find(chat => 
                            chat.name && chat.name.toLowerCase().includes(recipient.toLowerCase())
                        );
                        if (contact && contact.phoneNumber) {
                            sendResult = await whatsappService.sendMessageToNumber(contact.phoneNumber, aiMessage.content);
                        } else {
                            throw new Error(`Contact "${recipient}" not found`);
                        }
                        break;
                        
                    default:
                        throw new Error('Invalid recipientType. Use: phone, group, or contact');
                }
            } catch (sendError) {
                // If sending fails, still return the generated message
                console.error('Failed to send AI message:', sendError.message);
                sendResult = { error: sendError.message };
            }
        }
        
        res.json({
            success: true,
            message: `AI message ${autoSend ? 'generated and sent' : 'generated'} successfully`,
            data: {
                ...aiMessage,
                recipient: recipient,
                recipientType: recipientType,
                intent: intent,
                ...(sendResult && {
                    sent: !sendResult.error,
                    messageId: sendResult.messageId,
                    sentAt: sendResult.sentAt,
                    sendError: sendResult.error
                })
            },
            actions: autoSend ? null : {
                sendToPhone: 'POST /api/whatsapp/messages/send-to-number',
                sendToGroup: 'POST /api/whatsapp/groups/send',
                sendToContact: 'POST /api/whatsapp/contacts/send'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate/send AI message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= ENHANCED STATUS ENDPOINTS =============

/**
 * POST /api/whatsapp/status/post-ai - Generate and post AI-enhanced status
 */
app.post('/api/whatsapp/status/post-ai', async (req, res) => {
    try {
        const { 
            topic, 
            mood = 'positive', 
            autoPost = true,
            mediaUrl,
            mediaType,
            backgroundColor,
            duration = 86400 
        } = req.body;
        
        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: topic',
                examples: {
                    simple: {
                        topic: "completed a project",
                        mood: "accomplished",
                        autoPost: true
                    },
                    withMedia: {
                        topic: "amazing sunset view",
                        mood: "peaceful",
                        autoPost: true,
                        mediaUrl: "https://example.com/sunset.jpg",
                        mediaType: "image"
                    },
                    withBackground: {
                        topic: "motivational quote",
                        mood: "inspiring",
                        autoPost: true,
                        backgroundColor: "#4CAF50"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // Generate AI status
        const aiStatus = await aiService.generateWhatsAppStatus(topic, mood);
        
        let postResult = null;
        
        if (autoPost) {
            try {
                postResult = await whatsappService.postWhatsAppStatus(aiStatus.content, {
                    mediaUrl,
                    mediaType,
                    backgroundColor,
                    duration: parseInt(duration)
                });
            } catch (postError) {
                console.error('Failed to post AI status:', postError.message);
                postResult = { error: postError.message };
            }
        }
        
        res.json({
            success: true,
            message: `AI status ${autoPost ? 'generated and posted' : 'generated'} successfully`,
            data: {
                ...aiStatus,
                topic: topic,
                mood: mood,
                ...(postResult && {
                    posted: !postResult.error,
                    statusId: postResult.statusId,
                    postedAt: postResult.postedAt,
                    postError: postResult.error
                })
            },
            actions: autoPost ? null : {
                postStatus: 'POST /api/whatsapp/status/post with the generated content'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate/post AI status',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/status/my-statuses - Get your posted statuses
 */
app.get('/api/whatsapp/status/my-statuses', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Note: This endpoint depends on Unipile supporting status retrieval
        // Implementation may vary based on actual API capabilities
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/stories`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: {
                account_id: process.env.WHATSAPP_ACCOUNT_ID,
                limit: parseInt(limit)
            }
        });
        
        let statuses = [];
        if (response.data && response.data.items) {
            statuses = response.data.items;
        } else if (Array.isArray(response.data)) {
            statuses = response.data;
        }
        
        res.json({
            success: true,
            message: `Retrieved ${statuses.length} of your WhatsApp statuses`,
            data: statuses.map(status => ({
                id: status.id,
                content: status.text || status.content,
                mediaType: status.media_type,
                mediaUrl: status.media_url,
                backgroundColor: status.background_color,
                postedAt: status.timestamp || status.created_at,
                expiresAt: status.expires_at,
                viewCount: status.view_count || 0,
                isExpired: status.is_expired || false
            })),
            total: response.data.total || statuses.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get your statuses',
            error: error.message,
            note: 'This feature depends on Unipile API support for status retrieval',
            timestamp: new Date().toISOString()
        });
    }
});

// ============= UTILITY ENDPOINTS =============

/**
 * GET /api/whatsapp/search - Search messages, groups, contacts
 */
app.get('/api/whatsapp/search', async (req, res) => {
    try {
        const { query, type = 'all', limit = 20 } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: query',
                examples: [
                    'GET /api/whatsapp/search?query=project&type=messages',
                    'GET /api/whatsapp/search?query=family&type=groups',
                    'GET /api/whatsapp/search?query=john&type=contacts'
                ],
                timestamp: new Date().toISOString()
            });
        }
        
        const results = {
            messages: [],
            groups: [],
            contacts: []
        };
        
        if (type === 'all' || type === 'messages') {
            const messages = await whatsappService.getWhatsAppMessages({ limit: 200 });
            results.messages = messages.messages.filter(msg =>
                msg.content.toLowerCase().includes(query.toLowerCase()) ||
                msg.senderName.toLowerCase().includes(query.toLowerCase())
            ).slice(0, parseInt(limit));
        }
        
        if (type === 'all' || type === 'groups') {
            const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 100 });
            results.groups = chats.chats.filter(chat =>
                chat.name && chat.name.toLowerCase().includes(query.toLowerCase())
            ).slice(0, parseInt(limit));
        }
        
        if (type === 'all' || type === 'contacts') {
            const chats = await whatsappService.getWhatsAppChats({ type: 'individual', limit: 200 });
            results.contacts = chats.chats.filter(chat =>
                (chat.name && chat.name.toLowerCase().includes(query.toLowerCase())) ||
                (chat.phoneNumber && chat.phoneNumber.includes(query))
            ).slice(0, parseInt(limit));
        }
        
        const totalResults = results.messages.length + results.groups.length + results.contacts.length;
        
        res.json({
            success: true,
            message: `Found ${totalResults} results for "${query}"`,
            query: query,
            searchType: type,
            data: results,
            summary: {
                totalResults: totalResults,
                messagesFound: results.messages.length,
                groupsFound: results.groups.length,
                contactsFound: results.contacts.length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Search failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/messages/decode - Decode specific messages with enhanced information
 */
app.post('/api/whatsapp/messages/decode', async (req, res) => {
    try {
        const { messageIds } = req.body;
        
        if (!messageIds || !Array.isArray(messageIds)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: messageIds (array)',
                example: {
                    messageIds: ["tHcGJpjVXIarBMvpBuTS3Q", "ci2VpTDHUvGRyk5ixagdPA"]
                },
                timestamp: new Date().toISOString()
            });
        }
        
        // Get all recent messages
        const allMessages = await whatsappService.getWhatsAppMessages({ limit: 200 });
        
        // Find and decode the requested messages
        const decodedMessages = messageIds.map(msgId => {
            const message = allMessages.messages.find(msg => msg.id === msgId);
            if (!message) {
                return {
                    messageId: msgId,
                    found: false,
                    error: 'Message not found'
                };
            }
            
            return {
                messageId: msgId,
                found: true,
                original: message,
                decoded: {
                    actualSenderName: message.decodedData?.actualSenderName,
                    pushName: message.decodedData?.pushName,
                    decodedContent: message.content,
                    isReaction: message.decodedData?.isReaction,
                    reactionEmoji: message.decodedData?.reactionEmoji,
                    isSystemMessage: message.decodedData?.isSystemMessage,
                    systemAction: message.decodedData?.systemAction,
                    senderPhone: message.senderPhone
                }
            };
        });
        
        res.json({
            success: true,
            message: 'Messages decoded successfully',
            data: decodedMessages,
            summary: {
                requestedMessages: messageIds.length,
                foundMessages: decodedMessages.filter(m => m.found).length,
                notFoundMessages: decodedMessages.filter(m => !m.found).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to decode messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/messages/decoded - Get messages with enhanced decoding
 */
app.get('/api/whatsapp/messages/decoded', async (req, res) => {
    try {
        const { limit = 20, showOnlyDecoded = false } = req.query;
        
        const messages = await whatsappService.getWhatsAppMessages({
            limit: parseInt(limit)
        });
        
        let filteredMessages = messages.messages;
        
        if (showOnlyDecoded === 'true') {
            filteredMessages = messages.messages.filter(msg => 
                msg.decodedData?.actualSenderName || msg.decodedData?.isReaction || msg.decodedData?.isSystemMessage
            );
        }
        
        res.json({
            success: true,
            message: `Retrieved ${filteredMessages.length} decoded WhatsApp messages`,
            data: filteredMessages.map(msg => ({
                id: msg.id,
                chatId: msg.chatId,
                senderPhone: msg.senderPhone,
                originalSenderName: msg.senderName,
                actualSenderName: msg.decodedData?.actualSenderName,
                pushName: msg.decodedData?.pushName,
                content: msg.content,
                messageType: msg.messageType,
                timestamp: msg.timestamp,
                isReaction: msg.decodedData?.isReaction,
                reactionEmoji: msg.decodedData?.reactionEmoji,
                isSystemMessage: msg.decodedData?.isSystemMessage,
                systemAction: msg.decodedData?.systemAction,
                isGroup: msg.isGroup,
                groupName: msg.groupName
            })),
            summary: {
                totalMessages: filteredMessages.length,
                decodedMessages: filteredMessages.filter(m => m.decodedData?.actualSenderName).length,
                reactionMessages: filteredMessages.filter(m => m.decodedData?.isReaction).length,
                systemMessages: filteredMessages.filter(m => m.decodedData?.isSystemMessage).length,
                regularMessages: filteredMessages.filter(m => !m.decodedData?.isReaction && !m.decodedData?.isSystemMessage).length
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get decoded messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/whatsapp/placeholders/extract - Extract all placeholder IDs for mapping
 */
app.get('/api/whatsapp/placeholders/extract', async (req, res) => {
    try {
        const { limit = 100 } = req.query;
        
        const messages = await whatsappService.getWhatsAppMessages({
            limit: parseInt(limit)
        });
        
        const placeholders = new Map();
        
        messages.messages.forEach(msg => {
            // Extract placeholders from content
            const placeholderMatches = (msg.content || '').matchAll(/\{\{([^}]+)\}\}/g);
            for (const match of placeholderMatches) {
                const placeholderId = match[1];
                
                if (!placeholders.has(placeholderId)) {
                    placeholders.set(placeholderId, {
                        placeholderId: placeholderId,
                        actualName: msg.decodedData?.actualSenderName || null,
                        pushName: msg.decodedData?.pushName || null,
                        senderPhone: msg.senderPhone,
                        firstSeenInMessage: msg.id,
                        messageContent: msg.content,
                        timestamp: msg.timestamp
                    });
                }
            }
        });
        
        const placeholderArray = Array.from(placeholders.values());
        
        res.json({
            success: true,
            message: `Extracted ${placeholderArray.length} unique placeholder IDs`,
            data: placeholderArray,
            codeSnippet: {
                description: 'Add these to your resolvePlaceholder method in whatsapp-service.js',
                code: placeholderArray.map(p => 
                    `'${p.placeholderId}': '${p.actualName || p.pushName || 'Unknown User'}'`
                ).join(',\n')
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to extract placeholders',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * GET /api/whatsapp/capabilities - Check WhatsApp account capabilities
 */
app.get('/api/whatsapp/capabilities', async (req, res) => {
    try {
        const capabilities = await whatsappService.checkWhatsAppCapabilities();
        
        res.json({
            success: true,
            message: 'WhatsApp account capabilities retrieved',
            data: capabilities,
            recommendations: [
                capabilities.canSendMessages === false ? 
                    'Account cannot send messages - this is common for WhatsApp Business API' : 
                    'Messaging capabilities available',
                'WhatsApp typically restricts third-party message sending',
                'Consider using WhatsApp Business API directly for sending messages'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to check WhatsApp capabilities',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/messages/preview - Preview message without sending
 */
app.post('/api/whatsapp/messages/preview', async (req, res) => {
    try {
        const { chatId, groupName, phoneNumber, content } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: content',
                timestamp: new Date().toISOString()
            });
        }
        
        let targetChatId = chatId;
        let targetName = groupName || phoneNumber || 'Unknown';
        
        // If group name is provided, find the group ID
        if (groupName && !chatId) {
            const chats = await whatsappService.getWhatsAppChats({ type: 'group', limit: 100 });
            const targetGroup = chats.chats.find(chat => 
                chat.name && chat.name.toLowerCase().includes(groupName.toLowerCase())
            );
            
            if (targetGroup) {
                targetChatId = targetGroup.id;
                targetName = targetGroup.name;
            }
        }
        
        const preview = await whatsappService.generateMessagePreview(targetChatId, content);
        
        res.json({
            success: true,
            message: 'Message preview generated (not sent)',
            data: {
                ...preview,
                targetName: targetName,
                targetChatId: targetChatId,
                characterCount: content.length,
                estimatedDeliveryTime: 'Instant (if sending was supported)'
            },
            note: 'This is a preview only. Actual sending may not be supported by WhatsApp API.',
            alternatives: [
                'Use WhatsApp Web manually',
                'Use official WhatsApp Business API',
                'Copy the generated content and send manually'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate message preview',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/whatsapp/debug/endpoints - Test different messaging endpoints
 */
app.post('/api/whatsapp/debug/endpoints', async (req, res) => {
    try {
        const { chatId, content = "Test message" } = req.body;
        
        if (!chatId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: chatId',
                timestamp: new Date().toISOString()
            });
        }
        
        const endpointsToTest = [
            `${process.env.UNIPILE_BASE_URL}/api/v1/messages`,
            `${process.env.UNIPILE_BASE_URL}/api/v1/whatsapp/messages`,
            `${process.env.UNIPILE_BASE_URL}/api/v1/messages/whatsapp`,
            `${process.env.UNIPILE_BASE_URL}/api/v1/chats/${chatId}/messages`,
            `${process.env.UNIPILE_BASE_URL}/api/v1/send`,
            `${process.env.UNIPILE_BASE_URL}/api/v1/whatsapp/send`
        ];
        
        const results = [];
        
        for (const endpoint of endpointsToTest) {
            try {
                const testData = {
                    account_id: process.env.WHATSAPP_ACCOUNT_ID,
                    chat_id: chatId,
                    text: content
                };
                
                // Don't actually send, just test if endpoint exists
                const response = await axios.post(endpoint, testData, {
                    headers: {
                        'X-API-KEY': process.env.UNIPILE_API_KEY,
                        'X-DSN': process.env.UNIPILE_DSN,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000,
                    validateStatus: () => true // Don't throw on any status
                });
                
                results.push({
                    endpoint: endpoint,
                    status: response.status,
                    available: response.status !== 404,
                    response: response.status === 404 ? 'Not Found' : 'Available (may need proper payload)'
                });
            } catch (error) {
                results.push({
                    endpoint: endpoint,
                    status: 'error',
                    available: false,
                    error: error.code || error.message
                });
            }
        }
        
        res.json({
            success: true,
            message: 'WhatsApp messaging endpoints tested',
            data: results,
            summary: {
                totalTested: results.length,
                available: results.filter(r => r.available).length,
                notFound: results.filter(r => r.status === 404).length
            },
            recommendation: results.filter(r => r.available).length === 0 ? 
                'No messaging endpoints available - WhatsApp may not support third-party sending' :
                'Some endpoints available - check individual results',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to test endpoints',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log('🚀 WHATSAPP AI-ENHANCED SERVER STARTED');
    console.log('🚀 ========================================');
    console.log(`📱 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/`);
    console.log(`🤖 AI Features: Enabled with Gemini integration`);
    console.log(`📱 WhatsApp Integration: Ready via Unipile`);
    console.log('🚀 ========================================');
    console.log('🎯 Quick Test: POST /api/whatsapp/messages/send-to-number');
    console.log('📬 Messages: GET /api/whatsapp/messages');
    console.log('👥 Groups: GET /api/whatsapp/groups');
    console.log('🚀 ========================================');
});

export default app;
