// linkedin-server.js - Main LinkedIn AI Server
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { config } from 'dotenv';
import { LinkedInService } from './linkedin-service.js';
import { AIEnhancementService } from './ai-enhancement-service.js';
import { PostGenerator } from './post-generator.js';

config();

const app = express();
const linkedinService = new LinkedInService();
const aiService = new AIEnhancementService();
const postGenerator = new PostGenerator();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload middleware
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============= ROOT ENDPOINTS =============

/**
 * GET / - LinkedIn API Documentation
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'LinkedIn AI-Enhanced Server',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        features: [
            '🔗 LinkedIn Message Management',
            '📝 AI-Powered Post Generation',
            '🤖 Content Enhancement',
            '📊 Engagement Analytics',
            '💬 Smart Response Suggestions',
            '🎯 Achievement Post Templates'
        ],
        endpoints: {
            // Account Management
            accounts: 'GET /api/linkedin/accounts',
            
            // Message Management
            messages: 'GET /api/linkedin/messages',
            sendMessage: 'POST /api/linkedin/messages/send',
            analyzeMessage: 'POST /api/linkedin/messages/analyze',
            suggestResponse: 'POST /api/linkedin/messages/suggest-response',
            
            // Post Management
            posts: 'GET /api/linkedin/posts',
            createPost: 'POST /api/linkedin/posts/create',
            generatePost: 'POST /api/linkedin/posts/generate',
            enhancePost: 'POST /api/linkedin/posts/enhance',
            
            // AI Features
            generateAchievement: 'POST /api/ai/posts/achievement',
            generateInsight: 'POST /api/ai/posts/insight',
            generateUpdate: 'POST /api/ai/posts/update',
            generateEngagement: 'POST /api/ai/posts/engagement',
            hackIndiaPost: 'POST /api/ai/posts/hackindia'
        },
        quickStart: {
            step1: `GET http://localhost:4000/api/linkedin/accounts`,
            step2: `GET http://localhost:4000/api/linkedin/messages`,
            step3: `POST http://localhost:4000/api/ai/posts/hackindia`
        }
    });
});

/**
 * GET /debug/linkedin/attendee/:attendeeId - Debug attendee details
 */
app.get('/debug/linkedin/attendee/:attendeeId', async (req, res) => {
    try {
        const { attendeeId } = req.params;
        const { chatId } = req.query;
        
        console.log(`🔍 Debug: Getting attendee details for ${attendeeId}`);
        
        // Try to get attendee details
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/attendees/${attendeeId}`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: {
                account_id: process.env.LINKEDIN_ACCOUNT_ID,
                ...(chatId && { chat_id: chatId })
            }
        });

        res.json({
            success: true,
            message: 'Attendee details retrieved',
            data: {
                attendeeId: attendeeId,
                attendeeData: response.data,
                availableFields: Object.keys(response.data || {}),
                extractedInfo: {
                    name: response.data.name || response.data.display_name || response.data.full_name,
                    identifier: response.data.identifier || response.data.email,
                    profile: response.data.linkedin_url || response.data.profile_url,
                    headline: response.data.headline || response.data.title
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /debug/linkedin/chat/:chatId/participants - Debug chat participants
 */
app.get('/debug/linkedin/chat/:chatId/participants', async (req, res) => {
    try {
        const { chatId } = req.params;
        
        console.log(`🔍 Debug: Getting chat participants for ${chatId}`);
        
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/chats/${chatId}/attendees`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: {
                account_id: process.env.LINKEDIN_ACCOUNT_ID
            }
        });

        const participants = response.data.items || response.data || [];

        res.json({
            success: true,
            message: 'Chat participants retrieved',
            data: {
                chatId: chatId,
                participants: participants,
                participantCount: participants.length,
                participantDetails: participants.map(p => ({
                    id: p.id,
                    name: p.name || p.display_name,
                    identifier: p.identifier || p.email,
                    availableFields: Object.keys(p)
                }))
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
});


// ============= LINKEDIN ACCOUNT ENDPOINTS =============

/**
 * GET /api/linkedin/accounts - Get LinkedIn accounts
 */
app.get('/api/linkedin/accounts', async (req, res) => {
    try {
        const result = await linkedinService.getLinkedInAccounts();
        
        res.json({
            success: true,
            message: `Found ${result.total} LinkedIn account${result.total !== 1 ? 's' : ''}`,
            data: result.accounts,
            total: result.total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get LinkedIn accounts',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= LINKEDIN MESSAGE ENDPOINTS =============

/**
 * GET /api/linkedin/messages - Get LinkedIn messages
 */
app.get('/api/linkedin/messages', async (req, res) => {
    try {
        const { limit = 20, offset = 0, since, until } = req.query;
        
        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ...(since && { since }),
            ...(until && { until })
        };
        
        const result = await linkedinService.getLinkedInMessages(options);
        
        res.json({
            success: true,
            message: `Retrieved ${result.messages.length} LinkedIn messages`,
            data: result.messages,
            total: result.total,
            pagination: {
                limit: options.limit,
                offset: options.offset,
                hasMore: result.messages.length === options.limit
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get LinkedIn messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/messages/send - Send LinkedIn message
 */
app.post('/api/linkedin/messages/send', async (req, res) => {
    try {
        const { chatId, content, subject } = req.body;
        
        if (!chatId || !content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: chatId, content',
                example: {
                    chatId: "J3RCR5uYWqCC3tdWohCn4A",
                    content: "Hi! Thank you for your message. Looking forward to connecting!",
                    subject: "Re: Your message"
                },
                howToGetChatId: [
                    "Get messages: GET /api/linkedin/messages",
                    "Look for 'threadId' or 'chatId' in message response",
                    "Use that chatId to send message to same conversation"
                ],
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`📤 Sending LinkedIn message to chat: ${chatId}`);
        
        const result = await linkedinService.sendLinkedInMessage(chatId, content, { subject });
        
        res.json({
            success: true,
            message: 'LinkedIn message sent successfully',
            data: {
                messageId: result.messageId,
                chatId: chatId,
                content: content,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Send LinkedIn message failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send LinkedIn message',
            error: error.message,
            troubleshooting: [
                'Verify the chatId is correct (get from messages endpoint)',
                'Ensure content is not empty',
                'Check LinkedIn account permissions'
            ],
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/messages/analyze - Analyze message with AI
 */
app.post('/api/linkedin/messages/analyze', async (req, res) => {
    try {
        const { messageContent } = req.body;
        
        if (!messageContent) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: messageContent',
                example: {
                    messageContent: "Hi, I saw your post about AI and would love to connect!"
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const analysis = await aiService.analyzeMessage(messageContent);
        
        res.json({
            success: true,
            message: 'Message analyzed successfully',
            data: analysis,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to analyze message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/messages/suggest-response - Get AI response suggestions
 */
app.post('/api/linkedin/messages/suggest-response', async (req, res) => {
    try {
        const { originalMessage, responseType = 'professional' } = req.body;
        
        if (!originalMessage) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: originalMessage',
                timestamp: new Date().toISOString()
            });
        }
        
        const suggestion = await aiService.generateMessageResponse(originalMessage, responseType);
        
        res.json({
            success: true,
            message: 'Response suggestion generated',
            data: suggestion,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate response suggestion',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= LINKEDIN POST ENDPOINTS =============

/**
 * GET /api/linkedin/posts - Get LinkedIn posts
 */
app.get('/api/linkedin/posts', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        
        const result = await linkedinService.getLinkedInPosts(options);
        
        res.json({
            success: true,
            message: `Retrieved ${result.posts.length} LinkedIn posts`,
            data: result.posts,
            total: result.total,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get LinkedIn posts',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/posts/create - Create LinkedIn post
 */
/**
 * POST /api/linkedin/posts/create - Create LinkedIn post (FIXED)
 */
app.post('/api/linkedin/posts/create', async (req, res) => {
    try {
        const { content, text, visibility = 'public', imageUrl, mentions } = req.body;
        
        // Accept either 'content' or 'text' field
        const postText = text || content;
        
        if (!postText) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: content or text',
                example: {
                    content: "Excited to share my latest project!",
                    visibility: "public"
                },
                alternativeExample: {
                    text: "Excited to share my latest project!",
                    visibility: "public",
                    mentions: [
                        { "name": "John Doe", "profile_id": "linkedin_user_id" }
                    ]
                },
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`📝 Creating LinkedIn post with ${postText.length} characters`);
        
        const result = await linkedinService.createLinkedInPost(postText, {
            visibility,
            imageUrl,
            mentions
        });
        
        res.json({
            success: true,
            message: 'LinkedIn post created successfully!',
            data: {
                postId: result.postId,
                url: result.url,
                content: postText,
                visibility: visibility,
                createdAt: result.createdAt,
                characterCount: postText.length
            },
            tips: [
                'Your post should appear on your LinkedIn profile within a few minutes',
                'Check your LinkedIn activity or posts tab to see the post',
                'Engage with comments to boost algorithmic reach'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Create LinkedIn post failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create LinkedIn post',
            error: error.message,
            troubleshooting: [
                'Check if LINKEDIN_ACCOUNT_ID is set correctly in .env',
                'Verify LinkedIn account is connected to Unipile',
                'Ensure account has posting permissions',
                'Check if content length is within LinkedIn limits (3000 chars)'
            ],
            timestamp: new Date().toISOString()
        });
    }
});


// Add these new endpoints to your existing linkedin-server.js

/**
 * POST /api/linkedin/posts/auto-create - Generate, enhance, and post automatically
 */
app.post('/api/linkedin/posts/auto-create', async (req, res) => {
    try {
        const { 
            brief, 
            type = 'achievement', 
            postImmediately = false,
            enhancement = 'improve',
            visibility = 'public'
        } = req.body;
        
        if (!brief) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: brief',
                examples: {
                    achievement: {
                        brief: "We won HackIndia finals with our AI project",
                        type: "achievement",
                        postImmediately: true
                    },
                    insight: {
                        brief: "AI and Web3 are converging to create new opportunities",
                        type: "insight",
                        postImmediately: false
                    },
                    update: {
                        brief: "Completed major milestone in our project development",
                        type: "update",
                        postImmediately: true
                    }
                },
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🤖 Auto-creating ${type} post from brief: "${brief.substring(0, 50)}..."`);

        // Step 1: Generate initial content based on type
        let generatedContent;
        
        switch (type) {
            case 'achievement':
                const achievementResult = await aiService.generateAchievementPost(brief, {
                    team: 'Team Sankalp',
                    competition: 'professional milestone',
                    impact: 'significant achievement'
                });
                generatedContent = achievementResult.content;
                break;
                
            case 'insight':
                const insightResult = await aiService.generateLinkedInPost(brief, {
                    tone: 'thought-leadership',
                    length: 'medium',
                    includeHashtags: true,
                    targetAudience: 'tech professionals',
                    callToAction: true
                });
                generatedContent = insightResult.content;
                break;
                
            case 'update':
                const updateResult = await aiService.generateLinkedInPost(brief, {
                    tone: 'professional',
                    length: 'medium',
                    includeHashtags: true,
                    targetAudience: 'professional network',
                    callToAction: false
                });
                generatedContent = updateResult.content;
                break;
                
            case 'hackindia':
                const hackindiaResult = await aiService.generateHackIndiaPost('finalist');
                generatedContent = hackindiaResult.content;
                break;
                
            default:
                const defaultResult = await aiService.generateLinkedInPost(brief, {
                    tone: 'professional',
                    length: 'medium',
                    includeHashtags: true
                });
                generatedContent = defaultResult.content;
        }

        // Step 2: Auto-enhance the generated content
        const enhancedResult = await aiService.enhancePostContent(generatedContent, enhancement);
        const finalContent = enhancedResult.enhancedContent;

        console.log(`✨ Content enhanced: ${enhancedResult.improvements.join(', ')}`);

        let postResult = null;
        
        // Step 3: Post immediately if requested
        if (postImmediately) {
            console.log('📤 Posting to LinkedIn automatically...');
            postResult = await linkedinService.createLinkedInPost(finalContent, { visibility });
        }

        res.json({
            success: true,
            message: `Auto-enhanced ${type} post ${postImmediately ? 'created and posted' : 'generated'} successfully!`,
            data: {
                originalBrief: brief,
                type: type,
                generatedContent: generatedContent,
                enhancedContent: finalContent,
                enhancement: enhancement,
                improvements: enhancedResult.improvements,
                wordCount: aiService.countWords(finalContent),
                hashtags: aiService.extractHashtags(finalContent),
                ...(postResult && {
                    posted: true,
                    postId: postResult.postId,
                    postUrl: postResult.url,
                    postedAt: postResult.createdAt
                })
            },
            actions: postImmediately ? null : {
                postNow: 'POST /api/linkedin/posts/create with the enhancedContent',
                enhanceMore: 'POST /api/linkedin/posts/enhance with different enhancement type'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Auto-create post failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to auto-create post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/posts/quick-post - One-liner to enhanced post
 */
app.post('/api/linkedin/posts/quick-post', async (req, res) => {
    try {
        const { message, autoPost = true } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: message',
                examples: [
                    "Just finished an amazing hackathon",
                    "Learned something interesting about AI today",
                    "Our team achieved a major milestone",
                    "Excited about new project developments"
                ],
                timestamp: new Date().toISOString()
            });
        }

        console.log(`🚀 Quick-posting: "${message}"`);

        // Generate enhanced content
        const enhanced = await aiService.enhancePostContent(message, 'improve');
        
        let postResult = null;
        if (autoPost) {
            postResult = await linkedinService.createLinkedInPost(enhanced.enhancedContent, {
                visibility: 'public'
            });
        }

        res.json({
            success: true,
            message: `Quick post ${autoPost ? 'created and posted' : 'enhanced'} successfully!`,
            data: {
                originalMessage: message,
                enhancedContent: enhanced.enhancedContent,
                improvements: enhanced.improvements,
                characterCount: enhanced.enhancedContent.length,
                ...(postResult && {
                    posted: true,
                    postId: postResult.postId,
                    postUrl: postResult.url
                })
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create quick post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= ENHANCED MESSAGE MANAGEMENT ENDPOINTS =============

/**
 * GET /api/linkedin/messages/unread - Get unread LinkedIn messages
 */
app.get('/api/linkedin/messages/unread', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        // Get all messages first
        const allMessages = await linkedinService.getLinkedInMessages({
            limit: parseInt(limit) * 2 // Get more to filter unread
        });
        
        // Filter for unread messages
        const unreadMessages = allMessages.messages.filter(msg => !msg.isRead);
        
        // Limit the results
        const limitedUnread = unreadMessages.slice(0, parseInt(limit));

        res.json({
            success: true,
            message: `Found ${limitedUnread.length} unread LinkedIn messages`,
            data: limitedUnread.map(msg => ({
                id: msg.id,
                from: msg.from,
                subject: msg.subject || 'No Subject',
                preview: msg.content.substring(0, 100) + '...',
                date: msg.date,
                threadId: msg.threadId,
                priority: msg.content.toLowerCase().includes('urgent') ? 'high' : 'normal'
            })),
            total: limitedUnread.length,
            summary: {
                unreadCount: limitedUnread.length,
                fromUniqueUsers: [...new Set(limitedUnread.map(msg => msg.from.identifier))].length,
                hasUrgent: limitedUnread.some(msg => msg.content.toLowerCase().includes('urgent'))
            },
            actions: {
                readMessage: 'GET /api/linkedin/messages/{messageId}',
                replyToMessage: 'POST /api/linkedin/messages/reply/{messageId}',
                analyzeMessage: 'POST /api/linkedin/messages/analyze'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get unread messages',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/linkedin/messages/summary - Get message summary and insights
 */
app.get('/api/linkedin/messages/summary', async (req, res) => {
    try {
        const messages = await linkedinService.getLinkedInMessages({ limit: 50 });
        
        const unreadMessages = messages.messages.filter(msg => !msg.isRead);
        const uniqueSenders = [...new Set(messages.messages.map(msg => msg.from.identifier))];
        
        // Categorize messages
        const categories = {
            networking: messages.messages.filter(msg => 
                msg.content.toLowerCase().includes('connect') || 
                msg.content.toLowerCase().includes('network')
            ).length,
            job: messages.messages.filter(msg => 
                msg.content.toLowerCase().includes('job') || 
                msg.content.toLowerCase().includes('opportunity') ||
                msg.content.toLowerCase().includes('position')
            ).length,
            collaboration: messages.messages.filter(msg => 
                msg.content.toLowerCase().includes('collaborate') || 
                msg.content.toLowerCase().includes('partnership')
            ).length,
            sales: messages.messages.filter(msg => 
                msg.content.toLowerCase().includes('sales') || 
                msg.content.toLowerCase().includes('product') ||
                msg.content.toLowerCase().includes('service')
            ).length
        };

        res.json({
            success: true,
            message: 'Message summary generated successfully',
            data: {
                totalMessages: messages.total,
                unreadCount: unreadMessages.length,
                uniqueSenders: uniqueSenders.length,
                categories: categories,
                recentActivity: messages.messages.slice(0, 5).map(msg => ({
                    from: msg.from.name || msg.from.identifier,
                    subject: msg.subject || 'No Subject',
                    date: msg.date,
                    isRead: msg.isRead
                })),
                urgentMessages: messages.messages.filter(msg => 
                    msg.content.toLowerCase().includes('urgent') ||
                    msg.content.toLowerCase().includes('asap') ||
                    msg.content.toLowerCase().includes('immediately')
                ).length
            },
            actions: {
                getUnread: 'GET /api/linkedin/messages/unread',
                replyToAll: 'POST /api/linkedin/messages/bulk-reply',
                analyzeMessage: 'POST /api/linkedin/messages/analyze'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate message summary',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/linkedin/messages/:messageId - Get specific message details
 */
app.get('/api/linkedin/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        
        // Get all messages and find the specific one
        const allMessages = await linkedinService.getLinkedInMessages({ limit: 100 });
        const message = allMessages.messages.find(msg => msg.id === messageId);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
                messageId: messageId,
                timestamp: new Date().toISOString()
            });
        }

        // Analyze the message with AI
        const analysis = await aiService.analyzeMessage(message.content);
        
        res.json({
            success: true,
            message: 'Message details retrieved successfully',
            data: {
                ...message,
                analysis: analysis.analysis,
                actions: {
                    reply: `POST /api/linkedin/messages/reply/${messageId}`,
                    suggestResponse: `POST /api/linkedin/messages/suggest-response`
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get message details',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/linkedin/messages/reply/:messageId - Reply to specific message
 */
app.post('/api/linkedin/messages/reply/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { message, autoEnhance = true } = req.body;
        
        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: message',
                example: {
                    message: "Thank you for your message! Great to connect with you.",
                    autoEnhance: true
                },
                timestamp: new Date().toISOString()
            });
        }

        // Get original message to extract chat ID
        const allMessages = await linkedinService.getLinkedInMessages({ limit: 100 });
        const originalMessage = allMessages.messages.find(msg => msg.id === messageId);
        
        if (!originalMessage) {
            return res.status(404).json({
                success: false,
                message: 'Original message not found',
                messageId: messageId,
                timestamp: new Date().toISOString()
            });
        }

        let finalMessage = message;
        
        // Auto-enhance the reply if requested
        if (autoEnhance) {
            const enhanced = await aiService.generateMessageResponse(originalMessage.content, 'professional');
            // Use the user's message as base and enhance it
            const enhancePrompt = `Enhance this reply: "${message}" - make it professional and engaging for LinkedIn`;
            const enhancedResult = await aiService.enhancePostContent(message, 'improve');
            finalMessage = enhancedResult.enhancedContent;
        }

        // Send reply using chat ID
        const result = await linkedinService.sendLinkedInMessage(
            originalMessage.chatId,
            finalMessage
        );

        res.json({
            success: true,
            message: 'Reply sent successfully',
            data: {
                messageId: result.messageId,
                originalMessageId: messageId,
                chatId: originalMessage.chatId,
                sentMessage: finalMessage,
                enhanced: autoEnhance,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Reply to LinkedIn message failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send reply',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
/**
 * POST /api/linkedin/messages/send-enhanced - Send enhanced message to user
 */
app.post('/api/linkedin/messages/send-enhanced', async (req, res) => {
    try {
        const { chatId, brief, messageType = 'professional', autoEnhance = true } = req.body;
        
        if (!chatId || !brief) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: chatId, brief',
                examples: {
                    networking: {
                        chatId: "J3RCR5uYWqCC3tdWohCn4A",
                        brief: "Thanks for connecting! Would love to discuss AI opportunities",
                        messageType: "networking"
                    },
                    reply: {
                        chatId: "J3RCR5uYWqCC3tdWohCn4A",
                        brief: "Great to hear from you! Hope you are doing well too",
                        messageType: "friendly"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }

        let finalMessage = brief;
        
        if (autoEnhance) {
            // Generate enhanced message based on type
            const prompt = `${brief} - ${messageType} LinkedIn message`;
            const enhanced = await aiService.generateMessageResponse(prompt, messageType);
            finalMessage = enhanced.suggestedResponse;
        }

        // Send the message
        const result = await linkedinService.sendLinkedInMessage(chatId, finalMessage);

        res.json({
            success: true,
            message: 'Enhanced LinkedIn message sent successfully',
            data: {
                messageId: result.messageId,
                chatId: chatId,
                originalBrief: brief,
                enhancedMessage: finalMessage,
                messageType: messageType,
                enhanced: autoEnhance,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Send enhanced LinkedIn message failed:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to send enhanced LinkedIn message',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /debug/linkedin/messages/:accountId - Debug LinkedIn messages structure
 */
app.get('/debug/linkedin/messages/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { limit = 5 } = req.query;
        
        console.log(`🔍 Debug: Fetching LinkedIn messages for account ${accountId}`);
        
        // Make direct API call to see raw response
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/messages`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: {
                account_id: accountId,
                limit: parseInt(limit)
            }
        });
        
        console.log('🔍 Raw LinkedIn messages response:', JSON.stringify(response.data, null, 2));
        
        let messages = [];
        if (response.data && response.data.items) {
            messages = response.data.items;
        } else if (Array.isArray(response.data)) {
            messages = response.data;
        }
        
        const messageAnalysis = messages.map(msg => ({
            id: msg.id,
            availableFields: Object.keys(msg),
            fromField: msg.from_attendee,
            toField: msg.to_attendees,
            bodyFields: {
                body: msg.body,
                body_plain: msg.body_plain,
                text: msg.text,
                content: msg.content,
                message: msg.message
            },
            subjectField: msg.subject,
            dateField: msg.date,
            readField: {
                read_date: msg.read_date,
                is_read: msg.is_read,
                read: msg.read
            }
        }));
        
        res.json({
            success: true,
            message: 'Raw LinkedIn messages analysis',
            data: messageAnalysis,
            totalMessages: messages.length,
            responseStructure: {
                topLevelKeys: Object.keys(response.data || {}),
                sampleMessage: messages[0] ? Object.keys(messages[0]) : []
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /debug/linkedin/message/:accountId/:messageId - Debug specific message
 */
app.get('/debug/linkedin/message/:accountId/:messageId', async (req, res) => {
    try {
        const { accountId, messageId } = req.params;
        
        // Make direct API call to get specific message
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/messages/${messageId}`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: { account_id: accountId }
        });
        
        console.log('🔍 Raw specific message:', JSON.stringify(response.data, null, 2));
        
        res.json({
            success: true,
            message: 'Raw message data',
            rawMessage: response.data,
            availableFields: Object.keys(response.data || {}),
            contentFields: {
                body: response.data.body,
                body_plain: response.data.body_plain,
                text: response.data.text,
                content: response.data.content,
                html_body: response.data.html_body
            },
            senderInfo: response.data.from_attendee,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
});



/**
 * POST /api/linkedin/posts/enhance - Enhance existing post content
 */
app.post('/api/linkedin/posts/enhance', async (req, res) => {
    try {
        const { content, enhancement = 'improve' } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: content',
                enhancements: ['improve', 'add_emojis', 'add_hashtags', 'make_shorter', 'make_longer'],
                example: {
                    content: "Our team won the hackathon!",
                    enhancement: "improve"
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.enhancePostContent(content, enhancement);
        
        res.json({
            success: true,
            message: 'Post content enhanced successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to enhance post content',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= AI POST GENERATION ENDPOINTS =============

/**
 * POST /api/ai/posts/achievement - Generate achievement post
 */
app.post('/api/ai/posts/achievement', async (req, res) => {
    try {
        const { achievement, details = {} } = req.body;
        
        if (!achievement) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: achievement',
                example: {
                    achievement: "Reached finals in HackIndia 2025",
                    details: {
                        team: "Team Sankalp",
                        competition: "HackIndia - AI & Web3 hackathon",
                        impact: "recognition in India's top tech competition"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await postGenerator.generateAchievementPost(achievement, details);
        
        res.json({
            success: true,
            message: 'Achievement post generated successfully',
            data: result,
            actions: {
                createPost: 'POST /api/linkedin/posts/create',
                enhance: 'POST /api/linkedin/posts/enhance'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate achievement post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Add this endpoint to your linkedin-server.js

/**
 * GET /api/ai/test - Test Gemini AI connection
 */
app.get('/api/ai/test', async (req, res) => {
    try {
        const result = await aiService.testConnection();
        
        res.json({
            success: true,
            message: 'Gemini AI service is working properly',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gemini AI service connection failed',
            error: error.message,
            troubleshooting: [
                'Check GEMINI_API_KEY in .env file',
                'Verify API key is valid and active',
                'Ensure you have Gemini API access'
            ],
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/posts/tech-insight - Generate tech insight post
 */
app.post('/api/ai/posts/tech-insight', async (req, res) => {
    try {
        const { topic, insight, context = {} } = req.body;
        
        if (!topic || !insight) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: topic, insight',
                example: {
                    topic: "AI in Web3 Development",
                    insight: "The convergence of AI and blockchain is creating unprecedented opportunities for decentralized intelligence",
                    context: {
                        industry: "technology",
                        audience: "developers and tech leaders",
                        experience: "working on AI/Web3 projects"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await aiService.generateTechInsightPost(topic, insight, context);
        
        res.json({
            success: true,
            message: 'Tech insight post generated successfully',
            data: result,
            actions: {
                createPost: 'POST /api/linkedin/posts/create',
                enhance: 'POST /api/linkedin/posts/enhance'
            },
            tips: [
                'Tech insights perform best Tuesday-Thursday',
                'Include code snippets or diagrams for better engagement',
                'Respond to comments to boost algorithmic reach'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate tech insight post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});


/**
 * POST /api/ai/posts/hackindia - Generate HackIndia specific post
 */
app.post('/api/ai/posts/hackindia', async (req, res) => {
    try {
        const { status = 'finalist' } = req.body;
        
        const result = await postGenerator.createHackIndiaPost(status);
        
        res.json({
            success: true,
            message: `HackIndia ${status} post generated successfully`,
            data: result,
            actions: {
                createPost: 'POST /api/linkedin/posts/create',
                enhance: 'POST /api/linkedin/posts/enhance'
            },
            tips: [
                'Consider adding a team photo or project screenshot',
                'Tag your teammates if they have LinkedIn profiles',
                'Post during optimal hours for maximum engagement'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate HackIndia post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/posts/insight - Generate insight/thought leadership post
 */
app.post('/api/ai/posts/insight', async (req, res) => {
    try {
        const { topic, insight, context = {} } = req.body;
        
        if (!topic || !insight) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: topic, insight',
                example: {
                    topic: "AI in Web3",
                    insight: "The intersection of AI and blockchain is creating unprecedented opportunities",
                    context: { industry: "tech", audience: "developers" }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await postGenerator.generateInsightPost(topic, insight, context);
        
        res.json({
            success: true,
            message: 'Insight post generated successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate insight post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/posts/update - Generate project update post
 */
app.post('/api/ai/posts/update', async (req, res) => {
    try {
        const { projectName, updates, milestones = [] } = req.body;
        
        if (!projectName || !updates || !Array.isArray(updates)) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: projectName, updates (array)',
                example: {
                    projectName: "AI Email Assistant",
                    updates: ["Enhanced NLP processing", "Added multi-language support"],
                    milestones: ["1000 users reached", "Beta launch completed"]
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await postGenerator.generateProjectUpdatePost(projectName, updates, milestones);
        
        res.json({
            success: true,
            message: 'Project update post generated successfully',
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate project update post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/ai/posts/engagement - Generate engagement/question post
 */
app.post('/api/ai/posts/engagement', async (req, res) => {
    try {
        const { question, context = '' } = req.body;
        
        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Missing required field: question',
                example: {
                    question: "What's the biggest challenge you face in AI development?",
                    context: "As AI becomes more mainstream, developers face various challenges"
                },
                timestamp: new Date().toISOString()
            });
        }
        
        const result = await postGenerator.generateEngagementPost(question, context);
        
        res.json({
            success: true,
            message: 'Engagement post generated successfully',
            data: result,
            engagementTips: [
                'Posts with questions get 3x more comments',
                'Respond to comments to boost engagement',
                'Best time to post: Tuesday-Thursday 10 AM-3 PM'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate engagement post',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        requestedPath: req.originalUrl,
        availableEndpoints: [
            'GET /',
            'GET /api/linkedin/accounts',
            'GET /api/linkedin/messages',
            'GET /api/linkedin/posts',
            'POST /api/ai/posts/hackindia',
            'POST /api/ai/posts/achievement',
            'POST /api/linkedin/posts/create'
        ],
        timestamp: new Date().toISOString()
    });
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log('🚀 LINKEDIN AI-ENHANCED SERVER STARTED');
    console.log('🚀 ========================================');
    console.log(`🔗 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Docs: http://localhost:${PORT}/`);
    console.log(`🤖 AI Features: Enabled with OpenAI integration`);
    console.log(`📱 LinkedIn Integration: Ready via Unipile`);
    console.log('🚀 ========================================');
    console.log('🎯 Quick Test: POST /api/ai/posts/hackindia');
    console.log('📧 Messages: GET /api/linkedin/messages');
    console.log('🚀 ========================================');
});

export default app;
